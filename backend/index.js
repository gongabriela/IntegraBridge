require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pedidoRoutes = require('./routes/pedido.routes');

// TEMPORARIO Precisamos do Supabase aqui apenas para a rota de login temporária
const supabase = require('./config/supabase');

const lookupRoutes = require('./routes/lookup.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente e com Clean Code!' });
});

// ------------------------------------------------------------------
// ROTA TEMPORÁRIA DE LOGIN (Para obtermos o Token no Postman)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(400).json({ erro: error.message });
    }
    // Devolvemos o Token JWT!
    res.json({ token: data.session.access_token });
  } catch (erroInesperado) {
    res.status(500).json({ erro: 'Erro no servidor ao tentar fazer login.' });
  }
});
// ------------------------------------------------------------------

app.use('/api/pedidos', pedidoRoutes);

app.use('/api/lookup', lookupRoutes);

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});