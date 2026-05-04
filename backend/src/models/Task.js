const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(20), defaultValue: 'todo' },
  priority: { type: DataTypes.STRING(10), defaultValue: 'medium' },
  dueDate: { type: DataTypes.DATEONLY },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'tasks' });

module.exports = Task;
