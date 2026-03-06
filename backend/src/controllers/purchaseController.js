const sequelize = require('../config/database');
const Reservation = require('../models/Reservation');
const Purchase = require('../models/Purchase');

exports.completePurchase = async (req, res) => {
  const { reservationId } = req.body;
  
  if (!reservationId) {
    return res.status(400).json({ error: 'Reservation ID is required to complete purchase.' });
  }

  const t = await sequelize.transaction();
  try {
    const reservation = await Reservation.findByPk(reservationId, { 
      transaction: t, 
      lock: t.LOCK.UPDATE 
    });

    if (!reservation) {
      await t.rollback();
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (reservation.completed) {
      await t.rollback();
      return res.status(400).json({ error: 'Reservation has already been processed or expired.' });
    }

    if (new Date(reservation.expiresAt) < new Date()) {
      await t.rollback();
      return res.status(400).json({ error: 'Reservation has expired.' });
    }

    // mark reservation as completed and create purchase
    reservation.completed = true;
    await reservation.save({ transaction: t });

    const purchase = await Purchase.create(
      {
        userId: reservation.userId,
        dropId: reservation.dropId,
        quantity: 1
      },
      { transaction: t }
    );

    await t.commit();

    // notify clients of new purchase
    const io = require('../utils/io').getIo();
    io.emit('purchaseMade', { 
      dropId: purchase.dropId, 
      userId: purchase.userId,
      username: reservation.userId // Consider changing this if needed, but for now we use ID
    });

    res.json({ 
      success: true,
      purchase 
    });
  } catch (err) {
    if (t) await t.rollback();
    console.error('Purchase Error:', err);
    res.status(500).json({ error: 'Failed to complete purchase. Internal server error.' });
  }
};
