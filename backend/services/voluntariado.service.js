const { createClient } = require('@supabase/supabase-js');
const pedidoService = require('./pedido.service');

const getAuthClient = (authHeader) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};

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

exports.obterContacto = async (pedidoId, callerId, authHeader) => {
  const supabase = getAuthClient(authHeader);

  const { data, error } = await supabase.rpc('obter_contacto_parceiro', {
    p_pedido_id: pedidoId,
    p_caller_id: callerId
  });

  if (error) {
    // Mapear códigos de erro do Supabase para mensagens amigáveis
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
