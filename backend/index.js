require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pedidoRoutes = require('./routes/pedido.routes');
const lookupRoutes = require('./routes/lookup.routes');
const authController = require('./controllers/auth.controller'); // Importa o novo controller

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente e com Clean Code SOLID!' });
});

// Rota de Auth isolada
app.post('/api/login', authController.loginMock);

// Rotas da API
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/lookups', lookupRoutes);

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});