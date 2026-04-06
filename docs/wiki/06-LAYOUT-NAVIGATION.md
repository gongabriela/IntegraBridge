# 📐 Layout e Navegação - IntegraBridge

> **Objetivo**: Documentar a estrutura de layout da aplicação (MainLayout, Navbar, Sidebar, Footer) e sistema de rotas Angular.

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [MainLayout - Layout Principal](#2-mainlayout---layout-principal)
3. [Navbar - Barra de Navegação Superior](#3-navbar---barra-de-navegação-superior)
4. [Sidebar - Menu Lateral](#4-sidebar---menu-lateral)
5. [Footer - Rodapé](#5-footer---rodapé)
6. [Sistema de Rotas (app.routes.ts)](#6-sistema-de-rotas-approutests)
7. [Páginas Adicionais](#7-páginas-adicionais)
8. [Fluxo de Navegação](#8-fluxo-de-navegação)
9. [Responsive Design](#9-responsive-design)

---

## 1. Visão Geral

### Arquitetura de Layout

A aplicação usa **pattern de Layout Wrapper** onde todas as páginas autenticadas partilham a mesma estrutura:

```
┌─────────────────────────────────────┐
│         NAVBAR (topo)               │
├──────┬──────────────────────────────┤
│      │                              │
│  S   │    ROUTER OUTLET             │
│  I   │    (conteúdo dinâmico)       │
│  D   │                              │
│  E   │                              │
│  B   │                              │
│  A   │                              │
│  R   │                              │
│      │                              │
├──────┴──────────────────────────────┤
│         FOOTER (rodapé)             │
└─────────────────────────────────────┘
```

### Componentes de Layout

| Componente | Responsabilidade | Posição |
|------------|------------------|---------|
| **MainLayout** | Container principal, orquestra subcomponentes | Wrapper |
| **Navbar** | Barra superior, título da página, botão hamburger | Topo |
| **Sidebar** | Menu de navegação, perfil, tema | Lateral esquerda |
| **Footer** | Copyright, informações da aplicação | Rodapé |

### Separação de Responsabilidades

- **MainLayout**: Composição (junta componentes) + gestão de dados de utilizador
- **Navbar**: Apresentação (dumb component) + emissão de eventos
- **Sidebar**: Apresentação + lógica de tema (delega ao service)
- **Footer**: Apresentação pura (sem lógica)

---

## 2. MainLayout - Layout Principal

### Localização
`frontend/src/app/layouts/main-layout/main-layout.ts`

### Responsabilidades

1. **Composição de Componentes**: Junta Navbar, Sidebar, Footer e RouterOutlet
2. **Gestão de Utilizador**: Carrega dados do user autenticado via AuthService
3. **Estado da Sidebar**: Controla abertura/fecho (mobile)
4. **Logout**: Processa ação de logout e redireciona para /login

### Estrutura do Componente

```typescript
export class MainLayout implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Estado da Sidebar
  isSidebarOpen = false;

  // Dados do Utilizador
  nome: string = 'Carregando...';
  email: string = '';
  inicial: string = '';
}
```

### Ciclo de Vida

```
ngOnInit()
    ↓
carregarDadosUtilizador()
    ↓
authService.obterUtilizadorAtual()
    ↓
Extrai nome de user_metadata
    ↓
Calcula inicial para avatar
    ↓
ChangeDetectorRef.detectChanges()
```

### Método: carregarDadosUtilizador()

```typescript
private async carregarDadosUtilizador(): Promise<void> {
  const user = await this.authService.obterUtilizadorAtual();
  if (user) {
    this.nome = user.user_metadata?.['nome'] || 'Utilizador';
    this.email = user.email || '';
    this.inicial = this.nome.charAt(0).toUpperCase();
    this.cdr.detectChanges();
  }
}
```

**Explicação**:
- `user_metadata.nome`: Guardado no registo (AuthService.registar)
- **Fallback**: Se nome não existir, usa 'Utilizador'
- **Inicial**: Primeira letra em uppercase para avatar circular
- **ChangeDetectorRef**: Força re-render porque método é async

### Método: toggleSidebar()

```typescript
toggleSidebar(): void {
  this.isSidebarOpen = !this.isSidebarOpen;
}
```

**Uso**: Chamado pelo evento `(toggleSidebar)` emitido pela Navbar quando user clica no botão hamburger.

### Método: realizarLogout()

```typescript
async realizarLogout(): Promise<void> {
  await this.authService.logout();
  this.router.navigate(['/login']);
}
```

**Fluxo**:
1. Chama `AuthService.logout()` (limpa localStorage, Supabase session)
2. Redireciona para /login
3. AuthGuard impede acesso a rotas protegidas

### Template HTML

```html
<div class="layout-container">
  <!-- Navbar no topo -->
  <app-navbar 
    [title]="'IntegraBridge'" 
    (toggleSidebar)="toggleSidebar()">
  </app-navbar>

  <!-- Sidebar lateral -->
  <app-sidebar 
    [isOpen]="isSidebarOpen"
    [nomeUtilizador]="nome"
    [emailUtilizador]="email"
    [inicialAvatar]="inicial"
    (close)="isSidebarOpen = false"
    (logoutAction)="realizarLogout()">
  </app-sidebar>

  <!-- Conteúdo dinâmico (rotas filhas) -->
  <main class="main-content">
    <router-outlet></router-outlet>
  </main>

  <!-- Footer no rodapé -->
  <app-footer></app-footer>
</div>
```

**Property Binding** (`[]`): Passa dados do pai para filho
**Event Binding** (`()`): Escuta eventos emitidos pelo filho

---

## 3. Navbar - Barra de Navegação Superior

### Localização
`frontend/src/app/components/navbar/navbar.ts`

### Características

- **Dumb Component**: Apenas apresentação, sem lógica de negócio
- **Input Properties**: Recebe título e descrição do pai
- **Output Events**: Emite evento `toggleSidebar` ao clicar no hamburger

### Estrutura do Componente

```typescript
export class NavbarComponent {
  @Input() title = 'IntegraBridge';
  @Input() description = '';
  @Output() toggleSidebar = new EventEmitter<void>();
}
```

### Propriedades

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `title` | `string` | Título da página atual |
| `description` | `string` | Descrição opcional (subtítulo) |
| `toggleSidebar` | `EventEmitter` | Evento emitido ao clicar no hamburger |

### Template HTML (Simplificado)

```html
<nav class="navbar">
  <!-- Botão Hamburger (Mobile) -->
  <button class="hamburger-btn" (click)="toggleSidebar.emit()">
    <i class="fas fa-bars"></i>
  </button>

  <!-- Título e Descrição -->
  <div class="navbar-content">
    <h1>{{ title }}</h1>
    <p *ngIf="description">{{ description }}</p>
  </div>
</nav>
```

### CSS: Responsive Behavior

```css
.hamburger-btn {
  display: none; /* Escondido em desktop */
}

@media (max-width: 768px) {
  .hamburger-btn {
    display: block; /* Visível em mobile */
  }
}
```

---

## 4. Sidebar - Menu Lateral

### Localização
`frontend/src/app/components/sidebar/sidebar.ts`

### Responsabilidades

1. **Navegação**: Links para páginas da aplicação (Dashboard, Meus Pedidos, etc.)
2. **Perfil de Utilizador**: Mostra nome, email e avatar
3. **Toggle de Tema**: Botão para alternar light/dark mode
4. **Logout**: Botão para sair da aplicação

### Estrutura do Componente

```typescript
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() nomeUtilizador: string = 'Carregando...';
  @Input() emailUtilizador: string = '';
  @Input() inicialAvatar: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() logoutAction = new EventEmitter<void>();

  private themeService = inject(ThemeService);
  currentTheme$ = this.themeService.currentTheme$;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
```

### Propriedades de Input

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `isOpen` | `boolean` | Controla visibilidade (mobile) |
| `nomeUtilizador` | `string` | Nome completo do user |
| `emailUtilizador` | `string` | Email do user |
| `inicialAvatar` | `string` | Primeira letra do nome (avatar) |

### Propriedades de Output

| Evento | Quando Emite | Handler no Pai |
|--------|--------------|----------------|
| `close` | Ao clicar fora ou no X | `isSidebarOpen = false` |
| `logoutAction` | Ao clicar em Sair | `realizarLogout()` |

### Integração com ThemeService

```typescript
private themeService = inject(ThemeService);
currentTheme$ = this.themeService.currentTheme$;
```

**Observable Subscription**: Template usa `AsyncPipe` para subscrever `currentTheme$`

```html
<button (click)="toggleTheme()">
  <i *ngIf="(currentTheme$ | async) === 'light'" class="fas fa-moon"></i>
  <i *ngIf="(currentTheme$ | async) === 'dark'" class="fas fa-sun"></i>
</button>
```

### Menu de Navegação

```html
<nav class="sidebar-menu">
  <a routerLink="/dashboard" routerLinkActive="active">
    <i class="fas fa-th-large"></i> Dashboard
  </a>
  <a routerLink="/meus-pedidos" routerLinkActive="active">
    <i class="fas fa-list"></i> Meus Pedidos
  </a>
  <a routerLink="/minhas-contribuicoes" routerLinkActive="active">
    <i class="fas fa-hand-holding-heart"></i> Minhas Contribuições
  </a>
  <a routerLink="/criar-pedido" routerLinkActive="active">
    <i class="fas fa-plus-circle"></i> Criar Pedido
  </a>
</nav>
```

**RouterLinkActive**: Aplica classe `.active` ao link da página atual

### Perfil de Utilizador

```html
<div class="user-profile">
  <!-- Avatar Circular -->
  <div class="avatar">{{ inicialAvatar }}</div>
  
  <!-- Nome e Email -->
  <div class="user-info">
    <p class="user-name">{{ nomeUtilizador }}</p>
    <p class="user-email">{{ emailUtilizador }}</p>
  </div>
</div>
```

### Botão de Logout

```html
<button class="logout-btn" (click)="logoutAction.emit()">
  <i class="fas fa-sign-out-alt"></i> Sair
</button>
```

**Event Emission**: Emite evento que MainLayout processa

---

## 5. Footer - Rodapé

### Localização
`frontend/src/app/components/footer/footer.ts`

### Estrutura do Componente

```typescript
export class FooterComponent {
  anoAtual = new Date().getFullYear();
}
```

### Template HTML

```html
<footer class="app-footer">
  <p>&copy; {{ anoAtual }} IntegraBridge - Conectando Refugiados e Imigrantes</p>
</footer>
```

### Característica

- **Copyright Dinâmico**: Atualiza automaticamente o ano
- **Stateless**: Sem lógica, apenas apresentação
- **Global**: Sempre visível em todas as páginas autenticadas

---

## 6. Sistema de Rotas (app.routes.ts)

### Localização
`frontend/src/app/app.routes.ts`

### Configuração de Rotas

```typescript
export const routes: Routes = [
  // ============================================
  // 🔓 ROTAS PÚBLICAS (sem autenticação)
  // ============================================
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // ============================================
  // 🔒 ROTAS PROTEGIDAS (com authGuard)
  // ============================================
  {
    path: '', 
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'meus-pedidos', component: MeusPedidosComponent },
      { path: 'minhas-contribuicoes', component: MinhasContribuicoesComponent },
      { path: 'criar-pedido', component: CriarPedido },
      { path: 'pedido/:id', component: DetalhePedidoComponent },
      { path: 'pedido/:id/editar', component: EditarPedidoComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
```

### Explicação da Estrutura

#### Rotas Públicas

```typescript
{ path: '', redirectTo: 'login', pathMatch: 'full' }
```
- **Rota Raiz**: `/` redireciona para `/login`
- **pathMatch: 'full'**: Só redireciona se URL for exatamente `/`

```typescript
{ path: 'login', component: LoginComponent }
```
- **Sem authGuard**: Acessível sem autenticação
- **Sem MainLayout**: Página fullscreen, sem navbar/sidebar/footer

#### Rotas Protegidas (Parent-Child)

```typescript
{
  path: '', 
  component: MainLayout,
  canActivate: [authGuard],
  children: [...]
}
```

**Parent Route (MainLayout)**:
- `canActivate: [authGuard]`: Protege **todas** as rotas filhas
- `component: MainLayout`: Renderiza o layout wrapper

**Child Routes**:
- Renderizadas dentro do `<router-outlet>` do MainLayout
- **Herdam proteção do authGuard** (não precisam repetir)

### Rotas Filhas Detalhadas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/dashboard` | `Dashboard` | Todos os pedidos |
| `/meus-pedidos` | `MeusPedidosComponent` | Pedidos criados pelo user |
| `/minhas-contribuicoes` | `MinhasContribuicoesComponent` | Pedidos onde user ofereceu ajuda |
| `/criar-pedido` | `CriarPedido` | Formulário de criação |
| `/pedido/:id` | `DetalhePedidoComponent` | Detalhe de pedido específico |
| `/pedido/:id/editar` | `EditarPedidoComponent` | Edição de pedido |

### Route Parameters

```typescript
{ path: 'pedido/:id', component: DetalhePedidoComponent }
```

**Extração do ID no Componente**:
```typescript
ngOnInit(): void {
  const pedidoId = this.route.snapshot.paramMap.get('id') || '';
  // Usa pedidoId para carregar dados
}
```

### Fluxo de Navegação com AuthGuard

```
User acessa /dashboard
    ↓
AuthGuard verifica token no localStorage
    ↓
┌─────────────┬─────────────┐
│ Token válido│ Sem token   │
│     ↓       │     ↓       │
│ Permite     │ Redireciona │
│ acesso      │ para /login │
└─────────────┴─────────────┘
```

---

## 7. Páginas Adicionais

### 7.1 Editar Pedido (EditarPedidoComponent)

#### Localização
`frontend/src/app/pages/editar-pedido/editar-pedido.ts`

#### Funcionalidade

Permite editar pedidos existentes criados pelo utilizador autenticado.

#### Fluxo de Funcionamento

```
ngOnInit()
    ↓
Extrai ID da rota (route.snapshot.paramMap)
    ↓
carregarDados()
    ↓
forkJoin (paralelo):
  - obterPorId(pedidoId)
  - obterDistritos()
  - obterIdiomas()
    ↓
Preenche formulário com patchValue()
    ↓
User edita e submete
    ↓
onSubmit()
    ↓
atualizarPedido(pedidoId, payload)
    ↓
Mostra AlertModal (sucesso/erro)
    ↓
Se sucesso: redireciona para /pedido/:id
```

#### Método: carregarDados()

```typescript
private carregarDados(): void {
  forkJoin({
    pedido: this.pedidoService.obterPorId(this.pedidoId),
    distritos: this.pedidoService.obterDistritos(),
    idiomas: this.pedidoService.obterIdiomas()
  }).pipe(
    finalize(() => {
      this.carregando = false;
      this.cdr.detectChanges();
    })
  ).subscribe({
    next: (dados) => {
      this.distritos = dados.distritos;
      this.idiomas = dados.idiomas;
      const p = dados.pedido; 
      
      this.statusOriginal = p.status; // Guarda para manter no update

      this.pedidoForm.patchValue({
        titulo: p.titulo,
        descricao: p.descricao,
        urgencia: p.urgencia,
        distrito_id: p.distrito_id || 0,
        idioma_id: p.idioma_id || 0
      });
    },
    error: (err) => {
      console.error('Erro ao carregar dados:', err);
      this.erro = 'Não foi possível carregar o pedido para edição.';
    }
  });
}
```

**Por que forkJoin?**
- Executa 3 Observables **em paralelo**
- Espera todos completarem
- Retorna objeto com `{ pedido, distritos, idiomas }`

**Por que guardar statusOriginal?**
- Status não é editável pelo user (gerido pela state machine)
- Mas precisamos enviar no payload do update
- `statusOriginal` garante que não mudamos o status

#### Método: onSubmit()

```typescript
onSubmit(): void {
  if (this.pedidoForm.invalid) {
    this.pedidoForm.markAllAsTouched();
    return;
  }
  this.salvando = true;
  const raw = this.pedidoForm.getRawValue();
  const payload = {
    titulo: raw.titulo,
    descricao: raw.descricao,
    status: this.statusOriginal,  // ← Mantém status original
    urgencia: raw.urgencia as PedidoUrgencia,
    distrito_id: raw.distrito_id || 0,
    idioma_id: raw.idioma_id || 0
  };
  this.pedidoService.atualizarPedido(this.pedidoId, payload)
    .pipe(finalize(() => this.salvando = false))
    .subscribe({
      next: () => {
        this.alertConfig = {
          titulo: 'Alterações Guardadas',
          mensagem: 'O pedido foi atualizado com sucesso.',
          tipo: 'sucesso',
          redirecionar: true
        };
        this.mostrarAlert = true;
      },
      error: (err) => {
        this.alertConfig = {
          titulo: 'Erro ao guardar',
          mensagem: 'Não foi possível atualizar o pedido.',
          tipo: 'erro',
          redirecionar: false
        };
        this.mostrarAlert = true;
      }
    });
}
```

**Pattern de Loading States**:
```typescript
this.salvando = true;  // Antes do request
.pipe(finalize(() => this.salvando = false))  // Sempre executa
```
- Desativa botão enquanto salva (previne duplo-submit)
- `finalize()` garante execução mesmo em erro

#### Validações

```typescript
pedidoForm = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(5)]],
  descricao: ['', [Validators.required, Validators.minLength(10)]],
  urgencia: [this.opcoesUrgencia[1], [Validators.required]],
  distrito_id: [0, [Validators.required]],
  idioma_id: [0, [Validators.required]]
});
```

**Mesmas validações de CriarPedido** para consistência.

---

### 7.2 Meus Pedidos (MeusPedidosComponent)

#### Localização
`frontend/src/app/pages/meus-pedidos/meus-pedidos.ts`

#### Funcionalidade

Mostra pedidos criados pelo utilizador autenticado. Integra filtros reutilizáveis.

#### Diferença vs Dashboard

| Aspecto | Dashboard | Meus Pedidos |
|---------|-----------|--------------|
| **Dados** | Todos os pedidos (global) | Apenas pedidos do user |
| **Endpoint** | `PedidoService.obterPedidos()` | `VoluntariadoService.obterMeusPedidos()` |
| **Estatísticas** | Sim (total, pendentes, urgentes) | Não |
| **Filtros** | Sim | Sim (mesmo componente) |

#### Estrutura de Dados

```typescript
meusPedidos: IPedido[] = [];           // Dados brutos
pedidosOriginais: IPedido[] = [];      // Backup para filtros
pedidosFiltrados: IPedido[] = [];      // Exibidos no template
```

**Pattern de 3 Arrays**:
1. `meusPedidos`: Response do backend (histórico)
2. `pedidosOriginais`: Cópia para resetar filtros
3. `pedidosFiltrados`: Resultado após aplicar filtros

#### Método: carregarMeusPedidos()

```typescript
private carregarMeusPedidos(): void {
  this.voluntariadoService.obterMeusPedidos()
    .pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges(); 
      })
    )
    .subscribe({
      next: (dados) => {
        this.meusPedidos = dados;
        this.pedidosOriginais = dados;        // Backup
        this.pedidosFiltrados = dados;        // Inicialmente todos visíveis
      },
      error: (erro) => {
        console.error('Erro ao carregar meus pedidos:', erro);
        this.erro = 'Não foi possível carregar os teus pedidos.';
      }
    });
}
```

**Por que VoluntariadoService?**
- Endpoint específico: `GET /api/voluntariado/meus-pedidos`
- Backend filtra por `user_id` (extraído do JWT)
- **Mais seguro** que filtrar client-side

#### Método: aplicarFiltros()

```typescript
aplicarFiltros(filtros: IFiltrosPedidos): void {
  this.pedidosFiltrados = this.pedidosOriginais.filter(pedido => {
    // Filtro por distrito
    if (filtros.distrito_id !== null && pedido.distrito_id !== filtros.distrito_id) {
      return false;
    }

    // Filtro por idioma
    if (filtros.idioma_id !== null && pedido.idioma_id !== filtros.idioma_id) {
      return false;
    }

    // Filtro por urgência
    if (filtros.urgencia !== null && pedido.urgencia !== filtros.urgencia) {
      return false;
    }

    // Filtro por status
    if (filtros.status !== null && pedido.status !== filtros.status) {
      return false;
    }

    return true; // Passou por todos os filtros
  });
}
```

**Lógica AND (Acumulativa)**:
- Pedido deve passar **todos** os filtros ativos
- `null` = "não filtrar" (ignora esse critério)
- Early return (`return false`) para performance

#### Template HTML

```html
<div class="meus-pedidos-container">
  <h1>Meus Pedidos</h1>

  <!-- Componente de Filtros -->
  <app-pedidos-filter 
    (filtrosAlterados)="aplicarFiltros($event)">
  </app-pedidos-filter>

  <!-- Lista de Pedidos -->
  <div class="pedidos-grid" *ngIf="!carregando && !erro">
    <app-card-pedido 
      *ngFor="let pedido of pedidosFiltrados" 
      [pedido]="pedido">
    </app-card-pedido>
  </div>

  <!-- Estado de Carregamento -->
  <div *ngIf="carregando" class="loading">
    Carregando pedidos...
  </div>

  <!-- Mensagem de Erro -->
  <div *ngIf="erro" class="error-message">
    {{ erro }}
  </div>
</div>
```

---

## 8. Fluxo de Navegação

### 8.1 Fluxo Completo: Login → Dashboard → Detalhe

```
1. User acede à aplicação (/)
    ↓
2. Redireciona para /login (rota raiz)
    ↓
3. LoginComponent renderizado (sem layout)
    ↓
4. User preenche credenciais e submete
    ↓
5. AuthService.login() → Supabase Auth
    ↓
6. Token JWT guardado no localStorage
    ↓
7. Redireciona para /dashboard
    ↓
8. AuthGuard verifica token
    ↓
9. MainLayout renderizado (navbar + sidebar + footer)
    ↓
10. Dashboard renderizado no <router-outlet>
    ↓
11. User clica em card de pedido
    ↓
12. Router navega para /pedido/:id
    ↓
13. DetalhePedidoComponent carrega no <router-outlet>
    ↓
14. MainLayout permanece (apenas conteúdo muda)
```

### 8.2 Fluxo de Logout

```
User clica em "Sair" na Sidebar
    ↓
SidebarComponent emite evento logoutAction
    ↓
MainLayout recebe evento
    ↓
Chama realizarLogout()
    ↓
AuthService.logout()
  - Limpa localStorage
  - Supabase.auth.signOut()
    ↓
Router navega para /login
    ↓
Token removido, authGuard bloqueia acesso
```

---

## 9. Responsive Design

### Breakpoints

```css
/* Mobile First */
.sidebar {
  position: fixed;
  left: -280px; /* Escondida por padrão */
  transition: left 0.3s ease;
}

.sidebar.open {
  left: 0; /* Visível quando open */
}

/* Desktop */
@media (min-width: 769px) {
  .sidebar {
    position: relative;
    left: 0; /* Sempre visível */
  }
  
  .hamburger-btn {
    display: none; /* Esconde botão hamburger */
  }
}
```

### Comportamento Mobile

1. **Sidebar**: Overlay sobre conteúdo (position: fixed)
2. **Navbar**: Mostra botão hamburger
3. **Conteúdo**: Full-width (sem margem para sidebar)

### Comportamento Desktop

1. **Sidebar**: Coluna lateral permanente
2. **Navbar**: Sem botão hamburger
3. **Conteúdo**: Com margem à esquerda (espaço para sidebar)

---

