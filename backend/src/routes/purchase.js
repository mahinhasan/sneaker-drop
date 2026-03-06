const express = require('express');
const router = express.Router();
const { completePurchase } = require('../controllers/purchaseController');

router.post('/', completePurchase);

module.exports = router;
