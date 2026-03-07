const sequelize = require('../config/database');
const Reservation = require('../models/Reservation');
const Purchase = require('../models/Purchase');
const Drop = require('../models/Drop');
const User = require('../models/User');

async function completePurchase(reservationId) {
  if (!reservationId) {
    throw {
      statusCode: 400,
      message: 'Reservation ID is required to complete purchase.'
    };
  }

  const t = await sequelize.transaction();
  try {
    const reservation = await Reservation.findByPk(reservationId, { 
      transaction: t, 
      lock: t.LOCK.UPDATE 
    });

    if (!reservation) {
      await t.rollback();
      throw {
        statusCode: 404,
        message: 'Reservation not found.'
      };
    }

    if (reservation.completed) {
      await t.rollback();
      throw {
        statusCode: 400,
        message: 'Reservation has already been processed or expired.'
      };
    }

    if (new Date(reservation.expiresAt) < new Date()) {
      await t.rollback();
      throw {
        statusCode: 400,
        message: 'Reservation has expired.'
      };
    }

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

    const io = require('../utils/io').getIo();
    const userRecord = await User.findByPk(purchase.userId);
    io.emit('purchaseMade', { 
      dropId: purchase.dropId, 
      userId: purchase.userId,
      username: userRecord ? userRecord.user : purchase.userId
    });

    return purchase;
  } catch (err) {
    if (t) await t.rollback();
    console.error('Purchase Error:', err);
    if (err.statusCode) {
      throw err;
    }
    throw {
      statusCode: 500,
      message: 'Failed to complete purchase. Internal server error.'
    };
  }
}

async function getUserPurchases(userId) {
  try {
    const purchases = await Purchase.findAll({
      where: { userId },
      include: [{ model: Drop }],
      order: [['createdAt', 'DESC']]
    });
    return purchases;
  } catch (err) {
    console.error('Error fetching user purchases:', err);
    throw {
      statusCode: 500,
      message: 'Failed to fetch purchase history.'
    };
  }
}

async function getAllPurchases() {
  try {
    const purchases = await Purchase.findAll({
      include: [
        { model: Drop },
        { model: User, attributes: ['id', 'user', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return purchases;
  } catch (err) {
    console.error('Error fetching all purchases:', err);
    throw {
      statusCode: 500,
      message: 'Failed to fetch all purchases.'
    };
  }
}

module.exports = {
  completePurchase,
  getUserPurchases,
  getAllPurchases
};
