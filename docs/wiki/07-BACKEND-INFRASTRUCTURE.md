# 🏗️ Backend Infrastructure - IntegraBridge

> **Objetivo**: Documentar a configuração base do backend Node.js/Express, sistema de lookup (distritos/idiomas), e configuração Supabase.

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Servidor Express Principal (index.js)](#2-servidor-express-principal-indexjs)
3. [Configuração Supabase (config/supabase.js)](#3-configuração-supabase-configsupabasejs)
4. [Sistema de Lookup](#4-sistema-de-lookup)
5. [Estrutura de Rotas](#5-estrutura-de-rotas)
6. [Middleware de Segurança](#6-middleware-de-segurança)
7. [Environment Variables](#7-environment-variables)
8. [Error Handling](#8-error-handling)

---

## 1. Visão Geral

### Infraestrutura Backend

O backend IntegraBridge usa **arquitetura em camadas** com separação clara de responsabilidades:

```
┌─────────────────────┐
│    EXPRESS APP      │ ← index.js (servidor principal)
│    (HTTP Layer)     │
├─────────────────────┤
│      ROUTES         │ ← *.routes.js (definição endpoints)
│   (Routing Layer)   │
├─────────────────────┤
│    CONTROLLERS      │ ← *.controller.js (HTTP handlers)
│  (Presentation)     │
├─────────────────────┤
│     SERVICES        │ ← *.service.js (business logic)
│  (Business Logic)   │
├─────────────────────┤
│   SUPABASE CLIENT   │ ← config/supabase.js
│   (Data Access)     │
└─────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnologia | Versão | Propósito |
|------------|------------|--------|-----------|
| **Runtime** | Node.js | 18+ | Ambiente JavaScript backend |
| **Framework** | Express.js | ~4.18 | Server HTTP e routing |
| **Base de Dados** | Supabase | SDK 2.x | PostgreSQL hosted |
| **Autenticação** | JWT | Supabase Auth | Validação de tokens |
| **CORS** | cors | ~2.8 | Cross-origin requests |

### Arquivos de Infraestrutura

| Arquivo | Responsabilidade | Linhas |
|---------|------------------|--------|
| `index.js` | Servidor Express principal | 40 |
| `config/supabase.js` | Cliente Supabase | 14 |
| `routes/lookup.routes.js` | Rotas de lookup | 16 |
| `controllers/lookup.controller.js` | HTTP handlers | 31 |
| `services/lookup.service.js` | Queries BD | 25 |

---

## 2. Servidor Express Principal (index.js)

### Localização
`backend/index.js`

### Responsabilidades

1. **Configuração Express**: Middleware, CORS, JSON parsing
2. **Registo de Rotas**: Mapeia prefixos para routers
3. **Health Check**: Endpoint raiz para verificar API
4. **Startup**: Inicia servidor na porta configurada

### Estrutura do Arquivo

```javascript
// Configuração base
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importação de routers
const pedidoRoutes = require('./routes/pedido.routes');
const lookupRoutes = require('./routes/lookup.routes');
const authController = require('./controllers/auth.controller');
const rotasPedido = require('./routes/pedido.routes');
const rotasVoluntariado = require('./routes/voluntariado.routes');

// Configuração da app
const app = express();
const port = process.env.PORT || 3000;
```

### Middleware Configuration

```javascript
app.use(cors());           // Permite requests cross-origin
app.use(express.json());   // Parser de JSON no body
```

**Explicação**:
- **CORS**: Necessário para frontend Angular aceder ao backend
- **express.json()**: Converte `req.body` de JSON string para objeto

### Health Check Endpoint

```javascript
app.get('/', (req, res) => {
  res.json({ mensagem: 'API IntegraBridge a funcionar perfeitamente e com Clean Code SOLID!' });
});
```

**Uso**:
- **Deployment**: Render.com usa este endpoint para health checks
- **Debug**: Verificar se API está acessível

### Registo de Rotas

```javascript
app.post('/api/login', authController.loginMock);

app.use('/api/pedidos', pedidoRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/pedidos', rotasPedido);
app.use('/api/voluntariado', rotasVoluntariado);
```

**Pattern**:
- **Prefixo comum**: `/api/*` para todas as rotas da API
- **Router delegação**: Cada módulo tem seu router específico
- **Middleware aplicado**: `verificarToken` aplicado em cada router

### Startup do Servidor

```javascript
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
```

**Port Selection**:
1. `process.env.PORT` (produção - Render.com define)
2. `3000` (desenvolvimento - fallback)

---

## 3. Configuração Supabase (config/supabase.js)

### Localização
`backend/config/supabase.js`

### Responsabilidade

Configura cliente Supabase para operações backend com **service key** (não anon key).

### Estrutura do Arquivo

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

### Environment Variables Requeridas

```bash
# .env file
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_KEY=[service-role-key]  # ⚠️ NÃO anon key
```

**Diferenças entre Keys**:

| Key Type | Uso | Permissões | Local |
|----------|-----|------------|-------|
| **Anon Key** | Frontend público | RLS policies aplicadas | Angular app |
| **Service Key** | Backend privado | Bypass RLS (full access) | Node.js server |

### Padrão Singleton

```javascript
// Cada service importa a mesma instância
const supabase = require('../config/supabase');
```

**Benefícios**:
- **Connection pooling**: Reutiliza conexões
- **Configuração centralizada**: Uma só fonte de verdade
- **Memory efficient**: Evita múltiplas instâncias

### Segurança

⚠️ **CRÍTICO**: Service key deve estar **apenas no backend**

```javascript
// ✅ CORRETO: Backend com service key
const supabase = createClient(url, serviceKey);  // Full access

// ❌ ERRADO: Frontend com service key
// Nunca expor service key no código frontend
```

---

## 4. Sistema de Lookup

### Conceito

**Lookup** = dados de referência (dropdowns, listas estáticas) usados em formulários.

### Entidades de Lookup

| Entidade | Tabela BD | Uso |
|----------|-----------|-----|
| **Distritos** | `distritos` | Localização geográfica dos pedidos |
| **Idiomas** | `idiomas` | Idioma preferencial para comunicação |

### Fluxo Completo

```
Frontend (criar-pedido.ts)
    ↓ HTTP GET
/api/lookups/distritos
    ↓
lookup.routes.js
    ↓
verificarToken middleware (valida JWT)
    ↓
lookup.controller.js → listarDistritos()
    ↓
lookup.service.js → listarDistritos()
    ↓
Supabase query → SELECT id, nome FROM distritos ORDER BY nome
    ↓
JSON response → [{ id: 1, nome: "Aveiro" }, ...]
```

### 4.1 Lookup Routes (lookup.routes.js)

```javascript
const router = express.Router();
const lookupController = require('../controllers/lookup.controller');
const verificarToken = require('../middleware/auth');

router.get('/distritos', verificarToken, lookupController.listarDistritos);
router.get('/idiomas', verificarToken, lookupController.listarIdiomas);
```

**Características**:
- **Proteção JWT**: Só users autenticados acedem
- **Delegação**: Controller processa a lógica
- **RESTful**: GET para listar recursos

### 4.2 Lookup Controller (lookup.controller.js)

```javascript
exports.listarDistritos = async (req, res) => {
  try {
    const distritos = await lookupService.listarDistritos();
    res.json(distritos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar distritos.' });
  }
};
```

**Pattern Try-Catch**:
- **Happy path**: `res.json(data)` - status 200 implícito
- **Error path**: `res.status(500).json({ erro })` - mensagem amigável

### 4.3 Lookup Service (lookup.service.js)

```javascript
exports.listarDistritos = async () => {
  const { data, error } = await supabase
    .from('distritos')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};
```

**Supabase Query Builder**:
- `.from('distritos')`: Especifica tabela
- `.select('id, nome')`: Projeta apenas campos necessários
- `.order('nome', { ascending: true })`: Ordena alfabeticamente

**Error Handling**: Se Supabase retorna error, lança exception que é capturada no controller.

---

## 5. Estrutura de Rotas

### Mapeamento de URLs

| URL | Router | Controller | Descrição |
|-----|--------|------------|-----------|
| `GET /` | - | index.js | Health check |
| `POST /api/login` | - | auth.controller | Mock login (legacy) |
| `/api/pedidos/*` | pedido.routes | pedido.controller | CRUD pedidos |
| `/api/lookups/*` | lookup.routes | lookup.controller | Dados de referência |
| `/api/voluntariado/*` | voluntariado.routes | voluntariado.controller | Sistema matching |

### Pattern de Rotas

```javascript
// index.js - registro de routers
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/voluntariado', rotasVoluntariado);

// lookup.routes.js - definição específica
router.get('/distritos', verificarToken, lookupController.listarDistritos);
//         ↑ path relativo

// URL final: /api/lookups/distritos
//            ↑ prefix     ↑ route
```

### RESTful Design

| Verbo HTTP | Padrão | Exemplo |
|------------|--------|---------|
| `GET` | Listar/Obter | `GET /api/lookups/distritos` |
| `POST` | Criar | `POST /api/pedidos` |
| `PUT` | Atualizar | `PUT /api/pedidos/:id` |
| `DELETE` | Eliminar | `DELETE /api/pedidos/:id` |

---

## 6. Middleware de Segurança

### verificarToken Middleware

Aplicado em **todas** as rotas de lookup:

```javascript
router.get('/distritos', verificarToken, lookupController.listarDistritos);
//                       ↑ middleware
```

### Fluxo de Validação

```
Client request → JWT token no header Authorization
    ↓
verificarToken middleware
    ↓
┌─────────────────┬────────────────┐
│ Token válido    │ Token inválido │
│       ↓         │       ↓        │
│ req.user =      │ res.status(401)│
│ decoded payload │ return         │
│       ↓         │                │
│ next() →        │                │
│ Controller      │                │
└─────────────────┴────────────────┘
```

**Documentação completa**: Ver [01-AUTENTICACAO.md](./01-AUTENTICACAO.md)

---

## 7. Environment Variables

### Arquivo .env (exemplo)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Server Configuration  
PORT=3000

# Para produção adicionar:
NODE_ENV=production
```

### Carregamento

```javascript
require('dotenv').config();  // Carrega .env no processo Node.js

const supabaseUrl = process.env.SUPABASE_URL;
const port = process.env.PORT || 3000;
```

### Deployment (Render.com)

No Render, environment variables são definidas via **dashboard web** (não arquivo .env):

```
SUPABASE_URL → Settings → Environment Variables
SUPABASE_KEY → Settings → Environment Variables  
PORT → Automaticamente definido pelo Render
```

---

## 8. Error Handling

### Pattern Consistente

Todos os controllers seguem o mesmo pattern:

```javascript
exports.operacao = async (req, res) => {
  try {
    const resultado = await service.operacao();
    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Mensagem amigável' });
  }
};
```

### HTTP Status Codes

| Status | Uso | Exemplo |
|--------|-----|---------|
| `200` | Sucesso | `res.json(data)` |
| `401` | Não autenticado | Middleware `verificarToken` |
| `500` | Erro servidor | `catch` block nos controllers |

### Error Propagation

```
Service (Supabase error)
    ↓ throw new Error()
Controller (catch block)
    ↓ res.status(500)
Frontend (HTTP error)
    ↓ .subscribe({ error: ... })
UI (mensagem erro)
```

---

