# 📚 SESSÃO 5: ARQUITETURA DO SISTEMA

> **Objetivo desta sessão:** Compreender a arquitetura completa do IntegraBridge (frontend + backend + database), stack tecnológico, padrões arquiteturais e decisões de design.

---

## 🎯 VISÃO GERAL

O **IntegraBridge** é uma aplicação **full-stack** para conectar refugiados e imigrantes com voluntários que oferecem ajuda. A arquitetura segue o padrão **cliente-servidor** com separação clara de responsabilidades.

```
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRABRIDGE                            │
│                                                              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │  FRONTEND   │ ───▶ │   BACKEND   │ ───▶ │   SUPABASE  │ │
│  │  (Angular)  │ ◀─── │  (Node.js)  │ ◀─── │ (PostgreSQL)│ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│       Vercel             Render              Cloud DB       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARQUITETURA DE ALTO NÍVEL

### **Three-Tier Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                           │
│                   (Frontend - Angular)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Components│  │ Services │  │  Guards  │  │  Models  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│        │              │              │              │        │
└────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │
         │         HTTP Requests (REST API)           │
         │              │              │              │
┌────────▼──────────────▼──────────────▼──────────────▼────────┐
│                    APPLICATION TIER                           │
│                   (Backend - Node.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Routes  │→ │Controllers│→│ Services │→ │Middleware│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│        │              │              │              │        │
└────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │
         │         Supabase Client SDK                │
         │              │              │              │
┌────────▼──────────────▼──────────────▼──────────────▼────────┐
│                      DATA TIER                                │
│                   (Supabase PostgreSQL)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Tables  │  │   RPC    │  │   RLS    │  │ Storage  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 💻 STACK TECNOLÓGICO

### **Frontend:**

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Angular** | 21.2.0 | Framework SPA com components standalone |
| **TypeScript** | 5.9.2 | Type-safe JavaScript |
| **RxJS** | 7.8.0 | Reactive programming (Observables) |
| **Supabase JS** | 2.100.1 | Cliente Supabase para auth |
| **CSS Variables** | Native | Design system (light/dark theme) |
| **Vitest** | 4.0.8 | Unit testing |

**Deployment:** Vercel (CI/CD automático)

---

### **Backend:**

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | LTS | Runtime JavaScript server-side |
| **Express** | 5.2.1 | Web framework (rotas, middleware) |
| **Supabase JS** | 2.99.3 | Cliente Supabase para queries |
| **JWT** | Via Supabase | Autenticação stateless |
| **CORS** | 2.8.6 | Cross-Origin Resource Sharing |
| **dotenv** | 17.3.1 | Environment variables |

**Deployment:** Render (Node.js hosting)

---

### **Database & Services:**

| Tecnologia | Propósito |
|------------|-----------|
| **Supabase** | Backend-as-a-Service (BaaS) |
| **PostgreSQL** | Database relacional |
| **Row Level Security (RLS)** | Permissões a nível de row |
| **RPC Functions** | Stored procedures (plpgsql) |
| **Supabase Auth** | Sistema de autenticação completo |

---

## 📁 ESTRUTURA DE PASTAS

### **Frontend (Angular):**

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/           # Componentes reutilizáveis
│   │   │   ├── sidebar/          # Navegação lateral
│   │   │   ├── navbar/           # Cabeçalho top
│   │   │   ├── card-pedido/      # Card de visualização
│   │   │   ├── pedidos-filter/   # Filtros configuráveis
│   │   │   ├── alert-modal/      # Modal de alerta
│   │   │   └── footer/           # Rodapé
│   │   │
│   │   ├── pages/                # Componentes de página (rotas)
│   │   │   ├── login/            # Autenticação
│   │   │   ├── dashboard/        # Lista todos os pedidos
│   │   │   ├── criar-pedido/     # Criar novo pedido
│   │   │   ├── detalhe-pedido/   # Detalhes + ações
│   │   │   └── editar-pedido/    # Editar pedido
│   │   │
│   │   ├── services/             # Business logic e HTTP
│   │   │   ├── auth.ts           # Autenticação (Supabase)
│   │   │   ├── pedido.ts         # CRUD pedidos
│   │   │   ├── voluntariado.ts   # Sistema voluntariado
│   │   │   └── theme.service.ts  # Light/dark mode
│   │   │
│   │   ├── guards/               # Route guards
│   │   │   └── auth-guard.ts     # Protege rotas autenticadas
│   │   │
│   │   ├── models/               # TypeScript interfaces
│   │   │   ├── auth.model.ts     # User, Session
│   │   │   ├── pedido.model.ts   # IPedido, IDistrito, IIdioma
│   │   │   ├── contacto.model.ts # IContacto
│   │   │   └── filter.model.ts   # IFiltrosPedidos
│   │   │
│   │   └── app.routes.ts         # Routing configuration
│   │
│   ├── styles.css                # Global styles + CSS variables
│   ├── index.html                # Entry point HTML
│   └── main.ts                   # Bootstrap Angular app
│
├── angular.json                  # Angular CLI config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

**Padrões:**
- **Standalone Components**: Sem NgModules (Angular 17+)
- **Services**: Injectable com `providedIn: 'root'`
- **Guards**: canActivate para proteção de rotas
- **Models**: Interfaces TypeScript para type safety

---

### **Backend (Node.js):**

```
backend/
├── controllers/                  # Request handlers
│   ├── auth.controller.js        # Login/Register (mock/legacy)
│   ├── pedido.controller.js      # CRUD pedidos
│   └── voluntariado.controller.js # Sistema voluntariado
│
├── services/                     # Business logic
│   ├── pedido.service.js         # Queries Supabase (pedidos)
│   └── voluntariado.service.js   # RPC functions + queries
│
├── routes/                       # Route definitions
│   ├── pedido.routes.js          # /api/pedidos
│   └── voluntariado.routes.js    # /api/voluntariado
│
├── middleware/                   # Express middleware
│   └── auth.js                   # JWT validation (verificarToken)
│
├── config/                       # Configuration files
│   └── supabase.js               # Supabase client global
│
├── index.js                      # Entry point (Express app)
├── .env                          # Environment variables
└── package.json                  # Dependencies
```

**Padrões:**
- **MVC**: Model (Supabase) → View (JSON) → Controller (handlers)
- **Services**: Camada de lógica de negócio
- **Middleware**: Autenticação, CORS, error handling
- **Routes**: Definição de endpoints REST

---

## 🛠️ MIDDLEWARE & CORS (Explicação Pedagógica)

### **O que é Middleware? (Os Funcionários do Meio)**

A palavra *Middleware* significa literalmente "software do meio".

**Analogia do Hotel:** Imagina o corredor que o hóspede (Angular) tem de atravessar desde a porta da rua até chegar à secretária do Rececionista (a rota final onde está a resposta).

Os **Middlewares** são funcionários que ficam plantados nesse corredor. Quando o hóspede entra, ele é obrigado a passar por estes funcionários **antes** de chegar ao rececionista.

**Exemplos de Middlewares no nosso código:**
- **O Tradutor (`app.use(express.json())`):** Um hóspede entra a falar um dialeto estranho. Este middleware para-o e diz: *"Espera aí, o nosso rececionista só entende JSON. Deixa-me pegar no que estás a dizer e traduzir para JSON antes de passares"*.
- **O Segurança da Autenticação (`verificarToken`):** *"Mostra-me o teu cartão (Token JWT). Se não tiveres cartão, vais já daqui para fora e nem chegas a falar com o rececionista."*

### **O que é CORS? (A Lista VIP do Segurança)**

CORS significa *Cross-Origin Resource Sharing* (Partilha de Recursos entre Origens Diferentes). Podes pensar no CORS como o **Segurança da Porta do teu Prédio**.

**O Problema que CORS resolve:**
- O Frontend (Angular) corre em `localhost:4200` (Prédio A)
- O Backend (Node.js) corre em `localhost:3000` (Prédio B)

Para o navegador, são dois prédios diferentes. Se o Angular tentar pedir dados ao Node.js, o Chrome entra em pânico e bloqueia: *"ALERTA! O Prédio A está a tentar espiar o Prédio B!"*

**A Solução (`app.use(cors())`):**
Ao colocar este middleware, dás instruções ao Segurança: *"Calma! O Prédio A (Angular) é nosso amigo. Quando ele vier pedir dados, deixa-o entrar. Ele está na nossa Lista VIP."*

---

## 🧩 PADRÕES FRONTEND

### **Smart vs Dumb Components**

Para manter o código organizado e facilitar os testes, dividimos os componentes em dois tipos:

1. **Smart Components (Componentes Inteligentes):** 
   - **Localização:** `pages/` (ex: DashboardComponent)
   - **Características:** Têm acesso aos serviços (`PedidoService`, `AuthService`)
   - **Responsabilidade:** Gerem estado, tomam decisões, orquestram operações

2. **Dumb Components (Componentes de Apresentação):**
   - **Localização:** `components/` (ex: CardPedidoComponent)
   - **Características:** Não sabem que a API existe
   - **Dados:** Apenas recebem via `@Input()` e emitem via `@Output()`
   - **Responsabilidade:** Apenas apresentam dados e propagam eventos

**Vantagens:**
- **Testability:** Dumb components são fáceis de testar (input → output)
- **Reusability:** Dumb components podem ser reutilizados em contextos diferentes
- **Maintainability:** Separação clara de responsabilidades

### **Programação Reativa com RxJS**

**forkJoin Pattern (Sincronização Paralela):**

Imagine um empregado de mesa num restaurante que usa um tabuleiro grande e traz dois pratos ao mesmo tempo, em vez de ir uma vez, trazer um, voltar, etc.

```typescript
ngOnInit() {
  // ❌ Sequencial (lento)
  this.lookupService.obterDistritos().subscribe(distritos => {
    this.distritos = distritos;
    this.lookupService.obterIdiomas().subscribe(idiomas => {
      this.idiomas = idiomas;
      // Só aqui podemos mostrar o form
    });
  });
  
  // ✅ Paralelo (rápido)
  forkJoin({
    distritos: this.lookupService.obterDistritos(),
    idiomas: this.lookupService.obterIdiomas()
  }).subscribe(({ distritos, idiomas }) => {
    this.distritos = distritos;
    this.idiomas = idiomas;
    // Form pronto imediatamente!
  });
}
```

---

## 🔄 FLUXO DE DADOS END-TO-END

### **Exemplo: Criar Pedido de Ajuda**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER: Preenche formulário "Criar Pedido"                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: CriarPedidoComponent                                │
│    - Valida form (Reactive Forms)                                │
│    - Monta DTO: ICriarPedido                                     │
│    - Chama pedidoService.criarPedido(dto)                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND SERVICE: PedidoService.criarPedido()                 │
│    - Obtém JWT token (AuthService)                               │
│    - POST /api/pedidos                                           │
│    - Headers: { Authorization: Bearer <token> }                  │
│    - Body: { titulo, descricao, distrito_id, idioma_id, ... }   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTP Request
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│ 4. BACKEND ROUTE: POST /api/pedidos                              │
│    - Middleware: verificarToken (valida JWT)                     │
│    - Extrai user.id do token → req.user                          │
│    - Passa para controller                                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. BACKEND CONTROLLER: pedidoController.criar()                  │
│    - Extrai req.body (dados do pedido)                           │
│    - Adiciona user_id: req.user.id ao payload                    │
│    - Chama pedidoService.criar(payload, authHeader)              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. BACKEND SERVICE: pedidoService.criar()                        │
│    - Cria cliente autenticado (getAuthClient)                    │
│    - Query Supabase:                                             │
│      supabase.from('pedidos_ajuda').insert(payload).select()     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. SUPABASE DATABASE                                             │
│    - Valida RLS policies (user pode inserir?)                    │
│    - INSERT INTO pedidos_ajuda (...)                             │
│    - Gera UUID automático (id)                                   │
│    - Timestamps automáticos (created_at)                         │
│    - Retorna row inserida                                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Response (201 Created)
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│ 8. FRONTEND: Recebe pedido criado                                │
│    - Mostra AlertModal (sucesso)                                 │
│    - Navega para /dashboard                                      │
│    - Pedido aparece na lista                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

### **Fluxo de Autenticação:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User login/register
        │
        ▼
┌───────────────────┐
│ Supabase Auth API │ ← Frontend chama diretamente (sem backend)
└────────┬──────────┘
         │
         │ Retorna JWT + Refresh Token
         │
         ▼
┌─────────────────────┐
│ Frontend localStorage│ ← Supabase SDK gere tokens automaticamente
└────────┬────────────┘
         │
         │ Cada request HTTP
         │
         ▼
┌──────────────────────────┐
│ Backend Middleware (JWT) │ ← Valida token em TODAS as rotas protegidas
└────────┬─────────────────┘
         │
         │ Token válido? → Extrai user.id
         │
         ▼
┌──────────────────────┐
│ req.user = {id, ...} │ ← Controllers têm acesso ao user autenticado
└──────────────────────┘
```

---

### **Segurança em 3 Camadas:**

**Layer 1: Frontend (UX)**
```typescript
// AuthGuard - Protege rotas
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const session = await authService.obterSessaoAtual();
  
  if (!session) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
```
**Propósito:** Melhorar UX (não deixar user aceder páginas sem login)
**NÃO é segurança:** Frontend pode ser manipulado

---

**Layer 2: Backend (Validação Real)**
```javascript
// middleware/auth.js
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, email, role }
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
```
**Propósito:** Validação REAL de autenticação
**Segurança:** Token validado com chave secreta

---

**Layer 3: Database (RLS - Row Level Security)**
```sql
-- Supabase RLS Policy
CREATE POLICY "Users can only update their own pedidos"
ON pedidos_ajuda
FOR UPDATE
USING (auth.uid() = user_id);
```
**Propósito:** Última linha de defesa
**Segurança:** Mesmo com token válido, apenas pode modificar próprios dados

---

### **Tabela de Permissões:**

| Ação | Autenticação | Autorização | RLS Policy |
|------|--------------|-------------|------------|
| **Login/Register** | ❌ Público | - | - |
| **Listar todos pedidos** | ✅ JWT | Todos | SELECT any |
| **Criar pedido** | ✅ JWT | Todos | INSERT with user_id |
| **Editar pedido** | ✅ JWT | Apenas dono | UPDATE where user_id = auth.uid() |
| **Apagar pedido** | ✅ JWT | Apenas dono | DELETE where user_id = auth.uid() |
| **Oferecer ajuda** | ✅ JWT | Não-dono | RPC function valida |
| **Marcar concluído** | ✅ JWT | Apenas dono | RPC function valida |
| **Ver contacto** | ✅ JWT | Dono ou Helper | RPC function valida |

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

### **Principais Tabelas:**

```sql
-- Utilizadores (gerida por Supabase Auth)
CREATE TABLE utilizadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Distritos (lookup table)
CREATE TABLE distritos (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL
);

-- Idiomas (lookup table)
CREATE TABLE idiomas (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL
);

-- Pedidos de Ajuda (core table)
CREATE TABLE pedidos_ajuda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES utilizadores(id),
  helper_id UUID REFERENCES utilizadores(id),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  distrito_id INTEGER REFERENCES distritos(id),
  idioma_id INTEGER REFERENCES idiomas(id),
  urgencia TEXT CHECK (urgencia IN ('baixa', 'media', 'alta')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluido')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **RPC Functions (Stored Procedures):**

**1. oferecer_ajuda()** - Atribuir helper a pedido

```sql
CREATE OR REPLACE FUNCTION oferecer_ajuda(
  p_pedido_id UUID,
  p_helper_id UUID
) RETURNS void AS $$
DECLARE
  v_pedido RECORD;
BEGIN
  -- 1. Buscar pedido
  SELECT * INTO v_pedido FROM pedidos_ajuda WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  -- 2. Validar que não é o dono
  IF v_pedido.user_id = p_helper_id THEN
    RAISE EXCEPTION 'Não podes oferecer ajuda no teu próprio pedido.';
  END IF;

  -- 3. Validar que está pendente
  IF v_pedido.status != 'pendente' THEN
    RAISE EXCEPTION 'Pedido não está disponível para ajuda.';
  END IF;

  -- 4. Validar que não tem helper
  IF v_pedido.helper_id IS NOT NULL THEN
    RAISE EXCEPTION 'Pedido já tem ajuda atribuída.';
  END IF;

  -- 5. Atribuir helper e mudar status
  UPDATE pedidos_ajuda 
  SET 
    helper_id = p_helper_id,
    status = 'em_progresso',
    updated_at = NOW()
  WHERE id = p_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Por que RPC Function?**
- ✅ **Atomicidade**: Todas as validações + UPDATE numa transação
- ✅ **Performance**: Executa na BD (sem round-trips)
- ✅ **Segurança**: Lógica sensível protegida
- ✅ **Validações complexas**: 4 checks antes de UPDATE

---

**2. obter_contacto_parceiro()** - Retorna contacto do parceiro

```sql
CREATE OR REPLACE FUNCTION obter_contacto_parceiro(
  p_pedido_id UUID,
  p_caller_id UUID
) RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT
) AS $$
DECLARE
  v_pedido RECORD;
  v_parceiro_id UUID;
BEGIN
  -- 1. Buscar pedido
  SELECT * INTO v_pedido FROM pedidos_ajuda WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validar que pedido tem helper
  IF v_pedido.helper_id IS NULL THEN
    RAISE EXCEPTION 'Pedido ainda não tem helper atribuído.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Validar que caller é dono ou helper
  IF p_caller_id != v_pedido.user_id AND p_caller_id != v_pedido.helper_id THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  -- 4. Determinar qual parceiro retornar
  IF p_caller_id = v_pedido.user_id THEN
    v_parceiro_id := v_pedido.helper_id;  -- Dono vê helper
  ELSE
    v_parceiro_id := v_pedido.user_id;     -- Helper vê dono
  END IF;

  -- 5. Retornar dados do parceiro
  RETURN QUERY
  SELECT 
    u.id,
    u.nome,
    u.email,
    u.telefone
  FROM utilizadores u
  WHERE u.id = v_parceiro_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Lógica de Parceiro:**
- Se caller é **dono** → Retorna contacto do **helper**
- Se caller é **helper** → Retorna contacto do **dono**

---

## 🚀 DEPLOYMENT & CI/CD

### **Frontend (Vercel):**

```
Git Push → GitHub
    ↓
Vercel detecta mudança
    ↓
Build automático (Angular CLI)
    ↓
Deploy to CDN (global)
    ↓
URL: https://integrabridge.vercel.app
```

**Configuração (vercel.json):**
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```
**Por que?** Single Page Application precisa redirecionar tudo para index.html

---

### **Backend (Render):**

```
Git Push → GitHub
    ↓
Render detecta mudança
    ↓
Build (npm install)
    ↓
Start (node index.js)
    ↓
URL: https://integrabridge-api.onrender.com
```

**Environment Variables (Render Dashboard):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=supersecretkey123
PORT=3000
```

---

### **Database (Supabase Cloud):**

- **Hosted PostgreSQL**: Automático (sem gestão)
- **Backups**: Diários (automático)
- **Scaling**: Automático conforme uso
- **Monitoring**: Dashboard Supabase

---

## 🎨 PADRÕES ARQUITETURAIS

### **1. MVC (Model-View-Controller) - Backend**

```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Route   │ ───▶ │  Controller  │ ───▶ │ Service  │
│ (Express)│ ◀─── │  (Handler)   │ ◀─── │ (Logic)  │
└──────────┘      └──────────────┘      └──────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Supabase DB  │
                   │   (Model)    │
                   └──────────────┘
```

**Separação de Responsabilidades:**
- **Route**: Define endpoints e middleware
- **Controller**: Valida request, chama service, retorna response
- **Service**: Lógica de negócio, queries BD
- **Model**: Schema da BD (Supabase)

---

### **2. Component-Based Architecture - Frontend**

```
┌─────────────────────────────────────────────┐
│              App Component (Root)            │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────▼────┐ ┌────▼────┐ ┌────▼────┐
│ Sidebar  │ │ Navbar  │ │ Footer  │
└──────────┘ └─────────┘ └─────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────▼─────┐ ┌───▼────┐ ┌────▼────────┐
│ Dashboard │ │ Criar  │ │ Detalhe     │
│ (Page)    │ │ Pedido │ │ Pedido      │
└───────────┘ └────────┘ └─────────────┘
      │
┌─────▼──────┬──────────┬──────────┐
│ CardPedido │ Filtros  │ Modal    │
│ (Dumb)     │ (Smart)  │ (Dumb)   │
└────────────┴──────────┴──────────┘
```

**Tipos de Componentes:**
- **Smart (Container)**: Gere estado, faz HTTP calls (Dashboard)
- **Dumb (Presentation)**: Apenas renderiza @Input, emite @Output (CardPedido)

---

### **3. Service Layer Pattern - Frontend**

```
Components
    ↓ Inject
Services (Singleton)
    ↓ HTTP
Backend API
```

**Vantagens:**
- ✅ **Reutilização**: Múltiplos components usam mesmo service
- ✅ **Testabilidade**: Services podem ser mockados
- ✅ **Separação**: Component não faz HTTP diretamente

---

### **4. Repository Pattern - Backend**

```
Controller
    ↓
Service (Business Logic)
    ↓
Supabase Client (Data Access)
```

**Service como Repository:**
```javascript
// pedido.service.js
exports.obterPorId = async (id, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .eq('id', id)
    .single();

  if (error) throw new Error('Pedido não encontrado.');
  return data;
};
```

**Encapsula:**
- Queries Supabase
- Error handling
- Data transformation

---

## 🔧 DECISÕES TÉCNICAS E TRADE-OFFS

### **1. Por que Supabase em vez de MongoDB/MySQL?**

**✅ Vantagens:**
- **Auth built-in**: Sistema completo de autenticação (login, register, JWT)
- **RLS nativo**: Row Level Security (permissões a nível de row)
- **RPC functions**: Stored procedures em PostgreSQL (lógica complexa)
- **Real-time**: WebSockets built-in (não usado ainda, mas disponível)
- **Storage**: File upload built-in
- **Free tier generoso**: 500MB BD, 1GB storage, 2GB bandwidth

**❌ Trade-offs:**
- **Vendor lock-in**: Difícil migrar para outro BD
- **Curva de aprendizagem**: PostgreSQL + RLS + RPC
- **Debugging RPC**: Erros em stored procedures mais difíceis de debugar

---

### **2. Por que Angular em vez de React/Vue?**

**✅ Vantagens:**
- **Opinionated**: Estrutura clara (services, guards, routing built-in)
- **TypeScript first**: Type safety nativo
- **RxJS integrado**: Reactive programming out-of-the-box
- **Dependency Injection**: Pattern robusto para services
- **Standalone Components**: Sem NgModules (Angular 17+)

**❌ Trade-offs:**
- **Bundle size**: Maior que React (mas tree-shaking melhora)
- **Curva de aprendizagem**: RxJS, Dependency Injection, decorators
- **Ecossistema menor**: Menos libraries que React

---

### **3. Por que Express em vez de NestJS/Fastify?**

**✅ Vantagens:**
- **Simplicidade**: Minimalista, fácil de entender
- **Maturidade**: Battle-tested, documentação extensa
- **Flexibilidade**: Sem opiniões fortes (escolhemos estrutura)
- **Ecosystem**: Middleware abundante (cors, body-parser, etc.)

**❌ Trade-offs:**
- **Sem TypeScript nativo**: NestJS tem TypeScript first
- **Sem decorators**: NestJS tem @Controller, @Get, etc.
- **Performance**: Fastify é mais rápido (mas não crítico neste projeto)

---

### **4. Por que JWT em vez de Sessions?**

**✅ Vantagens:**
- **Stateless**: Não precisa armazenar sessões no servidor
- **Escalável**: Fácil adicionar servidores (sem sessão partilhada)
- **Mobile-friendly**: Token pode ser armazenado facilmente
- **Supabase nativo**: Supabase usa JWT por padrão

**❌ Trade-offs:**
- **Revogação difícil**: Token válido até expirar (não pode ser "deslogado")
- **Tamanho**: Token pode ser grande (300+ bytes)
- **XSS vulnerável**: Se armazenado em localStorage (mitigado com httpOnly cookies)

---

### **5. Frontend chama Supabase Auth diretamente (não via backend)?**

**✅ Vantagens:**
- **Latência**: Menos hops (frontend → Supabase direto)
- **SDK features**: Supabase JS tem refresh token automático
- **Simplicidade**: Não duplicar lógica de auth no backend

**❌ Trade-offs:**
- **Menos controle**: Não podemos customizar resposta de auth
- **Chaves expostas**: SUPABASE_KEY no frontend (mitigado com anon key)

**Solução Híbrida:**
- **Login/Register**: Frontend → Supabase Auth direto
- **API calls**: Frontend → Backend (valida JWT) → Supabase

---

## 📊 MÉTRICAS DO PROJETO

### **Linhas de Código:**

| Camada | Ficheiros | Linhas |
|--------|-----------|--------|
| **Frontend** | ~30 files | ~3,500 linhas |
| **Backend** | ~15 files | ~800 linhas |
| **Database** | 2 RPC functions | ~150 linhas SQL |
| **Total** | ~45 files | ~4,450 linhas |

---

### **Endpoints API:**

| Grupo | Endpoints | Total |
|-------|-----------|-------|
| **Pedidos** | GET, POST, PUT, DELETE, GET/:id | 5 |
| **Voluntariado** | POST /ajudar, PATCH /concluir, GET /contacto, GET /meus-pedidos, GET /minhas-contribuicoes | 5 |
| **Auth (legacy)** | POST /login, POST /register | 2 |
| **Total** | | 12 |

---

### **Componentes Angular:**

| Tipo | Quantidade |
|------|------------|
| **Pages (Smart)** | 5 (Login, Dashboard, Criar, Editar, Detalhe) |
| **Components (Dumb)** | 6 (Sidebar, Navbar, Footer, CardPedido, Filter, Modal) |
| **Services** | 4 (Auth, Pedido, Voluntariado, Theme) |
| **Guards** | 1 (AuthGuard) |
| **Models** | 4 (Auth, Pedido, Contacto, Filter) |
| **Total** | 20 |

---

## 🎓 CONCEITOS-CHAVE PARA APRESENTAÇÃO

### **1. Three-Tier Architecture**
- Presentation (Frontend) ↔ Application (Backend) ↔ Data (Supabase)
- Separação clara de responsabilidades
- Escalabilidade horizontal

### **2. RESTful API Design**
- Recursos: `/api/pedidos`, `/api/voluntariado`
- Métodos HTTP semânticos (GET, POST, PUT, DELETE, PATCH)
- Status codes apropriados (200, 201, 400, 403, 404, 500)

### **3. Stateless Authentication**
- JWT tokens (não sessions)
- Token em Authorization header: `Bearer <token>`
- Backend valida em cada request (middleware)

### **4. Row Level Security (RLS)**
- Policies a nível de database
- Última linha de defesa
- `auth.uid()` identifica user no PostgreSQL

### **5. RPC Functions**
- Stored procedures em PostgreSQL
- Lógica complexa com validações atômicas
- Executa perto dos dados (performance)

### **6. Reactive Programming (RxJS)**
- Observables para async operations
- Operators: `map`, `switchMap`, `finalize`
- AsyncPipe no template (auto-unsubscribe)

---

## 📚 RESUMO EXECUTIVO

O **IntegraBridge** é uma aplicação **full-stack moderna** construída com **Angular 21**, **Node.js/Express** e **Supabase PostgreSQL**.

**Arquitetura:**
- **Three-tier**: Presentation → Application → Data
- **RESTful API**: 12 endpoints organizados em 2 grupos
- **Stateless Auth**: JWT com validação em 3 camadas

**Stack:**
- Frontend: Angular 21 + TypeScript + RxJS
- Backend: Node.js + Express + Supabase Client
- Database: PostgreSQL + RLS + RPC Functions

**Padrões:**
- MVC no backend (Routes → Controllers → Services)
- Component-based no frontend (Smart vs Dumb)
- Repository pattern (Services encapsulam data access)

**Segurança:**
- Frontend: AuthGuard (UX)
- Backend: JWT Middleware (validação real)
- Database: RLS Policies (última defesa)

**Deployment:**
- Frontend: Vercel (CDN global, CI/CD)
- Backend: Render (Node.js hosting)
- Database: Supabase Cloud (managed PostgreSQL)

**Métricas:**
- ~4,450 linhas de código
- 12 endpoints REST
- 20 componentes Angular
- 2 RPC functions PostgreSQL

---

## 🗺️ PRÓXIMOS PASSOS (Roadmap)

### **Melhorias Arquiteturais:**

1. **Refactoring URLs**
   - Mover hardcoded URLs para `environment.ts`
   - Separate dev/prod configs

2. **Error Handling Global**
   - Frontend: HttpInterceptor para erros HTTP
   - Backend: Error middleware centralizado

3. **Logging**
   - Backend: Winston/Morgan para logs estruturados
   - Frontend: Sentry para error tracking

4. **Testing**
   - Unit tests: Vitest (frontend), Jest (backend)
   - E2E tests: Playwright/Cypress
   - Target: 80% coverage

5. **Performance**
   - Lazy loading de rotas Angular
   - Response caching (Redis)
   - Image optimization

6. **Real-time Features**
   - WebSockets (Supabase Realtime)
   - Notificações push quando helper aceita

---

*Documentação de arquitetura completa - IntegraBridge v1.0* 🏗️
