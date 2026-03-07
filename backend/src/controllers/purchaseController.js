const { completePurchase, getUserPurchases, getAllPurchases } = require('../services/purchaseService');

async function completePurchaseController(req, res) {
  try {
    const { reservationId } = req.body;
    const purchase = await completePurchase(reservationId);
    const returnData = {
      error: false,
      data: { purchase },
      message: 'Purchase completed successfully'
    };
    res.json(returnData);
  } catch (err) {
    console.error('Purchase Error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to complete purchase. Internal server error.';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

async function getUserPurchasesController(req, res) {
  try {
    const { userId } = req.params;
    const purchases = await getUserPurchases(userId);
    const returnData = { error: false, data: purchases, message: 'User purchases retrieved successfully' };
    res.json(returnData);
  } catch (err) {
    console.error('Error fetching user purchases:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to fetch purchase history.';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

async function getAllPurchasesController(req, res) {
  try {
    const purchases = await getAllPurchases();
    const returnData = { error: false, data: purchases, message: 'All purchases retrieved successfully' };
    res.json(returnData);
  } catch (err) {
    console.error('Error fetching all purchases:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to fetch all purchases.';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

module.exports = {
  completePurchaseController,
  getUserPurchasesController,
  getAllPurchasesController
};
