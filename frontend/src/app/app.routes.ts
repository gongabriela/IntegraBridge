import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CriarPedido } from './pages/criar-pedido/criar-pedido';
import { PedidoDetalhe } from './pages/pedido-detalhe/pedido-detalhe';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'criar-pedido', component: CriarPedido },
  { path: 'pedido/:id', component: PedidoDetalhe },
];