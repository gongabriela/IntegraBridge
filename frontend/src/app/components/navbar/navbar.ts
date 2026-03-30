import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  // APAGAR COMENTARIO A página pai vai poder injetar estes textos! Definimos valores por defeito:
  @Input() title = 'IntegraBridge';
  @Input() description = '';

  // APAGAR COMENTARIO O megafone para avisar que o menu mobile deve abrir
  @Output() toggleSidebar = new EventEmitter<void>();
}