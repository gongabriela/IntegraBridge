require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Permite ao servidor entender dados em formato JSON

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota de Teste (Health Check)
app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente!' });
});

// Iniciar o Servidor
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});