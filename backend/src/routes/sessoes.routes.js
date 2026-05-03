const router = require('express').Router();
const ctrl = require('../controllers/sessoes.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getStats);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.delete);

module.exports = router;
