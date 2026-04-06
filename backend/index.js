require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pedidoRoutes = require('./routes/pedido.routes');
const lookupRoutes = require('./routes/lookup.routes');
const authController = require('./controllers/auth.controller');
const rotasPedido = require('./routes/pedido.routes');
const rotasVoluntariado = require('./routes/voluntariado.routes');

/**
 * Servidor Express principal da aplicação IntegraBridge.
 * Configura middleware, rotas da API e inicia servidor.
 */
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Rota raiz de health check.
 * @returns {Object} Mensagem de confirmação que API está operacional
 */
app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente e com Clean Code SOLID!' });
});

/**
 * Rota de autenticação mock (legacy).
 * POST /api/login - endpoint isolado para testes
 */
app.post('/api/login', authController.loginMock);

/**
 * Registo de rotas da API com prefixos específicos.
 * Todas as rotas são protegidas por middleware auth exceto /api/login.
 */
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/pedidos', rotasPedido);
app.use('/api/voluntariado', rotasVoluntariado);

/**
 * Inicia servidor Express na porta especificada.
 * Usa PORT do environment ou 3000 como fallback.
 */
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});