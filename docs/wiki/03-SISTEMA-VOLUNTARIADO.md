# 📚 SESSÃO 3: SISTEMA DE VOLUNTARIADO

> **Objetivo desta sessão:** Compreender o sistema completo de voluntariado (oferecer ajuda, marcar como concluído, ver contacto) e as transições de estado dos pedidos.

---

## 🎯 VISÃO GERAL

O **Sistema de Voluntariado** gere o **ciclo de vida** de um pedido de ajuda desde a criação até à conclusão. Este sistema permite:

1. **Oferecer Ajuda** → Voluntário oferece-se para ajudar (pendente → em_progresso)
2. **Marcar como Concluído** → Dono marca pedido como resolvido (em_progresso → concluido)
3. **Ver Contacto** → Dono e helper vêem contacto um do outro para coordenar ajuda
4. **Meus Pedidos** → Listar pedidos criados pelo user
5. **Minhas Contribuições** → Listar pedidos onde user é helper

---

## 📊 DIAGRAMA DE ESTADOS

```
┌─────────────┐
│  PENDENTE   │ ← Pedido criado, aguardando voluntário
└──────┬──────┘
       │
       │ (1) OFERECER AJUDA
       │     - Qualquer user autenticado (exceto dono)
       │     - Atribui helper_id
       ▼
┌──────────────┐
│ EM_PROGRESSO │ ← Helper atribuído, ajuda em andamento
└──────┬───────┘
       │
       │ (2) MARCAR CONCLUÍDO
       │     - Apenas o dono (user_id)
       │     - Pedido resolvido
       ▼
┌─────────────┐
│  CONCLUÍDO  │ ← Pedido finalizado com sucesso
└─────────────┘
```

**Regras de Transição:**
- ✅ **pendente → em_progresso**: Qualquer user (exceto dono) pode oferecer ajuda
- ✅ **em_progresso → concluido**: Apenas o dono pode marcar como concluído
- ❌ **Não é possível**: pendente → concluido (tem de passar por em_progresso)
- ❌ **Não é possível**: Reverter estados (concluido → em_progresso)

---

## 🗂️ ARQUITETURA DO SISTEMA

### **Frontend:**
- `voluntariado.ts` (114 linhas) - Service com 5 métodos

### **Backend:**
- `voluntariado.routes.js` (15 linhas) - 5 rotas
- `voluntariado.controller.js` (67 linhas) - 5 controllers
- `voluntariado.service.js` (106 linhas) - 5 services + 2 RPC functions

### **Fluxo de Dados:**
```
Frontend Component (DetalhePedido)
        ↓
Frontend Service (voluntariado.ts)
        ↓ HTTP Request
Backend Routes (voluntariado.routes.js)
        ↓ verificarToken middleware
Backend Controller (voluntariado.controller.js)
        ↓
Backend Service (voluntariado.service.js)
        ↓ Query Supabase
Supabase Database + RPC Functions
```

---

## 🔍 ANÁLISE DETALHADA

---

### **1. Frontend Service (voluntariado.ts)**

**Localização:** `frontend/src/app/services/voluntariado.ts`

#### **Estrutura:**

```typescript
@Injectable({ providedIn: 'root' })
export class VoluntariadoService {
  private readonly apiUrl = 'https://integrabridge-api.onrender.com/api/voluntariado';

  // 1. Autenticação centralizada (DRY)
  private getAuthHeaders(): Observable<HttpHeaders>

  // 2. Ver contacto do parceiro
  obterContactoParceiro(pedidoId: string): Observable<IContacto | null>

  // 3. Oferecer ajuda (pendente → em_progresso)
  oferecerAjuda(pedidoId: string): Observable<IPedido>

  // 4. Listar pedidos criados pelo user
  obterMeusPedidos(): Observable<IPedido[]>

  // 5. Listar pedidos onde user é helper
  obterMinhasContribuicoes(): Observable<IPedido[]>

  // 6. Marcar pedido como concluído (em_progresso → concluido)
  marcarComoConcluido(pedidoId: string): Observable<IPedido>
}
```

---

#### **1.1 getAuthHeaders() - Autenticação Centralizada**

```typescript
private getAuthHeaders(): Observable<HttpHeaders> {
  return from(this.authService.obterSessaoAtual()).pipe(
    map((session) => {
      const token = session?.access_token;
      if (!token) {
        console.warn('VoluntariadoService: Nenhum token de sessão encontrado.');
      }
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    })
  );
}
```

**Por que isto existe?**
- **DRY (Don't Repeat Yourself)**: Todos os métodos precisam do token JWT
- **Centralização**: Um único ponto para obter headers de autenticação
- **Observable**: Retorna Observable para uso com `switchMap()`

**Padrão de uso:**
```typescript
return this.getAuthHeaders().pipe(
  switchMap((headers) => this.http.post(url, body, { headers }))
);
```

---

#### **1.2 obterContactoParceiro() - Ver Contacto**

```typescript
obterContactoParceiro(pedidoId: string): Observable<IContacto | null> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.get<IContacto>(`${this.apiUrl}/contacto/${pedidoId}`, { headers })
    ),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        console.warn('VoluntariadoService: Não autorizado a ver contacto deste pedido.');
        return of(null);  // Retorna null em vez de erro
      }
      throw error;
      })
  );
}
```

**Características:**
- ✅ GET `/api/voluntariado/contacto/:pedidoId`
- ✅ Retorna `IContacto` ou `null` (se não autorizado)
- ✅ Tratamento de erro 403 (sem permissão) sem crashar
- ✅ Usado em `DetalhePedidoComponent.verContacto()`

**Interface IContacto:**
```typescript
interface IContacto {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
}
```

**Quem pode ver:**
- ✅ Dono do pedido (vê contacto do helper)
- ✅ Helper do pedido (vê contacto do dono)
- ❌ Outros users (retorna null)

**Quando disponível:**
- ✅ Pedido em status `em_progresso` ou `concluido`
- ❌ Pedido em status `pendente` (ainda não tem helper)

---

#### **1.3 oferecerAjuda() - Oferecer Ajuda**

```typescript
oferecerAjuda(pedidoId: string): Observable<IPedido> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) =>
      this.http.post<IPedido>(`${this.apiUrl}/ajudar/${pedidoId}`, {}, { headers })
    )
  );
}
```

**Características:**
- ✅ POST `/api/voluntariado/ajudar/:id`
- ✅ Body vazio `{}` (user ID vem do token)
- ✅ Retorna pedido atualizado com `helper_id` e `status: 'em_progresso'`
- ✅ Usado em `DetalhePedidoComponent.oferecerMinhaAjuda()`

**O que acontece no backend:**
1. Valida que pedido está `pendente`
2. Valida que user **não é o dono**
3. Atribui `helper_id = user.id`
4. Muda `status = 'em_progresso'`
5. Retorna pedido atualizado

**Validações (feitas por RPC function no Supabase):**
- ❌ Pedido não existe → Erro
- ❌ Pedido já tem helper → Erro "Pedido já tem ajuda atribuída"
- ❌ User é o dono → Erro "Não podes oferecer ajuda no teu próprio pedido"
- ❌ Status não é `pendente` → Erro "Pedido não está disponível"

---

#### **1.4 obterMeusPedidos() - Listar Pedidos Criados**

```typescript
obterMeusPedidos(): Observable<IPedido[]> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) =>
      this.http.get<IPedido[]>(`${this.apiUrl}/meus-pedidos`, { headers })
    )
  );
}
```

**Características:**
- ✅ GET `/api/voluntariado/meus-pedidos`
- ✅ Retorna pedidos onde `user_id = currentUser.id`
- ✅ Inclui JOINs com distritos e idiomas
- ✅ Ordenado por `created_at DESC` (mais recente primeiro)

**Uso:**
- Componente "Meus Pedidos" (página separada do Dashboard)
- Mostra apenas pedidos criados pelo user
- Útil para acompanhar progresso dos seus pedidos

---

#### **1.5 obterMinhasContribuicoes() - Listar Contribuições**

```typescript
obterMinhasContribuicoes(): Observable<IPedido[]> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) =>
      this.http.get<IPedido[]>(`${this.apiUrl}/minhas-contribuicoes`, { headers })
    )
  );
}
```

**Características:**
- ✅ GET `/api/voluntariado/minhas-contribuicoes`
- ✅ Retorna pedidos onde `helper_id = currentUser.id`
- ✅ Mostra pedidos onde user ofereceu ajuda
- ✅ Útil para tracking de voluntariado

**Diferença entre Meus Pedidos vs Minhas Contribuições:**
```
Meus Pedidos           → user_id = eu     (pedi ajuda)
Minhas Contribuições   → helper_id = eu   (ofereci ajuda)
```

---

#### **1.6 marcarComoConcluido() - Concluir Pedido**

```typescript
marcarComoConcluido(pedidoId: string): Observable<IPedido> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) =>
      this.http.patch<IPedido>(`${this.apiUrl}/concluir/${pedidoId}`, {}, { headers })
    )
  );
}
```

**Características:**
- ✅ PATCH `/api/voluntariado/concluir/:id`
- ✅ Body vazio `{}` (validação no backend)
- ✅ Retorna pedido com `status: 'concluido'`
- ✅ Usado em `DetalhePedidoComponent.concluirPedido()`

**O que acontece no backend:**
1. Valida que user é o **dono** (user_id)
2. Valida que status é `em_progresso`
3. Atualiza `status = 'concluido'`
4. Retorna pedido atualizado

**Validações:**
- ❌ User não é o dono → Erro "Acesso negado: Apenas o criador do pedido o pode concluir"
- ❌ Status não é `em_progresso` → Erro "Operação inválida: Apenas pedidos 'em progresso' podem ser concluídos"

---

### **2. Backend Routes (voluntariado.routes.js)**

**Localização:** `backend/routes/voluntariado.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');
const voluntariadoController = require('../controllers/voluntariado.controller');

// Listar pedidos do user
router.get('/meus-pedidos', verificarToken, voluntariadoController.listarMeusPedidos);
router.get('/minhas-contribuicoes', verificarToken, voluntariadoController.listarMinhasContribuicoes);

// Ações sobre pedidos
router.post('/ajudar/:id', verificarToken, voluntariadoController.oferecerAjuda);
router.patch('/concluir/:id', verificarToken, voluntariadoController.marcarComoConcluido);

// Ver contacto do parceiro
router.get('/contacto/:pedidoId', verificarToken, voluntariadoController.obterContacto);

module.exports = router;
```

**Rotas:**
| Método | Endpoint | Ação | Middleware |
|--------|----------|------|------------|
| GET | `/meus-pedidos` | Lista pedidos criados pelo user | verificarToken |
| GET | `/minhas-contribuicoes` | Lista pedidos onde user é helper | verificarToken |
| POST | `/ajudar/:id` | Oferecer ajuda em pedido | verificarToken |
| PATCH | `/concluir/:id` | Marcar pedido como concluído | verificarToken |
| GET | `/contacto/:pedidoId` | Obter contacto do parceiro | verificarToken |

**Todas as rotas exigem autenticação** (`verificarToken` middleware).

---

### **3. Backend Controller (voluntariado.controller.js)**

**Localização:** `backend/controllers/voluntariado.controller.js`

Camada intermediária entre rotas e service. Responsável por:
- Extrair parâmetros de `req` (params, user, headers)
- Chamar service apropriado
- Retornar resposta HTTP com status correto
- Tratar erros e mapear para status HTTP

---

#### **3.1 oferecerAjuda()**

```javascript
exports.oferecerAjuda = async (req, res) => {
  try {
    const pedidoId = req.params.id;        // UUID do pedido (da URL)
    const helperId = req.user.id;          // ID do user (do token JWT)
    const authHeader = req.headers.authorization;  // Token para Supabase
    
    const resultado = await voluntariadoService.oferecerAjuda(pedidoId, helperId, authHeader);
    res.json(resultado);  // 200 OK + pedido atualizado
  } catch (erro) {
    res.status(400).json({ erro: erro.message });  // 400 Bad Request
  }
};
```

**Extração de dados:**
- `pedidoId` → `req.params.id` (vem da URL `/ajudar/:id`)
- `helperId` → `req.user.id` (injetado pelo middleware `verificarToken`)
- `authHeader` → `req.headers.authorization` (Bearer token)

**Respostas:**
- ✅ 200: Pedido atualizado com helper atribuído
- ❌ 400: Erro de validação (já tem helper, user é dono, etc.)

---

#### **3.2 listarMeusPedidos()**

```javascript
exports.listarMeusPedidos = async (req, res) => {
  try {
    const pedidos = await voluntariadoService.obterMeusPedidos(req.user.id, req.headers.authorization);
    res.json(pedidos);  // 200 OK + array de pedidos
  } catch (erro) {
    res.status(500).json({ erro: erro.message });  // 500 Internal Server Error
  }
};
```

**Respostas:**
- ✅ 200: Array de pedidos (pode ser vazio `[]`)
- ❌ 500: Erro interno do servidor

---

#### **3.3 listarMinhasContribuicoes()**

```javascript
exports.listarMinhasContribuicoes = async (req, res) => {
  try {
    const contribuicoes = await voluntariadoService.obterMinhasContribuicoes(req.user.id, req.headers.authorization);
    res.json(contribuicoes);  // 200 OK + array de pedidos
  } catch (erro) {
    res.status(500).json({ erro: erro.message });  // 500 Internal Server Error
  }
};
```

**Idêntico a `listarMeusPedidos()` mas filtra por `helper_id`.**

---

#### **3.4 marcarComoConcluido()**

```javascript
exports.marcarComoConcluido = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const userId = req.user.id;
    const authHeader = req.headers.authorization;
    
    const pedidoConcluido = await voluntariadoService.marcarComoConcluido(pedidoId, userId, authHeader);
    res.json(pedidoConcluido);  // 200 OK + pedido com status 'concluido'
  } catch (erro) {
    res.status(400).json({ erro: erro.message });  // 400 Bad Request
  }
};
```

**Respostas:**
- ✅ 200: Pedido marcado como concluído
- ❌ 400: Erro de validação (user não é dono, status inválido)

---

#### **3.5 obterContacto()**

```javascript
exports.obterContacto = async (req, res) => {
  try {
    const pedidoId = req.params.pedidoId;  // UUID do pedido
    const userId = req.user.id;            // ID do user autenticado
    const authHeader = req.headers.authorization;

    const contacto = await voluntariadoService.obterContacto(pedidoId, userId, authHeader);
    res.json(contacto);  // 200 OK + dados de contacto
  } catch (erro) {
    // Mapear erros para status HTTP apropriados
    if (erro.message.includes('não encontrado')) {
      return res.status(404).json({ erro: erro.message });  // 404 Not Found
    }
    
    if (erro.message.includes('Não autorizado') || erro.message.includes('Acesso negado')) {
      return res.status(403).json({ erro: erro.message });  // 403 Forbidden
    }

    res.status(500).json({ erro: erro.message });  // 500 Internal Server Error
  }
};
```

**Mapeamento de erros:**
- ✅ 200: Contacto do parceiro retornado
- ❌ 403: User não tem permissão (não é dono nem helper)
- ❌ 404: Pedido não encontrado
- ❌ 500: Erro interno

**Segurança:**
- Apenas dono e helper podem ver contactos
- Validação feita por RPC function no Supabase

---

### **4. Backend Service (voluntariado.service.js)**

**Localização:** `backend/services/voluntariado.service.js`

Camada de acesso a dados. Responsável por:
- Queries Supabase
- Chamadas a RPC functions (stored procedures)
- Validação de regras de negócio
- Lançar erros descritivos

---

#### **4.1 getAuthClient() - Cliente Autenticado**

```javascript
const getAuthClient = (authHeader) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};
```

**Por que criar cliente com token do user?**
- **RLS (Row Level Security)**: Supabase valida permissões baseado no JWT
- **Contexto de user**: Queries executam como se o user estivesse logado no Supabase
- **Segurança**: RPC functions conseguem aceder `auth.uid()` (ID do user autenticado)

---

#### **4.2 oferecerAjuda() - RPC Function**

```javascript
exports.oferecerAjuda = async (pedidoId, helperId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  
  // Chama função RPC no Supabase
  const { error } = await supabase.rpc('oferecer_ajuda', {
    p_pedido_id: pedidoId,
    p_helper_id: helperId
  });

  if (error) {
    throw new Error(error.message || 'Erro ao processar a oferta de ajuda.');
  }

  // Retorna pedido atualizado
  const pedidoAtualizado = await pedidoService.obterPorId(pedidoId, authHeader);
  return pedidoAtualizado;
};
```

**Por que usar RPC function?**
- **Lógica complexa**: Validações múltiplas (status, dono, helper existente)
- **Atomicidade**: UPDATE + validações numa transação
- **Segurança**: Lógica sensível no servidor (não pode ser burlada)
- **Performance**: Uma chamada em vez de múltiplas queries

**RPC Function `oferecer_ajuda` (Supabase SQL):**
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
    status = 'em_progresso'
  WHERE id = p_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Validações (em ordem):**
1. ✅ Pedido existe
2. ✅ User não é o dono
3. ✅ Status é `pendente`
4. ✅ Não tem helper atribuído
5. ✅ UPDATE atômico

---

#### **4.3 obterMeusPedidos()**

```javascript
exports.obterMeusPedidos = async (userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')  // JOINs automáticos
    .eq('user_id', userId)  // Filtra por criador
    .order('created_at', { ascending: false });  // Mais recente primeiro

  if (error) throw new Error('Erro ao buscar os teus pedidos na base de dados.');
  return data;
};
```

**Query equivalente SQL:**
```sql
SELECT 
  pedidos_ajuda.*,
  distritos.nome,
  idiomas.nome
FROM pedidos_ajuda
LEFT JOIN distritos ON pedidos_ajuda.distrito_id = distritos.id
LEFT JOIN idiomas ON pedidos_ajuda.idioma_id = idiomas.id
WHERE pedidos_ajuda.user_id = :userId
ORDER BY pedidos_ajuda.created_at DESC;
```

---

#### **4.4 obterMinhasContribuicoes()**

```javascript
exports.obterMinhasContribuicoes = async (userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select('*, distritos(nome), idiomas(nome)')
    .eq('helper_id', userId)  // Filtra por helper (diferente de obterMeusPedidos)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar as tuas contribuições na base de dados.');
  return data;
};
```

**Diferença de obterMeusPedidos():**
```javascript
.eq('user_id', userId)     // Pedidos criados por mim
.eq('helper_id', userId)   // Pedidos onde ofereci ajuda
```

---

#### **4.5 marcarComoConcluido()**

```javascript
exports.marcarComoConcluido = async (pedidoId, userId, authHeader) => {
  const supabase = getAuthClient(authHeader);
  
  // 1. Validar pedido existe e obter dados
  const pedidoAtual = await pedidoService.obterPorId(pedidoId, authHeader);
  
  // 2. Validar que user é o dono
  if (pedidoAtual.user_id !== userId) {
    throw new Error('Acesso negado: Apenas o criador do pedido o pode concluir.');
  }

  // 3. Validar que status é 'em_progresso'
  if (pedidoAtual.status !== 'em_progresso') {
    throw new Error('Operação inválida: Apenas pedidos "em progresso" podem ser concluídos.');
  }
  
  // 4. Atualizar status
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .update({ status: 'concluido' })
    .eq('id', pedidoId)
    .eq('user_id', userId)  // Segurança: dupla validação
    .select()
    .single();

  if (error) throw new Error('Erro ao atualizar o status do pedido na base de dados.');
  return data;
};
```

**Validações (camada aplicacional):**
1. ✅ Pedido existe (via `obterPorId`)
2. ✅ User é o dono (`user_id === userId`)
3. ✅ Status é `em_progresso`
4. ✅ UPDATE com `.eq('user_id', userId)` (validação dupla)

**Por que validação dupla?**
- Camada aplicacional: Mensagens de erro claras
- Camada BD: Segurança (evita race conditions)

---

#### **4.6 obterContacto() - RPC Function**

```javascript
exports.obterContacto = async (pedidoId, callerId, authHeader) => {
  const supabase = getAuthClient(authHeader);

  // Chama RPC function
  const { data, error } = await supabase.rpc('obter_contacto_parceiro', {
    p_pedido_id: pedidoId,
    p_caller_id: callerId
  });

  if (error) {
    // Mapear códigos de erro PostgreSQL para mensagens amigáveis
    if (error.code === 'P0002') {
      throw new Error('Pedido não encontrado.');
    }

    if (error.code === '42501') {
      throw new Error('Não autorizado a visualizar contactos deste pedido. Apenas o dono e o helper podem aceder.');
    }

    if (error.code === 'P0003') {
      throw new Error('Pedido ainda não tem helper atribuído.');
    }

    throw new Error(error.message || 'Erro ao obter contacto do parceiro.');
  }

  if (!data) {
    throw new Error('Nenhum dado retornado pela RPC obter_contacto_parceiro.');
  }

  return data && data.length > 0 ? data[0] : null;
};
```

**Mapeamento de códigos de erro PostgreSQL:**
| Código | Significado | Mensagem |
|--------|-------------|----------|
| P0002 | `RAISE EXCEPTION` custom | Pedido não encontrado |
| 42501 | Insufficient privilege | Não autorizado (não é dono nem helper) |
| P0003 | `RAISE EXCEPTION` custom | Pedido sem helper |

**RPC Function `obter_contacto_parceiro` (Supabase SQL):**
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

**Lógica de parceiro:**
```
Se caller é dono    → Retorna contacto do helper
Se caller é helper  → Retorna contacto do dono
```

**Segurança:**
- ✅ Apenas dono e helper podem chamar
- ✅ Validação de permissões na BD (não pode ser burlada)
- ✅ `SECURITY DEFINER`: Função executa com permissões do owner

---

## 🔄 FLUXOS COMPLETOS

---

### **Fluxo 1: Oferecer Ajuda**

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Clica "Posso Ajudar" em pedido pendente              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: DetalhePedidoComponent.oferecerMinhaAjuda()      │
│ - Valida: !carregandoAjuda && pedido.status === 'pendente' │
│ - carregandoAjuda = true (desabilita botão)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE: voluntariadoService.oferecerAjuda()      │
│ - POST /api/voluntariado/ajudar/:id                        │
│ - Headers: { Authorization: Bearer <token> }               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND ROUTE: POST /ajudar/:id                            │
│ - Middleware: verificarToken (valida JWT, extrai user.id)  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND CONTROLLER: oferecerAjuda()                         │
│ - Extrai: pedidoId (params), helperId (user.id)            │
│ - Chama service                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND SERVICE: oferecerAjuda()                            │
│ - Chama RPC supabase.rpc('oferecer_ajuda', {...})          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE RPC: oferecer_ajuda()                              │
│ ✅ Valida: pedido existe                                    │
│ ✅ Valida: user não é o dono                                │
│ ✅ Valida: status é 'pendente'                              │
│ ✅ Valida: helper_id é NULL                                 │
│ 🔄 UPDATE: helper_id = userId, status = 'em_progresso'     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND SERVICE: Retorna pedido atualizado                  │
│ - Chama pedidoService.obterPorId() para obter dados frescos│
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Recebe pedido atualizado                          │
│ - this.pedido.status = 'em_progresso'                      │
│ - this.isHelperDoPedido = true                             │
│ - carregandoAjuda = false (via finalize)                   │
│ - Mostra modal de sucesso                                   │
│ - UI atualiza botões (esconde "Posso Ajudar")             │
└─────────────────────────────────────────────────────────────┘
```

**Estados UI antes/depois:**
```
ANTES:
- Botão "Posso Ajudar" visível
- Botão "Marcar Concluído" oculto
- Botão "Ver Contacto" oculto

DEPOIS:
- Botão "Posso Ajudar" oculto
- Botão "Marcar Concluído" visível (se user é dono)
- Botão "Ver Contacto" visível
```

---

### **Fluxo 2: Marcar Como Concluído**

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Clica "Marcar Concluído" (pedido em_progresso)       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: DetalhePedidoComponent.concluirPedido()          │
│ - Valida: !carregandoConcluir && isDonoDoPedido            │
│ - Mostra confirm() nativo do browser                        │
│ - carregandoConcluir = true                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE: voluntariadoService.marcarComoConcluido()│
│ - PATCH /api/voluntariado/concluir/:id                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND CONTROLLER: marcarComoConcluido()                   │
│ - Extrai: pedidoId, userId (do token)                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND SERVICE: marcarComoConcluido()                      │
│ ✅ Busca pedido atual (obterPorId)                          │
│ ✅ Valida: pedidoAtual.user_id === userId                   │
│ ✅ Valida: pedidoAtual.status === 'em_progresso'            │
│ 🔄 UPDATE: status = 'concluido'                             │
│    WHERE id = pedidoId AND user_id = userId                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Recebe pedido concluído                           │
│ - this.pedido.status = 'concluido'                         │
│ - carregandoConcluir = false (via finalize)                │
│ - Mostra modal de sucesso                                   │
│ - UI atualiza (todos os botões de ação desabilitados)      │
└─────────────────────────────────────────────────────────────┘
```

**Validações:**
- ❌ Se user não é dono → Erro "Acesso negado"
- ❌ Se status não é `em_progresso` → Erro "Operação inválida"
- ✅ Se tudo OK → Status muda para `concluido`

---

### **Fluxo 3: Ver Contacto**

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Clica "Ver Contacto" (pedido em_progresso/concluido) │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: DetalhePedidoComponent.verContacto()             │
│ - Valida: !carregandoContacto && pedido não null           │
│ - carregandoContacto = true                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND SERVICE: obterContactoParceiro()                   │
│ - GET /api/voluntariado/contacto/:pedidoId                 │
│ - Trata 403 sem crashar (retorna null)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND CONTROLLER: obterContacto()                         │
│ - Extrai: pedidoId, userId (do token)                      │
│ - Mapeia erros para status HTTP (403, 404, 500)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND SERVICE: obterContacto()                            │
│ - Chama RPC supabase.rpc('obter_contacto_parceiro')        │
│ - Mapeia error.code para mensagens amigáveis               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE RPC: obter_contacto_parceiro()                     │
│ ✅ Valida: pedido existe                                    │
│ ✅ Valida: pedido tem helper                                │
│ ✅ Valida: caller é dono OU helper                          │
│ 🔍 Determina parceiro:                                      │
│    - Se caller = dono → retorna helper                     │
│    - Se caller = helper → retorna dono                     │
│ 📤 Retorna: { id, nome, email, telefone }                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Recebe contacto                                   │
│ - contactoParceiro = { nome, email, telefone }             │
│ - mostrarModalContacto = true                               │
│ - carregandoContacto = false (via finalize)                │
│ - Modal exibe dados de contacto                             │
└─────────────────────────────────────────────────────────────┘
```

**Cenários:**
- ✅ Dono do pedido → Vê contacto do helper
- ✅ Helper do pedido → Vê contacto do dono
- ❌ Outro user → 403 Forbidden (frontend trata gracefully)
- ❌ Pedido pendente (sem helper) → Erro "Pedido ainda não tem helper"

---

## 🔐 SEGURANÇA E VALIDAÇÕES

### **1. Validações Frontend (UX)**

```typescript
// DetalhePedidoComponent

// Mostrar botão "Posso Ajudar"?
get mostrarBotaoAjudar(): boolean {
  return this.pedido?.status === 'pendente' && !this.isDonoDoPedido;
}

// Mostrar botão "Marcar Concluído"?
get mostrarBotaoConcluir(): boolean {
  return this.pedido?.status === 'em_progresso' && this.isDonoDoPedido;
}

// Mostrar botão "Ver Contacto"?
get mostrarBotaoContacto(): boolean {
  const statusValido = this.pedido?.status === 'em_progresso' || this.pedido?.status === 'concluido';
  const temPermissao = this.isDonoDoPedido || this.isHelperDoPedido;
  return statusValido && temPermissao;
}
```

**Propósito:** Melhorar UX (não mostrar botões inválidos)
**NÃO é segurança:** Frontend pode ser manipulado

---

### **2. Validações Backend (Segurança Real)**

#### **oferecerAjuda() - RPC Function**
```sql
-- 1. User não pode ajudar o próprio pedido
IF v_pedido.user_id = p_helper_id THEN
  RAISE EXCEPTION 'Não podes oferecer ajuda no teu próprio pedido.';
END IF;

-- 2. Status deve ser 'pendente'
IF v_pedido.status != 'pendente' THEN
  RAISE EXCEPTION 'Pedido não está disponível para ajuda.';
END IF;

-- 3. Não pode ter helper já atribuído
IF v_pedido.helper_id IS NOT NULL THEN
  RAISE EXCEPTION 'Pedido já tem ajuda atribuída.';
END IF;
```

#### **marcarComoConcluido() - Service**
```javascript
// 1. Apenas dono pode concluir
if (pedidoAtual.user_id !== userId) {
  throw new Error('Acesso negado: Apenas o criador do pedido o pode concluir.');
}

// 2. Status deve ser 'em_progresso'
if (pedidoAtual.status !== 'em_progresso') {
  throw new Error('Operação inválida: Apenas pedidos "em progresso" podem ser concluídos.');
}

// 3. Query com .eq('user_id', userId) (validação dupla)
.update({ status: 'concluido' })
.eq('id', pedidoId)
.eq('user_id', userId)  // 🔒 Segurança
```

#### **obterContacto() - RPC Function**
```sql
-- 1. Pedido deve ter helper
IF v_pedido.helper_id IS NULL THEN
  RAISE EXCEPTION 'Pedido ainda não tem helper atribuído.';
END IF;

-- 2. Caller deve ser dono OU helper
IF p_caller_id != v_pedido.user_id AND p_caller_id != v_pedido.helper_id THEN
  RAISE EXCEPTION 'Acesso negado';
END IF;
```

---

### **3. Middleware de Autenticação**

```javascript
// middleware/auth.js (verificarToken)

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];  // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Injeta { id, email } no req
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
```

**Protege:**
- ✅ Todas as rotas de voluntariado
- ✅ Garante que `req.user.id` é confiável (vem do JWT válido)

---

## 📝 CONCEITOS-CHAVE PARA APRESENTAÇÃO

### **1. RPC Functions (Remote Procedure Calls)**

**O que são?**
- Stored procedures do PostgreSQL/Supabase
- Lógica executada diretamente na BD
- Equivalente a "funções serverless" na BD

**Vantagens:**
- ✅ **Atomicidade**: Transações automáticas (tudo ou nada)
- ✅ **Performance**: Lógica executa perto dos dados (sem round-trips)
- ✅ **Segurança**: Lógica sensível não exposta no frontend
- ✅ **Validações complexas**: Queries avançadas difíceis via API

**Quando usar?**
- Operações com múltiplas validações (oferecer ajuda)
- Lógica condicional complexa (determinar parceiro)
- Segurança crítica (permissões)

**Desvantagens:**
- ⚠️ Difícil de testar (precisa BD real)
- ⚠️ Vendor lock-in (específico de PostgreSQL)
- ⚠️ Debugging mais complexo

---

### **2. Estado do Pedido (State Machine)**

```
pendente → em_progresso → concluido
```

**Transições válidas:**
- ✅ `pendente → em_progresso` (via oferecerAjuda)
- ✅ `em_progresso → concluido` (via marcarComoConcluido)

**Transições inválidas:**
- ❌ `pendente → concluido` (deve passar por em_progresso)
- ❌ `em_progresso → pendente` (não pode reverter)
- ❌ `concluido → *` (estado final)

**Validação:**
- Frontend: Mostra/oculta botões baseado no estado
- Backend: Valida estado antes de UPDATE

---

### **3. Permissões Baseadas em Papel**

| Ação | Dono | Helper | Outros |
|------|------|--------|--------|
| Ver detalhes | ✅ | ✅ | ✅ |
| Oferecer ajuda | ❌ | ❌ | ✅ (se pendente) |
| Marcar concluído | ✅ | ❌ | ❌ |
| Ver contacto | ✅ | ✅ | ❌ |
| Editar pedido | ✅ | ❌ | ❌ |
| Apagar pedido | ✅ | ❌ | ❌ |

**Implementação:**
- Frontend: `isDonoDoPedido`, `isHelperDoPedido` (calculado em ngOnInit)
- Backend: Validações em service/RPC

---

### **4. getAuthClient vs supabaseGlobal**

```javascript
// Cliente GLOBAL (admin)
const supabaseGlobal = require('../config/supabase');

// Cliente AUTENTICADO (user)
const getAuthClient = (authHeader) => {
  return createClient(URL, KEY, {
    global: { headers: { Authorization: authHeader } }
  });
};
```

**Quando usar cada um:**

| Cliente | Uso | Exemplo |
|---------|-----|---------|
| `supabaseGlobal` | Operações admin, sem RLS | `listarTodos()` (mostrar todos os pedidos) |
| `getAuthClient()` | Operações de user, com RLS | `obterMeusPedidos()` (apenas meus) |

**RLS (Row Level Security):**
- Policies do Supabase que filtram rows baseado no `auth.uid()`
- Cliente autenticado → RLS ativo
- Cliente global → RLS ignorado (admin)

---

