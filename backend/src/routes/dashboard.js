const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getDashboard);

module.exports = router;
