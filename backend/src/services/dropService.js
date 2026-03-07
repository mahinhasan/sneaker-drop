const Drop = require('../models/Drop');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

async function createDrop(name, price, totalStock, startTime) {
  if (!name || !price || totalStock === undefined) {
    return {
      error: true,
      statusCode: 400,
      message: 'Name, price, and total stock are required.',
      data: null
    };
  }

  if (price <= 0) {
    return {
      error: true,
      statusCode: 400,
      message: 'Price must be greater than zero.',
      data: null
    };
  }

  if (totalStock < 0) {
    return {
      error: true,
      statusCode: 400,
      message: 'Total stock cannot be negative.',
      data: null
    };
  }

  try {
    const drop = await Drop.create({
      name,
      price,
      totalStock,
      availableStock: totalStock,
      startTime: startTime ? new Date(startTime) : null
    });

    return {
      error: false,
      statusCode: 201,
      message: 'Drop created successfully',
      data: drop
    };
  } catch (err) {
    console.error('Error in createDrop service:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to create drop. Internal server error.',
      data: null
    };
  }
}

async function getDrops() {
  try {
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

    return {
      error: false,
      statusCode: 200,
      message: 'Drops retrieved successfully',
      data: drops
    };
  } catch (err) {
    console.error('Error in getDrops service:', err);
    return {
      error: true,
      statusCode: 500,
      message: 'Failed to fetch drops.',
      data: null
    };
  }
}

module.exports = {
  createDrop,
  getDrops
};
