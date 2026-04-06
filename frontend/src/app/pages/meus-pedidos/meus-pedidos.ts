import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { PedidosFilter } from '../../components/pedidos-filter/pedidos-filter';
import { IPedido } from '../../models/pedido.model';
import { IFiltrosPedidos } from '../../models/filter.model';
import { VoluntariadoService } from '../../services/voluntariado';

/**
 * Componente "Meus Pedidos" - mostra pedidos criados pelo utilizador autenticado.
 * Integra filtros reutilizáveis e cards de pedidos. Filtragem client-side.
 */
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
  
  /** Pedidos do utilizador (não filtrados) */
  meusPedidos: IPedido[] = [];
  
  /** Lista original completa (backup para filtros) */
  pedidosOriginais: IPedido[] = [];
  
  /** Lista após aplicar filtros (exibida no template) */
  pedidosFiltrados: IPedido[] = [];
  
  /** Indica se dados estão carregando */
  carregando: boolean = true;
  
  /** Mensagem de erro caso carregamento falhe */
  erro: string = '';

  ngOnInit(): void {
    this.carregarMeusPedidos();
  }

  /**
   * Carrega pedidos do utilizador autenticado via VoluntariadoService.
   * Inicializa arrays de originais e filtrados com mesmos dados.
   */
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
          this.pedidosOriginais = dados;
          this.pedidosFiltrados = dados;
        },
        error: (erro) => {
          console.error('Erro ao carregar meus pedidos:', erro);
          this.erro = 'Não foi possível carregar os teus pedidos. Verifica a tua ligação.';
        }
      });
  }

  /**
   * Aplica filtros aos pedidos usando lógica AND (acumulativa).
   * Filtra client-side a partir de pedidosOriginais. Valores null indicam "não filtrar".
   * @param filtros - Objeto com distrito_id, idioma_id, urgencia, status
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