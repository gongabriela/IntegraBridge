import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Componente de navegação superior (navbar).
 * Mostra título da página e botão hamburger para abrir sidebar.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  /** Título da página exibido na navbar */
  @Input() title = 'IntegraBridge';
  
  /** Descrição opcional da página */
  @Input() description = '';
  
  /** Evento emitido ao clicar no botão hamburger para toggle sidebar */
  @Output() toggleSidebar = new EventEmitter<void>();
}