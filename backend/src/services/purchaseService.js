const sequelize = require('../config/database');
const Reservation = require('../models/Reservation');
const Purchase = require('../models/Purchase');
const Drop = require('../models/Drop');
const User = require('../models/User');

async function completePurchase(reservationId) {
  if (!reservationId) {
    return {
      error: true,
      statusCode: 400,
      message: 'Reservation ID is required to complete purchase.',
      data: null
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
      return {
        error: true,
        statusCode: 404,
        message: 'Reservation not found.',
        data: null
      };
    }

    if (reservation.completed) {
      await t.rollback();
      return {
        error: true,
        statusCode: 400,
        message: 'Reservation has already been processed or expired.',
        data: null
      };
    }

    if (new Date(reservation.expiresAt) < new Date()) {
      await t.rollback();
      return {
        error: true,
        statusCode: 400,
        message: 'Reservation has expired.',
        data: null
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

    return {
      error: false,
      statusCode: 200,
      message: 'Purchase completed successfully',
      data: { purchase }
    };
  } catch (err) {
    if (t) await t.rollback();
    console.error('Purchase Error:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to complete purchase. Internal server error.',
      data: null
    };
  }
}

async function getUserPurchases(userId) {
  if (!userId) {
    return {
      error: true,
      statusCode: 400,
      message: 'User ID is required.',
      data: null
    };
  }

  try {
    const purchases = await Purchase.findAll({
      where: { userId },
      include: [{ model: Drop }],
      order: [['createdAt', 'DESC']]
    });
    return {
      error: false,
      statusCode: 200,
      message: 'User purchases retrieved successfully',
      data: purchases
    };
  } catch (err) {
    console.error('Error fetching user purchases:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to fetch purchase history.',
      data: null
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
    return {
      error: false,
      statusCode: 200,
      message: 'All purchases retrieved successfully',
      data: purchases
    };
  } catch (err) {
    console.error('Error fetching all purchases:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to fetch all purchases.',
      data: null
    };
  }
}

module.exports = {
  completePurchase,
  getUserPurchases,
  getAllPurchases
};
