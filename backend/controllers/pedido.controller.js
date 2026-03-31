const pedidoService = require('../services/pedido.service');

exports.listarTodos = async (req, res) => {
  try {
    const pedidos = await pedidoService.listarTodos();
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

exports.obterPorId = async (req, res) => {
  try {
    const pedido = await pedidoService.obterPorId(req.params.id, req.headers.authorization);
    res.json(pedido);
  } catch (erro) {
    res.status(404).json({ erro: erro.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.user.id
    };
    const novoPedido = await pedidoService.criar(payload, req.headers.authorization);
    res.status(201).json(novoPedido);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const pedidoAtualizado = await pedidoService.atualizar(
      req.params.id, 
      req.user.id, 
      req.body, 
      req.headers.authorization
    );
    res.json(pedidoAtualizado);
  } catch (erro) {
    res.status(403).json({ erro: erro.message });
  }
};

exports.apagar = async (req, res) => {
  try {
    await pedidoService.apagar(req.params.id, req.user.id, req.headers.authorization);
    res.status(204).send();
  } catch (erro) {
    res.status(403).json({ erro: erro.message });
  }
};