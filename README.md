# IntegraBridge

Bem-vindo ao repositório Backend do **IntegraBridge**, uma plataforma desenvolvida para conectar Recém-Chegados a Portugal com Buddies (voluntários locais) dispostos a ajudar.

Este projeto foca-se na construção de uma **API RESTful** completa com operações CRUD, autenticação segura e integração com uma base de dados relacional na nuvem.

## Disclaimer

Este repositório é um projeto que encontra-se em andamento!

---

## 🚀 Arquitetura e Tecnologias Utilizadas

A infraestrutura foi desenhada seguindo as melhores práticas de Engenharia de Software, separando as responsabilidades entre Servidor, Segurança e Base de Dados.

* **Servidor (Node.js & Express.js):** Gestão de rotas da API e ciclo de Request-Response HTTP.
* **Base de Dados Relacional (Supabase / PostgreSQL):** Armazenamento de utilizadores e pedidos de ajuda.
* **Segurança de Rotas (Middlewares & JWT):** Implementação de um middleware customizado (`auth.js`) que interceta pedidos HTTP e valida Tokens JWT (formato Bearer) gerados pelo Supabase Auth.
* **Segurança de Dados (RLS - Row Level Security):** Políticas configuradas diretamente no PostgreSQL para garantir a autorização a nível de linha (ex: impedir que um utilizador apague o pedido de outro).
* **Deploy e CI/CD (Render & GitHub Actions):** O projeto está configurado com Continuous Deployment nativo. Qualquer *merge* na branch `main` despoleta um *build* automático no **Render.com**, onde o servidor está alojado publicamente.

---

## 🗄️ Modelo Relacional da Base de Dados

A base de dados PostgreSQL utiliza uma relação de **1:N (Um para Muitos)**, onde um utilizador autenticado pode ser dono de vários pedidos de ajuda.

```text
[ Tabela: auth.users ] (Gerida pelo Supabase)
PK | id (UUID)
   | email (VARCHAR)

             | (1)
             | Relacionamento (Garantido por Foreign Key e RLS)
             | (N)
             v

[ Tabela: pedidos_ajuda ]
PK | id (UUID)
FK | user_id (UUID)  --> Liga ao auth.users
   | titulo, descricao, idioma, urgencia, distrito, status
```

---

## 🌐 Acesso em Produção (Render)

A API está a correr em tempo real na nuvem através do Render.
**URL Base de Produção:** `https://integrabridge-api.onrender.com/`

---

## ⚙️ Como correr o projeto localmente

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/gongabriela/IntegraBridge.git
   cd IntegraBridge/backend
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um ficheiro `.env` na raiz da pasta `backend` com as credenciais do seu projeto Supabase:
   ```env
   PORT=3000
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_KEY=<sua-chave-anon-publica>
   ```

4. **Iniciar o Servidor Local:**
   ```bash
   node index.js
   # O servidor iniciará em http://localhost:3000
   ```

---

## 🔌 Documentação da API (Endpoints)

Todas as rotas (exceto a de teste na raiz `/`) são **Protegidas**. É estritamente obrigatório enviar o Token JWT no cabeçalho do pedido HTTP:
`Authorization: Bearer <SEU_TOKEN_JWT>`

### 1. Ler Pedidos (GET)
* **Listar todos os pedidos:** `GET /api/pedidos`
  * Retorna uma lista de pedidos ordenados do mais recente para o mais antigo.
* **Detalhe de um pedido específico:** `GET /api/pedidos/:id`
  * Utiliza parâmetros de rota para devolver apenas o objeto JSON correspondente ao `UUID` solicitado.

### 2. Criar Pedido (POST)
* **Rota:** `POST /api/pedidos`
* **Corpo do Pedido (JSON):**
  ```json
  {
    "titulo": "Preciso de ajuda com Finanças",
    "descricao": "Não percebo como preencher o IRS em Portugal.",
    "idioma": "Português",
    "urgencia": "Alta",
    "distrito": "Porto"
  }
  ```
  *(O `user_id` é injetado automaticamente pelo backend através do token decodificado).*

### 3. Atualizar Pedido (PUT)
* **Rota:** `PUT /api/pedidos/:id`
* **Segurança:** Apenas o dono do pedido (validado via RLS e middleware) o pode editar.
* **Corpo do Pedido (JSON):** Deve conter os dados a atualizar (incluindo a possibilidade de alterar o `status` para 'resolvido').

### 4. Apagar Pedido (DELETE)
* **Rota:** `DELETE /api/pedidos/:id`
* **Segurança:** Dupla validação (JWT no Node.js + RLS no PostgreSQL). Retorna um erro `403 Forbidden` se o utilizador tentar apagar um pedido de outro utilizador.

---
*Desenvolvido no âmbito do módulo de laboratórios práticos do programa UPskill ServiceNow.*
