const supabase = require('../config/supabase');

// Seguindo Clean Code: Funções simples e diretas
exports.listarDistritos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('distritos')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (error) return res.status(400).json({ erro: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar distritos.' });
  }
};

exports.listarIdiomas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('idiomas')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (error) return res.status(400).json({ erro: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar idiomas.' });
  }
};