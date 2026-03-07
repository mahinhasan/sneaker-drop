const { createDrop, getDrops } = require('../services/dropService');

async function createDropController(req, res) {
  const { name, price, totalStock, startTime } = req.body;
  const result = await createDrop(name, price, totalStock, startTime);
  res.status(result.statusCode).json(result);
}

async function getDropsController(req, res) {
  const result = await getDrops();
  res.status(result.statusCode).json(result);
}

module.exports = {
  createDropController,
  getDropsController
};
