const voluntariadoService = require('../services/voluntariado.service');

exports.oferecerAjuda = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const helperId = req.user.id;
    const authHeader = req.headers.authorization;
    
    const resultado = await voluntariadoService.oferecerAjuda(pedidoId, helperId, authHeader);
    res.json(resultado);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
};

exports.listarMeusPedidos = async (req, res) => {
  try {
    const pedidos = await voluntariadoService.obterMeusPedidos(req.user.id, req.headers.authorization);
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

exports.listarMinhasContribuicoes = async (req, res) => {
  try {
    const contribuicoes = await voluntariadoService.obterMinhasContribuicoes(req.user.id, req.headers.authorization);
    res.json(contribuicoes);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

exports.marcarComoConcluido = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const userId = req.user.id;
    const authHeader = req.headers.authorization;
    
    const pedidoConcluido = await voluntariadoService.marcarComoConcluido(pedidoId, userId, authHeader);
    res.json(pedidoConcluido);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
};

exports.obterContacto = async (req, res) => {
  try {
    const pedidoId = req.params.pedidoId;
    const userId = req.user.id;
    const authHeader = req.headers.authorization;

    const contacto = await voluntariadoService.obterContacto(pedidoId, userId, authHeader);
    res.json(contacto);
  } catch (erro) {
    // Mapear erros específicos para status HTTP apropriados
    if (erro.message.includes('não encontrado')) {
      return res.status(404).json({ erro: erro.message });
    }
    
    if (erro.message.includes('Não autorizado') || erro.message.includes('Acesso negado')) {
      return res.status(403).json({ erro: erro.message });
    }

    res.status(500).json({ erro: erro.message });
  }
};