const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primaryEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primaryContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otherContacts: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emails: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  delete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clinics: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  defaultClinic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deleteDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  activationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dismissalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dismissedByUId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users'
});

module.exports = User;
