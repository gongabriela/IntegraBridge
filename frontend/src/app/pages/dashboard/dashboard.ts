import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { PedidosFilter } from '../../components/pedidos-filter/pedidos-filter';
import { IPedido } from '../../models/pedido.model';
import { IFiltrosPedidos } from '../../models/filter.model';
import { PedidoService } from '../../services/pedido';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardPedidoComponent, RouterModule, PedidosFilter],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);
  
  meusPedidos: IPedido[] = [];
  pedidosOriginais: IPedido[] = [];
  pedidosFiltrados: IPedido[] = [];
  carregando: boolean = true;
  erro: string = '';

  get casosAtivos(): number {
    return this.pedidosOriginais.filter(pedido => pedido.status !== 'concluido').length;
  }

  get revisoesUrgentes(): number {
    return this.pedidosOriginais.filter(pedido => 
      pedido.status === 'pendente' && pedido.urgencia === 'alta'
    ).length;
  }

  get emProcessamento(): number {
    return this.pedidosOriginais.filter(pedido => pedido.status === 'em_progresso').length;
  }

  ngOnInit(): void {
    this.carregarPedidos();
  }

  private carregarPedidos(): void {
    this.pedidoService.obterPedidos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (dados) => {
          this.meusPedidos = dados;
          this.pedidosOriginais = dados;
          this.pedidosFiltrados = dados;
        },
        error: (erro) => {
          console.error('Erro de API:', erro);
          this.erro = 'Não foi possível carregar os teus pedidos. Verifica a tua ligação.';
        }
      });
  }

  /**
   * Método chamado quando o componente de filtros emite evento.
   * Aplica filtros acumulativos (AND logic).
   */
  aplicarFiltros(filtros: IFiltrosPedidos): void {
    this.pedidosFiltrados = this.pedidosOriginais.filter(pedido => {
      if (filtros.distrito_id !== null && pedido.distrito_id !== filtros.distrito_id) {
        return false;
      }

      if (filtros.idioma_id !== null && pedido.idioma_id !== filtros.idioma_id) {
        return false;
      }

      if (filtros.urgencia !== null && pedido.urgencia !== filtros.urgencia) {
        return false;
      }

      if (filtros.status !== null && pedido.status !== filtros.status) {
        return false;
      }

      return true;
    });
  }
}