const router = require('express').Router();
const ctrl = require('../controllers/concursos.controller');
const projection = require('../controllers/projecao.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/:id/projecao', projection.get);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
