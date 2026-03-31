const { createClient } = require('@supabase/supabase-js');
const supabaseGlobal = require('../config/supabase');

const getAuthClient = (authHeader) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};

exports.listarTodos = async () => {
  const { data, error } = await supabaseGlobal
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

exports.obterPorId = async (id, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .eq('id', id)
    .single();

  if (error) throw new Error('Pedido não encontrado.');
  return data;
};

exports.criar = async (payload, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .insert(payload)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
};

exports.atualizar = async (id, donoId, payload, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .update(payload)
    .eq('id', id)
    .eq('user_id', donoId)
    .select();

  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Acesso negado ou pedido não encontrado.');
  return data[0];
};

exports.apagar = async (id, donoId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .delete()
    .eq('id', id)
    .eq('user_id', donoId)
    .select();

  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error('Acesso negado ou pedido não encontrado.');
  return true;
};