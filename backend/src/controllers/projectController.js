const { Op } = require('sequelize');
const { Project, User, ProjectMember, Task, TaskAssignee } = require('../models');

exports.createProject = async (req, res) => {
  const { name, description, color, memberIds } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  try {
    const logo = req.file ? req.file.path.replace(/\\/g, '/') : null;
    const project = await Project.create({ name, description, color: color || '#6366f1', logo, createdBy: req.user.id });
    
    // Add creator as admin
    await ProjectMember.create({ projectId: project.id, userId: req.user.id, projectRole: 'admin', isLead: false });
    
    // Add initial team members
    if (memberIds) {
      const ids = Array.isArray(memberIds) ? memberIds : [memberIds];
      const members = ids.map(id => ({ projectId: project.id, userId: parseInt(id), projectRole: 'member', isLead: false }));
      await ProjectMember.bulkCreate(members, { ignoreDuplicates: true });
    }
    
    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['projectRole', 'isLead'] } },
        { model: Task, attributes: ['id', 'status'] },
      ],
    });
    res.status(201).json(fullProject);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] });
      const ids = memberships.map(m => m.projectId);
      whereClause = { id: { [Op.in]: ids } };
    }
    const projects = await Project.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['projectRole', 'isLead'] } },
        { model: Task, attributes: ['id', 'status'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['projectRole', 'isLead'] } },
        {
          model: Task,
          include: [{ model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.update(req.body);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  const { userId, isLead } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const exists = await ProjectMember.findOne({ where: { projectId: req.params.id, userId } });
    if (exists) return res.status(400).json({ message: 'User is already a member' });
    const role = isLead ? 'lead' : 'member';
    await ProjectMember.create({ projectId: req.params.id, userId, projectRole: role, isLead: !!isLead });
    res.status(201).json({ message: `${user.name} added to project${isLead ? ' as Team Lead' : ''}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const member = await ProjectMember.findOne({ where: { projectId: req.params.id, userId: req.params.userId } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await member.destroy();
    res.json({ message: 'Member removed from project' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMemberRole = async (req, res) => {
  const { isLead } = req.body;
  try {
    const member = await ProjectMember.findOne({ where: { projectId: req.params.id, userId: req.params.userId } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await member.update({ isLead: !!isLead, projectRole: isLead ? 'lead' : 'member' });
    res.json({ message: `Role updated` });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadAssets = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Admins and leads check
    const memberRecord = await ProjectMember.findOne({ where: { projectId: project.id, userId: req.user.id } });
    if (req.user.role !== 'admin' && (!memberRecord || (!memberRecord.isLead && memberRecord.projectRole !== 'admin'))) {
      return res.status(403).json({ message: 'Only admins or leads can upload assets' });
    }

    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const newAssets = req.files.map(f => ({ name: f.originalname, path: f.path.replace(/\\/g, '/') }));
    const currentAssets = project.assets ? JSON.parse(project.assets) : [];
    const updatedAssets = [...currentAssets, ...newAssets];

    await project.update({ assets: JSON.stringify(updatedAssets) });
    res.json(updatedAssets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
