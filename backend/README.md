# IntegraBridge Backend API

API Node.js + Express para plataforma de voluntariado de ajuda burocrática a imigrantes e refugiados com integração Supabase.

## Como usar

```bash
npm install
npm start
node index.js
```

**URL Base:** `https://integrabridge-api.onrender.com`

---

## Tecnologias

- Node.js + Express.js
- Supabase (auth + database)
- CORS + dotenv

---

## Estrutura

```
backend/
├── controllers/     # auth, pedido, lookup, voluntariado
├── routes/         # pedido, lookup, voluntariado  
├── middleware/     # auth
├── services/       # pedido, lookup, voluntariado
├── config/         # supabase
└── index.js        # servidor principal
```

---

## Autenticação

Todos os endpoints (exceto login) precisam de Authorization header.

---

## Middleware de Autenticação

**Todos os endpoints protegidos podem retornar:**
- `401`: `{ "erro": "Acesso negado. Precisas de fazer login primeiro." }`
- `401`: `{ "erro": "Token inválido ou expirado." }`

---

## Endpoints

### **Autenticação**

#### `POST /api/login`
Login do utilizador.

**Respostas:**
- `200`: `{ "token": "access_token_do_supabase" }`
- `400`: `{ "erro": "mensagem_erro_supabase" }`
- `500`: `{ "erro": "Erro no servidor ao tentar fazer login." }`

---

### **Gestão de Pedidos**

#### `GET /api/pedidos`
Lista todos os pedidos ordenados por data de criação (mais recentes primeiro).

**Respostas:**
- `200`: Array de pedidos
- `500`: `{ "erro": "Ocorreu um erro interno no servidor." }`

#### `GET /api/pedidos/:id`
Obtém um pedido específico pelo ID.

**Respostas:**
- `200`: Objeto pedido
- `404`: `{ "erro": "Pedido não encontrado." }`

#### `POST /api/pedidos`
Criar novo pedido (adiciona automaticamente o user_id do utilizador logado).

**Respostas:**
- `201`: Pedido criado
- `400`: Erro nos dados

#### `PUT /api/pedidos/:id`
Atualizar pedido existente (apenas o autor).

**Respostas:**
- `200`: Pedido atualizado
- `403`: Erro de permissão

#### `DELETE /api/pedidos/:id`
Apagar pedido (apenas o autor).

**Respostas:**
- `204`: Apagado com sucesso (sem conteúdo)
- `403`: Erro de permissão

---

### **Dados Auxiliares (Lookups)**

#### `GET /api/lookups/distritos`
Lista todos os distritos disponíveis.

**Respostas:**
- `200`: Array de distritos
- `500`: `{ "erro": "Erro ao carregar distritos." }`

#### `GET /api/lookups/idiomas`
Lista todos os idiomas disponíveis.

**Respostas:**
- `200`: Array de idiomas
- `500`: `{ "erro": "Erro ao carregar idiomas." }`

---

### **Sistema de Voluntariado**

#### `GET /api/voluntariado/meus-pedidos`
Lista pedidos criados pelo utilizador autenticado.

**Respostas:**
- `200`: Array de pedidos do utilizador
- `500`: Erro interno

#### `GET /api/voluntariado/minhas-contribuicoes`
Lista pedidos onde o utilizador está a oferecer ajuda.

**Respostas:**
- `200`: Array de contribuições
- `500`: Erro interno

#### `POST /api/voluntariado/ajudar/:id`
Oferecer ajuda num pedido específico.

**Respostas:**
- `200`: Ajuda oferecida
- `400`: Erro nos dados

#### `PATCH /api/voluntariado/concluir/:id`
Marcar pedido como concluído.

**Respostas:**
- `200`: Pedido marcado como concluído
- `400`: Erro nos dados

#### `GET /api/voluntariado/contacto/:pedidoId`
Obter informações de contacto.

**Respostas:**
- `200`: Informações de contacto
- `403`: `{ "erro": "Não autorizado" }` ou `{ "erro": "Acesso negado" }`
- `404`: Erro contendo "não encontrado"
- `500`: Erro interno

---

