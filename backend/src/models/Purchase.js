const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Drop = require('./Drop');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dropId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'purchases'
});

// Associations
Purchase.belongsTo(User, { foreignKey: 'userId' });
Purchase.belongsTo(Drop, { foreignKey: 'dropId' });
User.hasMany(Purchase, { foreignKey: 'userId' });
Drop.hasMany(Purchase, { foreignKey: 'dropId' });

module.exports = Purchase;
