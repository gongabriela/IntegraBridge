/**
 * Service para sistema de voluntariado no Supabase.
 * Gere ofertas de ajuda, conclusão de pedidos e acesso a contactos.
 * Usa RPC functions para lógica complexa com validações atômicas.
 */

const { createClient } = require('@supabase/supabase-js');
const pedidoService = require('./pedido.service');

/**
 * Cria cliente Supabase autenticado com JWT do user.
 * Permite RPC functions acederem ao contexto do user (auth.uid()).
 * @param {string} authHeader - Header Authorization com Bearer token
 * @returns {object} Cliente Supabase autenticado
 */
const getAuthClient = (authHeader) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};

/**
 * Oferece ajuda num pedido pendente via RPC function.
 * Atribui user como helper e muda status para 'em_progresso'.
 * RPC valida: pedido existe, user não é dono, status é pendente, sem helper existente.
 * @param {string} pedidoId - UUID do pedido
 * @param {string} helperId - ID do user a oferecer ajuda
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Pedido atualizado com helper_id e status 'em_progresso'
 * @throws {Error} Se validações RPC falharem (já tem helper, user é dono, etc.)
 */
exports.oferecerAjuda = async (pedidoId, helperId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  
  const { error } = await supabase.rpc('oferecer_ajuda', {
    p_pedido_id: pedidoId,
    p_helper_id: helperId
  });

  if (error) {
    throw new Error(error.message || 'Erro ao processar a oferta de ajuda.');
  }

  const pedidoAtualizado = await pedidoService.obterPorId(pedidoId, authHeader);
  return pedidoAtualizado;
};

/**
 * Lista pedidos criados pelo user autenticado.
 * Filtra por user_id = userId e inclui JOINs com distritos e idiomas.
 * @param {string} userId - ID do user autenticado
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<Array>} Array de pedidos criados pelo user (ordenado por created_at desc)
 * @throws {Error} Se houver erro na query Supabase
 */
exports.obterMeusPedidos = async (userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar os teus pedidos na base de dados.');
  return data;
};

/**
 * Lista pedidos onde user é helper (ofereceu ajuda).
 * Filtra por helper_id = userId e inclui JOINs com distritos e idiomas.
 * @param {string} userId - ID do user autenticado
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<Array>} Array de contribuições do user (ordenado por created_at desc)
 * @throws {Error} Se houver erro na query Supabase
 */
exports.obterMinhasContribuicoes = async (userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .eq('helper_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar as tuas contribuições na base de dados.');
  return data;
};

/**
 * Marca pedido como concluído (em_progresso → concluido).
 * Valida que apenas o dono (user_id) pode concluir e que status é 'em_progresso'.
 * @param {string} pedidoId - UUID do pedido
 * @param {string} userId - ID do user autenticado (deve ser o dono)
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Pedido atualizado com status 'concluido'
 * @throws {Error} Se user não é dono ou status não é 'em_progresso'
 */
exports.marcarComoConcluido = async (pedidoId, userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  
  const pedidoAtual = await pedidoService.obterPorId(pedidoId, authHeader);
  
  if (pedidoAtual.user_id !== userId) {
    throw new Error('Acesso negado: Apenas o criador do pedido o pode concluir.');
  }

  if (pedidoAtual.status !== 'em_progresso') {
    throw new Error('Operação inválida: Apenas pedidos "em progresso" podem ser concluídos.');
  }
  
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .update({ status: 'concluido' })
    .eq('id', pedidoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error('Erro ao atualizar o status do pedido na base de dados.');
  return data;
};

/**
 * Obtém contacto do parceiro via RPC function (dono vê helper, helper vê dono).
 * RPC valida: pedido existe, tem helper atribuído, caller é dono ou helper.
 * @param {string} pedidoId - UUID do pedido
 * @param {string} callerId - ID do user a solicitar contacto
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Dados de contacto {id, nome, email, telefone}
 * @throws {Error} Se não autorizado, pedido não encontrado ou sem helper
 */
exports.obterContacto = async (pedidoId, callerId, authHeader) => {
  const supabase = getAuthClient(authHeader);

  const { data, error } = await supabase.rpc('obter_contacto_parceiro', {
    p_pedido_id: pedidoId,
    p_caller_id: callerId
  });

  if (error) {
    if (error.code === 'P0002') {
      throw new Error('Pedido não encontrado.');
    }

    if (error.code === '42501') {
      throw new Error('Não autorizado a visualizar contactos deste pedido. Apenas o dono e o helper podem aceder.');
    }

    if (error.code === 'P0003') {
      throw new Error('Pedido ainda não tem helper atribuído.');
    }

    throw new Error(error.message || 'Erro ao obter contacto do parceiro.');
  }

  if (!data) {
    throw new Error('Nenhum dado retornado pela RPC obter_contacto_parceiro.');
  }

  return data && data.length > 0 ? data[0] : null;
};
