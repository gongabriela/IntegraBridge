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