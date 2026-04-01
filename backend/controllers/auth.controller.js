const supabase = require('../config/supabase');

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