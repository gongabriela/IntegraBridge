const supabase = require('../config/supabase');

/**
 * Endpoint de login mock (LEGACY - não usado em produção).
 * Frontend chama Supabase Auth diretamente, sem passar por este endpoint.
 * Mantido para testes backend isolados.
 * 
 * @param {Request} req - Express request com {email, password} no body
 * @param {Response} res - Express response com {token} ou {erro}
 */
exports.loginMock = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ erro: error.message });
    res.json({ token: data.session.access_token });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor ao tentar fazer login.' });
  }
};