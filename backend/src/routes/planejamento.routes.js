const router = require('express').Router();
const ctrl = require('../controllers/planejamento.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.upsert);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.delete('/dia/:dia', ctrl.clearDay);

module.exports = router;
