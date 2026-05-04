const { User } = require('../models');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: require('../models').Task, as: 'assignedTasks', attributes: ['id', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ message: 'Invalid role. Use admin or member.' });
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot change your own role' });
    await user.update({ role });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
