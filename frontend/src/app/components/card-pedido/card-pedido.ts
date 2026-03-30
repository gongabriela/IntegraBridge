import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para o pipe 'titlecase'
import { IPedido } from '../../models/pedido.model';

@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './card-pedido.html', // Aponta para o novo ficheiro
  styleUrl: './card-pedido.css'      // Aponta para o novo ficheiro
})
export class CardPedidoComponent {
  @Input({ required: true }) dados!: IPedido;
}