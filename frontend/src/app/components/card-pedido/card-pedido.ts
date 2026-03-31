import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para o pipe 'titlecase'
import { IPedido } from '../../models/pedido.model';
import { RouterModule } from '@angular/router'; // Necessário para o [routerLink]
@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './card-pedido.html',
  styleUrl: './card-pedido.css'
})
export class CardPedidoComponent {
  @Input({ required: true }) dados!: IPedido;
}