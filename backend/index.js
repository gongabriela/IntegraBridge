require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const verificarToken = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota de Teste
app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente!' });
});

app.get('/api/pedidos', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .select(`
        *,
        distritos ( nome ),
        idiomas ( nome )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    res.json(data);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

app.get('/api/pedidos/:id', verificarToken, async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .select(`
        *,
        distritos ( nome ),
        idiomas ( nome )
      `)
      .eq('id', pedidoId)
      .single();

    if (error) {
      return res.status(404).json({ erro: 'Pedido de ajuda não encontrado.' });
    }
    res.json(data);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

app.delete('/api/pedidos/:id', verificarToken, async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const donoId = req.user.id;
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .delete()
      .eq('id', pedidoId)
      .eq('user_id', donoId)
      .select();
    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    if (data.length === 0) {
      return res.status(403).json({ erro: 'Acesso negado: Não és o dono deste pedido ou ele já não existe.' });
    }
    res.json({ mensagem: 'Pedido de ajuda apagado com sucesso!' });
  } catch (erroInesperado) {
    console.error("Erro no DELETE /pedidos/:id:", erroInesperado);
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

app.put('/api/pedidos/:id', verificarToken, async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const donoId = req.user.id;
    
    const { titulo, descricao, idioma_id, urgencia, distrito_id, status } = req.body;

    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .update({
        titulo: titulo,
        descricao: descricao,
        idioma_id: idioma_id,
        urgencia: urgencia,
        distrito_id: distrito_id,
        status: status
      })
      .eq('id', pedidoId)
      .eq('user_id', donoId)
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    if (data.length === 0) {
      return res.status(403).json({ erro: 'Acesso negado: Não és o dono deste pedido ou ele já não existe.' });
    }
    res.json(data[0]);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

app.post('/api/pedidos', verificarToken, async (req, res) => {
  try {
    const { titulo, descricao, idioma_id, urgencia, distrito_id } = req.body;
    
    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .insert([
        {
          user_id: req.user.id, 
          titulo: titulo,
          descricao: descricao,
          idioma_id: idioma_id,
          urgencia: urgencia,
          distrito_id: distrito_id
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    res.status(201).json(data[0]);
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

// APAGAR (codigo): Fazer Login para obter o Token (A Pulseira VIP)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }
  res.json({ token: data.session.access_token });
});
// Iniciar o Servidor

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
