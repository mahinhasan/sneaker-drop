const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Drop = require('./Drop');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'reservations'
});

// Associations
Reservation.belongsTo(User, { foreignKey: 'userId' });
Reservation.belongsTo(Drop, { foreignKey: 'dropId' });
User.hasMany(Reservation, { foreignKey: 'userId' });
Drop.hasMany(Reservation, { foreignKey: 'dropId' });

module.exports = Reservation;
