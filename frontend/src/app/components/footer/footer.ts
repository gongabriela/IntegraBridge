import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  // APAGAR COMENTARIO Pega o ano atual automaticamente do sistema
  anoAtual = new Date().getFullYear();
}