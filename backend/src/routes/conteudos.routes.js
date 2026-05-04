const router = require('express').Router();
const ctrl = require('../controllers/conteudos.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/materia/:materiaId', ctrl.getByMateria);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);
router.delete('/:id', ctrl.delete);

module.exports = router;
