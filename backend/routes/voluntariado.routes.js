const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth');
const voluntariadoController = require('../controllers/voluntariado.controller');

router.get('/meus-pedidos', verificarToken, voluntariadoController.listarMeusPedidos);
router.get('/minhas-contribuicoes', verificarToken, voluntariadoController.listarMinhasContribuicoes);

router.post('/ajudar/:id', verificarToken, voluntariadoController.oferecerAjuda);
router.patch('/concluir/:id', verificarToken, voluntariadoController.marcarComoConcluido);

module.exports = router;