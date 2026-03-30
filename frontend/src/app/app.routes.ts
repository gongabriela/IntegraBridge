import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CriarPedido } from './pages/criar-pedido/criar-pedido';
import { PedidoDetalhe } from './pages/pedido-detalhe/pedido-detalhe';
import { authGuard } from './guards/auth-guard';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'criar-pedido', component: CriarPedido, canActivate: [authGuard] },
  { path: 'pedido/:id', component: PedidoDetalhe, canActivate: [authGuard] },
  {
    path: '', // APAGAR COMENTARIO Rota base protegida
    component: MainLayout, // APAGAR COMENTARIO Carrega o Esqueleto primeiro!
    canActivate: [authGuard], // APAGAR COMENTARIO Se tiveres o guard de autenticação, fica aqui
    children: [
      { path: 'dashboard', component: Dashboard },
      // APAGAR COMENTARIO No futuro, adicionarás aqui: { path: 'configuracoes', component: ConfigComponent }
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];