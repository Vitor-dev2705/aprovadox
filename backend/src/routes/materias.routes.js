const router = require('express').Router();
const ctrl = require('../controllers/materias.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.post('/:id/assuntos', ctrl.addAssunto);
router.patch('/:id/assuntos/:assuntoId/toggle', ctrl.toggleAssunto);

module.exports = router;
