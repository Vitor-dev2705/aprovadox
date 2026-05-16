const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getDashboard);
router.get('/estatisticas', ctrl.getEstatisticas);
router.get('/calendario', ctrl.getCalendario);
router.get('/atividades', ctrl.getAtividades);

module.exports = router;
