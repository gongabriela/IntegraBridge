# 01 - Sistema de Autenticação

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Componentes Frontend](#componentes-frontend)
- [Componentes Backend](#componentes-backend)
- [AuthService - Métodos Detalhados](#authservice---métodos-detalhados)
- [LoginComponent - Fluxos](#logincomponent---fluxos)
- [Conceitos Importantes](#conceitos-importantes)
- [Fluxo Completo](#fluxo-completo)
- [Segurança](#segurança)

---

## 🎯 Visão Geral

O IntegraBridge usa **Supabase Auth** (Backend-as-a-Service) para gestão completa de autenticação. Isto elimina a necessidade de implementar:
- Hash de passwords (bcrypt)
- Geração/validação de JWT tokens
- Renovação automática de tokens
- Storage seguro de credenciais

### 🎪 JWT como "Pulseira VIP"
Pensa no JWT como uma **Pulseira VIP** de um festival:
1. Quando o utilizador faz login corretamente (email + password), o Supabase entrega-lhe essa "pulseira" (o Token JWT)
2. A partir desse momento, o utilizador não precisa de enviar a password a cada clique - apenas mostra a pulseira ao servidor
3. A pulseira tem **tempo de validade** e contém informação **encriptada** sobre quem a usa (ID do utilizador)

**Tecnologias:**
- **Frontend:** Angular Standalone Components + Reactive Forms
- **Backend:** Supabase Auth (PostgreSQL + API REST)
- **Tokens:** JWT (access_token 1h, refresh_token 30 dias)
- **Storage:** localStorage (`sb-<project-id>-auth-token`)

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  LoginComponent │  ← UI (formulário login/registo)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   AuthService   │  ← Abstração Supabase SDK
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supabase SDK   │  ← Cliente JavaScript oficial
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supabase API   │  ← Servidor (PostgreSQL + Auth)
└─────────────────┘
         │
         ↓
     JWT Tokens → localStorage
```

### **Fluxo de Dados:**
1. User preenche formulário → `LoginComponent`
2. Component chama → `AuthService.login()`
3. AuthService chama → `supabase.auth.signInWithPassword()`
4. Supabase SDK faz → `POST /auth/v1/token`
5. Supabase API valida credenciais
6. API retorna → `{ access_token, refresh_token, user }`
7. SDK armazena → `localStorage['sb-...-auth-token']`
8. AuthGuard valida → `AuthService.obterUtilizadorAtual()`
9. Se válido → Acesso a `/dashboard`

---

## 🧩 Componentes Frontend

### **1. LoginComponent** (`login.ts`)

#### **Responsabilidades:**
- UI de login/registo (modo toggle)
- Validação de formulário (email, password, nome)
- Gestão de estados (loading, erros, sucesso)
- Integração com modal de alertas

#### **Propriedades Importantes:**

**`isLoginMode: boolean`**
- `true` = Formulário de Login
- `false` = Formulário de Registo
- Alterna com `toggleMode()`

**`authForm: FormGroup`**
- **Tipo:** `NonNullableFormGroup`
- **Campos:** nome, email, password
- **Validações:**
  - `email`: required, formato email
  - `password`: required, mínimo 6 caracteres
  - `nome`: required (só em modo registo)

**`alertConfig: object`**
- **Estrutura:** `{ titulo, mensagem, tipo, acao }`
- **Tipo:** `'sucesso' | 'erro'`
- **Ação:** `'mudar-para-login' | 'nenhuma'`
- **Uso:** Configura AlertModalComponent com mensagem + callback

#### **Métodos Importantes:**

**`toggleMode(): void`**
```typescript
// Alterna entre Login ↔ Registo
// 1. Inverte isLoginMode
// 2. Limpa formulário (reset)  
// 3. Adiciona/remove validação de 'nome'
```

### 🔄 Validações Dinâmicas (Reactive Forms Pattern)

O formulário **muda de comportamento** dinamicamente. No Registo, o campo 'nome' é obrigatório; no Login é ignorado:

```typescript
const nomeControl = this.authForm.get('nome');

if (this.isLoginMode) {
  nomeControl.clearValidators(); // No Login, o nome não é obrigatório
} else {
  nomeControl.setValidators([Validators.required]); // No Registo, é obrigatório
}
nomeControl.updateValueAndValidity(); // Recalcula o estado geral do formulário
```

**Conceito:** A manipulação dinâmica de validadores permite reciclar o mesmo objeto FormGroup. O método `updateValueAndValidity()` força o Angular a reavaliar se o formulário é válido com base nas novas regras.

**`onSubmit(): async void`**
```typescript
// Fluxo de submissão:
// 1. Valida formulário
// 2. Se LOGIN: chama authService.login() → redireciona /dashboard
// 3. Se REGISTO: chama authService.registar() → modal sucesso → toggle para login
// 4. CATCH: mostra modal de erro
```

### ⚡ Error Handling Pattern (Type-Safe)

Tratamento robusto de erros com type narrowing:

```typescript
async onSubmit(): Promise<void> {
  try {
    const formData = this.authForm.getRawValue();
    const loginData: Login = { email: formData.email, password: formData.password };

    const { error } = await this.authService.login(loginData);
    if (error) throw error; // Salta para catch
    
    this.router.navigate(['/dashboard']);
  } catch (error: unknown) {
    // Type-safe error handling
    if (error instanceof Error || (error as AuthError).message) {
      alert('Erro: ' + (error as AuthError).message);
    } else {
      alert('Ocorreu um erro inesperado.');
    }
  }
}
```

**`aoFecharAlert(): void`**
```typescript
// Callback quando user fecha modal:
// - Se acao === 'mudar-para-login': chama toggleMode()
// - Caso contrário: apenas fecha modal
```

---

### **2. AuthService** (`auth.ts`)

Abstração do Supabase SDK. Todos os métodos são **async** e retornam Promises.

---

## 🖥️ Componentes Backend

### **1. `middleware/auth.js` - Middleware de Validação de Token** 🔑

#### **Responsabilidades:**
- **Intercepta todas as rotas protegidas da API**
- Valida JWT token enviado pelo frontend
- Adiciona dados do user ao request (`req.user`)
- Bloqueia acesso não autorizado (401 Unauthorized)

#### **Como Funciona:**
```javascript
const verificarToken = async (req, res, next) => {
  // 1. Extrai token do header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Precisas de fazer login primeiro.' });
  }
  
  // 2. Separa 'Bearer' do token
  const token = authHeader.split(' ')[1];
  
  // 3. Valida token com Supabase (verifica assinatura + expiração)
  const { data, error } = await supabase.auth.getUser(token);
  
  // 4. Se inválido: retorna erro
  if (error || !data.user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
  
  // 5. Se válido: adiciona user ao request e continua
  req.user = data.user;  // ← Agora controllers podem usar req.user.id!
  next();
};
```

#### **Uso nas Rotas:**
```javascript
// pedido.routes.js
const verificarToken = require('../middleware/auth');

router.get('/', verificarToken, pedidoController.listarTodos);
router.post('/', verificarToken, pedidoController.criar);
router.put('/:id', verificarToken, pedidoController.atualizar);

// voluntariado.routes.js
router.post('/ajudar/:id', verificarToken, voluntariadoController.oferecerAjuda);
router.patch('/concluir/:id', verificarToken, voluntariadoController.marcarComoConcluido);

// lookup.routes.js
router.get('/distritos', verificarToken, lookupController.listarDistritos);
```

#### **O que `req.user` contém:**
```javascript
req.user = {
  id: 'uuid-do-utilizador',
  email: 'user@example.com',
  user_metadata: {
    nome_completo: 'João Silva'
  },
  created_at: '2024-01-15T10:30:00Z'
};

// Controllers podem usar:
async criar(req, res) {
  const novoPedido = {
    ...req.body,
    criado_por: req.user.id  // ← User autenticado!
  };
  await supabase.from('pedidos').insert(novoPedido);
}
```

---

### **2. `controllers/auth.controller.js` - Endpoint de Login Mock**

#### **Responsabilidades:**
- Endpoint de login **MOCK/LEGACY** (não usado em produção)

#### **Código:**
```javascript
exports.loginMock = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ erro: error.message });
    res.json({ token: data.session.access_token });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor ao tentar fazer login.' });
  }
};
```

#### **Rota:**
```javascript
// backend/index.js
app.post('/api/login', authController.loginMock);
```

#### **⚠️ STATUS: NÃO USADO EM PRODUÇÃO!**

**Porquê?**
- Frontend chama **diretamente** `supabase.auth.signInWithPassword()`
- Não passa pelo backend Node.js
- Este endpoint é **redundante** (legacy ou para testes backend isolados)

**Fluxo Real:**
```
Frontend → Supabase SDK → Supabase Cloud
(Backend Node.js NÃO é envolvido no login)
```

---

### **3. Fluxo Backend Completo: Login + API Call**

#### **FASE 1: LOGIN (Frontend → Supabase Direto)**
```
1. User preenche formulário
2. LoginComponent.onSubmit()
3. AuthService.login(dados)
4. supabase.auth.signInWithPassword()  ← CHAMA DIRETAMENTE SUPABASE
5. Supabase valida credenciais
6. Supabase retorna { access_token, refresh_token, user }
7. SDK salva tokens em localStorage
8. router.navigate(['/dashboard'])

❌ Backend Node.js NÃO é usado nesta fase!
```

---

#### **FASE 2: CHAMADA API (Frontend → Backend → Supabase)**
```
1. User acessa /dashboard
2. DashboardComponent.ngOnInit()
3. pedidoService.listarTodos()
4. ↓ Frontend faz request:
   GET /api/pedidos
   Headers: {
     'Authorization': 'Bearer eyJhbGc...'  ← access_token do localStorage
   }

5. ↓ Request chega ao backend Node.js
6. ↓ Express router: router.get('/', verificarToken, pedidoController.listarTodos)
7. ↓ Middleware verificarToken intercepta
8. ↓ Extrai token do header
9. ↓ Valida com Supabase: supabase.auth.getUser(token)
10. ✅ Se válido:
    - Adiciona req.user = data.user
    - Chama next()
11. ❌ Se inválido:
    - Retorna 401 Unauthorized
    - Request termina aqui

12. ✅ pedidoController.listarTodos() executa
13. ↓ Usa req.user.id para filtrar pedidos do user
14. ↓ Query Supabase: .from('pedidos').select('*').eq('criado_por', req.user.id)
15. ✓ Retorna JSON com pedidos
16. ✓ Frontend recebe e renderiza dados
```

---

### **4. Diagrama Completo: Login vs API Calls**

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend ──────────────► Supabase Auth (direto)           │
│  (AuthService)            (sem passar por backend)          │
│       │                                                     │
│       └──► Tokens salvos em localStorage                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                           ↓ (após login)

┌─────────────────────────────────────────────────────────────┐
│                  API CALLS FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend ──────────────► Backend Node.js                   │
│  (Headers: Bearer token)  │                                 │
│                           │                                 │
│                           ↓                                 │
│                    verificarToken                           │
│                    (middleware)                             │
│                           │                                 │
│                           ├── Valida token com Supabase     │
│                           ├── Se válido: req.user = user    │
│                           └── Se inválido: 401              │
│                           │                                 │
│                           ↓                                 │
│                    Controller                               │
│                    (usa req.user.id)                        │
│                           │                                 │
│                           ↓                                 │
│                    Query Supabase DB                        │
│                           │                                 │
│                           ↓                                 │
│  Frontend ◄────────── JSON Response                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **5. Validação Dual: Frontend vs Backend**

#### **Frontend (AuthGuard):**
```typescript
async canActivate(): Promise<boolean> {
  const user = await this.authService.obterUtilizadorAtual();
  
  if (!user) {
    this.router.navigate(['/login']);
    return false;
  }
  
  return true;
}
```

**Objetivo:** **Melhorar UX**
- Evita carregar componente se user não autenticado
- Redireciona imediatamente para /login
- Não espera erro do backend

**⚠️ NÃO substitui validação backend!** (user pode manipular localStorage)

---

#### **Backend (verificarToken Middleware):**
```javascript
const verificarToken = async (req, res, next) => {
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
  
  req.user = data.user;
  next();
};
```

**Objetivo:** **Segurança Real**
- NUNCA confia no frontend
- Valida token em CADA request
- Garante que user é legítimo
- Fonte de verdade para dados do user

---

### **6. Porque Frontend chama Supabase Direto?**

#### **Vantagens:**
✅ **Menos Latência:** 1 request (Frontend → Supabase) vs 2 (Frontend → Backend → Supabase)  
✅ **Menos Código Backend:** Não precisa implementar proxy de autenticação  
✅ **SDK Gerencia Tudo:** Renovação automática de tokens, retry, storage, headers  
✅ **Escalabilidade:** Supabase lida com milhões de logins sem sobrecarregar backend  

#### **Trade-offs:**
❌ **Controle:** Menos controle sobre fluxo de autenticação  
❌ **Customização:** Difícil adicionar lógica personalizada (ex: 2FA customizado)  
❌ **Auditoria:** Logs de login ficam no Supabase, não no backend  

**Para IntegraBridge:** As vantagens superam os trade-offs (projeto pequeno/médio).

---

### **7. Porque Backend Valida Token Novamente?**

#### **Cenário Perigoso:**
```javascript
// ❌ NUNCA FAZER ISTO:
async listarPedidos(req, res) {
  // Confiar cegamente em dados do frontend
  const userId = req.body.userId;  // ← User pode mandar QUALQUER ID!
  const pedidos = await db.query('SELECT * FROM pedidos WHERE criado_por = ?', [userId]);
  res.json(pedidos);
}

// Atacante envia:
POST /api/pedidos
Body: { userId: 'outro-usuario-id' }
// Resultado: Atacante vê pedidos de outra pessoa!
```

#### **Solução Segura:**
```javascript
// ✅ SEMPRE FAZER ISTO:
router.get('/', verificarToken, pedidoController.listarPedidos);

async listarPedidos(req, res) {
  // Middleware já validou token e adicionou req.user
  const userId = req.user.id;  // ← Fonte de verdade do token JWT!
  const pedidos = await db.query('SELECT * FROM pedidos WHERE criado_por = ?', [userId]);
  res.json(pedidos);
}

// Atacante NÃO consegue manipular req.user (vem do token validado)
```

#### **Princípio de Segurança:**
> **"NUNCA confiar em dados do frontend. Sempre validar no backend."**

---

## 🔐 AuthService - Métodos Detalhados

### **`registar(dados: Registrar): Promise<AuthResponse>`**

#### **O que faz:**
1. Chama `supabase.auth.signUp()`
2. Cria user no banco de dados
3. Envia email de confirmação (opcional)
4. Retorna `{ data: { user, session }, error }`

#### **Estrutura AuthResponse:**
```typescript
{
  data: {
    user: {
      id: 'uuid',
      email: 'user@example.com',
      user_metadata: { nome_completo: 'João Silva' }
    },
    session: {
      access_token: 'eyJhbGc...',
      refresh_token: 'v1.MRjY...',
      expires_at: 1712155234
    }
  },
  error: null
}
```

#### **⚠️ CASO ESPECIAL: Email Duplicado**
```typescript
// Supabase retorna user MAS com identities vazio:
{
  data: {
    user: { id: '...', identities: [] },  // ← VAZIO = duplicado!
    session: null
  },
  error: null  // ← NÃO retorna error!
}
```

**Detecção:**
```typescript
if (data.user && data.user.identities.length === 0) {
  throw new Error('Email já registado');
}
```

**Por que isso acontece?**
- Supabase protege contra enumeration attacks (não revela se email existe)
- Developer deve verificar `identities.length === 0` manualmente

---

### **`login(dados: Login): Promise<AuthResponse>`**

#### **O que faz:**
1. Chama `supabase.auth.signInWithPassword()`
2. Valida email + password no servidor
3. Gera JWT tokens (access + refresh)
4. Armazena tokens automaticamente no localStorage

#### **Processo Interno:**
```
1. SDK envia POST /auth/v1/token
2. Supabase valida credenciais (bcrypt)
3. Supabase gera access_token (JWT, 1h)
4. Supabase gera refresh_token (30 dias)
5. SDK armazena em localStorage['sb-<project-id>-auth-token']
6. SDK adiciona header Authorization: Bearer <token>
```

#### **Estrutura do Token no localStorage:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjYwLi4uLi4uLi4u...",
  "expires_at": 1712155234,
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": { "nome_completo": "..." }
  }
}
```

#### **Erros Possíveis:**
```typescript
// Credenciais inválidas:
{ error: { message: 'Invalid login credentials', status: 400 } }

// Email não confirmado (se obrigatório):
{ error: { message: 'Email not confirmed', status: 400 } }

// Rate limit (muitas tentativas):
{ error: { message: 'Too many requests', status: 429 } }
```

---

### **`logout(): Promise<{ error: AuthError | null }>`**

#### **O que faz:**
1. Invalida access_token no servidor
2. Remove tokens do localStorage
3. Limpa dados de sessão do SDK

#### **Após logout:**
```typescript
// localStorage['sb-<project-id>-auth-token'] = null

// Próximas chamadas:
await authService.obterUtilizadorAtual(); // → null
await authService.obterSessaoAtual();     // → null

// AuthGuard redireciona automaticamente para /login
```

#### **Exemplo Completo:**
```typescript
async fazerLogout() {
  const { error } = await this.authService.logout();
  
  if (error) {
    console.error('Erro ao fazer logout:', error.message);
  } else {
    console.log('Logout bem-sucedido');
    this.router.navigate(['/login']);
  }
}
```

---

### **`obterUtilizadorAtual(): Promise<User | null>`**

#### **O que faz:**
1. Lê access_token do localStorage
2. **Valida token com servidor Supabase** (verifica assinatura + expiração)
3. Se válido → retorna User
4. Se expirado → tenta renovar com refresh_token
5. Se renovação falha → retorna null

#### **Uso Principal:**
- **AuthGuard:** Verificar se user está autenticado antes de permitir acesso a rotas
- **Componentes:** Obter dados do user logado (id, email, nome)

#### **Estrutura User:**
```typescript
{
  id: 'uuid-do-utilizador',
  email: 'user@example.com',
  user_metadata: {
    nome_completo: 'João Silva'
  },
  created_at: '2024-01-15T10:30:00Z'
}
```

#### **Exemplo no AuthGuard:**
```typescript
async canActivate(): Promise<boolean> {
  const user = await this.authService.obterUtilizadorAtual();
  
  if (!user) {
    this.router.navigate(['/login']);
    return false;
  }
  
  return true;
}
```

---

### **`obterSessaoAtual(): Promise<Session | null>`**

#### **O que faz:**
- Lê tokens do localStorage **SEM validar com servidor**
- Retorna objeto Session completo

#### **🔑 getUser() vs getSession():**

| Aspecto | `getUser()` | `getSession()` |
|---------|-------------|----------------|
| **Validação** | Valida com servidor | Lê do localStorage |
| **Velocidade** | Mais lento (~100ms) | Instantâneo (~1ms) |
| **Segurança** | Mais seguro | Menos seguro |
| **Uso** | AuthGuard, checks críticos | Obter access_token |

#### **Estrutura Session:**
```typescript
{
  access_token: 'eyJhbGc...',       // JWT para autenticação
  refresh_token: 'v1.MRjY...',      // Token para renovar access
  expires_at: 1712155234,           // Timestamp UNIX
  expires_in: 3600,                 // Segundos até expiração
  token_type: 'bearer',
  user: { ... }                     // Mesmo que getUser()
}
```

#### **Exemplo: Usar token em chamadas API**
```typescript
async fazerChamadaAPI() {
  const session = await this.authService.obterSessaoAtual();
  
  if (!session) {
    throw new Error('Utilizador não autenticado');
  }
  
  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch('/api/pedidos', { headers });
}
```

#### **Exemplo: Verificar tempo de expiração**
```typescript
async verificarExpiracao() {
  const session = await this.authService.obterSessaoAtual();
  const agora = Math.floor(Date.now() / 1000);
  const tempoRestante = session.expires_at - agora;
  
  if (tempoRestante < 300) { // Menos de 5 minutos
    console.log('Token expira em breve, renovação automática em curso');
  }
}
```

---

## 🧪 Checklist de Testes Completo

### 1️⃣ **Testes de UX (Validações)**
- [ ] **Campo Email vazio**: Clica no email → clica fora. Deve ficar vermelho com mensagem
- [ ] **Email inválido**: Digite "abc" → deve mostrar erro de formato
- [ ] **Password curta**: Digite "123" → deve exigir mínimo 6 caracteres
- [ ] **Toggle Registo**: Clica "Registe-se" → campo Nome deve aparecer e ser obrigatório
- [ ] **Botão desabilitado**: Formulário inválido → botão deve estar cinza/desabilitado

### 2️⃣ **Testes de Integração (Supabase)**
- [ ] **Registo válido**: Email + password válidos → deve criar conta no Supabase
- [ ] **Email duplicado**: Tente registar email existente → deve mostrar erro
- [ ] **Login válido**: Credenciais corretas → deve redirecionar para /dashboard
- [ ] **Login inválido**: Password errada → deve mostrar erro específico

### 3️⃣ **Testes de Segurança (Auth Guard)**
- [ ] **Acesso direto**: Digite `localhost:4200/dashboard` sem login → deve redirecionar para /login
- [ ] **Token expirado**: Expire o token manualmente → deve forçar novo login
- [ ] **Token válido**: Com token válido, acesse /dashboard → deve permitir entrada

### 4️⃣ **Testes de Estado (Persistência)**
- [ ] **Reload da página**: Após login, recarregue F5 → deve manter-se logado
- [ ] **Fechar/abrir browser**: Feche e abra browser → deve manter sessão (se refresh token válido)
- [ ] **Logout**: Clique logout → deve limpar localStorage e redirecionar para /login

---

## 💡 Conceitos Importantes

### **1. NonNullableFormBuilder**

**O que é?**
- Variante do Angular FormBuilder
- **Garantia:** Valores nunca são `null` ou `undefined`

**Diferença:**
```typescript
// FormBuilder normal:
const email = form.get('email')?.value;  // tipo: string | null | undefined
const emailSafe = email ?? '';           // necessário ?? ou ||

// NonNullableFormBuilder:
const email = form.getRawValue().email;  // tipo: string
// Sem necessidade de verificações null!
```

**Quando usar:**
- ✅ Formulários onde todos os campos têm valores default
- ✅ Quando quer type safety completo
- ❌ Formulários com campos opcionais (usar FormBuilder normal)

---

### **2. JWT Tokens no IntegraBridge**

**O que são?**
- JSON Web Tokens: strings assinadas digitalmente
- Contêm dados do user (id, email) + assinatura criptográfica

**Estrutura de um JWT:**
```
eyJhbGc... (header)
.eyJzdWI... (payload: {id, email, exp})
.SflKxwR... (signature: assinatura secreta)
```

**Como funciona:**
1. Servidor assina token com chave secreta
2. Token enviado ao cliente
3. Cliente envia token em cada request: `Authorization: Bearer <token>`
4. Servidor valida assinatura (garante que não foi alterado)
5. Extrai dados do user sem query à BD

**Expiração:**
- **Access Token:** 1 hora (curto = mais seguro)
- **Refresh Token:** 30 dias (renovar access sem re-login)

**Renovação Automática:**
```typescript
// Supabase SDK faz automaticamente:
// 1. Detecta access_token expirado
// 2. Envia refresh_token ao servidor
// 3. Servidor gera novo access_token
// 4. SDK atualiza localStorage
// 5. Retry da chamada original

// Developer não precisa fazer nada!
```

---

### **3. Supabase Auth - Porque usar BaaS?**

**Vantagens:**
- ✅ Zero implementação de bcrypt/JWT
- ✅ Renovação automática de tokens
- ✅ Email confirmation (opcional)
- ✅ OAuth (Google, GitHub) com 2 linhas
- ✅ Row Level Security (PostgreSQL)
- ✅ Auditoria built-in

**Alternativas (mais trabalho):**
- ❌ **JWT manual:** Criar endpoints, hash passwords, assinar tokens, renovar
- ❌ **Passport.js:** Configurar strategies, sessions, serialization
- ❌ **Auth0/Okta:** Mais completo mas pago

---

## 🔄 Fluxo Completo

### **Registo de Novo Utilizador:**

```
1. User preenche: nome, email, password
2. LoginComponent.onSubmit()
3. ↓ authService.registar(dados)
4. ↓ supabase.auth.signUp()
5. ↓ POST /auth/v1/signup
6. ↓ Supabase cria user (bcrypt password)
7. ↓ Supabase envia email confirmação (opcional)
8. ↓ Retorna { user, session }
9. ✓ Modal: "Conta criada!"
10. ✓ Toggle para modo login
```

### **Login de Utilizador Existente:**

```
1. User preenche: email, password
2. LoginComponent.onSubmit()
3. ↓ authService.login(dados)
4. ↓ supabase.auth.signInWithPassword()
5. ↓ POST /auth/v1/token
6. ↓ Supabase valida password (bcrypt compare)
7. ↓ Supabase gera JWT tokens
8. ↓ SDK armazena em localStorage
9. ↓ Retorna { user, session }
10. ✓ router.navigate(['/dashboard'])
```

### **Acesso a Rota Protegida:**

```
1. User tenta acessar /dashboard
2. ↓ AuthGuard.canActivate()
3. ↓ authService.obterUtilizadorAtual()
4. ↓ supabase.auth.getUser()
5. ↓ GET /auth/v1/user (com Bearer token)
6. ↓ Supabase valida JWT signature
7. ↓ Se válido: retorna User
8. ↓ Se expirado: renova com refresh_token
9. ✓ canActivate() retorna true
10. ✓ Carrega DashboardComponent
```

### **Logout:**

```
1. User clica "Sair"
2. ↓ authService.logout()
3. ↓ supabase.auth.signOut()
4. ↓ POST /auth/v1/logout
5. ↓ Supabase invalida access_token
6. ↓ SDK remove localStorage
7. ✓ router.navigate(['/login'])
```

---

## 🛡️ Segurança

### **1. Password Hashing (bcrypt):**
```
Input: "mypassword123"
↓ bcrypt (salt rounds: 10)
Output: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."

// Impossível reverter!
// Mesmo password = hashes diferentes (salt aleatório)
```

### **2. JWT Signature:**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "user-id", "exp": 1712155234 }
Signature: HMACSHA256(header + payload, SECRET_KEY)

// Se alguém alterar payload:
// → Signature inválida
// → Servidor rejeita token
```

### **3. Token Storage (localStorage):**
```
✅ Automático pelo Supabase SDK
✅ Apenas acessível pelo mesmo domínio
❌ Vulnerável a XSS (se site tiver scripts maliciosos)

// Proteção Angular:
// - Sanitização automática de HTML
// - DomSanitizer para casos especiais
```

### **4. Validação Dual (Frontend + Backend):**
```
Frontend (AuthGuard):
- Verifica se user existe
- Redireciona para /login se não
- OBJETIVO: Melhorar UX (não esperar erro backend)

Backend (middleware/auth.js):
- Valida JWT signature
- Verifica expiração
- OBJETIVO: Segurança real (não confia em frontend)

NUNCA confiar apenas no frontend!
```

---

