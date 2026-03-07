const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Drop = require('../models/Drop');
const Reservation = require('../models/Reservation');

const User = require('../models/User');

async function reserveItem(userId, dropId) {
  if (!userId || !dropId) {
    return {
      error: true,
      statusCode: 400,
      message: 'Missing user or drop id',
      data: null
    };
  }

  try {
    // Ensure user exists
    await User.findOrCreate({ 
      where: { id: userId }, 
      defaults: { user: userId.split('-')[1] || 'anonymous' } 
    });

    const t = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE });
    try {
      const drop = await Drop.findByPk(dropId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!drop || drop.availableStock < 1) {
        await t.rollback();
        return {
          error: true,
          statusCode: 409,
          message: 'Out of stock',
          data: null
        };
      }

      drop.availableStock -= 1;
      await drop.save({ transaction: t });

      const expiration = new Date(Date.now() + 60 * 1000);
      const reservation = await Reservation.create({ 
        userId, 
        dropId, 
        expiresAt: expiration 
      }, { transaction: t });

      await t.commit();

      const io = require('../utils/io').getIo();
      io.emit('stockUpdated', { dropId, availableStock: drop.availableStock });

      return {
        error: false,
        statusCode: 200,
        message: 'Item reserved successfully',
        data: {
          reservation: {
            id: reservation.id,
            dropId: reservation.dropId,
            expiresAt: reservation.expiresAt
          }
        }
      };
    } catch (err) {
      await t.rollback();
      console.error('Reservation logic error:', err);
      if (err.name === 'SequelizeSerializationError') {
        return {
          error: true,
          statusCode: 409,
          message: 'Concurrency conflict, try again',
          data: null
        };
      }
      throw err; // Re-throw for outer catch
    }
  } catch (err) {
    console.error('Error in reserveItem service:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Server error',
      data: null
    };
  }
}

async function getUserReservation(userId) {
  if (!userId) {
    return {
      error: true,
      statusCode: 400,
      message: 'User ID is required.',
      data: null
    };
  }

  try {
    const reservations = await Reservation.findAll({ 
      where: { userId, completed: false } 
    });
    return {
      error: false,
      statusCode: 200,
      message: 'Reservations retrieved successfully',
      data: reservations
    };
  } catch (err) {
    console.error('Error fetching user reservation:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to fetch reservations',
      data: null
    };
  }
}

async function expireReservations() {
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
}

module.exports = {
  reserveItem,
  getUserReservation,
  expireReservations
};
