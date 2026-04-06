/**
 * Controller para sistema de voluntariado.
 * Gere oferta de ajuda, conclusão de pedidos e visualização de contactos.
 */

const voluntariadoService = require('../services/voluntariado.service');

/**
 * Oferece ajuda num pedido pendente (transição pendente → em_progresso).
 * Atribui user atual como helper do pedido.
 * @param {string} req.params.id - UUID do pedido
 * @param {string} req.user.id - ID do user autenticado (extraído do token)
 * @returns {200} Pedido atualizado com helper_id e status 'em_progresso'
 * @returns {400} Erro de validação (pedido já tem helper, user é dono, status inválido)
 */
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

/**
 * Lista todos os pedidos criados pelo user autenticado.
 * Filtra por user_id = currentUser.id.
 * @param {string} req.user.id - ID do user autenticado
 * @returns {200} Array de pedidos criados pelo user (com JOINs)
 * @returns {500} Erro interno do servidor
 */
exports.listarMeusPedidos = async (req, res) => {
  try {
    const pedidos = await voluntariadoService.obterMeusPedidos(req.user.id, req.headers.authorization);
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

/**
 * Lista todos os pedidos onde user é helper.
 * Filtra por helper_id = currentUser.id.
 * @param {string} req.user.id - ID do user autenticado
 * @returns {200} Array de contribuições do user (pedidos onde é helper)
 * @returns {500} Erro interno do servidor
 */
exports.listarMinhasContribuicoes = async (req, res) => {
  try {
    const contribuicoes = await voluntariadoService.obterMinhasContribuicoes(req.user.id, req.headers.authorization);
    res.json(contribuicoes);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};

/**
 * Marca pedido como concluído (transição em_progresso → concluido).
 * Apenas o dono do pedido pode executar esta ação.
 * @param {string} req.params.id - UUID do pedido
 * @param {string} req.user.id - ID do user autenticado (deve ser o dono)
 * @returns {200} Pedido atualizado com status 'concluido'
 * @returns {400} Erro de validação (user não é dono, status inválido)
 */
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

/**
 * Obtém contacto do parceiro (dono vê helper, helper vê dono).
 * Apenas dono e helper do pedido têm acesso. Pedido deve ter helper atribuído.
 * @param {string} req.params.pedidoId - UUID do pedido
 * @param {string} req.user.id - ID do user autenticado
 * @returns {200} Dados de contacto do parceiro {id, nome, email, telefone}
 * @returns {403} Acesso negado (user não é dono nem helper)
 * @returns {404} Pedido não encontrado
 * @returns {500} Erro interno do servidor
 */
exports.obterContacto = async (req, res) => {
  try {
    const pedidoId = req.params.pedidoId;
    const userId = req.user.id;
    const authHeader = req.headers.authorization;

    const contacto = await voluntariadoService.obterContacto(pedidoId, userId, authHeader);
    res.json(contacto);
  } catch (erro) {
    if (erro.message.includes('não encontrado')) {
      return res.status(404).json({ erro: erro.message });
    }
    
    if (erro.message.includes('Não autorizado') || erro.message.includes('Acesso negado')) {
      return res.status(403).json({ erro: erro.message });
    }

    res.status(500).json({ erro: erro.message });
  }
};