import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { AuthService } from '../../services/auth';

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

  isSidebarOpen = false;

  nome: string = 'Carregando...';
  email: string = '';
  inicial: string = '';

  ngOnInit(): void {
    this.carregarDadosUtilizador();
  }

  private async carregarDadosUtilizador(): Promise<void> {
    const user = await this.authService.obterUtilizadorAtual();
    if (user) {
      this.nome = user.user_metadata?.['nome'] || 'Utilizador';
      this.email = user.email || '';
      this.inicial = this.nome.charAt(0).toUpperCase();
      this.cdr.detectChanges();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async realizarLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}