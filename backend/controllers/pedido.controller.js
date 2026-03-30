const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

exports.listarTodos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .select('*, distritos(nome), idiomas(nome)')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ erro: error.message });
    res.json(data);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

exports.obterPorId = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .select('*, distritos(nome), idiomas(nome)')
      .eq('id', pedidoId)
      .single();

    if (error) return res.status(404).json({ erro: 'Pedido de ajuda não encontrado.' });
    res.json(data);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const { titulo, descricao, idioma_id, urgencia, distrito_id, status } = req.body;
    const supabaseAutenticado = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // 3. Fazemos o insert com o nosso cliente autenticado
    const { data, error } = await supabaseAutenticado
      .from('pedidos_ajuda')
      .insert([{ 
        user_id: req.user.id, 
        titulo, 
        descricao, 
        idioma_id, 
        urgencia, 
        distrito_id, 
        status // Adicionámos o status aqui!
      }])
      .select(); // O .select() garante que a BD nos devolve o objeto criado
    if (error) {
      console.error('Erro no Supabase:', error);
      return res.status(400).json({ erro: error.message });
    }
    res.status(201).json(data[0]);
  } catch (erroInesperado) {
    console.error('Erro interno:', erroInesperado);
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const donoId = req.user.id;
    const { titulo, descricao, idioma_id, urgencia, distrito_id, status } = req.body;

    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .update({ titulo, descricao, idioma_id, urgencia, distrito_id, status })
      .eq('id', pedidoId)
      .eq('user_id', donoId)
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    if (data.length === 0) return res.status(403).json({ erro: 'Acesso negado.' });
    
    res.json(data[0]);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};

exports.apagar = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const donoId = req.user.id;

    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .delete()
      .eq('id', pedidoId)
      .eq('user_id', donoId)
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    if (data.length === 0) return res.status(403).json({ erro: 'Acesso negado.' });
    
    res.json({ mensagem: 'Pedido de ajuda apagado com sucesso!' });
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
};