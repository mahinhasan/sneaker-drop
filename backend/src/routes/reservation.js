const express = require('express');
const router = express.Router();
const { reserveItem, getUserReservation, expireReservations } = require('../controllers/reservationController');

router.post('/', reserveItem);
// might have GET /:userId for user reservations
router.get('/:userId', getUserReservation);

module.exports = router;
