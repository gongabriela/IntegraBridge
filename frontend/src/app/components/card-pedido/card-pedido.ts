import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { IPedido } from '../../models/pedido.model';

@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './card-pedido.html',
  styleUrl: './card-pedido.css'
})
export class CardPedidoComponent {
  @Input({ required: true }) dados!: IPedido;

  get statusFormatado(): string {
    if (!this.dados?.status) return '';
    if (this.dados.status === 'em_progresso') return 'Em Progresso';
    
    return this.dados.status.charAt(0).toUpperCase() + this.dados.status.slice(1);
  }

  get idFormatado(): string {
    if (!this.dados?.id) return 'N/A';
    return `REQ-${this.dados.id.substring(0, 6).toUpperCase()}`;
  }
}