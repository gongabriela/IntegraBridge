const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Middleware de autenticação para validar JWT token.
 * Valida token do header Authorization com Supabase.
 * Adiciona user ao request (req.user) se válido.
 * Retorna 401 Unauthorized se token inválido ou ausente.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Precisas de fazer login primeiro.' });
  }
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
  req.user = data.user;
  next();
};

module.exports = verificarToken;