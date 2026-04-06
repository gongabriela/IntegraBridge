import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { AuthService } from '../../services/auth';

/**
 * Layout principal da aplicação (estrutura base de todas as páginas autenticadas).
 * Composto por: Navbar (topo), Sidebar (lateral), RouterOutlet (conteúdo), Footer (rodapé).
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, FooterComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  /** Controla visibilidade da sidebar (mobile) */
  isSidebarOpen = false;

  /** Nome do utilizador autenticado */
  nome = 'Carregando...';
  
  /** Email do utilizador autenticado */
  email = '';
  
  /** Inicial do nome para avatar */
  inicial = '';

  ngOnInit(): void {
    this.carregarDadosUtilizador();
  }

  /**
   * Carrega dados do utilizador autenticado via AuthService.
   * Extrai nome de user_metadata (guardado no registo).
   */
  private async carregarDadosUtilizador(): Promise<void> {
    const user = await this.authService.obterUtilizadorAtual();
    if (user) {
      this.nome = user.user_metadata?.['nome'] || 'Utilizador';
      this.email = user.email || '';
      this.inicial = this.nome.charAt(0).toUpperCase();
      this.cdr.detectChanges();
    }
  }

  /**
   * Alterna visibilidade da sidebar (mobile).
   * Chamado pelo botão hamburger da navbar.
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Realiza logout chamando AuthService e redireciona para /login.
   * Chamado pelo botão logout da sidebar.
   */
  async realizarLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}