const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  projectRole: { type: DataTypes.STRING(20), defaultValue: 'member' },
  isLead: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'project_members' });

module.exports = ProjectMember;
