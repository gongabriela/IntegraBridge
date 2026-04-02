import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { PedidosFilter } from '../../components/pedidos-filter/pedidos-filter';
import { IPedido } from '../../models/pedido.model';
import { IFiltrosPedidos } from '../../models/filter.model';
import { VoluntariadoService } from '../../services/voluntariado';

@Component({
  selector: 'app-meus-pedidos',
  standalone: true,
  imports: [CardPedidoComponent, RouterModule, PedidosFilter],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.css'
})
export class MeusPedidosComponent implements OnInit {
  private voluntariadoService = inject(VoluntariadoService);
  private cdr = inject(ChangeDetectorRef);
  
  // Estado da Página
  meusPedidos: IPedido[] = [];
  pedidosOriginais: IPedido[] = [];    // ← NOVO: Lista original completa
  pedidosFiltrados: IPedido[] = [];    // ← NOVO: Lista após aplicar filtros
  carregando: boolean = true;
  erro: string = '';

  ngOnInit(): void {
    this.carregarMeusPedidos();
  }

  private carregarMeusPedidos(): void {
    this.voluntariadoService.obterMeusPedidos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (dados) => {
          this.meusPedidos = dados;
          this.pedidosOriginais = dados;        // ← NOVO: Guarda original
          this.pedidosFiltrados = dados;        // ← NOVO: Inicialmente todos visíveis
        },
        error: (erro) => {
          console.error('Erro ao carregar meus pedidos:', erro);
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
      // Filtro por distrito
      if (filtros.distrito_id !== null && pedido.distrito_id !== filtros.distrito_id) {
        return false;
      }

      // Filtro por idioma
      if (filtros.idioma_id !== null && pedido.idioma_id !== filtros.idioma_id) {
        return false;
      }

      // Filtro por urgência
      if (filtros.urgencia !== null && pedido.urgencia !== filtros.urgencia) {
        return false;
      }

      // Filtro por status
      if (filtros.status !== null && pedido.status !== filtros.status) {
        return false;
      }

      return true; // Pedido passou por todos os filtros
    });
  }
}