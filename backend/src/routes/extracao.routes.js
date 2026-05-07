const router = require('express').Router();
const ctrl = require('../controllers/extracao.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/edital', ctrl.extrairDoEdital);

module.exports = router;
