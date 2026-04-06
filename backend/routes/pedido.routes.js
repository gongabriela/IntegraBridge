/**
 * Rotas para gestão de pedidos de ajuda (CRUD completo).
 * Todas as rotas exigem autenticação via middleware verificarToken.
 * 
 * Endpoints:
 * - GET    /api/pedidos        → Lista todos os pedidos
 * - GET    /api/pedidos/:id    → Obtém pedido específico
 * - POST   /api/pedidos        → Cria novo pedido
 * - PUT    /api/pedidos/:id    → Atualiza pedido (apenas dono)
 * - DELETE /api/pedidos/:id    → Apaga pedido (apenas dono)
 */

const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth');
const pedidoController = require('../controllers/pedido.controller');

router.get('/', verificarToken, pedidoController.listarTodos);
router.get('/:id', verificarToken, pedidoController.obterPorId);
router.post('/', verificarToken, pedidoController.criar);
router.put('/:id', verificarToken, pedidoController.atualizar);
router.delete('/:id', verificarToken, pedidoController.apagar);

module.exports = router;