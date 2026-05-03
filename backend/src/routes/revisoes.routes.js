const router = require('express').Router();
const ctrl = require('../controllers/revisoes.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/hoje', ctrl.getToday);
router.get('/calendario', ctrl.getCalendar);
router.patch('/:id/concluir', ctrl.complete);

module.exports = router;
