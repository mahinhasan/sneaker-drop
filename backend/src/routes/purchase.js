const express = require('express');
const router = express.Router();
const { completePurchase, getUserPurchases, getAllPurchases } = require('../controllers/purchaseController');

router.post('/', completePurchase);
router.get('/', getAllPurchases);
router.get('/user/:userId', getUserPurchases);

module.exports = router;
