import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() isOpen = false;
  
  @Input() nomeUtilizador: string = 'Carregando...';
  @Input() emailUtilizador: string = '';
  @Input() inicialAvatar: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() logoutAction = new EventEmitter<void>();

  // ✨ NOVO: Integração com ThemeService (ESCALANDO funcionalidade)
  private themeService = inject(ThemeService);
  currentTheme$ = this.themeService.currentTheme$;

  /**
   * Alterna entre light e dark mode.
   * Segue Single Responsibility: apenas chama o service.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}