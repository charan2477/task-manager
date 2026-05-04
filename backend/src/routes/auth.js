const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');

const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.post('/signup', signupRules, ctrl.signup);
router.post('/admin-signup', [...signupRules, body('adminSecret').notEmpty().withMessage('Admin secret required')], ctrl.adminSignup);
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], ctrl.login);
router.get('/me', auth, ctrl.me);

module.exports = router;
