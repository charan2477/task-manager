const { Task, User, TaskAssignee, ProjectMember } = require('../models');

const getFullTask = (id) => Task.findByPk(id, {
  include: [
    { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
    { model: User, as: 'taskCreator', attributes: ['id', 'name'] },
  ],
});

exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeIds } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required' });
  try {
    const memberRecord = await ProjectMember.findOne({ where: { projectId: req.params.projectId, userId: req.user.id } });
    const isLead = memberRecord?.isLead || memberRecord?.projectRole === 'lead';

    if (req.user.role !== 'admin' && !isLead) {
      return res.status(403).json({ message: 'Access denied. Only admins and leads can create tasks.' });
    }

    const task = await Task.create({
      title, description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      projectId: req.params.projectId,
      createdBy: req.user.id,
    });
    // Create multiple assignees
    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      await TaskAssignee.bulkCreate(assigneeIds.map(uid => ({ taskId: task.id, userId: parseInt(uid) })));
    }
    const full = await getFullTask(task.id);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      include: [
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
        { model: User, as: 'taskCreator', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: 'assignees', attributes: ['id'], through: { attributes: [] } }],
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const assigneeIds = (task.assignees || []).map(a => a.id);
    const isAssignee = assigneeIds.includes(req.user.id);

    // Check if user is a lead in this project
    const memberRecord = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id } });
    const isLead = memberRecord?.isLead || memberRecord?.projectRole === 'lead';

    if (req.user.role !== 'admin' && !isLead && !isAssignee) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    const { assigneeIds: newAssigneeIds, ...taskData } = req.body;

    // Admins and leads can update everything; assignees can update everything EXCEPT reassigning
    if (req.user.role === 'admin' || isLead) {
      await task.update(taskData);
      if (Array.isArray(newAssigneeIds)) {
        await TaskAssignee.destroy({ where: { taskId: task.id } });
        if (newAssigneeIds.length > 0) {
          await TaskAssignee.bulkCreate(newAssigneeIds.map(uid => ({ taskId: task.id, userId: parseInt(uid) })));
        }
      }
    } else {
      // Assignees can update title, description, status, priority, dueDate — NOT reassign
      const { assigneeIds: _ignore, ...safeData } = taskData;
      // Enforce one-way status: todo → in_progress → done (no back)
      if (safeData.status) {
        const order = ['todo', 'in_progress', 'done'];
        const currentIdx = order.indexOf(task.status);
        const newIdx = order.indexOf(safeData.status);
        if (newIdx < currentIdx) {
          return res.status(400).json({ message: 'Cannot move task backwards in status' });
        }
      }
      await task.update(safeData);
    }

    const updated = await getFullTask(task.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await TaskAssignee.destroy({ where: { taskId: task.id } });
    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
