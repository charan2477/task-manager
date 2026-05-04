const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');
const TaskAssignee = require('./TaskAssignee');

// User <-> Project (creator)
Project.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Project, { foreignKey: 'createdBy' });

// Project <-> User (members via ProjectMember)
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', otherKey: 'userId', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', otherKey: 'projectId', as: 'projects' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId' });

// Task associations
Task.belongsTo(Project, { foreignKey: 'projectId' });
Task.belongsTo(User, { as: 'taskCreator', foreignKey: 'createdBy' });
Project.hasMany(Task, { foreignKey: 'projectId' });

// Task <-> User (multiple assignees via TaskAssignee)
Task.belongsToMany(User, { through: TaskAssignee, foreignKey: 'taskId', otherKey: 'userId', as: 'assignees' });
User.belongsToMany(Task, { through: TaskAssignee, foreignKey: 'userId', otherKey: 'taskId', as: 'assignedTasks' });
TaskAssignee.belongsTo(Task, { foreignKey: 'taskId' });
TaskAssignee.belongsTo(User, { foreignKey: 'userId', as: 'assigneeUser' });
Task.hasMany(TaskAssignee, { foreignKey: 'taskId' });

module.exports = { sequelize, User, Project, ProjectMember, Task, TaskAssignee };
