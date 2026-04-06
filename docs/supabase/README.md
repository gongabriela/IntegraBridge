# 📊 Supabase Database Documentation - IntegraBridge

> **Objetivo**: Documentação completa da estrutura de base de dados, scripts SQL e RPC functions do projeto IntegraBridge.

---

## 📑 Índice

1. [Visão Geral da Base de Dados](#1-visão-geral-da-base-de-dados)
2. [Scripts de Produção](#2-scripts-de-produção)
3. [Estrutura de Tabelas](#3-estrutura-de-tabelas)
4. [RPC Functions](#4-rpc-functions)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Lookup Tables](#6-lookup-tables)
7. [Índices de Performance](#7-índices-de-performance)
8. [Scripts Arquivados](#8-scripts-arquivados)
9. [Processo de Deploy](#9-processo-de-deploy)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Visão Geral da Base de Dados

### Arquitetura
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │   distritos     │    │    idiomas      │
│   (Supabase)    │    │   (Lookup)      │    │   (Lookup)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐              │                       │
│ pedidos_ajuda   │◄─────────────┴───────────────────────┘
│ (Tabela Main)   │
└─────────────────┘
```

### Entidades Principais

| Tabela | Tipo | Registos | Função |
|--------|------|----------|--------|
| `auth.users` | Supabase Auth | Dinâmico | Utilizadores autenticados |
| `pedidos_ajuda` | Aplicação | Dinâmico | Pedidos de ajuda (core business) |
| `distritos` | Lookup | 20 fixos | Distritos de Portugal |
| `idiomas` | Lookup | 6 fixos | Idiomas suportados |

### Fluxo de Dados
```
1. User autentica → auth.users
2. User cria pedido → pedidos_ajuda
3. Outro user oferece ajuda → RPC oferecer_ajuda
4. Status: pendente → em_progresso
5. Users partilham contacto → RPC obter_contacto_parceiro
6. Dono marca como concluído → status: concluido
```

---

## 2. Scripts de Produção

### Pasta `production/`
Scripts limpos e organizados para execução em produção:

| Script | Ordem | Função | Dependências |
|--------|-------|--------|--------------|
| `01-schema.sql` | 1º | Cria tabelas, ENUMs, dados iniciais, RLS | Nenhuma |
| `02-rpc-functions.sql` | 2º | Cria stored procedures | 01-schema.sql |
| `03-indexes.sql` | 3º | Otimizações de performance | 01-schema.sql |

### Como Executar
```sql
-- 1. Abrir Supabase Dashboard → SQL Editor
-- 2. Executar scripts na ordem:

-- SCRIPT 1: Base
\i production/01-schema.sql

-- SCRIPT 2: RPC Functions  
\i production/02-rpc-functions.sql

-- SCRIPT 3: Performance
\i production/03-indexes.sql
```

---

## 3. Estrutura de Tabelas

### 3.1 Tabela: `pedidos_ajuda`

#### Schema
```sql
CREATE TABLE pedidos_ajuda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  distrito_id INT REFERENCES distritos(id) NOT NULL,
  idioma_id INT REFERENCES idiomas(id) NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  status status_pedido DEFAULT 'pendente',
  urgencia urgencia_pedido NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  helper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT dono_nao_pode_ser_ajudante CHECK (user_id != helper_id)
);
```

#### Campos Detalhados

| Campo | Tipo | Null | Função |
|-------|------|------|--------|
| `id` | `UUID` | ❌ | Chave primária |
| `user_id` | `UUID` | ❌ | Criador do pedido (FK → auth.users) |
| `helper_id` | `UUID` | ✅ | Voluntário que ofereceu ajuda (FK → auth.users) |
| `distrito_id` | `INT` | ❌ | Localização (FK → distritos) |
| `idioma_id` | `INT` | ❌ | Idioma preferencial (FK → idiomas) |
| `titulo` | `VARCHAR(100)` | ❌ | Resumo do pedido |
| `descricao` | `TEXT` | ❌ | Descrição completa |
| `status` | `status_pedido` | ❌ | Estado: pendente/em_progresso/concluido |
| `urgencia` | `urgencia_pedido` | ❌ | Prioridade: baixa/media/alta |
| `created_at` | `TIMESTAMPTZ` | ❌ | Data de criação (UTC) |

#### ENUMs
```sql
-- Estados possíveis do pedido
CREATE TYPE status_pedido AS ENUM ('pendente', 'em_progresso', 'concluido');

-- Níveis de urgência  
CREATE TYPE urgencia_pedido AS ENUM ('baixa', 'media', 'alta');
```

#### State Machine
```
pendente → em_progresso → concluido
   ↑           ↑             ↑
   │           │             │
   │     (oferecerAjuda)     │
   │        RPC              │
   │                   (marcarConcluido)
   │                     Backend logic
(criarPedido)
Frontend form
```

### 3.2 Tabela: `distritos` (Lookup)

#### Schema
```sql
CREATE TABLE distritos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL
);
```

#### Dados (20 registos fixos)
```
Aveiro, Beja, Braga, Bragança, Castelo Branco, Coimbra, 
Évora, Faro, Guarda, Leiria, Lisboa, Portalegre, Porto, 
Santarém, Setúbal, Viana do Castelo, Vila Real, Viseu, 
Açores, Madeira
```

### 3.3 Tabela: `idiomas` (Lookup)

#### Schema
```sql
CREATE TABLE idiomas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL
);
```

#### Dados (6 registos fixos)
```
Português, Inglês, Espanhol, Francês, Ucraniano, Árabe
```

---

## 4. RPC Functions

### 4.1 RPC: `oferecer_ajuda`

#### Assinatura
```sql
oferecer_ajuda(p_pedido_id UUID, p_helper_id UUID) RETURNS VOID
```

#### Função
Atribui voluntário a um pedido pendente com validações atômicas.

#### Validações
1. **Pedido existe**: `p_pedido_id` deve existir na BD
2. **Não é self-help**: `p_helper_id ≠ user_id` (dono não pode ajudar-se)
3. **Status válido**: `status = 'pendente'`
4. **Sem helper**: `helper_id IS NULL` (não pode sobrescrever)

#### Transformações
```sql
-- ANTES da RPC
status: 'pendente'
helper_id: NULL

-- DEPOIS da RPC  
status: 'em_progresso'
helper_id: p_helper_id
```

#### Uso no Backend
```javascript
// voluntariado.service.js
const { error } = await supabase.rpc('oferecer_ajuda', {
  p_pedido_id: pedidoId,
  p_helper_id: helperId
});
```

#### Error Codes
| Code | Condição | Mensagem |
|------|----------|----------|
| `P0002` | Pedido não encontrado | "Pedido não encontrado." |
| `42501` | Self-help | "Não podes oferecer ajuda ao teu próprio pedido." |
| `42501` | Status inválido | "Pedido não está pendente." |
| `42501` | Já tem helper | "Pedido já tem um helper atribuído." |

---

### 4.2 RPC: `obter_contacto_parceiro`

#### Assinatura
```sql
obter_contacto_parceiro(p_pedido_id UUID, p_caller_id UUID) 
RETURNS TABLE(nome TEXT, email TEXT, telefone TEXT, role TEXT)
```

#### Função
Retorna dados de contacto do "parceiro" num pedido:
- **Dono vê** → dados do helper
- **Helper vê** → dados do dono

#### Validações
1. **Pedido existe**: `p_pedido_id` deve existir
2. **Tem helper**: `helper_id IS NOT NULL`
3. **Autorizado**: `p_caller_id` deve ser dono OU helper

#### Lógica de Parceiro
```sql
IF p_caller_id = dono_id THEN
  parceiro := helper_id  -- Dono vê helper
  role := 'helper'
ELSIF p_caller_id = helper_id THEN  
  parceiro := dono_id    -- Helper vê dono
  role := 'dono'
ELSE
  RAISE EXCEPTION 'Não autorizado'
END IF;
```

#### Response Format
```json
{
  "nome": "João Silva",
  "email": "joao@email.com", 
  "telefone": "+351912345678",  // ou null
  "role": "helper"              // ou "dono"
}
```

#### Uso no Backend
```javascript
// voluntariado.service.js
const { data, error } = await supabase.rpc('obter_contacto_parceiro', {
  p_pedido_id: pedidoId,
  p_caller_id: callerId
});
```

#### Error Codes
| Code | Condição | Mensagem |
|------|----------|----------|
| `P0002` | Pedido não encontrado | "Pedido não encontrado." |
| `P0003` | Sem helper | "Pedido ainda não tem helper atribuído." |
| `42501` | Não autorizado | "Não autorizado a visualizar contactos." |

---

## 5. Row Level Security (RLS)

### Conceito
RLS filtra dados **a nível de linha** baseado no contexto do user autenticado (`auth.uid()`).

### 5.1 Policies: `pedidos_ajuda`

#### SELECT (Leitura)
```sql
"Autenticados podem ver pedidos" 
  FOR SELECT TO authenticated USING (true)
```
**Função**: Qualquer user autenticado vê **todos** os pedidos (dashboard público).

#### INSERT (Criação)
```sql
"Autenticados podem criar pedidos" 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)
```
**Função**: User só pode criar pedidos em **seu próprio nome** (`user_id = auth.uid()`).

#### UPDATE (Edição)
```sql
"Donos podem editar/apagar" 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
```
**Função**: Apenas o **criador** pode editar o pedido.

#### DELETE (Eliminação)
```sql
"Donos podem apagar" 
  FOR DELETE TO authenticated USING (auth.uid() = user_id)
```
**Função**: Apenas o **criador** pode eliminar o pedido.

### 5.2 Policies: Lookup Tables

#### distritos & idiomas
```sql
"Permitir leitura de distritos/idiomas" 
  FOR SELECT USING (true)
```
**Função**: Dados de referência são **públicos** (qualquer user autenticado acede).

---

## 6. Lookup Tables

### Conceito
Tabelas com **dados estáticos** para dropdowns/formulários. Reduzem inconsistência vs strings hardcoded.

### Vantagens
1. **Normalização**: Evita repetição de strings
2. **Integridade**: Foreign keys garantem dados válidos
3. **Localização**: Fácil tradução (futuro)
4. **Manutenção**: Adicionar/remover opções centralmente

### Como Funciona
```javascript
// Frontend: Carregar opções
const distritos = await pedidoService.obterDistritos();
// [{ id: 1, nome: "Aveiro" }, { id: 2, nome: "Beja" }, ...]

// Frontend: Usar em formulário
<select formControlName="distrito_id">
  <option *ngFor="let d of distritos" [value]="d.id">
    {{ d.nome }}
  </option>
</select>

// Backend: JOIN para exibir nomes
SELECT p.*, d.nome as distrito_nome, i.nome as idioma_nome
FROM pedidos_ajuda p
JOIN distritos d ON p.distrito_id = d.id  
JOIN idiomas i ON p.idioma_id = i.id;
```

---

## 7. Índices de Performance

### Propósito
Aceleram queries frequentes criando estruturas de dados otimizadas.

### Índices Simples
```sql
idx_pedidos_ajuda_user_id     -- Para "Meus Pedidos"
idx_pedidos_ajuda_helper_id   -- Para "Minhas Contribuições"  
idx_pedidos_ajuda_status      -- Para filtros por status
idx_pedidos_ajuda_created_at  -- Para ordenação cronológica
```

### Índices Compostos
```sql
idx_pedidos_ajuda_status_created  -- Filtro + ordem
idx_pedidos_ajuda_user_status     -- User + filtro
```

### Impact
| Query | Sem Índice | Com Índice | Melhoria |
|-------|------------|------------|----------|
| "Meus pedidos pendentes" | O(n) | O(log n) | 100x+ |
| "Últimos 10 pedidos" | O(n log n) | O(log n) | 50x+ |
| "JOIN com distritos" | O(n²) | O(n) | 10x+ |

---

## 8. Scripts Arquivados

### Pasta `archive/`
Scripts experimentais, fixes pontuais e documentação de debugging:

| Arquivo | Estado | Função |
|---------|--------|--------|
| `fix_obter_contacto_parceiro.sql` | ✅ Aplicado | Fix da RPC contacto |
| `FIX_FINAL_RPC.md` | 📖 Docs | Processo de debugging |
| `backup_rpc_original.sql` | 🗂️ Backup | Versão original da RPC |
| `SEGURANCA_SQL_PASSOS.md` | 📖 Docs | Processo RLS |

### Pasta `scripts/` (Histórico)
Scripts de desenvolvimento (podem ter inconsistências):

| Arquivo | Estado | Função |
|---------|--------|--------|
| `initial-build-script.sql` | ⚠️ Obsoleto | Primeira versão schema |
| `pedidos-de-ajuda-registo-rls.sql` | ⚠️ Obsoleto | RLS antigo |
| `add-helper-assignment.sql` | ⚠️ Obsoleto | Adicionar helper_id |
| `perfil-user-rpcs-contacto-pedido.sql` | ⚠️ Obsoleto | Profiles (não usado) |

---

## 9. Processo de Deploy

### 9.1 Setup Inicial (Primeira vez)

#### Pré-requisitos
1. Projeto Supabase criado
2. Environment variables configuradas:
   ```bash
   SUPABASE_URL=https://[project].supabase.co
   SUPABASE_KEY=[service-role-key]  # Não anon key!
   ```

#### Execução
```sql
-- 1. Schema base (tabelas, ENUMs, dados)
\i production/01-schema.sql

-- 2. RPC functions (business logic)  
\i production/02-rpc-functions.sql

-- 3. Índices (performance)
\i production/03-indexes.sql

-- 4. Verificação
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Deve retornar: pedidos_ajuda, distritos, idiomas

SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Deve retornar: oferecer_ajuda, obter_contacto_parceiro
```

### 9.2 Updates (Migrações)

#### Para Schema Changes
```sql
-- Exemplo: Adicionar nova coluna
ALTER TABLE pedidos_ajuda ADD COLUMN prioridade INT DEFAULT 1;

-- Criar script: migration_YYYY_MM_DD.sql
-- Documentar no CHANGELOG.md
```

#### Para RPC Changes
```sql
-- Sempre usar CREATE OR REPLACE
CREATE OR REPLACE FUNCTION oferecer_ajuda(...)
RETURNS VOID AS $$
-- nova implementação
$$;
```

---

## 10. Troubleshooting

### 10.1 Erros Comuns

#### "relation 'pedidos' does not exist"
**Causa**: RPC usa nome de tabela incorreto.
**Fix**: Verificar que todas as RPCs usam `pedidos_ajuda` (não `pedidos`).

#### "column 'email' is ambiguous"
**Causa**: JOIN sem qualificação de tabelas.
**Fix**: Usar aliases (`u.email` não `email`).

#### "structure does not match"
**Causa**: Tipos de retorno não correspondem exatamente.
**Fix**: Usar cast explícito (`::TEXT`).

#### "permission denied for table"
**Causa**: RLS está ativo mas não há policy adequada.
**Fix**: Verificar/adicionar policies ou usar `SECURITY DEFINER`.

### 10.2 Debugging Queries

#### Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pedidos_ajuda';
```

#### Test RPC Functions
```sql
-- Test com dados reais
SELECT oferecer_ajuda(
  'ee330fff-ff1a-4ae2-9e18-b649f88fb9c7'::UUID,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID
);

SELECT * FROM obter_contacto_parceiro(
  'ee330fff-ff1a-4ae2-9e18-b649f88fb9c7'::UUID,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID  
);
```

#### Performance Analysis
```sql
EXPLAIN ANALYZE 
SELECT p.*, d.nome, i.nome 
FROM pedidos_ajuda p
JOIN distritos d ON p.distrito_id = d.id
JOIN idiomas i ON p.idioma_id = i.id
WHERE p.status = 'pendente'
ORDER BY p.created_at DESC;
```

### 10.3 Logs Úteis

#### Backend Error Mapping
```javascript
// voluntariado.service.js - Error handling
if (error.code === 'P0002') {
  throw new Error('Pedido não encontrado.');
} else if (error.code === '42501') {
  throw new Error('Não tens permissão para esta operação.');
}
```

#### Frontend Network Debug
```javascript
// Chrome DevTools → Network → Response
{
  "code": "P0002",
  "details": null,
  "hint": null,
  "message": "Pedido não encontrado."
}
```

---

## 📚 Recursos Relacionados

### Documentação IntegraBridge
- [02-CRUD-PEDIDOS.md](../wiki/02-CRUD-PEDIDOS.md) - Como frontend usa estas tabelas
- [03-SISTEMA-VOLUNTARIADO.md](../wiki/03-SISTEMA-VOLUNTARIADO.md) - RPC functions em detalhe
- [07-BACKEND-INFRASTRUCTURE.md](../wiki/07-BACKEND-INFRASTRUCTURE.md) - Configuração Supabase

### Documentação Externa
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RPC](https://supabase.com/docs/guides/database/functions)

---

**Última atualização**: Abril 2026  
**Autor**: Gabriela Gon (documentação de produção IntegraBridge)