const router = require('express').Router();
const ctrl = require('../controllers/gamificacao.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/status', ctrl.getStatus);
router.get('/missoes', ctrl.getMissoes);
router.post('/check-medalhas', ctrl.checkMedalhas);

module.exports = router;
