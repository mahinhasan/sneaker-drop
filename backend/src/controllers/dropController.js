const { createDrop, getDrops } = require('../services/dropService');

async function createDropController(req, res) {
  try {
    const { name, price, totalStock, startTime } = req.body;
    const drop = await createDrop(name, price, totalStock, startTime);
    const returnData = { error: false, data: drop, message: 'Drop created successfully' };
    res.status(201).json(returnData);
  } catch (err) {
    console.error('Error creating drop:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to create drop. Please try again.';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

async function getDropsController(req, res) {
  try {
    const drops = await getDrops();
    const returnData = { error: false, data: drops, message: 'Drops retrieved successfully' };
    res.json(returnData);
  } catch (err) {
    console.error('Error fetching drops:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to fetch drops.';
    const returnData = { error: true, data: null, message };
    res.status(statusCode).json(returnData);
  }
}

module.exports = {
  createDropController,
  getDropsController
};
