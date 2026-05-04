const { Op } = require('sequelize');
const { Task, Project, User, ProjectMember, TaskAssignee } = require('../models');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let projectIds;

    if (req.user.role === 'admin') {
      const projects = await Project.findAll({ attributes: ['id'] });
      projectIds = projects.map(p => p.id);
    } else {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] });
      projectIds = memberships.map(m => m.projectId);
    }

    // For members: show tasks they are assigned to
    let taskFilter = { projectId: { [Op.in]: projectIds } };
    if (req.user.role !== 'admin') {
      const myAssignments = await TaskAssignee.findAll({ where: { userId: req.user.id }, attributes: ['taskId'] });
      const myTaskIds = myAssignments.map(a => a.taskId);
      taskFilter = { projectId: { [Op.in]: projectIds }, id: { [Op.in]: myTaskIds } };
    }

    const [total, todo, inProgress, done, overdue, recentTasks, recentProjects] = await Promise.all([
      Task.count({ where: taskFilter }),
      Task.count({ where: { ...taskFilter, status: 'todo' } }),
      Task.count({ where: { ...taskFilter, status: 'in_progress' } }),
      Task.count({ where: { ...taskFilter, status: 'done' } }),
      Task.count({ where: { ...taskFilter, dueDate: { [Op.lt]: today }, status: { [Op.ne]: 'done' } } }),
      Task.findAll({
        where: taskFilter,
        include: [
          { model: User, as: 'assignees', attributes: ['id', 'name'], through: { attributes: [] } },
          { model: Project, attributes: ['id', 'name', 'color'] },
        ],
        order: [['createdAt', 'DESC']], limit: 6,
      }),
      Project.findAll({
        where: { id: { [Op.in]: projectIds } },
        include: [{ model: Task, attributes: ['id', 'status'] }],
        order: [['createdAt', 'DESC']], limit: 4,
      }),
    ]);

    const totalUsers = req.user.role === 'admin' ? await User.count() : null;
    res.json({
      stats: { total, todo, inProgress, done, overdue, totalProjects: projectIds.length, totalUsers },
      recentTasks,
      recentProjects,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
