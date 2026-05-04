const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAssignee = sequelize.define('TaskAssignee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'task_assignees' });

module.exports = TaskAssignee;
