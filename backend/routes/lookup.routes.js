const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookup.controller');
const verificarToken = require('../middleware/auth');

/**
 * Rotas para lookup de dados de referência (distritos e idiomas).
 * Todas as rotas são protegidas - apenas utilizadores autenticados podem aceder.
 */

/**
 * GET /api/lookups/distritos - Lista todos os distritos ordenados por nome.
 * @middleware verificarToken - Validação JWT obrigatória
 */
router.get('/distritos', verificarToken, lookupController.listarDistritos);

/**
 * GET /api/lookups/idiomas - Lista todos os idiomas ordenados por nome.
 * @middleware verificarToken - Validação JWT obrigatória
 */
router.get('/idiomas', verificarToken, lookupController.listarIdiomas);

module.exports = router;