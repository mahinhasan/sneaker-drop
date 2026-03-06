const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Drop = sequelize.define('Drop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  availableStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'drops'
});

module.exports = Drop;
