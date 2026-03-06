const Drop = require('../models/Drop');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

// create a new merch drop
exports.createDrop = async (req, res) => {
  try {
    const { name, price, totalStock, startTime } = req.body;
    
    if (!name || !price || totalStock === undefined) {
      return res.status(400).json({ error: 'Name, price, and total stock are required.' });
    }

    const drop = await Drop.create({
      name,
      price,
      totalStock,
      availableStock: totalStock,
      startTime: startTime ? new Date(startTime) : null
    });

    res.status(201).json(drop);
  } catch (err) {
    console.error('Error creating drop:', err);
    res.status(500).json({ error: 'Failed to create drop. Please try again.' });
  }
};

// list active drops with top 3 recent purchasers
exports.getDrops = async (req, res) => {
  try {
    const drops = await Drop.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Purchase,
          limit: 3,
          separate: true, // Required for limit when including multiple
          order: [['createdAt', 'DESC']],
          include: [
            { 
              model: User, 
              attributes: ['id', 'username'] 
            }
          ]
        }
      ]
    });
    res.json(drops);
  } catch (err) {
    console.error('Error fetching drops:', err);
    res.status(500).json({ error: 'Failed to fetch drops.' });
  }
};
