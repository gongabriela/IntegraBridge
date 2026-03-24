require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const verificarToken = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(verificarToken);
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    
    res.json(data);
  } catch (erroInesperado) {
    console.error("Erro no GET /pedidos:", erroInesperado);
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

app.post('/api/pedidos', verificarToken, async (req, res) => {
  try {
    const { titulo, descricao, idioma, urgencia, distrito } = req.body;

    const { data, error } = await supabase
      .from('pedidos_ajuda')
      .insert([{
        user_id: req.user.id, 
        titulo: titulo,
        descricao: descricao,
        idioma: idioma,
        urgencia: urgencia,
        distrito: distrito
      }])
      .select(); 

    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (erroInesperado) {
    console.error("Erro no POST /pedidos:", erroInesperado);
    res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
  }
});

// Iniciar o Servidor
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
