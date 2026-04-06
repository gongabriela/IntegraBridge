const supabase = require('../config/supabase');

/**
 * Service para operações de lookup (dados de referência).
 * Executa queries Supabase para listar distritos e idiomas.
 */

/**
 * Lista todos os distritos da base de dados ordenados alfabeticamente.
 * @returns {Promise<Object[]>} Array de objectos {id, nome}
 * @throws {Error} Se query Supabase falha
 */
exports.listarDistritos = async () => {
  const { data, error } = await supabase
    .from('distritos')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Lista todos os idiomas da base de dados ordenados alfabeticamente.
 * @returns {Promise<Object[]>} Array de objectos {id, nome}
 * @throws {Error} Se query Supabase falha
 */
exports.listarIdiomas = async () => {
  const { data, error } = await supabase
    .from('idiomas')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};