# 📚 IntegraBridge - Wiki de Documentação

> **Documentação técnica completa** do projeto IntegraBridge - Plataforma de ajuda burocrática a imigrantes e refugiados.

Esta pasta contém documentação detalhada sobre as funcionalidades do IntegraBridge.

---

## 📖 Estrutura da Documentação

### **Código Fonte (Inline Docstrings):**
- **Formato:** Comentários JSDoc/TSDoc dentro dos arquivos `.ts`, `.js`
- **Conteúdo:** Descrição concisa (1-3 linhas), `@param`, `@returns`
- **Público:** Desenvolvedores que leem o código, IDEs (IntelliSense)
- **Exemplo:**
  ```typescript
  /**
   * Autentica utilizador existente.
   * @param dados Credenciais de login (email, password)
   * @returns AuthResponse com user e session
   */
  async login(dados: Login): Promise<AuthResponse> { ... }
  ```

### **Wiki (Esta Pasta):**
- **Formato:** Markdown (`.md`) separado do código
- **Conteúdo:** Explicações detalhadas, fluxos, conceitos, exemplos práticos
- **Público:** Onboarding, apresentações, estudo profundo
- **Exemplo:** `01-AUTENTICACAO.md` com 400+ linhas sobre sistema de autenticação

---

## 🗂️ Documentos Disponíveis

| Documento | Funcionalidade | Status |
|-----------|----------------|--------|
| `01-AUTENTICACAO.md` | Sistema de Login/Registo + AuthGuard
| `02-CRUD-PEDIDOS.md` | Criar, Listar, Editar, Deletar Pedidos
| `03-SISTEMA-VOLUNTARIADO.md` | Sistema de Matching + Workflow de Estados
| `04-UI-FEATURES.md` | Theme Toggle, Filtros, AlertModal
| `05-ARCHITECTURE.md` | Visão geral do sistema (Frontend + Backend)
| `06-LAYOUT-NAVIGATION.md` | MainLayout, Navbar, Sidebar, Footer, Rotas
| `07-BACKEND-INFRASTRUCTURE.md` | Servidor Express, Supabase Config, Lookup System

---

## 🎯 Como Usar Esta Wiki

### **Para Estudo:**
1. Leia o documento da funcionalidade a estudar
2. Siga os fluxos passo-a-passo
3. Teste os exemplos no código real

### **Para Desenvolvimento:**
1. Consulta rápida: Leia as docstrings inline (hover no VS Code)
2. Dúvida conceitual: Venha à Wiki para explicação detalhada
3. Debug: Use os fluxos completos para entender comportamento

### **Para Onboarding:**
1. Comece pelo `ARCHITECTURE.md` (visão geral)
2. Estude cada funcionalidade pela ordem da User Story
3. Clone o repo e siga os exemplos práticos
4. Use como **material de estudo** para entender decisões técnicas

---

## 📐 Padrão de Documentação

Cada documento de funcionalidade segue esta estrutura:

```markdown
# XX - NOME_FUNCIONALIDADE

## 📋 Índice
## 🎯 Visão Geral
## 🏗️ Arquitetura
## 🧩 Componentes [Frontend/Backend]
## 💡 Conceitos Importantes
## 🔄 Fluxo Completo
## 🛡️ Segurança (se aplicável)
## 📚 Referências
```

---

**Última atualização:** Abril 2026  
**Autora:** Gabriela Gon + GitHub Copilot CLI
