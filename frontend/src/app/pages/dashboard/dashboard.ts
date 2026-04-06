import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { PedidosFilter } from '../../components/pedidos-filter/pedidos-filter';
import { IPedido } from '../../models/pedido.model';
import { IFiltrosPedidos } from '../../models/filter.model';
import { PedidoService } from '../../services/pedido';

/**
 * Componente Dashboard para listar todos os pedidos da plataforma.
 * Mostra estatísticas resumidas e permite filtrar pedidos por distrito, idioma, urgência e status.
 * Usa finalize() para garantir que carregando=false em sucesso ou erro.
 */
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
  
  /** Array exibido no template (pode ser igual a pedidosOriginais ou filtrado) */
  meusPedidos: IPedido[] = [];
  
  /** Array original carregado da API (não muda após carregamento) */
  pedidosOriginais: IPedido[] = [];
  
  /** Array filtrado após aplicar filtros (usado para estatísticas após filtro) */
  pedidosFiltrados: IPedido[] = [];
  
  /** Indica se está a carregar dados da API */
  carregando: boolean = true;
  
  /** Mensagem de erro a mostrar ao utilizador */
  erro: string = '';

  /**
   * Calcula número de casos ativos (status !== 'concluido').
   * @returns Contagem de pedidos pendentes ou em progresso
   */
  get casosAtivos(): number {
    return this.pedidosOriginais.filter(pedido => pedido.status !== 'concluido').length;
  }

  /**
   * Calcula número de pedidos urgentes pendentes.
   * @returns Contagem de pedidos com urgencia='alta' e status='pendente'
   */
  get revisoesUrgentes(): number {
    return this.pedidosOriginais.filter(pedido => 
      pedido.status === 'pendente' && pedido.urgencia === 'alta'
    ).length;
  }

  /**
   * Calcula número de pedidos em processamento.
   * @returns Contagem de pedidos com status='em_progresso'
   */
  get emProcessamento(): number {
    return this.pedidosOriginais.filter(pedido => pedido.status === 'em_progresso').length;
  }

  ngOnInit(): void {
    this.carregarPedidos();
  }

  /**
   * Carrega todos os pedidos da API.
   * Usa finalize() para garantir que carregando=false independentemente de sucesso/erro.
   * Preenche 3 arrays: meusPedidos, pedidosOriginais, pedidosFiltrados.
   */
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
   * Aplica filtros aos pedidos.
   * Recebe objeto IFiltrosPedidos do componente PedidosFilter via evento.
   * Usa lógica AND (todos os filtros ativos devem passar).
   * @param filtros Objeto com distrito_id, idioma_id, urgencia, status (null = não filtrar)
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