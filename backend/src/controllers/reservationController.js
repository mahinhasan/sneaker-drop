const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Drop = require('../models/Drop');
const Reservation = require('../models/Reservation');

// reserve an item atomically
exports.reserveItem = async (req, res) => {
  const { userId, dropId } = req.body;
  if (!userId || !dropId) {
    return res.status(400).json({ error: 'Missing user or drop id' });
  }

  const t = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE });
  try {
    const drop = await Drop.findByPk(dropId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!drop || drop.availableStock < 1) {
      await t.rollback();
      return res.status(409).json({ error: 'Out of stock' });
    }

    // decrement stock
    drop.availableStock -= 1;
    await drop.save({ transaction: t });

    const expiration = new Date(Date.now() + 60 * 1000);
    const reservation = await Reservation.create({ userId, dropId, expiresAt: expiration }, { transaction: t });

    await t.commit();

    // notify via websocket
    const io = require('../utils/io').getIo();
    io.emit('stockUpdated', { dropId, availableStock: drop.availableStock });

    res.json({ 
      reservation: {
        id: reservation.id,
        dropId: reservation.dropId,
        expiresAt: reservation.expiresAt
      } 
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    if (err.name === 'SequelizeSerializationError') {
      return res.status(409).json({ error: 'Concurrency conflict, try again' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// get reservation for a user
exports.getUserReservation = async (req, res) => {
  const { userId } = req.params;
  const reservations = await Reservation.findAll({ where: { userId, completed: false } });
  res.json(reservations);
};

// expire reservations & restore stock
exports.expireReservations = async () => {
  try {
    const now = new Date();
    const expired = await Reservation.findAll({ 
      where: { 
        expiresAt: { [Op.lt]: now }, 
        completed: false 
      } 
    });

    for (const r of expired) {
      await sequelize.transaction(async (t) => {
        // Double check completion status within transaction
        const reservation = await Reservation.findByPk(r.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!reservation || reservation.completed) return;

        reservation.completed = true;
        await reservation.save({ transaction: t });

        const drop = await Drop.findByPk(reservation.dropId, { transaction: t, lock: t.LOCK.UPDATE });
        if (drop) {
          drop.availableStock += 1;
          await drop.save({ transaction: t });
          
          const io = require('../utils/io').getIo();
          io.emit('stockUpdated', { dropId: drop.id, availableStock: drop.availableStock });
          io.emit('reservationExpired', { dropId: drop.id, userId: reservation.userId });
        }
      });
    }
  } catch (err) {
    console.error('Error in expireReservations job:', err);
  }
};
