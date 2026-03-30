const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookup.controller');
const verificarToken = require('../middleware/auth');

// Rotas protegidas, pois apenas utilizadores logados devem ver estas listas
router.get('/distritos', verificarToken, lookupController.listarDistritos);
router.get('/idiomas', verificarToken, lookupController.listarIdiomas);

module.exports = router;