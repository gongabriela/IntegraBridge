import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CriarPedido } from './pages/criar-pedido/criar-pedido';
import { PedidoDetalhe } from './pages/pedido-detalhe/pedido-detalhe';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'criar-pedido', component: CriarPedido, canActivate: [authGuard] },
  { path: 'pedido/:id', component: PedidoDetalhe, canActivate: [authGuard] },

];