# IntegraBridge

Bem-vindo ao repositório do **IntegraBridge**, uma plataforma desenvolvida para conectar Recém-Chegados a Portugal com Buddies (voluntários locais) dispostos a ajudar.

Este projeto é composto por uma API RESTful (Backend) e uma Interface de Utilizador (Frontend), construídos com foco em usabilidade e segurança.

## Disclaimer

Este repositório é um projeto que se encontra em andamento.

---

## Arquitetura e Tecnologias Utilizadas

O projeto está organizado em diferentes pastas para separar as responsabilidades do código, facilitando a leitura e a manutenção:

```text
/backend
 ├── /config             # Ficheiro de conexão à base de dados (Supabase)
 ├── /controllers        # Lógica do sistema e comunicação com a base de dados
 ├── /middleware         # Interceção de pedidos (ex: verificação do Token JWT)
 ├── /routes             # Mapeamento dos URLs (endpoints) para os controladores
 └── index.js            # Ficheiro principal que inicia o servidor Express

/frontend/src/app/pages
 ├── /login                   # Página de autenticação e entrada no sistema
 ├── /dashboard               # Painel principal onde os pedidos de ajuda são listados
 ├── /criar-pedido            # Interceção de pedidos (ex: verificação do Token JWT)
 └── /pedido-detalhe          # Mapeamento dos URLs (endpoints) para os controladores
```

**Tecnologias Base:** 
* **Backend**: Node.js, Express.js, Supabase (PostgreSQL).
* **Frontend**: Angular, Typescript, CSS.
* **CI/CD**: GitHub Actions, Render, Vercel.

---

## Frontend

### Arquitetura de Componentes e Rotas

O sistema utiliza o Angular Router para a navegação entre as 4 páginas (componentes) principais que compõem o Produto Mínimo Viável (MVP):

* **`/login`:** Página de autenticação e entrada no sistema.
* **`/dashboard`:** Painel principal onde os pedidos de ajuda são listados.
* **`/criar-pedido`:** Formulário para inserção de novos pedidos de ajuda.
* **`/pedido/:id`:** Vista detalhada de um pedido específico para leitura, edição ou eliminação.

### Estilos Globais (Design System)

A aplicação utiliza um sistema de design limpo chamado **"Safe Haven"**.

* Em vez de frameworks externos (como Bootstrap ou Tailwind), o projeto utiliza **CSS Puro (Vanilla CSS)**.
* As cores, tipografias (Inter e Outfit) e espaçamentos estão centralizados num ficheiro de variáveis globais (`styles.css`), garantindo consistência em todos os componentes e permitindo a adaptação nativa a **Light/Dark Mode**.

### Acesso em Produção (Vercel)

O Frontend está alojado na Vercel com um pipeline de CI/CD (Entrega Contínua). Sempre que uma alteração é fundida (merged) na branch `main` do GitHub, a Vercel compila o Angular e atualiza o site automaticamente, sem necessidade de intervenção manual.

**URL Público da Plataforma:** `https://integra-bridge.vercel.app/`

---

## Backend

### Modelo Relacional da Base de Dados

A base de dados PostgreSQL foi estruturada utilizando chaves estrangeiras para relacionar tabelas e ENUMs para limitar as opções de alguns campos.

* **Tabelas Principais:** `auth.users` (gerida pelo Supabase) e `pedidos_ajuda`.
* **Tabelas de Domínio:** `distritos` e `idiomas`.
* **Segurança (RLS):** Foram criadas políticas (Row Level Security) diretamente no PostgreSQL para que apenas o utilizador criador de um pedido o possa editar ou apagar.

```text
[ Tabela: auth.users ]
PK | id (UUID)

           | (1)
           | (N)
           v
[ Tabela: pedidos_ajuda ]
PK | id (UUID)
FK | user_id (UUID)      -> Liga a auth.users(id)
FK | distrito_id (INT)   -> Liga a distritos(id)
FK | idioma_id (INT)     -> Liga a idiomas(id)
   | titulo (VARCHAR 100)
   | descricao (TEXT)
   | status (ENUM: pendente, em_progresso, concluido)
   | urgencia (ENUM: baixa, media, alta)
   | created_at (TIMESTAMP)
```

---

### Acesso em Produção

A API está alojada no Render.
**URL Base:** `https://integrabridge-api.onrender.com`

---

### Documentação da API (Endpoints)

Todas as rotas (exceto `/` e `/api/login`) são protegidas. É necessário enviar o Token JWT no cabeçalho do pedido HTTP:
`Authorization: Bearer <SEU_TOKEN_JWT>`

#### 1. Autenticação
* **Rota:** `POST /api/login`
* **Descrição:** Rota temporária para autenticar um utilizador e obter o Token JWT para testes.

#### 2. Ler Pedidos (GET)
* **Listar todos os pedidos:** `GET /api/pedidos`
  * Retorna uma lista de pedidos ordenados do mais recente para o mais antigo, incluindo os nomes das tabelas relacionadas (idiomas e distritos).
* **Detalhe de um pedido específico:** `GET /api/pedidos/:id`
  * Devolve apenas o objeto JSON correspondente ao `id` solicitado.

#### 3. Criar Pedido (POST)
* **Rota:** `POST /api/pedidos`
* **Corpo do Pedido (JSON):**
  ```json
  {
    "titulo": "Preciso de ajuda com Finanças",
    "descricao": "Não percebo como preencher o IRS em Portugal.",
    "idioma_id": 1,
    "urgencia": "alta",
    "distrito_id": 13
  }
  ```
  *(O `user_id` é registado automaticamente pelo backend através do token).*

#### 4. Atualizar Pedido (PUT)
* **Rota:** `PUT /api/pedidos/:id`
* **Segurança:** Apenas o dono do pedido o pode editar.
* **Corpo do Pedido (JSON):** Deve conter os dados a atualizar, incluindo a chave `status`.

#### 5. Apagar Pedido (DELETE)
* **Rota:** `DELETE /api/pedidos/:id`
* **Segurança:** Apenas o dono do pedido o pode apagar. Retorna erro de acesso negado caso contrário.
