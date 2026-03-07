const { reserveItem, getUserReservation, expireReservations } = require('../services/reservationService');

async function reserveItemController(req, res) {
  try {
    const { userId, dropId } = req.body;
    const reservation = await reserveItem(userId, dropId);
    const returnData = {
      error: false,
      data: { reservation },
      message: 'Item reserved successfully'
    };
    res.json(returnData);
  } catch (err) {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server error';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

async function getUserReservationController(req, res) {
  try {
    const { userId } = req.params;
    const reservations = await getUserReservation(userId);
    const returnData = { error: false, data: reservations, message: 'Reservations retrieved successfully' };
    res.json(returnData);
  } catch (err) {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to fetch reservations';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

async function expireReservationsJob() {
  await expireReservations();
}

module.exports = {
  reserveItemController,
  getUserReservationController,
  expireReservationsJob
};
