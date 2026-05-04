const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, ctrl.updateProfile);
router.put('/password', auth, ctrl.changePassword);
router.post('/avatar', auth, ctrl.uploadAvatar);

module.exports = router;
