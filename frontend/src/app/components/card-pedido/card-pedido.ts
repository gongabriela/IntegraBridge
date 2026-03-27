import { Component, Input } from '@angular/core';
import { IPedido } from '../../models/pedido.model'; // O caminho pode variar consoante as tuas pastas

@Component({
  selector: 'app-card-pedido',
  standalone: true,
  template: `
    <div class="card-teste">
      <h4>{{ dados.titulo }}</h4>
      <p>{{ dados.categoria }}</p>
      <span>● {{ dados.status }}</span>
    </div>
  `,
  // Podemos adicionar estilos diretamente no componente para testes rápidos
  styles: [`
    .card-teste { border: 1px solid #ddd; padding: 20px; border-radius: 15px; background: white; }
    h4 { margin: 0; }
    p { color: gray; font-size: 14px; }
  `]
})
export class CardPedidoComponent { // <--- Adicionado "Component"
  @Input({ required: true }) dados!: IPedido; 
}