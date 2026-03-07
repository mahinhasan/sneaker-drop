const express = require('express');
const router = express.Router();
const { reserveItemController, getUserReservationController } = require('../controllers/reservationController');

router.post('/', reserveItemController);
router.get('/:userId', getUserReservationController);

module.exports = router;
