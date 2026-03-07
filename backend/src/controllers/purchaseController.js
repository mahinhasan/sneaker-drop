const { completePurchase, getUserPurchases, getAllPurchases } = require('../services/purchaseService');

async function completePurchaseController(req, res) {
  const { reservationId } = req.body;
  const result = await completePurchase(reservationId);
  res.status(result.statusCode).json(result);
}

async function getUserPurchasesController(req, res) {
  const { userId } = req.params;
  const result = await getUserPurchases(userId);
  res.status(result.statusCode).json(result);
}

async function getAllPurchasesController(req, res) {
  const result = await getAllPurchases();
  res.status(result.statusCode).json(result);
}

module.exports = {
  completePurchaseController,
  getUserPurchasesController,
  getAllPurchasesController
};
