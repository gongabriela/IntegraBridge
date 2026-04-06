import { Component } from '@angular/core';

/**
 * Componente de rodapé da aplicação.
 * Mostra copyright dinâmico com ano atual.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  /** Ano atual para copyright dinâmico */
  anoAtual = new Date().getFullYear();
}