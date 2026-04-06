/**
 * Controller para gestão de pedidos de ajuda.
 * Camada intermediária entre rotas e service, responsável por validação de HTTP e resposta.
 */

const pedidoService = require('../services/pedido.service');

/**
 * Lista todos os pedidos de ajuda com JOINs (distritos, idiomas).
 * @returns {200} Array de pedidos ordenados por data de criação (mais recente primeiro)
 * @returns {500} Erro interno do servidor
 */
exports.listarTodos = async (req, res) => {
  try {
    const pedidos = await pedidoService.listarTodos();
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

/**
 * Obtém um pedido específico pelo ID com dados relacionados.
 * @param {string} req.params.id - UUID do pedido
 * @param {string} req.headers.authorization - Token JWT do user autenticado
 * @returns {200} Objeto do pedido com JOINs
 * @returns {404} Pedido não encontrado
 */
exports.obterPorId = async (req, res) => {
  try {
    const pedido = await pedidoService.obterPorId(req.params.id, req.headers.authorization);
    res.json(pedido);
  } catch (erro) {
    res.status(404).json({ erro: erro.message });
  }
};

/**
 * Cria novo pedido de ajuda atribuindo user_id do token JWT.
 * @param {object} req.body - Dados do pedido (titulo, descricao, distrito_id, idioma_id, urgencia)
 * @param {string} req.user.id - ID do user extraído do token (via middleware)
 * @returns {201} Pedido criado com sucesso
 * @returns {400} Dados inválidos ou erro de validação
 */
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

/**
 * Atualiza pedido existente. Apenas o dono (user_id) pode atualizar.
 * @param {string} req.params.id - UUID do pedido
 * @param {string} req.user.id - ID do user autenticado (deve ser o dono)
 * @param {object} req.body - Campos a atualizar
 * @returns {200} Pedido atualizado com sucesso
 * @returns {403} Acesso negado (não é o dono) ou pedido não encontrado
 */
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

/**
 * Apaga pedido permanentemente. Apenas o dono pode apagar.
 * @param {string} req.params.id - UUID do pedido
 * @param {string} req.user.id - ID do user autenticado (deve ser o dono)
 * @returns {204} Pedido apagado com sucesso (sem conteúdo)
 * @returns {403} Acesso negado (não é o dono) ou pedido não encontrado
 */
exports.apagar = async (req, res) => {
  try {
    await pedidoService.apagar(req.params.id, req.user.id, req.headers.authorization);
    res.status(204).send();
  } catch (erro) {
    res.status(403).json({ erro: erro.message });
  }
};