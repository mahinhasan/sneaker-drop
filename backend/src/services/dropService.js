const Drop = require('../models/Drop');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

async function createDrop(name, price, totalStock, startTime) {
  if (!name || !price || totalStock === undefined) {
    throw {
      statusCode: 400,
      message: 'Name, price, and total stock are required.'
    };
  }

  const drop = await Drop.create({
    name,
    price,
    totalStock,
    availableStock: totalStock,
    startTime: startTime ? new Date(startTime) : null
  });

  return drop;
}

async function getDrops() {
  const drops = await Drop.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Purchase,
        limit: 3,
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [
          { 
            model: User, 
            attributes: ['id', 'user', 'fullName'] 
          }
        ]
      }
    ]
  });

  return drops;
}

module.exports = {
  createDrop,
  getDrops
};
