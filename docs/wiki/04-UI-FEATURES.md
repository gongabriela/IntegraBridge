# 📚 SESSÃO 4: UI FEATURES

> **Objetivo desta sessão:** Compreender os componentes de UI reutilizáveis, sistema de temas (light/dark mode), filtros e padrões de design responsivo.

---

## 🎯 VISÃO GERAL

O **Sistema de UI** do IntegraBridge é construído com componentes **standalone**, **reutilizáveis** e **escaláveis**. Principais features:

1. **Theme Toggle** → Sistema light/dark mode com persistência
2. **Filtros de Pedidos** → Componente configurável para filtrar pedidos
3. **Alert Modal** → Modal reutilizável para feedback ao user
4. **Card Pedido** → Componente de visualização compacta
5. **Sidebar/Navbar** → Navegação e layout responsivo
6. **CSS Variables** → Design system consistente

---

## 🗂️ ARQUITETURA DE COMPONENTES

```
frontend/src/app/
├── components/
│   ├── sidebar/           → Navegação lateral com theme toggle
│   ├── navbar/            → Cabeçalho top
│   ├── card-pedido/       → Card compacto de pedido
│   ├── pedidos-filter/    → Filtros configuráveis
│   ├── alert-modal/       → Modal de alerta/sucesso
│   └── footer/            → Rodapé
├── services/
│   └── theme.service.ts   → Gestão de temas (light/dark/auto)
├── models/
│   └── filter.model.ts    → Interfaces de filtros
└── styles.css             → CSS Variables + Theme System
```

### **📐 Smart vs Dumb Components Pattern**

O IntegraBridge segue a divisão **Smart vs Dumb** para melhor organização e testabilidade:

**🧠 Smart Components (Componentes Inteligentes):**
- **Localização:** `pages/` (ex: `dashboard.ts`, `criar-pedido.ts`)
- **Características:**
  - Têm acesso aos **Services** (`PedidoService`, `AuthService`, `LookupService`)
  - **Gerem estado** da aplicação
  - **Tomam decisões** (quando chamar APIs, quando redirecionar)
  - Orquestram operações complexas

```typescript
// Exemplo: dashboard.ts (Smart Component)
export class DashboardComponent {
  pedidos: IPedido[] = [];

  constructor(
    private pedidoService: PedidoService,  // ← Acesso direto a services
    private router: Router                  // ← Controla navegação
  ) {}

  ngOnInit() {
    this.carregarPedidos(); // ← Decide quando carregar dados
  }

  private carregarPedidos(): void {
    this.pedidoService.obterPedidos().subscribe(pedidos => {
      this.pedidos = pedidos; // ← Gere estado local
    });
  }

  onPedidoSelecionado(pedido: IPedido): void {
    this.router.navigate(['/pedidos', pedido.id]); // ← Toma decisões de navegação
  }
}
```

**🎭 Dumb Components (Componentes de Apresentação):**
- **Localização:** `components/` (ex: `card-pedido.ts`, `alert-modal.ts`)
- **Características:**
  - **NÃO sabem** que APIs existem
  - Apenas recebem dados via **`@Input()`**
  - Emitem eventos via **`@Output()`**
  - **Puros** e facilmente testáveis

```typescript
// Exemplo: card-pedido.ts (Dumb Component)
export class CardPedidoComponent {
  @Input() pedido!: IPedido;              // ← Recebe dados
  @Input() showActions: boolean = true;   // ← Configurável
  
  @Output() verDetalhes = new EventEmitter<IPedido>(); // ← Emite eventos
  @Output() editarPedido = new EventEmitter<IPedido>();

  onVerDetalhes(): void {
    this.verDetalhes.emit(this.pedido); // ← Apenas propaga, não decide
  }

  onEditarPedido(): void {
    this.editarPedido.emit(this.pedido); // ← Não sabe o que acontece depois
  }
}
```

**🎯 Vantagens do Padrão:**
- **Testability:** Dumb components são fáceis de testar (input → output)
- **Reusability:** Card-pedido pode ser usado em Dashboard, MeusPedidos, etc.
- **Maintainability:** Lógica centralizada nos Smart components
- **Performance:** Dumb components podem usar OnPush change detection

---

## 🎨 FEATURE 1: SISTEMA DE TEMAS (LIGHT/DARK MODE)

### **Arquitetura do Sistema:**

```
ThemeService (State Management)
        ↓
   localStorage (Persistência)
        ↓
   CSS Classes (body.light-theme / body.dark-theme)
        ↓
   CSS Variables (--bg-main, --text-primary, etc.)
        ↓
   Todos os Componentes (herdam variáveis)
```

---

### **1.1 ThemeService**

**Localização:** `frontend/src/app/services/theme.service.ts`

#### **Responsabilidades:**
- ✅ Gerir estado do tema (light/dark/auto)
- ✅ Persistir preferência no localStorage
- ✅ Aplicar tema via classes CSS no `<body>`
- ✅ Fornecer Observable para reactive updates

#### **Estrutura:**

```typescript
export type Theme = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'integra-bridge-theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('auto');
  currentTheme$ = this.currentThemeSubject.asObservable();

  // 1. Alternar entre light/dark
  toggleTheme(): void

  // 2. Definir tema específico
  setTheme(theme: Theme): void

  // 3. Obter tema atual
  getTheme(): Theme

  // 4. Inicializar tema (constructor)
  private initTheme(): void

  // 5. Aplicar tema ao DOM
  private applyTheme(theme: Theme): void

  // 6. Persistência
  private saveTheme(theme: Theme): void
  private loadTheme(): Theme
}
```

---

#### **1. toggleTheme() - Alternar Tema**

```typescript
toggleTheme(): void {
  const currentTheme = this.currentThemeSubject.value;
  // Tratar 'auto' como 'light' para o toggle
  const effectiveTheme = currentTheme === 'auto' ? 'light' : currentTheme;
  const newTheme: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
  this.setTheme(newTheme);
}
```

**Lógica:**
```
auto → light (toggle trata como light)
light → dark
dark → light
```

**Por que tratar 'auto' como 'light'?**
- UX: User clica toggle e espera mudança imediata
- 'auto' depende de `@media prefers-color-scheme` (fora de controle)
- Ao clicar, forçamos tema manual (light ou dark)

---

#### **2. setTheme() - Definir Tema**

```typescript
setTheme(theme: Theme): void {
  this.currentThemeSubject.next(theme);  // 1. Atualiza Observable
  this.applyTheme(theme);                // 2. Aplica no DOM
  this.saveTheme(theme);                 // 3. Persiste no localStorage
}
```

**Pipeline:**
```
setTheme('dark')
    ↓
BehaviorSubject.next('dark')  → Componentes ouvindo currentTheme$ recebem update
    ↓
applyTheme('dark')  → body.classList.add('dark-theme')
    ↓
saveTheme('dark')  → localStorage.setItem('integra-bridge-theme', 'dark')
```

---

#### **3. applyTheme() - Manipulação do DOM**

```typescript
private applyTheme(theme: Theme): void {
  const body = document.body;
  
  body.classList.remove('light-theme', 'dark-theme');  // Limpa classes antigas
  
  if (theme === 'light') {
    body.classList.add('light-theme');  // Força light
  } else if (theme === 'dark') {
    body.classList.add('dark-theme');   // Força dark
  }
  // Se theme === 'auto', não adiciona classe (usa @media)
}
```

**Resultado no DOM:**
```html
<!-- Auto (system preference) -->
<body>...</body>

<!-- Light forçado -->
<body class="light-theme">...</body>

<!-- Dark forçado -->
<body class="dark-theme">...</body>
```

---

#### **4. Persistência (localStorage)**

```typescript
private saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(this.STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
}

private loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
  }
  
  return 'auto';  // Fallback para auto (system preference)
}
```

**Por que try-catch?**
- localStorage pode estar desabilitado (modo privado)
- Pode estar cheio (quota exceeded)
- Graceful degradation: app funciona mesmo sem persistência

---

#### **5. Inicialização (Constructor)**

```typescript
constructor() {
  this.initTheme();
}

private initTheme(): void {
  const savedTheme = this.loadTheme();           // 1. Carrega de localStorage
  this.currentThemeSubject.next(savedTheme);     // 2. Atualiza BehaviorSubject
  this.applyTheme(savedTheme);                   // 3. Aplica ao DOM imediatamente
}
```

**Fluxo de inicialização:**
```
App inicia
    ↓
ThemeService constructor é chamado
    ↓
loadTheme() → Retorna 'dark' (do localStorage)
    ↓
applyTheme('dark') → body.classList.add('dark-theme')
    ↓
User vê app em dark mode IMEDIATAMENTE (sem flash de light mode)
```

---

### **1.2 CSS Variables System**

**Localização:** `frontend/src/styles.css`

#### **Design System:**

```css
:root {
  /* Fonts */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Status Colors (compartilhados entre temas) */
  --status-pending: #f59e0b;
  --status-in-progress: #0ea5e9;
  --status-completed: #10b981;
  --status-urgent: #ef4444;

  /* LIGHT MODE (default) */
  --bg-main: #f8fafc;
  --bg-surface: #ffffff;
  --border-subtle: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --action-primary: #2563eb;
}
```

---

#### **Três Layers de Theme:**

**Layer 1: :root (Light Mode - Default)**
```css
:root {
  --bg-main: #f8fafc;      /* Fundo principal (cinza claro) */
  --bg-surface: #ffffff;   /* Cards/modals (branco) */
  --text-primary: #0f172a; /* Texto principal (preto azulado) */
}
```

**Layer 2: @media prefers-color-scheme: dark (Auto - System Preference)**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-main: #0f172a;      /* Fundo principal (preto azulado) */
    --bg-surface: #1e293b;   /* Cards/modals (cinza escuro) */
    --text-primary: #f8fafc; /* Texto principal (branco) */
  }
}
```

**Layer 3: body.light-theme / body.dark-theme (Manual Override)**
```css
/* Sobrescreve tudo quando user escolhe manualmente */
body.dark-theme {
  --bg-main: #0f172a;
  --bg-surface: #1e293b;
  --text-primary: #f8fafc;
}
```

**Ordem de Prioridade (CSS Cascade):**
```
body.dark-theme (Manual)  →  Mais alta prioridade
    ↓
@media (prefers-color-scheme) (Auto)  →  Média prioridade
    ↓
:root (Default Light)  →  Menor prioridade
```

---

#### **Uso em Componentes:**

```css
/* dashboard.css */
.dashboard-container {
  background-color: var(--bg-main);      /* Adapta automaticamente ao tema */
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.btn-primary {
  background-color: var(--action-primary);
  color: var(--action-text);
}
```

**Vantagens:**
- ✅ **DRY**: Não duplicar CSS para light/dark
- ✅ **Escalável**: Adicionar novo tema = apenas mudar variáveis
- ✅ **Manutenível**: Mudança de cor = um único lugar
- ✅ **Consistente**: Todos os componentes usam mesmas cores

---

### **1.3 SidebarComponent com Theme Toggle**

**Localização:** `frontend/src/app/components/sidebar/sidebar.ts`

```typescript
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  private themeService = inject(ThemeService);
  currentTheme$ = this.themeService.currentTheme$;  // Observable para template

  toggleTheme(): void {
    this.themeService.toggleTheme();  // Delega ao service
  }
}
```

**Template (sidebar.html):**
```html
<aside class="sidebar" [class.open]="isOpen">
  <!-- Botão de Toggle Theme -->
  <button class="theme-toggle-btn" (click)="toggleTheme()">
    @if ((currentTheme$ | async) === 'dark') {
      🌙 Dark Mode
    } @else {
      ☀️ Light Mode
    }
  </button>
</aside>
```

**Características:**
- ✅ **Reactive**: Usa AsyncPipe para subscrever currentTheme$
- ✅ **Single Responsibility**: Component apenas renderiza, service gere estado
- ✅ **Emoji dinâmico**: 🌙 para dark, ☀️ para light

---

## 🔍 FEATURE 2: PEDIDOS FILTER (Componente Configurável)

### **Arquitetura:**

```
PedidosFilter Component
        ↓
  @Input() config (controla quais filtros mostrar)
  @Output() filtrosAlterados (emite filtros selecionados)
        ↓
PedidoService (obter distritos/idiomas)
        ↓
Parent Component (Dashboard) → Recebe filtros e aplica
```

---

### **2.1 PedidosFilter Component**

**Localização:** `frontend/src/app/components/pedidos-filter/pedidos-filter.ts`

#### **Estrutura:**

```typescript
@Component({
  selector: 'app-pedidos-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-filter.html',
  styleUrl: './pedidos-filter.css',
})
export class PedidosFilter implements OnInit {
  // Configuração: quais filtros mostrar
  @Input() config: IFiltroConfig = {
    mostrarDistrito: true,
    mostrarIdioma: true,
    mostrarUrgencia: true,
    mostrarStatus: true
  };

  // Evento emitido quando filtros mudam
  @Output() filtrosAlterados = new EventEmitter<IFiltrosPedidos>();

  // Dados para dropdowns
  distritos: IDistrito[] = [];
  idiomas: IIdioma[] = [];
  listaStatus = LISTA_STATUS;      // ['pendente', 'em_progresso', 'concluido']
  listaUrgencia = LISTA_URGENCIA;  // ['baixa', 'media', 'alta']

  // Estado dos filtros selecionados
  filtrosSelecionados: IFiltrosPedidos = {
    distrito_id: null,
    idioma_id: null,
    urgencia: null,
    status: null
  };
}
```

---

#### **Interfaces (filter.model.ts):**

```typescript
export interface IFiltrosPedidos {
  distrito_id: number | null;     // null = não filtrar
  idioma_id: number | null;
  urgencia: PedidoUrgencia | null;  // 'baixa' | 'media' | 'alta'
  status: PedidoStatus | null;      // 'pendente' | 'em_progresso' | 'concluido'
}

export interface IFiltroConfig {
  mostrarDistrito: boolean;   // Mostrar filtro de distrito?
  mostrarIdioma: boolean;     // Mostrar filtro de idioma?
  mostrarUrgencia: boolean;   // Mostrar filtro de urgência?
  mostrarStatus: boolean;     // Mostrar filtro de status?
}
```

**Por que IFiltroConfig?**
- ✅ **Reutilizável**: Componente configurável para diferentes contextos
- ✅ **Exemplo**: "Meus Pedidos" pode não precisar filtro de status (todos são do user)

---

#### **Carregamento de Dropdowns:**

```typescript
ngOnInit(): void {
  this.carregarDistritos();
  this.carregarIdiomas();
}

private carregarDistritos(): void {
  this.pedidoService.obterDistritos().subscribe({
    next: (dados) => { 
      this.distritos = dados; 
      this.cdr.detectChanges();  // Força re-render
    },
    error: (erro) => {
      console.error('Erro ao carregar distritos:', erro);
    }
  });
}

private carregarIdiomas(): void {
  this.pedidoService.obterIdiomas().subscribe({
    next: (dados) => { 
      this.idiomas = dados; 
      this.cdr.detectChanges();
    },
    error: (erro) => {
      console.error('Erro ao carregar idiomas:', erro);
    }
  });
}
```

**Por que ChangeDetectorRef?**
- Dropdowns carregados assincronamente
- `cdr.detectChanges()` força Angular a re-renderizar template
- Garante que `<select>` mostra opções imediatamente

---

#### **Aplicar e Limpar Filtros:**

```typescript
/**
 * Aplica os filtros selecionados.
 * Emite um evento para o componente pai.
 */
aplicarFiltros(): void {
  this.filtrosAlterados.emit(this.filtrosSelecionados);
}

/**
 * Limpa todos os filtros.
 * Reseta para valores null e emite evento.
 */
limparFiltros(): void {
  this.filtrosSelecionados = {
    distrito_id: null,
    idioma_id: null,
    urgencia: null,
    status: null
  };
  this.filtrosAlterados.emit(this.filtrosSelecionados);
}
```

**Padrão @Output:**
- Component não filtra dados (Single Responsibility)
- Apenas **emite evento** com filtros selecionados
- Parent component (Dashboard) **aplica filtros** aos dados

---

#### **Template (pedidos-filter.html):**

```html
<div class="filtros-container">
  <h3>Filtrar Pedidos</h3>
  
  <!-- Filtro Distrito (apenas se config.mostrarDistrito) -->
  @if (config.mostrarDistrito) {
    <div class="filtro-item">
      <label for="distrito">Distrito</label>
      <select id="distrito" [(ngModel)]="filtrosSelecionados.distrito_id">
        <option [value]="null">Todos</option>
        @for (distrito of distritos; track distrito.id) {
          <option [value]="distrito.id">{{ distrito.nome }}</option>
        }
      </select>
    </div>
  }

  <!-- Filtro Idioma -->
  @if (config.mostrarIdioma) {
    <div class="filtro-item">
      <label for="idioma">Idioma</label>
      <select id="idioma" [(ngModel)]="filtrosSelecionados.idioma_id">
        <option [value]="null">Todos</option>
        @for (idioma of idiomas; track idioma.id) {
          <option [value]="idioma.id">{{ idioma.nome }}</option>
        }
      </select>
    </div>
  }

  <!-- Filtro Urgência -->
  @if (config.mostrarUrgencia) {
    <div class="filtro-item">
      <label for="urgencia">Urgência</label>
      <select id="urgencia" [(ngModel)]="filtrosSelecionados.urgencia">
        <option [value]="null">Todas</option>
        @for (urgencia of listaUrgencia; track urgencia) {
          <option [value]="urgencia">{{ urgencia }}</option>
        }
      </select>
    </div>
  }

  <!-- Filtro Status -->
  @if (config.mostrarStatus) {
    <div class="filtro-item">
      <label for="status">Status</label>
      <select id="status" [(ngModel)]="filtrosSelecionados.status">
        <option [value]="null">Todos</option>
        @for (status of listaStatus; track status) {
          <option [value]="status">{{ status }}</option>
        }
      </select>
    </div>
  }

  <!-- Botões -->
  <div class="filtro-actions">
    <button class="btn-aplicar" (click)="aplicarFiltros()">Aplicar</button>
    <button class="btn-limpar" (click)="limparFiltros()">Limpar</button>
  </div>
</div>
```

**Características:**
- ✅ **Two-way binding**: `[(ngModel)]` sincroniza select com `filtrosSelecionados`
- ✅ **Conditional rendering**: `@if (config.mostrar...)` controla visibilidade
- ✅ **Track by**: `track distrito.id` otimiza rendering

---

### **2.2 Uso no Dashboard:**

```typescript
// dashboard.ts
export class Dashboard {
  pedidosFiltrados: IPedido[] = [];

  aplicarFiltros(filtros: IFiltrosPedidos): void {
    this.pedidosFiltrados = this.pedidosOriginais.filter(pedido => {
      // Lógica AND: todos os filtros ativos devem passar
      if (filtros.distrito_id !== null && pedido.distrito_id !== filtros.distrito_id) {
        return false;
      }
      if (filtros.idioma_id !== null && pedido.idioma_id !== filtros.idioma_id) {
        return false;
      }
      if (filtros.urgencia !== null && pedido.urgencia !== filtros.urgencia) {
        return false;
      }
      if (filtros.status !== null && pedido.status !== filtros.status) {
        return false;
      }
      return true;
    });
  }
}
```

**Template (dashboard.html):**
```html
<app-pedidos-filter (filtrosAlterados)="aplicarFiltros($event)"></app-pedidos-filter>

<!-- Exibe pedidos filtrados -->
@for (pedido of pedidosFiltrados; track pedido.id) {
  <app-card-pedido [dados]="pedido"></app-card-pedido>
}
```

**Fluxo completo:**
```
User seleciona "Porto" no dropdown
    ↓
[(ngModel)] atualiza filtrosSelecionados.distrito_id = 2
    ↓
User clica "Aplicar"
    ↓
aplicarFiltros() emite filtrosAlterados.emit({distrito_id: 2, ...})
    ↓
Dashboard recebe evento (filtrosAlterados)="aplicarFiltros($event)"
    ↓
Dashboard.aplicarFiltros() filtra array
    ↓
pedidosFiltrados atualizado
    ↓
Template re-renderiza com pedidos filtrados
```

---

## 🚨 FEATURE 3: ALERT MODAL (Componente Reutilizável)

### **3.1 AlertModalComponent**

**Localização:** `frontend/src/app/components/alert-modal/alert-modal.ts`

#### **Estrutura:**

```typescript
@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css'
})
export class AlertModalComponent {
  @Input() titulo = '';
  @Input() mensagem = '';
  @Input() tipo: 'sucesso' | 'erro' = 'sucesso';
  
  @Output() fechar = new EventEmitter<void>();
}
```

**Características:**
- ✅ **Minimalista**: Apenas inputs e output, sem lógica
- ✅ **Presentation Component**: Apenas renderiza, não gere estado
- ✅ **Reutilizável**: Usado em criar-pedido, detalhe-pedido, etc.

---

#### **Template (alert-modal.html):**

```html
<div class="modal-backdrop" (click)="fechar.emit()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Ícone baseado no tipo -->
    <div class="modal-icon" [class.sucesso]="tipo === 'sucesso'" [class.erro]="tipo === 'erro'">
      @if (tipo === 'sucesso') {
        ✓
      } @else {
        ✕
      }
    </div>

    <h3>{{ titulo }}</h3>
    <p>{{ mensagem }}</p>

    <button class="btn-fechar" (click)="fechar.emit()">OK</button>
  </div>
</div>
```

**Padrões:**
- ✅ **Backdrop click**: Clicar fora fecha modal
- ✅ **stopPropagation**: Clicar dentro NÃO fecha (previne event bubbling)
- ✅ **Dynamic classes**: `[class.sucesso]` adiciona classe condicionalmente

---

#### **CSS (alert-modal.css):**

```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-overlay);  /* Usa variável CSS */
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-surface);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 28rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-icon.sucesso {
  background-color: var(--status-completed);
  color: white;
}

.modal-icon.erro {
  background-color: var(--status-error);
  color: white;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Características:**
- ✅ **CSS Variables**: Cores adaptam ao tema automaticamente
- ✅ **Animation**: Smooth slide-in de 0.3s
- ✅ **Backdrop filter**: Blur moderno (suportado em browsers recentes)
- ✅ **z-index: 1000**: Garante que fica sobre tudo

---

### **3.2 Uso em Componentes:**

```typescript
// criar-pedido.ts
export class CriarPedido {
  mostrarAlert = false;
  alertConfig = { 
    titulo: '', 
    mensagem: '', 
    tipo: 'sucesso' as 'sucesso' | 'erro' 
  };

  criarPedido(): void {
    this.pedidoService.criarPedido(dto).subscribe({
      next: () => {
        this.alertConfig = {
          titulo: 'Sucesso!',
          mensagem: 'Pedido criado com sucesso.',
          tipo: 'sucesso'
        };
        this.mostrarAlert = true;
      },
      error: () => {
        this.alertConfig = {
          titulo: 'Erro',
          mensagem: 'Não foi possível criar o pedido.',
          tipo: 'erro'
        };
        this.mostrarAlert = true;
      }
    });
  }

  fecharAlert(): void {
    this.mostrarAlert = false;
    // Opcional: navegação após fechar
    this.router.navigate(['/dashboard']);
  }
}
```

**Template:**
```html
@if (mostrarAlert) {
  <app-alert-modal
    [titulo]="alertConfig.titulo"
    [mensagem]="alertConfig.mensagem"
    [tipo]="alertConfig.tipo"
    (fechar)="fecharAlert()"
  />
}
```

**Vantagens:**
- ✅ **Configurável**: Título, mensagem e tipo dinâmicos
- ✅ **Callback**: `(fechar)` permite lógica customizada
- ✅ **Consistente**: Mesmo visual em todos os componentes

---

## 🎴 FEATURE 4: CARD PEDIDO (Componente de Visualização)

### **4.1 CardPedidoComponent**

**Localização:** `frontend/src/app/components/card-pedido/card-pedido.ts`

```typescript
@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './card-pedido.html',
  styleUrl: './card-pedido.css'
})
export class CardPedidoComponent {
  @Input({ required: true }) dados!: IPedido;

  get statusFormatado(): string {
    if (!this.dados?.status) return '';
    if (this.dados.status === 'em_progresso') return 'Em Progresso';
    return this.dados.status.charAt(0).toUpperCase() + this.dados.status.slice(1);
  }

  get idFormatado(): string {
    if (!this.dados?.id) return 'N/A';
    return `REQ-${this.dados.id.substring(0, 6).toUpperCase()}`;
  }
}
```

**Template (card-pedido.html):**
```html
<div class="card-pedido" [routerLink]="['/pedidos', dados.id]">
  <div class="card-header">
    <span class="pedido-id">{{ idFormatado }}</span>
    <span class="status-badge" [class]="dados.status">
      {{ statusFormatado }}
    </span>
  </div>

  <h3 class="titulo">{{ dados.titulo }}</h3>
  
  <div class="card-meta">
    <span class="distrito">📍 {{ dados.distritos?.nome || 'N/A' }}</span>
    <span class="urgencia" [class]="dados.urgencia">
      🔥 {{ dados.urgencia }}
    </span>
  </div>
</div>
```

**Características:**
- ✅ **Clicável**: `[routerLink]` navega para detalhes
- ✅ **Getters**: Formatação de dados (id, status)
- ✅ **Dynamic classes**: Status e urgência têm cores diferentes
- ✅ **Emojis**: Visual rápido (📍 local, 🔥 urgência)

---

## 📐 FEATURE 5: RESPONSIVIDADE

### **Breakpoints Padrão:**

```css
/* Mobile: < 768px */
@media (max-width: 48rem) {
  .detalhes-card {
    padding: 1.25rem;  /* Reduz padding */
  }

  .card-header {
    flex-direction: column;  /* Stack vertical */
  }

  .card-actions button {
    width: 100%;  /* Botões full-width */
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 48rem) and (max-width: 64rem) {
  .requests-grid {
    grid-template-columns: repeat(2, 1fr);  /* 2 colunas */
  }
}

/* Desktop: > 1024px */
@media (min-width: 64rem) {
  .requests-grid {
    grid-template-columns: repeat(3, 1fr);  /* 3 colunas */
  }
}
```

**Padrões Mobile-First:**
- ✅ **Stack vertical**: Elementos lado-a-lado viram verticais
- ✅ **Full-width buttons**: Mais fácil de tocar
- ✅ **Reduced padding**: Mais espaço para conteúdo
- ✅ **Grid adaptativo**: 1 coluna → 2 colunas → 3 colunas

---

## 🔄 PADRÕES DE DESIGN COMUNS

### **1. Component Communication:**

```
Parent Component
    ↓ @Input (dados)
Child Component
    ↓ @Output (evento)
Parent Component (callback)
```

**Exemplo:**
```typescript
// Parent
<app-pedidos-filter (filtrosAlterados)="aplicarFiltros($event)"></app-pedidos-filter>

// Child
@Output() filtrosAlterados = new EventEmitter<IFiltrosPedidos>();
```

---

### **2. Standalone Components:**

```typescript
@Component({
  selector: 'app-card-pedido',
  standalone: true,  // ✅ Novo padrão Angular
  imports: [CommonModule, RouterModule],  // Importações locais
})
```

**Vantagens:**
- ✅ Não precisa NgModule
- ✅ Lazy-loading automático
- ✅ Encapsulamento melhor

---

### **3. CSS Scoping:**

```typescript
@Component({
  styleUrl: './card-pedido.css'  // Styles apenas para este component
})
```

**Result:**
```css
/* Automaticamente prefixado pelo Angular */
.card-pedido[_ngcontent-abc] {
  background: white;
}
```

---

### **4. Reactive State (BehaviorSubject):**

```typescript
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>('auto');
  currentTheme$ = this.currentThemeSubject.asObservable();
}

// Component
currentTheme$ = this.themeService.currentTheme$;

// Template
{{ currentTheme$ | async }}
```

**Por que BehaviorSubject?**
- ✅ **Valor inicial**: Emite 'auto' imediatamente
- ✅ **Último valor**: Novos subscribers recebem último valor
- ✅ **Reactive**: UI atualiza automaticamente

---

## 📝 CONCEITOS-CHAVE PARA APRESENTAÇÃO

### **1. CSS Variables (Custom Properties)**

**Problema:** Duplicar CSS para light/dark theme
**Solução:** CSS Variables que mudam valor baseado em classe/media

```css
/* Definir */
:root { --bg-main: #f8fafc; }
body.dark-theme { --bg-main: #0f172a; }

/* Usar */
.container { background: var(--bg-main); }
```

**Vantagens:**
- Centralização
- Escalabilidade
- Sem duplicação

---

### **2. BehaviorSubject vs Subject**

| Feature | Subject | BehaviorSubject |
|---------|---------|-----------------|
| Valor inicial | ❌ Não | ✅ Sim |
| Emite último valor para novos subscribers | ❌ Não | ✅ Sim |
| Obtém valor atual | ❌ Não (`getValue()` não existe) | ✅ Sim (`getValue()`) |

**Quando usar BehaviorSubject?**
- State management (tema, user, configuração)
- Quando novos subscribers precisam do estado atual

---

### **3. @Input/@Output Pattern**

**@Input:** Parent → Child (dados)
**@Output:** Child → Parent (eventos)

```typescript
// Child
@Input() titulo: string;
@Output() clicked = new EventEmitter<void>();

// Parent Template
<app-child [titulo]="meuTitulo" (clicked)="handleClick()"></app-child>
```

**Smart vs Presentation Components:**
- **Smart:** Gere estado, faz HTTP calls (Dashboard)
- **Presentation:** Apenas renderiza inputs, emite eventos (CardPedido)

---

### **4. Event Propagation (stopPropagation)**

```html
<div class="backdrop" (click)="fechar()">
  <div class="modal" (click)="$event.stopPropagation()">
    <!-- Clicar aqui NÃO fecha -->
  </div>
</div>
```

**Por que?**
- Events "bubbleam" para parent elements
- `stopPropagation()` previne bubbling
- Modal: clicar fora fecha, dentro não

---

### **5. Conditional Rendering (@if)**

```html
<!-- Angular 17+ syntax -->
@if (mostrarAlert) {
  <app-alert-modal />
}

<!-- Old syntax -->
<app-alert-modal *ngIf="mostrarAlert" />
```

**@if vs *ngIf:**
- Mesma funcionalidade
- `@if` é sintaxe nova (mais limpa)
- Suporta `@else` inline

---

