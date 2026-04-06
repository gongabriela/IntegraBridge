const lookupService = require('../services/lookup.service');

/**
 * Controller para endpoints de lookup (dados de referência).
 * Gere pedidos HTTP para listar distritos e idiomas disponíveis.
 */

/**
 * Lista todos os distritos disponíveis ordenados por nome.
 * @param {Object} req - Objeto de request Express
 * @param {Object} res - Objeto de response Express
 * @returns {Object[]} Array de distritos {id, nome}
 */
exports.listarDistritos = async (req, res) => {
  try {
    const distritos = await lookupService.listarDistritos();
    res.json(distritos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar distritos.' });
  }
};

/**
 * Lista todos os idiomas disponíveis ordenados por nome.
 * @param {Object} req - Objeto de request Express
 * @param {Object} res - Objeto de response Express
 * @returns {Object[]} Array de idiomas {id, nome}
 */
exports.listarIdiomas = async (req, res) => {
  try {
    const idiomas = await lookupService.listarIdiomas();
    res.json(idiomas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar idiomas.' });
  }
};