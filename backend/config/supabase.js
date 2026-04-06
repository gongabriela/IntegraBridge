require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * Configuração do cliente Supabase para o backend.
 * Usa variáveis de ambiente para URL e chave de serviço.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

/**
 * Cliente Supabase configurado para operações backend.
 * Exportado para ser usado por services que acedem à base de dados.
 */
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;