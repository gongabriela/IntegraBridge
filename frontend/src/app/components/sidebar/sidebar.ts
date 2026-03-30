import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // APAGAR Recebe do Layout a ordem para abrir/fechar no telemóvel
  @Input() isOpen = false;
  
  //APAGAR Avisa o Layout quando o utilizador clica no fundo escuro para fechar
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  async sair() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}