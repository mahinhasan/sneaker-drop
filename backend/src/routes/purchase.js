const express = require('express');
const router = express.Router();
const { completePurchaseController, getUserPurchasesController, getAllPurchasesController } = require('../controllers/purchaseController');

router.post('/', completePurchaseController);
router.get('/', getAllPurchasesController);
router.get('/user/:userId', getUserPurchasesController);

module.exports = router;
