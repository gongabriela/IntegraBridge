# 🌍 IntegraBridge

[![CI](https://github.com/gongabriela/GestorDeTarefas/actions/workflows/ci.yml/badge.svg)](https://github.com/gongabriela/GestorDeTarefas/actions/workflows/ci.yml)

**IntegraBridge** é uma plataforma web que conecta **imigrantes e refugiados** com **voluntários locais** para ajuda em processos burocráticos essenciais. A aplicação facilita a criação, gestão e conclusão de pedidos de ajuda, promovendo a integração social através de um sistema de matchmaking voluntário baseado em localização, idiomas e competências específicas.

---

## 🎯 ODS - Objetivo de Desenvolvimento Sustentável

O **IntegraBridge** contribui diretamente para o **ODS 10 - Reduzir as Desigualdades** ao:
- 🤝 **Facilitar a integração social** de imigrantes e refugiados
- 📋 **Democratizar o acesso** a processos burocráticos complexos
- 🌐 **Criar pontes** entre comunidades locais e recém-chegados
- 💪 **Empoderar indivíduos** através de matchmaking de competências específicas

---

## 📱 Preview da Aplicação

<video src="docs/assets/gif_readme.mp4" width="100%">
  Seu navegador não suporta vídeos.
</video>

**🌐 URL de Produção:** 
- **Frontend:** https://integra-bridge.vercel.app/
- **Backend API:** https://integrabridge-api.onrender.com

---

## 💻 Stack Tecnológica

| **Camada** | **Tecnologia** | **Versão** | **Propósito** |
|------------|---------------|------------|--------------|
| **Frontend** | Angular | 17+ | SPA Framework |
| | TypeScript | ^5.0 | Type Safety |
| | CSS Variables | - | Design System |
| | RxJS | ^7.0 | Reactive Programming |
| **Backend** | Node.js | ^20.0 | Runtime |
| | Express.js | ^4.18 | Web Framework |
| | Supabase Client | ^2.0 | BaaS SDK |
| **Database** | PostgreSQL | 15 | Relational DB |
| | Row Level Security | - | Authorization |
| | Supabase | - | Backend-as-a-Service |
| **Deploy** | Vercel | - | Frontend Hosting |
| | Render | - | Backend Hosting |
| **DevOps** | GitHub Actions | - | CI/CD Pipeline |

---

## 🚀 Como Executar Localmente

### **Pré-requisitos**
```bash
node >= 20.0.0
npm >= 10.0.0
```

### **1. Clone o repositório**
```bash
git clone https://github.com/gongabriela/IntegraBridge.git
cd IntegraBridge
```

### **2. Setup do Backend**
```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Inicie o servidor
npm start
# 🚀 Backend rodando em http://localhost:3000
```

### **3. Setup do Frontend** 
```bash
cd frontend
npm install

# Inicie o cliente
ng serve
# 🎨 Frontend rodando em http://localhost:4200
```

### **4. Acesse a aplicação**
- **Frontend:** http://localhost:4200
- **API:** http://localhost:3000/api

---

## 🔐 Variáveis de Ambiente

### **Backend (.env)**
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_public_key

# Server Configuration  
PORT=3000
NODE_ENV=development
```

### **Frontend (environment.ts)**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: 'your_supabase_project_url',
  supabaseKey: 'your_supabase_anon_public_key'
};
```

> **⚠️ Importante:** Nunca commite valores reais de produção. Use `.env.example` como template.

---

## ✨ Funcionalidades Implementadas

### **🔐 Sistema de Autenticação**
- ✅ Login/Registo com Supabase Auth
- ✅ JWT Tokens (1h + refresh 30 dias)
- ✅ AuthGuard protegendo rotas sensíveis
- ✅ Persistência de sessão

### **📋 CRUD de Pedidos**
- ✅ **Create:** Formulários reativos com validação
- ✅ **Read:** Dashboard com listagem + detalhes
- ✅ **Update:** Edição (apenas pelo criador)
- ✅ **Delete:** Remoção com confirmação

### **🤝 Sistema de Voluntariado**
- ✅ **Matchmaking:** Oferecer ajuda em pedidos
- ✅ **Estado de progresso:** pendente → em_progresso → concluído
- ✅ **Contactos:** RPC function para obter dados do parceiro
- ✅ **Dashboard pessoal:** "Meus Pedidos" e "Minhas Contribuições"

### **🎨 UI/UX Features**
- ✅ **Design responsivo** para mobile/desktop
- ✅ **Light/Dark Mode** com persistência
- ✅ **Filtros avançados** (distrito, idioma, status)
- ✅ **Modais de feedback** para ações do utilizador
- ✅ **Loading states** e error handling

### **🔍 Sistema de Filtros**
- ✅ **Filtro por distrito** (Lisboa, Porto, etc.)
- ✅ **Filtro por idioma** (Português, Inglês, Árabe, etc.)
- ✅ **Filtro por status** (Pendente, Em Progresso, Concluído)
- ✅ **Combinação múltipla** de filtros

---

## 🏗️ Decisão de Design: Arquitetura Backend em Camadas

### **Escolha Técnica: Layered Architecture com Services**

**🤔 O Problema:**
Inicialmente, o projeto seguia um padrão MVC simples onde controllers faziam chamadas diretas ao Supabase. Isso criava:
- **Acoplamento forte** entre controllers e database
- **Dificuldade de testes** (controllers dependiam de BD real)
- **Violação do SRP** (controllers com múltiplas responsabilidades)

**🎯 A Solução:**
Refatoração para **Layered Architecture** com camada Service:

```javascript
// ❌ ANTES: Controller faz tudo
async listarTodos(req, res) {
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select(`*, distritos(nome), idiomas(nome)`)
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// ✅ DEPOIS: Responsabilidades separadas  
// Controller (pedidoController.js)
async listarTodos(req, res) {
  try {
    const pedidos = await pedidoService.listarTodos(req.headers.authorization);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

// Service (pedidoService.js)  
exports.listarTodos = async (authHeader) => {
  const supabase = getAuthClient(authHeader);
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .select(`*, distritos(nome), idiomas(nome)`)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(error.message);
  return data;
};
```

**🎉 Benefícios Alcançados:**
- **Single Responsibility:** Controllers focam em HTTP, Services em lógica de negócio
- **Testability:** Services podem ser testados isoladamente
- **Reusability:** Lógica de negócio pode ser reutilizada entre rotas
- **Maintainability:** Mudanças na BD apenas afetam Services
- **Security:** Padrão de "Defesa em Profundidade" com validações redundantes

**💡 Princípio SOLID aplicado:** SRP (Single Responsibility Principle) - cada camada tem uma única razão para mudar.

---

## 📚 Documentação Adicional

- 📖 **[Wiki Técnica](./docs/wiki/)** - Documentação detalhada de arquitetura e componentes
- 🗄️ **[Supabase Setup](./docs/supabase/)** - Scripts e configuração da base de dados  
- 📋 **[API Documentation](./docs/archive/entrega-TP1/)** - Endpoints e exemplos de uso
- 🚀 **[Deploy Guides](./docs/wiki/07-BACKEND-INFRASTRUCTURE.md)** - Configuração de produção

---

## 👩‍💻 Autora

**Gabriela Gonçalves de Oliveira**

> Desenvolvido como projeto final do módulo de Laboratórios Práticos do **Programa UPskill ServiceNow 25/26**.
