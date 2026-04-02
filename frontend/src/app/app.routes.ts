import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CriarPedido } from './pages/criar-pedido/criar-pedido';
import { DetalhePedidoComponent } from './pages/detalhe-pedido/detalhe-pedido';
import { authGuard } from './guards/auth-guard';
import { MainLayout } from './layouts/main-layout/main-layout';
import { EditarPedidoComponent } from './pages/editar-pedido/editar-pedido';
import { MeusPedidosComponent } from './pages/meus-pedidos/meus-pedidos';
import { MinhasContribuicoesComponent } from './pages/minhas-contribuicoes/minhas-contribuicoes';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
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