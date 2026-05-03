const router = require('express').Router();
const ctrl = require('../controllers/questoes.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.patch('/:id/revisar', ctrl.markReviewed);
router.delete('/:id', ctrl.delete);

module.exports = router;
