import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { IPedido } from '../../models/pedido.model';

/**
 * Componente de visualização compacta de um pedido de ajuda.
 * Exibe informações essenciais (título, status, urgência, distrito) num card clicável.
 */
@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './card-pedido.html',
  styleUrl: './card-pedido.css'
})
export class CardPedidoComponent {
  /** Dados completos do pedido recebidos do componente pai (Dashboard ou Meus Pedidos) */
  @Input({ required: true }) dados!: IPedido;

  /**
   * Formata o status do pedido para exibição legível.
   * Converte 'pendente' → 'Pendente', 'em_progresso' → 'Em Progresso', 'concluido' → 'Concluido'.
   * @returns Status formatado com capitalização adequada
   */
  get statusFormatado(): string {
    if (!this.dados?.status) return '';
    if (this.dados.status === 'em_progresso') return 'Em Progresso';
    
    return this.dados.status.charAt(0).toUpperCase() + this.dados.status.slice(1);
  }

  /**
   * Gera identificador visual amigável para o pedido.
   * Converte UUID completo em código curto (ex: 'REQ-3F4A2B').
   * @returns ID formatado no padrão 'REQ-XXXXXX'
   */
  get idFormatado(): string {
    if (!this.dados?.id) return 'N/A';
    return `REQ-${this.dados.id.substring(0, 6).toUpperCase()}`;
  }
}