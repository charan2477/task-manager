const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
  color: { type: DataTypes.STRING(7), defaultValue: '#6366f1' },
  logo: { type: DataTypes.STRING },
  assets: { type: DataTypes.TEXT }, // Stored as JSON string
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'projects' });

module.exports = Project;
