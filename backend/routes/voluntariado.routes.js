/**
 * Rotas para sistema de voluntariado (oferecer ajuda, concluir, ver contacto).
 * Todas as rotas exigem autenticação via middleware verificarToken.
 * 
 * Endpoints:
 * - GET    /api/voluntariado/meus-pedidos          → Listar pedidos criados pelo user
 * - GET    /api/voluntariado/minhas-contribuicoes  → Listar pedidos onde user é helper
 * - POST   /api/voluntariado/ajudar/:id            → Oferecer ajuda (pendente → em_progresso)
 * - PATCH  /api/voluntariado/concluir/:id          → Marcar concluído (em_progresso → concluido)
 * - GET    /api/voluntariado/contacto/:pedidoId    → Ver contacto do parceiro (dono/helper)
 */

const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth');
const voluntariadoController = require('../controllers/voluntariado.controller');

router.get('/meus-pedidos', verificarToken, voluntariadoController.listarMeusPedidos);
router.get('/minhas-contribuicoes', verificarToken, voluntariadoController.listarMinhasContribuicoes);

router.post('/ajudar/:id', verificarToken, voluntariadoController.oferecerAjuda);
router.patch('/concluir/:id', verificarToken, voluntariadoController.marcarComoConcluido);

router.get('/contacto/:pedidoId', verificarToken, voluntariadoController.obterContacto);

module.exports = router;