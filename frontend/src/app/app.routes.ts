import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CriarPedido } from './pages/criar-pedido/criar-pedido';
import { DetalhePedidoComponent } from './pages/detalhe-pedido/detalhe-pedido';
import { authGuard } from './guards/auth-guard';
import { MainLayout } from './layouts/main-layout/main-layout';
// Importar o Editar quando o criares:
// import { EditarPedido } from './pages/editar-pedido/editar-pedido';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '', 
    component: MainLayout, // Carrega o Esqueleto (Sidebar + Header)
    canActivate: [authGuard], // Protege todas as rotas filhas
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'criar-pedido', component: CriarPedido },
      
      // Movi o detalhe-pedido para dentro do MainLayout!
      { path: 'pedido/:id', component: DetalhePedidoComponent },
      
      // Já deixamos a rota de editar preparada para o próximo passo:
      // { path: 'pedido/:id/editar', component: EditarPedido },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];