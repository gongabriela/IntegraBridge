/**
 * Service para operações CRUD de pedidos de ajuda no Supabase.
 * Camada de acesso a dados com lógica de negócio e validação de permissões.
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseGlobal = require('../config/supabase');

/**
 * Cria cliente Supabase autenticado com JWT do user.
 * Permite operações RLS (Row Level Security) respeitando permissões do user.
 * @param {string} authHeader - Header Authorization com Bearer token
 * @returns {object} Cliente Supabase autenticado
 */
const getAuthClient = (authHeader) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};

/**
 * Lista todos os pedidos de ajuda com JOINs de distritos e idiomas.
 * Usa cliente global (admin) para listar todos sem restrições RLS.
 * @returns {Promise<Array>} Array de pedidos ordenados por created_at (desc)
 * @throws {Error} Se houver erro na query Supabase
 */
exports.listarTodos = async () => {
  const { data, error } = await supabaseGlobal
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Obtém pedido específico pelo ID com dados relacionados.
 * Usa cliente autenticado para respeitar RLS (apenas pedidos acessíveis ao user).
 * @param {string} id - UUID do pedido
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Objeto do pedido com JOINs
 * @throws {Error} Se pedido não encontrado ou sem permissão
 */
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

/**
 * Cria novo pedido de ajuda no Supabase.
 * User_id vem do payload (injetado pelo controller com req.user.id).
 * @param {object} payload - Dados do pedido (titulo, descricao, user_id, distrito_id, idioma_id, urgencia)
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Pedido criado com ID gerado
 * @throws {Error} Se dados inválidos ou erro de constraint
 */
exports.criar = async (payload, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .insert(payload)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
};

/**
 * Atualiza pedido existente. Valida que apenas o dono (user_id) pode atualizar.
 * Query com .eq('user_id', donoId) garante que apenas o dono consegue atualizar.
 * @param {string} id - UUID do pedido
 * @param {string} donoId - ID do user autenticado (deve ser o dono)
 * @param {object} payload - Campos a atualizar
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<object>} Pedido atualizado
 * @throws {Error} Se não for o dono ou pedido não existir
 */
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

/**
 * Apaga pedido permanentemente. Valida que apenas o dono pode apagar.
 * Query com .eq('user_id', donoId) garante segurança.
 * @param {string} id - UUID do pedido
 * @param {string} donoId - ID do user autenticado (deve ser o dono)
 * @param {string} authHeader - Token JWT do user
 * @returns {Promise<boolean>} True se apagado com sucesso
 * @throws {Error} Se não for o dono ou pedido não existir
 */
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