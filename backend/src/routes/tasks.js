const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/taskController');
const auth = require('../middleware/auth');
const role = require('../middleware/roleGuard');

router.post('/', auth, ctrl.createTask);
router.get('/', auth, ctrl.getTasks);
router.put('/:id', auth, ctrl.updateTask);
router.delete('/:id', auth, role('admin'), ctrl.deleteTask);

module.exports = router;
