import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { ThemeService } from '../../services/theme.service';

/**
 * Componente de navegação lateral (sidebar).
 * Contém menu de navegação, perfil de utilizador e toggle de tema.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  /** Controla se sidebar está visível (mobile) */
  @Input() isOpen = false;
  
  /** Nome do utilizador autenticado */
  @Input() nomeUtilizador = 'Carregando...';
  
  /** Email do utilizador autenticado */
  @Input() emailUtilizador = '';
  
  /** Inicial do nome para avatar */
  @Input() inicialAvatar = '';

  /** Evento emitido ao fechar sidebar (mobile) */
  @Output() sidebarClose = new EventEmitter<void>();
  
  /** Evento emitido ao clicar em logout */
  @Output() logoutAction = new EventEmitter<void>();

  private themeService = inject(ThemeService);
  
  /** Observable do tema atual para exibir ícone correto */
  currentTheme$ = this.themeService.currentTheme$;

  /**
   * Alterna entre light e dark mode chamando ThemeService.
   * Segue Single Responsibility: delega lógica ao service.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}