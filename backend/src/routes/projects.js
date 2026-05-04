const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const auth = require('../middleware/auth');
const role = require('../middleware/roleGuard');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', auth, role('admin'), upload.single('logo'), ctrl.createProject);
router.post('/:id/assets', auth, upload.array('assets', 5), ctrl.uploadAssets);
router.get('/', auth, ctrl.getProjects);
router.get('/:id', auth, ctrl.getProject);
router.put('/:id', auth, role('admin'), ctrl.updateProject);
router.delete('/:id', auth, role('admin'), ctrl.deleteProject);
router.post('/:id/members', auth, role('admin'), ctrl.addMember);
router.put('/:id/members/:userId/role', auth, role('admin'), ctrl.updateMemberRole);
router.delete('/:id/members/:userId', auth, role('admin'), ctrl.removeMember);

module.exports = router;
