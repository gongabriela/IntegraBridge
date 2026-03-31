const lookupService = require('../services/lookup.service');

exports.listarDistritos = async (req, res) => {
  try {
    const distritos = await lookupService.listarDistritos();
    res.json(distritos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar distritos.' });
  }
};

exports.listarIdiomas = async (req, res) => {
  try {
    const idiomas = await lookupService.listarIdiomas();
    res.json(idiomas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar idiomas.' });
  }
};