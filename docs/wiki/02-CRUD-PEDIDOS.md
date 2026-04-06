# 02 - Sistema CRUD de Pedidos

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Model & Interfaces](#model--interfaces)
- [Service - PedidoService](#service---pedidoservice)
- [Componentes Frontend](#componentes-frontend)
- [Backend - Controller & Routes](#backend---controller--routes)
- [Fluxos Completos](#fluxos-completos)
- [Conceitos Importantes](#conceitos-importantes)

---

## 🎯 Visão Geral

O sistema CRUD de Pedidos permite que utilizadores:
- ✅ **CREATE:** Criar pedidos de ajuda (formulário com validação)
- ✅ **READ:** Listar todos os pedidos (Dashboard) e ver detalhes
- ✅ **UPDATE:** Editar pedidos existentes (apenas o criador)
- ✅ **DELETE:** Apagar pedidos (apenas o criador)

**Tecnologias:**
- **Frontend:** Angular Standalone Components + Reactive Forms
- **Backend:** Node.js + Express + Service Layer
- **BD:** Supabase (PostgreSQL com JOINs)
- **Validação:** Frontend (UX) + Backend (Segurança)

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND ANGULAR                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  criar-pedido.ts ─┐                                      │
│  editar-pedido.ts ─┤                                     │
│  dashboard.ts ─────┼──► PedidoService ──► HttpClient    │
│  detalhe-pedido.ts ┘         ↓                           │
│                        AuthService (token JWT)           │
│                                                          │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP Requests
                     │ Authorization: Bearer <token>
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   BACKEND NODE.JS/EXPRESS                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  pedido.routes.js ──► verificarToken (middleware)        │
│         ↓                      ↓                         │
│  pedido.controller.js ──► pedido.service.js              │
│         ↓                      ↓                         │
│    Validação              Lógica de Negócio              │
│                                ↓                         │
│                         Supabase Client                  │
│                                                          │
└────────────────────┬─────────────────────────────────────┘
                     │ SQL Queries
                     ↓
┌──────────────────────────────────────────────────────────┐
│                SUPABASE (PostgreSQL)                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  pedidos (tabela principal)                              │
│  ├─ id (UUID, PK)                                        │
│  ├─ user_id (FK → auth.users)                           │
│  ├─ titulo, descricao                                    │
│  ├─ status, urgencia                                     │
│  ├─ distrito_id (FK → distritos)                         │
│  ├─ idioma_id (FK → idiomas)                             │
│  └─ helper_id (FK → auth.users)                          │
│                                                          │
│  distritos (lookup)                                      │
│  idiomas (lookup)                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Model & Interfaces

**Arquivo:** `frontend/src/app/models/pedido.model.ts`

### **Tipos (Domain Enums):**

```typescript
type PedidoStatus = 'pendente' | 'em_progresso' | 'concluido';
type PedidoUrgencia = 'baixa' | 'media' | 'alta';

// Constantes exportadas para dropdowns
export const LISTA_STATUS: PedidoStatus[] = ['pendente', 'em_progresso', 'concluido'];
export const LISTA_URGENCIA: PedidoUrgencia[] = ['baixa', 'media', 'alta'];
```

**Por que usar constantes?**
- ✅ Reutilização em múltiplos componentes (criar, editar)
- ✅ Single source of truth (mudar em 1 lugar)
- ✅ Type-safe (TypeScript valida valores)

---

### **DTO para Criação:**

```typescript
interface ICriarPedido {
  titulo: string;           // Validação: minLength(5)
  descricao: string;        // Validação: minLength(10)
  status: PedidoStatus;     // Default: 'pendente'
  urgencia: PedidoUrgencia; // Default: 'media'
  distrito_id: number;      // Required
  idioma_id: number;        // Required
}
```

**DTO (Data Transfer Object):**
- Contém **apenas** campos que o frontend envia
- `user_id` é adicionado pelo backend (via `req.user.id`)
- `created_at`, `id` são gerados automaticamente pelo BD

---

### **Interface Completa:**

```typescript
interface IPedido {
  id: string;               // UUID gerado pelo PostgreSQL
  user_id: string;          // Criador do pedido
  titulo: string;
  descricao: string;
  status: PedidoStatus;
  urgencia: PedidoUrgencia;
  created_at: string;       // Timestamp ISO 8601
  
  // Relacionamentos opcionais
  distrito_id?: number;
  idioma_id?: number;
  helper_id?: string;       // Quem ofereceu ajuda
  
  // JOINs resolvidos pela API
  distritos: { nome: string };
  idiomas: { nome: string };
}
```

**JOINs na API:**
```sql
SELECT pedidos.*, 
       distritos.nome as "distritos.nome",
       idiomas.nome as "idiomas.nome"
FROM pedidos
LEFT JOIN distritos ON pedidos.distrito_id = distritos.id
LEFT JOIN idiomas ON pedidos.idioma_id = idiomas.id
```

Supabase retorna objetos aninhados automaticamente:
```json
{
  "id": "abc-123",
  "titulo": "Ajuda com documentos",
  "distritos": { "nome": "Lisboa" },
  "idiomas": { "nome": "Inglês" }
}
```

---

### **Tabelas de Apoio (Lookups):**

```typescript
interface IDistrito {
  id: number;
  nome: string;  // "Lisboa", "Porto", "Faro", ...
}

interface IIdioma {
  id: number;
  nome: string;  // "Português", "Inglês", "Francês", ...
}
```

**Carregadas via:**
- `GET /api/lookups/distritos`
- `GET /api/lookups/idiomas`

**Usadas em:** Dropdowns nos formulários (criar/editar pedido)

---

## 🔧 Service - PedidoService

**Arquivo:** `frontend/src/app/services/pedido.ts` (97 linhas)

### **Estrutura:**

```typescript
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly apiUrl = 'http://localhost:3000/api/pedidos';
  private readonly lookupUrl = 'http://localhost:3000/api/lookups';
}
```

---

### **Método Centralizado de Autenticação:**

```typescript
private getAuthHeaders(): Observable<HttpHeaders> {
  return from(this.authService.obterSessaoAtual()).pipe(
    map((session) => {
      const token = session?.access_token;
      if (!token) {
        console.warn('PedidoService: Nenhum token encontrado.');
      }
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    })
  );
}
```

**Padrão DRY (Don't Repeat Yourself):**
- ✅ Evita repetir lógica de autenticação em cada método
- ✅ Centraliza gestão de tokens
- ✅ Facilita manutenção (mudar em 1 lugar)

**RxJS Operators Usados:**
- `from()`: Converte Promise (`obterSessaoAtual()`) em Observable
- `map()`: Transforma dados (extrai token → cria HttpHeaders)

---

### **Métodos HTTP:**

#### **1. Listar Todos os Pedidos:**

```typescript
obterPedidos(): Observable<IPedido[]> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => this.http.get<IPedido[]>(this.apiUrl, { headers }))
  );
}
```

**Fluxo:**
1. `getAuthHeaders()` → resolve token
2. `switchMap()` → troca Observable (headers → request HTTP)
3. `http.get()` → faz GET /api/pedidos com Authorization header
4. Backend retorna array de pedidos com JOINs resolvidos

---

#### **2. Obter Pedido por ID:**

```typescript
obterPorId(id: string): Observable<IPedido> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => this.http.get<IPedido>(`${this.apiUrl}/${id}`, { headers }))
  );
}
```

**Usado em:**
- `detalhe-pedido.ts`: Carregar dados do pedido
- `editar-pedido.ts`: Pré-preencher formulário

---

#### **3. Criar Pedido:**

```typescript
criarPedido(novoPedido: ICriarPedido): Observable<IPedido> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.post<IPedido>(this.apiUrl, novoPedido, { headers })
    )
  );
}
```

**Fluxo:**
1. Frontend envia DTO: `{ titulo, descricao, status, urgencia, distrito_id, idioma_id }`
2. Backend adiciona: `user_id = req.user.id`
3. Backend insere na BD
4. Backend retorna pedido criado com `id` e `created_at`

---

#### **4. Atualizar Pedido:**

```typescript
atualizarPedido(id: string, payload: Partial<ICriarPedido>): Observable<IPedido> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.put<IPedido>(`${this.apiUrl}/${id}`, payload, { headers })
    )
  );
}
```

**Partial<ICriarPedido>:**
- Permite atualizar apenas alguns campos (não todos obrigatórios)
- TypeScript garante que campos são válidos

**Validação Backend:**
- Verifica se `req.user.id === pedido.user_id` (apenas dono pode editar)

---

#### **5. Apagar Pedido:**

```typescript
apagarPedido(id: string): Observable<void> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
    )
  );
}
```

**Validação Backend:**
- Verifica se `req.user.id === pedido.user_id` (apenas dono pode apagar)
- Retorna 403 Forbidden se não for o dono

---

#### **6. Obter Lookups:**

```typescript
obterDistritos(): Observable<IDistrito[]> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.get<IDistrito[]>(`${this.lookupUrl}/distritos`, { headers })
    )
  );
}

obterIdiomas(): Observable<IIdioma[]> {
  return this.getAuthHeaders().pipe(
    switchMap((headers) => 
      this.http.get<IIdioma[]>(`${this.lookupUrl}/idiomas`, { headers })
    )
  );
}
```

**Usado em:**
- `criar-pedido.ts`: Carregar opções dos dropdowns
- `editar-pedido.ts`: Carregar opções dos dropdowns

---

## 🎨 Componentes Frontend

### **1. CriarPedidoComponent**

**Arquivo:** `frontend/src/app/pages/criar-pedido/criar-pedido.ts` (121 linhas)

#### **Ciclo de Vida:**

```
ngOnInit()
   ↓
carregarDependencias()
   ↓
forkJoin({ distritos, idiomas })  ← Carrega ambos em paralelo
   ↓
Preencher arrays para dropdowns
   ↓
(User preenche formulário)
   ↓
onSubmit()
   ↓
Validar → Mapear → Chamar Service → Modal → Redirecionar
```

---

#### **Reactive Form:**

```typescript
readonly pedidoForm = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(5)]],
  descricao: ['', [Validators.required, Validators.minLength(10)]],
  status: [LISTA_STATUS[0], [Validators.required]],        // default: 'pendente'
  urgencia: [LISTA_URGENCIA[1], [Validators.required]],    // default: 'media'
  distrito_id: ['', [Validators.required]],
  idioma_id: ['', [Validators.required]]
});
```

**Validações:**
- `titulo`: Mínimo 5 caracteres
- `descricao`: Mínimo 10 caracteres
- Todos os campos são required

**Defaults:**
- `status`: 'pendente' (primeiro da lista)
- `urgencia`: 'media' (segundo da lista - index 1)

---

#### **Carregar Dependências (forkJoin):**

```typescript
private carregarDependencias(): void {
  this.carregando = true;
  
  forkJoin({
    distritos: this.pedidoService.obterDistritos(),
    idiomas: this.pedidoService.obterIdiomas()
  })
  .pipe(finalize(() => this.carregando = false))
  .subscribe({
    next: (dados) => {
      this.distritos = dados.distritos;
      this.idiomas = dados.idiomas;
    },
    error: (erro) => {
      console.error('Erro ao carregar lookups:', erro);
      this.erro = 'Erro ao carregar opções. Tenta novamente.';
    }
  });
}
```

**forkJoin:**
- Executa múltiplos Observables em **paralelo**
- Espera **todos** completarem
- Retorna objeto com resultados: `{ distritos: [...], idiomas: [...] }`

**finalize:**
- Executa **sempre** (sucesso ou erro)
- Garante que `carregando = false`

---

#### **Submissão do Formulário:**

```typescript
onSubmit(): void {
  // 1. Validação
  if (this.pedidoForm.invalid) {
    this.pedidoForm.markAllAsTouched();  // Mostra erros visuais
    return;
  }
  
  // 2. Mapear para DTO
  const dto = this.mapearParaDTO();
  
  // 3. Chamar Service
  this.pedidoService.criarPedido(dto).subscribe({
    next: (pedidoCriado) => {
      // 4. Mostrar Modal de Sucesso
      this.alertConfig = {
        titulo: 'Pedido Criado!',
        mensagem: `O teu pedido foi criado com sucesso.`,
        tipo: 'sucesso',
        acao: 'nenhuma'
      };
      this.mostrarAlert = true;
      
      // 5. Redirecionar após 2s
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
    },
    error: (erro) => {
      // Mostrar Modal de Erro
      this.alertConfig = {
        titulo: 'Erro ao Criar Pedido',
        mensagem: erro.error?.erro || 'Ocorreu um erro.',
        tipo: 'erro',
        acao: 'nenhuma'
      };
      this.mostrarAlert = true;
    }
  });
}
```

---

#### **Mapeamento para DTO:**

```typescript
private mapearParaDTO(): ICriarPedido {
  const raw = this.pedidoForm.getRawValue();
  
  return {
    titulo: raw.titulo,
    descricao: raw.descricao,
    status: raw.status as PedidoStatus,           // Type casting
    urgencia: raw.urgencia as PedidoUrgencia,
    distrito_id: Number(raw.distrito_id),         // String → Number
    idioma_id: Number(raw.idioma_id)
  };
}
```

**Por que Number()?**
- Dropdowns retornam strings: `<option value="1">` → "1"
- BD espera números: `distrito_id: number`
- Conversão explícita evita erros

---

### **2. DashboardComponent**

**Arquivo:** `frontend/src/app/pages/dashboard/dashboard.ts` (124 linhas)

#### **Estrutura Completa:**

```typescript
export class Dashboard implements OnInit {
  // Arrays para gestão de pedidos
  meusPedidos: IPedido[] = [];           // Exibido no template
  pedidosOriginais: IPedido[] = [];      // Original da API (imutável)
  pedidosFiltrados: IPedido[] = [];      // Resultado após filtros
  
  // Estados UI
  carregando: boolean = true;
  erro: string = '';

  // Getters para estatísticas
  get casosAtivos(): number {
    return this.pedidosOriginais.filter(p => p.status !== 'concluido').length;
  }

  get revisoesUrgentes(): number {
    return this.pedidosOriginais.filter(p => 
      p.status === 'pendente' && p.urgencia === 'alta'
    ).length;
  }

  get emProcessamento(): number {
    return this.pedidosOriginais.filter(p => p.status === 'em_progresso').length;
  }

  ngOnInit() {
    this.carregarPedidos();
  }

  private carregarPedidos() {
    this.pedidoService.obterPedidos()
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (dados) => {
          this.meusPedidos = dados;
          this.pedidosOriginais = dados;
          this.pedidosFiltrados = dados;
        },
        error: (erro) => {
          this.erro = 'Erro ao carregar pedidos. Tenta novamente.';
          console.error(erro);
        }
      });
  }

  aplicarFiltros(filtros: IFiltrosPedidos): void {
    this.pedidosFiltrados = this.pedidosOriginais.filter(pedido => {
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

---

#### **Características:**

**✅ 3 Arrays Distintos:**
- `meusPedidos`: Array exibido no template
- `pedidosOriginais`: Fonte de verdade (não muda após carregamento)
- `pedidosFiltrados`: Resultado após aplicar filtros

**Por que 3 arrays?**
- Permitir reset de filtros (voltar ao original)
- Estatísticas sempre baseadas em `pedidosOriginais`
- Filtros aplicam sobre original (não cascata)

**✅ Getters para Estatísticas:**
```typescript
casosAtivos       → Pedidos pendentes ou em progresso
revisoesUrgentes  → Pedidos urgentes ainda pendentes
emProcessamento   → Pedidos atualmente a ser tratados
```

**Mostrados em cards no topo do dashboard:**
```html
<div class="stats-cards">
  <div class="stat-card">
    <h3>{{ casosAtivos }}</h3>
    <p>Casos Ativos</p>
  </div>
  <div class="stat-card">
    <h3>{{ revisoesUrgentes }}</h3>
    <p>Revisões Urgentes</p>
  </div>
  <div class="stat-card">
    <h3>{{ emProcessamento }}</h3>
    <p>Em Processamento</p>
  </div>
</div>
```

---

#### **Sistema de Filtros:**

**Componente PedidosFilter:**
```typescript
// Emite evento quando user aplica filtros
@Output() filtrosAplicados = new EventEmitter<IFiltrosPedidos>();

aplicarFiltros() {
  this.filtrosAplicados.emit({
    distrito_id: this.distritoSelecionado,
    idioma_id: this.idiomaSelecionado,
    urgencia: this.urgenciaSelecionada,
    status: this.statusSelecionado
  });
}
```

**Dashboard recebe e processa:**
```typescript
// Template
<app-pedidos-filter (filtrosAplicados)="aplicarFiltros($event)"></app-pedidos-filter>

// Componente
aplicarFiltros(filtros: IFiltrosPedidos): void {
  // Filtra sobre pedidosOriginais (não cascata)
  this.pedidosFiltrados = this.pedidosOriginais.filter(pedido => {
    // Lógica AND: todos os filtros ativos devem passar
    if (filtros.distrito_id !== null && pedido.distrito_id !== filtros.distrito_id) {
      return false;
    }
    // ... outros filtros
    return true;
  });
}
```

**Interface IFiltrosPedidos:**
```typescript
interface IFiltrosPedidos {
  distrito_id: number | null;   // null = não filtrar
  idioma_id: number | null;
  urgencia: PedidoUrgencia | null;
  status: PedidoStatus | null;
}
```

**Lógica AND:**
- Todos os filtros **ativos** (não-null) devem passar
- Se distrito_id = 1 e urgencia = 'alta' → mostra apenas pedidos de distrito 1 **E** urgencia alta
- Diferente de OR (que mostraria distrito 1 **OU** urgencia alta)

---

#### **Template (Renderização):**

```html
<div class="dashboard-container">
  <!-- Estatísticas -->
  <div class="stats-cards">
    <div class="stat-card">
      <h3>{{ casosAtivos }}</h3>
      <p>Casos Ativos</p>
    </div>
    <div class="stat-card">
      <h3>{{ revisoesUrgentes }}</h3>
      <p>Revisões Urgentes</p>
    </div>
    <div class="stat-card">
      <h3>{{ emProcessamento }}</h3>
      <p>Em Processamento</p>
    </div>
  </div>

  <!-- Componente de Filtros -->
  <app-pedidos-filter (filtrosAplicados)="aplicarFiltros($event)"></app-pedidos-filter>

  <!-- Loading/Erro/Pedidos -->
  @if (carregando) {
    <p>A carregar pedidos...</p>
  } @else if (erro) {
    <p class="erro">{{ erro }}</p>
  } @else {
    <div class="requests-grid">
      <!-- Botão flutuante para criar novo pedido -->
      <div class="create-card" routerLink="/criar-pedido">
        <span class="plus-icon">+</span>
        <h3>Criar Novo Pedido</h3>
      </div>
      
      <!-- Cards de pedidos (usa pedidosFiltrados se filtros ativos) -->
      @for (pedido of pedidosFiltrados; track pedido.id) {
        <app-card-pedido [dados]="pedido"></app-card-pedido>
      } @empty {
        <p>Nenhum pedido encontrado com estes filtros.</p>
      }
    </div>
  }
</div>
```

**Angular @for Syntax (v17+):**
- `@for` substitui `*ngFor`
- `track pedido.id`: Otimiza renderização (evita re-render desnecessário)
- `@empty`: Mostra mensagem se array vazio

---

#### **Fluxo Completo:**

```
1. ngOnInit() → carregarPedidos()
2. API retorna dados → preenche 3 arrays (todos iguais inicialmente)
3. Estatísticas calculadas automaticamente (getters)
4. User ajusta filtros no PedidosFilter
5. PedidosFilter emite evento filtrosAplicados
6. Dashboard.aplicarFiltros() processa
7. pedidosFiltrados atualizado
8. Template re-renderiza com novos dados
9. Estatísticas continuam baseadas em pedidosOriginais (não mudam)
```

---

### **3. CardPedidoComponent**

**Arquivo:** `frontend/src/app/components/card-pedido/card-pedido.ts` (27 linhas)

#### **Componente Reutilizável:**

```typescript
@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CardPedidoComponent {
  @Input({ required: true }) dados!: IPedido;

  get statusFormatado(): string {
    const mapa: Record<PedidoStatus, string> = {
      'em_progresso': 'Em Progresso',
      'pendente': 'Pendente',
      'concluido': 'Concluído'
    };
    return mapa[this.dados.status] || this.capitalize(this.dados.status);
  }

  get idFormatado(): string {
    return `REQ-${this.dados.id.substring(0, 6).toUpperCase()}`;
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
```

**Getters:**
- `statusFormatado`: Mapeia 'em_progresso' → 'Em Progresso'
- `idFormatado`: Trunca UUID: 'abc-123-xyz' → 'REQ-ABC123'

---

#### **Template:**

```html
<div class="request-card">
  <div class="card-header">
    <span class="status-badge" [class]="dados.status">
      {{ statusFormatado }}
    </span>
    <span class="request-id">{{ idFormatado }}</span>
  </div>
  
  <h4 class="card-title">{{ dados.titulo }}</h4>
  
  <div class="tags-row">
    <span class="tag">{{ dados.idiomas.nome }}</span>
    <span class="tag">{{ dados.distritos.nome }}</span>
  </div>
  
  <p class="card-desc">{{ dados.descricao }}</p>
  
  <button class="view-btn" [routerLink]="['/pedido', dados.id]">
    Ver Detalhes
  </button>
</div>
```

**CSS Dinâmico:**
```html
<span class="status-badge" [class]="dados.status">
```

Adiciona classe CSS dinamicamente:
- `class="status-badge pendente"` → cor amarela
- `class="status-badge em_progresso"` → cor azul
- `class="status-badge concluido"` → cor verde

---

### **4. DetalhePedidoComponent**

**Arquivo:** `frontend/src/app/pages/detalhe-pedido/detalhe-pedido.ts` (228 linhas)

#### **Estados Gerenciados:**

```typescript
pedido: IPedido | null = null;
carregando: boolean = true;
usuarioAtualId: string | null = null;

// Permissões
isDonoDoPedido: boolean = false;
isHelperDoPedido: boolean = false;

// Estados de carregamento (botões)
carregandoAjuda: boolean = false;
carregandoConcluir: boolean = false;
carregandoContacto: boolean = false;

// Modais
mostrarModalApagar: boolean = false;
mostrarModalContacto: boolean = false;
mostrarAlert: boolean = false;

// Dados de contacto
contactoParceiro: any = null;
```

---

#### **Carregar Dados (ngOnInit):**

```typescript
async ngOnInit() {
  // 1. Obter ID da rota
  const id = this.route.snapshot.paramMap.get('id');
  if (!id) {
    this.router.navigate(['/dashboard']);
    return;
  }
  
  // 2. Obter user autenticado
  const user = await this.authService.obterUtilizadorAtual();
  this.usuarioAtualId = user?.id || null;
  
  // 3. Carregar pedido
  this.pedidoService.obterPorId(id)
    .pipe(finalize(() => this.carregando = false))
    .subscribe({
      next: (pedido) => {
        this.pedido = pedido;
        
        // 4. Verificar permissões
        this.isDonoDoPedido = pedido.user_id === this.usuarioAtualId;
        this.isHelperDoPedido = pedido.helper_id === this.usuarioAtualId;
      },
      error: (erro) => {
        console.error('Erro ao carregar pedido:', erro);
        this.router.navigate(['/dashboard']);
      }
    });
}
```

---

#### **Ações Disponíveis (Baseadas em Permissões):**

**1. Oferecer Ajuda:**
```typescript
// Condição: status === 'pendente' E não é o dono
<button *ngIf="pedido.status === 'pendente' && !isDonoDoPedido"
        (click)="oferecerMinhaAjuda()">
  Posso Ajudar
</button>

oferecerMinhaAjuda(): void {
  this.carregandoAjuda = true;
  
  this.voluntariadoService.oferecerAjuda(this.pedido.id)
    .pipe(finalize(() => this.carregandoAjuda = false))
    .subscribe({
      next: (pedidoAtualizado) => {
        this.pedido = pedidoAtualizado;  // status muda para 'em_progresso'
        this.isHelperDoPedido = true;
        
        // Mostrar sucesso
        this.alertConfig = {
          titulo: 'Ajuda Oferecida!',
          mensagem: 'Podes agora ver o contacto do criador.',
          tipo: 'sucesso'
        };
        this.mostrarAlert = true;
      },
      error: (erro) => {
        // Pedido já tem helper ou está concluído
        this.alertConfig = {
          titulo: 'Erro',
          mensagem: erro.error?.erro || 'Não foi possível oferecer ajuda.',
          tipo: 'erro'
        };
        this.mostrarAlert = true;
      }
    });
}
```

---

**2. Marcar como Concluído:**
```typescript
// Condição: (dono OU helper) E status === 'em_progresso'
<button *ngIf="(isDonoDoPedido || isHelperDoPedido) && 
                pedido.status === 'em_progresso'"
        (click)="concluirPedido()">
  Marcar como Concluído
</button>

concluirPedido(): void {
  if (!confirm('Tens a certeza que queres marcar este pedido como concluído?')) {
    return;
  }
  
  this.carregandoConcluir = true;
  
  this.voluntariadoService.marcarComoConcluido(this.pedido.id)
    .pipe(finalize(() => this.carregandoConcluir = false))
    .subscribe({
      next: (pedidoAtualizado) => {
        this.pedido = pedidoAtualizado;  // status muda para 'concluido'
        
        this.alertConfig = {
          titulo: 'Pedido Concluído!',
          mensagem: 'Este pedido foi marcado como concluído.',
          tipo: 'sucesso'
        };
        this.mostrarAlert = true;
      }
    });
}
```

---

**3. Ver Contacto do Parceiro:**
```typescript
// Condição: status !== 'pendente' (pedido em progresso ou concluído)
<button *ngIf="pedido.status !== 'pendente'"
        (click)="verContacto()">
  Ver Contacto
</button>

verContacto(): void {
  this.carregandoContacto = true;
  
  this.voluntariadoService.obterContactoParceiro(this.pedido.id)
    .pipe(finalize(() => this.carregandoContacto = false))
    .subscribe({
      next: (contacto) => {
        this.contactoParceiro = contacto;
        this.mostrarModalContacto = true;
      },
      error: (erro) => {
        alert('Erro ao obter contacto.');
      }
    });
}
```

**Backend retorna:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com"
}
```

---

**4. Editar Pedido:**
```typescript
// Condição: apenas o dono
<button *ngIf="isDonoDoPedido"
        [routerLink]="['/editar-pedido', pedido.id]">
  Editar
</button>
```

Redireciona para `/editar-pedido/:id`

---

**5. Apagar Pedido:**
```typescript
// Condição: apenas o dono
<button *ngIf="isDonoDoPedido"
        (click)="abrirModalApagar()">
  Apagar
</button>

abrirModalApagar(): void {
  this.mostrarModalApagar = true;
}

confirmarApagar(): void {
  this.pedidoService.apagarPedido(this.pedido.id).subscribe({
    next: () => {
      this.router.navigate(['/dashboard']);
    },
    error: (erro) => {
      alert('Erro ao apagar pedido. Apenas o criador pode apagar.');
    }
  });
}
```

---

### **5. EditarPedidoComponent**

**Arquivo:** `frontend/src/app/pages/editar-pedido/editar-pedido.ts` (139 linhas)

#### **Fluxo de Carregamento:**

```
ngOnInit()
   ↓
Extrair ID da rota (ActivatedRoute)
   ↓
forkJoin({ pedido, distritos, idiomas })
   ↓
Preencher dropdowns + formulário
   ↓
(User edita)
   ↓
onSubmit() → PUT /api/pedidos/:id → Redirecionar
```

---

#### **Carregar Dados:**

```typescript
private carregarDados(): void {
  this.carregando = true;
  
  forkJoin({
    pedido: this.pedidoService.obterPorId(this.pedidoId),
    distritos: this.pedidoService.obterDistritos(),
    idiomas: this.pedidoService.obterIdiomas()
  })
  .pipe(finalize(() => this.carregando = false))
  .subscribe({
    next: (dados) => {
      // 1. Preencher dropdowns
      this.distritos = dados.distritos;
      this.idiomas = dados.idiomas;
      
      // 2. Preencher formulário com dados existentes
      this.pedidoForm.patchValue({
        titulo: dados.pedido.titulo,
        descricao: dados.pedido.descricao,
        status: dados.pedido.status,
        urgencia: dados.pedido.urgencia,
        distrito_id: dados.pedido.distrito_id,
        idioma_id: dados.pedido.idioma_id
      });
    },
    error: (erro) => {
      console.error('Erro ao carregar dados:', erro);
      this.router.navigate(['/dashboard']);
    }
  });
}
```

**patchValue() vs setValue():**
- `patchValue()`: Atualiza apenas campos especificados (parcial)
- `setValue()`: Requer todos os campos do formulário

---

#### **Submissão:**

```typescript
onSubmit(): void {
  if (this.pedidoForm.invalid) {
    this.pedidoForm.markAllAsTouched();
    return;
  }
  
  const payload = this.mapearParaDTO();
  
  this.pedidoService.atualizarPedido(this.pedidoId, payload).subscribe({
    next: (pedidoAtualizado) => {
      this.alertConfig = {
        titulo: 'Pedido Atualizado!',
        mensagem: 'As alterações foram guardadas.',
        tipo: 'sucesso'
      };
      this.mostrarAlert = true;
      
      // Redirecionar para detalhe após 1.5s
      setTimeout(() => {
        this.router.navigate(['/pedido', this.pedidoId]);
      }, 1500);
    },
    error: (erro) => {
      this.alertConfig = {
        titulo: 'Erro ao Atualizar',
        mensagem: erro.error?.erro || 'Não foi possível atualizar.',
        tipo: 'erro'
      };
      this.mostrarAlert = true;
    }
  });
}
```

---

## 🖥️ Backend - Controller & Routes

### **Rotas (pedido.routes.js)**

**Arquivo:** `backend/routes/pedido.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const verificarToken = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.get('/', verificarToken, pedidoController.listarTodos);
router.get('/:id', verificarToken, pedidoController.obterPorId);
router.post('/', verificarToken, pedidoController.criar);
router.put('/:id', verificarToken, pedidoController.atualizar);
router.delete('/:id', verificarToken, pedidoController.apagar);

module.exports = router;
```

**Todas as rotas usam `verificarToken`:**
- Valida JWT token
- Adiciona `req.user` com dados do utilizador
- Retorna 401 se não autenticado

---

### **Controller (pedido.controller.js)**

**Arquivo:** `backend/controllers/pedido.controller.js`

#### **Estrutura:**

```javascript
const pedidoService = require('../services/pedido.service');

exports.listarTodos = async (req, res) => { ... }
exports.obterPorId = async (req, res) => { ... }
exports.criar = async (req, res) => { ... }
exports.atualizar = async (req, res) => { ... }
exports.apagar = async (req, res) => { ... }
```

**Padrão:**
- Controller valida request
- Controller chama Service (lógica de negócio)
- Controller retorna response

---

#### **1. Listar Todos:**

```javascript
exports.listarTodos = async (req, res) => {
  try {
    const pedidos = await pedidoService.listarTodos();
    res.json(pedidos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar pedidos.' });
  }
};
```

**Service executa:**
```sql
SELECT pedidos.*, 
       distritos.nome as "distritos.nome",
       idiomas.nome as "idiomas.nome"
FROM pedidos
LEFT JOIN distritos ON pedidos.distrito_id = distritos.id
LEFT JOIN idiomas ON pedidos.idioma_id = idiomas.id
ORDER BY created_at DESC
```

---

#### **2. Obter por ID:**

```javascript
exports.obterPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await pedidoService.obterPorId(id);
    
    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }
    
    res.json(pedido);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao obter pedido.' });
  }
};
```

---

#### **3. Criar:**

```javascript
exports.criar = async (req, res) => {
  try {
    const { titulo, descricao, status, urgencia, distrito_id, idioma_id } = req.body;
    
    // Validação
    if (!titulo || !descricao || !distrito_id || !idioma_id) {
      return res.status(400).json({ 
        erro: 'Título, descrição, distrito e idioma são obrigatórios.' 
      });
    }
    
    // Adicionar user_id do utilizador autenticado
    const dadosPedido = {
      user_id: req.user.id,  // ← Do middleware verificarToken
      titulo,
      descricao,
      status: status || 'pendente',
      urgencia: urgencia || 'media',
      distrito_id,
      idioma_id
    };
    
    const novoPedido = await pedidoService.criar(dadosPedido);
    res.status(201).json(novoPedido);
    
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar pedido.' });
  }
};
```

**Validação Backend:**
- ✅ Campos obrigatórios
- ✅ Adiciona `user_id` automaticamente (não confia em frontend)
- ✅ Defaults para `status` e `urgencia`

---

#### **4. Atualizar:**

```javascript
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status, urgencia, distrito_id, idioma_id } = req.body;
    
    // Verificar se pedido existe
    const pedidoExistente = await pedidoService.obterPorId(id);
    
    if (!pedidoExistente) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }
    
    // Verificar se user é o dono
    if (pedidoExistente.user_id !== req.user.id) {
      return res.status(403).json({ 
        erro: 'Não tens permissão para editar este pedido.' 
      });
    }
    
    const dadosAtualizados = {
      titulo,
      descricao,
      status,
      urgencia,
      distrito_id,
      idioma_id
    };
    
    const pedidoAtualizado = await pedidoService.atualizar(id, dadosAtualizados);
    res.json(pedidoAtualizado);
    
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar pedido.' });
  }
};
```

**Segurança:**
- ✅ Verifica se user é o dono (`pedido.user_id === req.user.id`)
- ✅ Retorna 403 Forbidden se não for
- ✅ Não permite alterar `user_id` (ignora se enviado)

---

#### **5. Apagar:**

```javascript
exports.apagar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedidoExistente = await pedidoService.obterPorId(id);
    
    if (!pedidoExistente) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }
    
    // Apenas o dono pode apagar
    if (pedidoExistente.user_id !== req.user.id) {
      return res.status(403).json({ 
        erro: 'Não tens permissão para apagar este pedido.' 
      });
    }
    
    await pedidoService.apagar(id);
    res.status(204).send();  // No Content
    
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao apagar pedido.' });
  }
};
```

**Status Code 204:**
- Significa "No Content" (sucesso sem corpo de resposta)
- Usado em DELETE bem-sucedido

---

### **Service (pedido.service.js)**

**Arquivo:** `backend/services/pedido.service.js`

#### **Estrutura:**

```javascript
const supabase = require('../config/supabase');

exports.listarTodos = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      distritos (nome),
      idiomas (nome)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

exports.obterPorId = async (id) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      distritos (nome),
      idiomas (nome)
    `)
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;  // PGRST116 = não encontrado
  return data;
};

exports.criar = async (dadosPedido) => {
  const { data, error } = await supabase
    .from('pedidos')
    .insert(dadosPedido)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

exports.atualizar = async (id, dadosAtualizados) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update(dadosAtualizados)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

exports.apagar = async (id) => {
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
```

**Supabase Query Syntax:**
- `.select('*')`: Seleciona todos os campos
- `.select('*, distritos (nome)')`: JOIN automático
- `.eq('id', id)`: WHERE id = ?
- `.single()`: Retorna 1 objeto (não array)
- `.order('created_at', { ascending: false })`: ORDER BY DESC

---

## 🔄 Fluxos Completos

### **CRIAR Pedido:**

```
1. User preenche formulário em criar-pedido.ts
2. Clica "Criar Pedido"
3. ↓ criar-pedido.ts valida formulário
4. ↓ criar-pedido.ts.mapearParaDTO()
5. ↓ pedidoService.criarPedido(dto)
6. ↓ getAuthHeaders() → obterSessaoAtual() → token JWT
7. ↓ http.post('/api/pedidos', dto, { headers })
8. ↓ Request chega ao backend
9. ↓ verificarToken middleware: valida token → adiciona req.user
10. ↓ pedidoController.criar()
11. ↓ Validação: campos obrigatórios?
12. ↓ Adiciona user_id = req.user.id
13. ↓ pedidoService.criar(dadosPedido)
14. ↓ supabase.from('pedidos').insert()
15. ↓ PostgreSQL: INSERT INTO pedidos VALUES (...)
16. ↓ Retorna pedido criado com id e created_at
17. ↓ Response: 201 Created { id, titulo, ... }
18. ✓ criar-pedido.ts recebe pedidoCriado
19. ✓ Mostrar modal de sucesso
20. ✓ Redirecionar para /dashboard
```

---

### **LISTAR Pedidos:**

```
1. User acessa /dashboard
2. DashboardComponent.ngOnInit()
3. ↓ carregarPedidos()
4. ↓ pedidoService.obterPedidos()
5. ↓ getAuthHeaders() → token
6. ↓ http.get('/api/pedidos', { headers })
7. ↓ Request chega ao backend
8. ↓ verificarToken middleware: valida → req.user
9. ↓ pedidoController.listarTodos()
10. ↓ pedidoService.listarTodos()
11. ↓ supabase.from('pedidos').select('*, distritos (nome), idiomas (nome)')
12. ↓ PostgreSQL: SELECT com JOINs
13. ↓ Retorna array de pedidos com objetos aninhados
14. ↓ Response: 200 OK [ { id, titulo, distritos: { nome }, ... }, ... ]
15. ✓ dashboard.ts recebe array
16. ✓ meusPedidos = dados
17. ✓ Template renderiza @for com <app-card-pedido>
```

---

### **EDITAR Pedido:**

```
1. User clica "Editar" em detalhe-pedido
2. Redireciona para /editar-pedido/:id
3. EditarPedidoComponent.ngOnInit()
4. ↓ Extrai id da rota
5. ↓ forkJoin({ pedido, distritos, idiomas })
6. ↓ 3 requests HTTP em paralelo:
   - GET /api/pedidos/:id
   - GET /api/lookups/distritos
   - GET /api/lookups/idiomas
7. ↓ Recebe todos os dados
8. ↓ Preenche dropdowns: distritos = [...], idiomas = [...]
9. ↓ Preenche formulário: pedidoForm.patchValue({ ... })
10. (User edita campos)
11. Clica "Guardar Alterações"
12. ↓ editar-pedido.ts valida formulário
13. ↓ mapearParaDTO()
14. ↓ pedidoService.atualizarPedido(id, payload)
15. ↓ http.put('/api/pedidos/:id', payload, { headers })
16. ↓ Request chega ao backend
17. ↓ verificarToken: valida → req.user
18. ↓ pedidoController.atualizar()
19. ↓ Verifica se pedido existe
20. ↓ Verifica se req.user.id === pedido.user_id
21. ↓ Se sim: pedidoService.atualizar(id, dados)
22. ↓ supabase.from('pedidos').update().eq('id', id)
23. ↓ PostgreSQL: UPDATE pedidos SET ... WHERE id = ?
24. ↓ Response: 200 OK { pedido atualizado }
25. ✓ editar-pedido.ts recebe sucesso
26. ✓ Modal de sucesso
27. ✓ Redirecionar para /pedido/:id
```

---

### **APAGAR Pedido:**

```
1. User clica "Apagar" em detalhe-pedido
2. ↓ abrirModalApagar() → mostrar confirmação
3. User confirma
4. ↓ confirmarApagar()
5. ↓ pedidoService.apagarPedido(id)
6. ↓ http.delete('/api/pedidos/:id', { headers })
7. ↓ Request chega ao backend
8. ↓ verificarToken: valida → req.user
9. ↓ pedidoController.apagar()
10. ↓ Verifica se pedido existe
11. ↓ Verifica se req.user.id === pedido.user_id
12. ↓ Se não: Response 403 Forbidden
13. ↓ Se sim: pedidoService.apagar(id)
14. ↓ supabase.from('pedidos').delete().eq('id', id)
15. ↓ PostgreSQL: DELETE FROM pedidos WHERE id = ?
16. ↓ Response: 204 No Content
17. ✓ detalhe-pedido.ts recebe sucesso
18. ✓ Redirecionar para /dashboard
```

---

## 💡 Conceitos Importantes

### **1. Padrão de Defesa em Profundidade**

A segurança no IntegraBridge segue uma estratégia de **múltiplas camadas** para proteger operações sensíveis (UPDATE e DELETE).

**Exemplo - Apagar Pedido:**

```javascript
// Backend: pedidoService.js
exports.apagar = async (id, donoId, authHeader) => {
  // 🛡️ Dupla Validação (Redundância Intencional)
  const { data, error } = await supabase
    .from('pedidos_ajuda')
    .delete()
    .eq('id', id)        // ← Primeira validação: pedido existe?
    .eq('user_id', donoId) // ← Segunda validação: user é o dono?
    .select();

  if (!data || data.length === 0) {
    throw new Error('Pedido não encontrado ou não tens permissão para apagá-lo');
  }
};
```

**Por que Dupla Validação?**
- Se o middleware JWT falhar, o `.eq('user_id', donoId)` bloqueia
- Se RLS policies falharem, a validação explícita protege
- **Princípio:** "Fail-Safe by Default" - sempre assumir que outras camadas podem falhar

**Camadas de Defesa:**
1. **Frontend:** AuthGuard (UX - evita clicks desnecessários)
2. **Backend Middleware:** `verificarToken` (Authentication)  
3. **Service Layer:** Validação `.eq('user_id')` (Authorization)
4. **Database:** RLS Policies (Last defense)

### **2. Spread Operator para Payloads**

Pattern usado para **combinar dados** de diferentes fontes no backend:

```javascript
// Backend: pedidoController.js
async criar(req, res) {
  const payload = {
    ...req.body,           // ← Dados do formulário (frontend)
    user_id: req.user.id   // ← ID extraído do JWT (middleware)
  };
  // payload agora tem: { titulo, descricao, distrito_id, idioma_id, user_id }
  
  const resultado = await pedidoService.criar(payload, req.headers.authorization);
  res.status(201).json(resultado);
}
```

**Vantagens:**
- **Immutability:** Não modifica `req.body` original
- **Clarity:** Mostra claramente que `user_id` é adicionado pelo backend
- **Security:** Frontend nunca envia `user_id` - sempre extraído do token

### **3. DTO (Data Transfer Object)**

**O que é?**
- Objeto usado para **transferir dados** entre camadas
- Contém apenas campos necessários (não a entidade completa)

**Exemplo:**
```typescript
// DTO (enviado pelo frontend)
interface ICriarPedido {
  titulo: string;
  descricao: string;
  status: PedidoStatus;
  urgencia: PedidoUrgencia;
  distrito_id: number;
  idioma_id: number;
}

// Entidade Completa (retornada pela API)
interface IPedido {
  id: string;               // ← Gerado pelo BD
  user_id: string;          // ← Adicionado pelo backend
  titulo: string;
  descricao: string;
  status: PedidoStatus;
  urgencia: PedidoUrgencia;
  created_at: string;       // ← Gerado pelo BD
  distrito_id: number;
  idioma_id: number;
  helper_id?: string;
  distritos: { nome: string };  // ← JOIN
  idiomas: { nome: string };    // ← JOIN
}
```

**Por que usar DTO?**
- ✅ Segurança: Frontend não pode enviar `user_id` falso
- ✅ Clareza: Sabemos exatamente o que o formulário envia
- ✅ Validação: TypeScript valida campos em compile-time

---

### **2. Reactive Forms (Angular)**

**O que são?**
- Formulários geridos **programaticamente** (não no template)
- Estado do formulário é um Observable (RxJS)

**Vantagens:**
- ✅ Type-safe (TypeScript)
- ✅ Validações dinâmicas
- ✅ Testável (sem DOM)
- ✅ Reactive (mudanças propagam automaticamente)

**Exemplo:**
```typescript
readonly pedidoForm = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(5)]],
  descricao: ['', [Validators.required, Validators.minLength(10)]]
});

// Acessar valor:
const titulo = this.pedidoForm.get('titulo')?.value;

// Verificar se válido:
if (this.pedidoForm.invalid) { ... }

// Marcar todos como touched (mostrar erros):
this.pedidoForm.markAllAsTouched();
```

---

### **3. forkJoin (RxJS)**

**O que é?**
- Operador que executa múltiplos Observables **em paralelo**
- Espera **todos** completarem
- Retorna objeto/array com resultados

**Exemplo:**
```typescript
forkJoin({
  pedido: this.pedidoService.obterPorId('abc'),
  distritos: this.pedidoService.obterDistritos(),
  idiomas: this.pedidoService.obterIdiomas()
}).subscribe((dados) => {
  console.log(dados.pedido);     // { id: 'abc', ... }
  console.log(dados.distritos);  // [ { id: 1, nome: 'Lisboa' }, ... ]
  console.log(dados.idiomas);    // [ { id: 1, nome: 'Inglês' }, ... ]
});
```

**Por que usar?**
- ✅ Performance: 3 requests em paralelo (não sequenciais)
- ✅ Sincronização: Só executa subscribe quando TODOS completaram
- ✅ Organização: Resultados agrupados num objeto

---

### **4. switchMap (RxJS)**

**O que é?**
- Operador que **troca** um Observable por outro
- Cancela Observable anterior se novo emitir

**Exemplo:**
```typescript
this.getAuthHeaders().pipe(
  switchMap((headers) => this.http.get(url, { headers }))
)

// Fluxo:
// 1. getAuthHeaders() emite HttpHeaders
// 2. switchMap recebe headers
// 3. switchMap retorna novo Observable (http.get)
// 4. Subscriber recebe resultado do http.get
```

**Por que usar?**
- ✅ Encadeamento: Observable → Observable → valor final
- ✅ Cancelamento: Se novo token vier, cancela request antigo

---

### **5. finalize (RxJS)**

**O que é?**
- Operador que executa callback **sempre** (sucesso ou erro)
- Similar a `finally` em Promises

**Exemplo:**
```typescript
this.pedidoService.obterPedidos()
  .pipe(finalize(() => this.carregando = false))
  .subscribe({
    next: (dados) => console.log(dados),
    error: (erro) => console.error(erro)
  });

// carregando = false executa SEMPRE (next ou error)
```

**Por que usar?**
- ✅ Garante cleanup (esconder spinner, fechar modal)
- ✅ Evita duplicação (não precisa em next E error)

---

### **6. Supabase JOINs Automáticos**

**Sintaxe:**
```javascript
supabase
  .from('pedidos')
  .select(`
    *,
    distritos (nome),
    idiomas (nome)
  `)
```

**SQL Gerado:**
```sql
SELECT pedidos.*, 
       distritos.nome as "distritos.nome",
       idiomas.nome as "idiomas.nome"
FROM pedidos
LEFT JOIN distritos ON pedidos.distrito_id = distritos.id
LEFT JOIN idiomas ON pedidos.idioma_id = idiomas.id
```

**Resultado:**
```json
{
  "id": "abc-123",
  "titulo": "Ajuda com documentos",
  "distrito_id": 1,
  "distritos": { "nome": "Lisboa" },
  "idioma_id": 2,
  "idiomas": { "nome": "Inglês" }
}
```

**Vantagens:**
- ✅ Menos código (não precisa mapear manualmente)
- ✅ Performance (1 query em vez de N+1)
- ✅ Type-safe (Supabase gera tipos TypeScript)

---

### **7. Validação Dual (Frontend + Backend)**

**Frontend (UX):**
```typescript
readonly pedidoForm = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(5)]]
});

if (this.pedidoForm.invalid) {
  this.pedidoForm.markAllAsTouched();  // Mostra erros visuais
  return;
}
```

**Backend (Segurança):**
```javascript
exports.criar = async (req, res) => {
  const { titulo } = req.body;
  
  if (!titulo || titulo.length < 5) {
    return res.status(400).json({ erro: 'Título inválido.' });
  }
  
  // ...
};
```

**Por que ambos?**
- ✅ Frontend: Melhor UX (feedback instantâneo)
- ✅ Backend: Segurança (não confia em frontend)
- ✅ Nunca apenas frontend (user pode manipular request)

---

### **8. Permissões Baseadas em User**

**Frontend:**
```typescript
isDonoDoPedido = pedido.user_id === usuarioAtualId;

<button *ngIf="isDonoDoPedido" (click)="editar()">Editar</button>
```

**Backend:**
```javascript
if (pedidoExistente.user_id !== req.user.id) {
  return res.status(403).json({ erro: 'Sem permissão.' });
}
```

**Princípio:**
- ✅ Frontend: Esconde botões (UX)
- ✅ Backend: Valida permissão (segurança)
- ✅ Mesmo que user manipule HTML, backend bloqueia

---

