const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/roleGuard');

router.get('/', auth, role('admin'), ctrl.getAllUsers);
router.put('/:id/role', auth, role('admin'), ctrl.updateRole);
router.delete('/:id', auth, role('admin'), ctrl.deleteUser);

module.exports = router;
