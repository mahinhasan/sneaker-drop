const { reserveItem, getUserReservation, expireReservations } = require('../services/reservationService');

async function reserveItemController(req, res) {
  const { userId, dropId } = req.body;
  const result = await reserveItem(userId, dropId);
  res.status(result.statusCode).json(result);
}

async function getUserReservationController(req, res) {
  const { userId } = req.params;
  const result = await getUserReservation(userId);
  res.status(result.statusCode).json(result);
}

async function expireReservationsJob() {
  await expireReservations();
}

module.exports = {
  reserveItemController,
  getUserReservationController,
  expireReservationsJob
};
