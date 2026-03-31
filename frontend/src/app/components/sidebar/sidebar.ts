import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
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
}