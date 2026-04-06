import { Component, EventEmitter, Input, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFiltrosPedidos, IFiltroConfig } from '../../models/filter.model';
import { IDistrito, IIdioma, LISTA_STATUS, LISTA_URGENCIA } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';

/**
 * Componente de filtros configuráveis para pedidos de ajuda.
 * Permite filtrar por distrito, idioma, urgência e status. Config via @Input controla quais filtros mostrar.
 */
@Component({
  selector: 'app-pedidos-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-filter.html',
  styleUrl: './pedidos-filter.css',
})
export class PedidosFilter implements OnInit {
  /** Configuração de quais filtros mostrar (distrito, idioma, urgência, status) */
  @Input() config: IFiltroConfig = {
    mostrarDistrito: true,
    mostrarIdioma: true,
    mostrarUrgencia: true,
    mostrarStatus: true
  };

  /** Emite evento quando user aplica ou limpa filtros */
  @Output() filtrosAlterados = new EventEmitter<IFiltrosPedidos>();

  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  /** Lista de distritos carregada da BD */
  distritos: IDistrito[] = [];
  
  /** Lista de idiomas carregada da BD */
  idiomas: IIdioma[] = [];
  
  /** Lista de status possíveis (constante) */
  listaStatus = LISTA_STATUS;
  
  /** Lista de urgências possíveis (constante) */
  listaUrgencia = LISTA_URGENCIA;

  /** Estado atual dos filtros selecionados (null = não filtrar) */
  filtrosSelecionados: IFiltrosPedidos = {
    distrito_id: null,
    idioma_id: null,
    urgencia: null,
    status: null
  };

  ngOnInit(): void {
    this.carregarDistritos();
    this.carregarIdiomas();
  }

  /**
   * Carrega lista de distritos do backend para popular dropdown.
   * Usa ChangeDetectorRef para forçar re-render após carregamento assíncrono.
   */
  private carregarDistritos(): void {
    this.pedidoService.obterDistritos().subscribe({
      next: (dados) => { 
        this.distritos = dados; 
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar distritos:', erro);
      }
    });
  }

  /**
   * Carrega lista de idiomas do backend para popular dropdown.
   * Usa ChangeDetectorRef para forçar re-render após carregamento assíncrono.
   */
  private carregarIdiomas(): void {
    this.pedidoService.obterIdiomas().subscribe({
      next: (dados) => { 
        this.idiomas = dados; 
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar idiomas:', erro);
      }
    });
  }

  /**
   * Aplica filtros selecionados emitindo evento para componente pai.
   * Parent component (Dashboard) responsável por filtrar dados.
   */
  aplicarFiltros(): void {
    this.filtrosAlterados.emit(this.filtrosSelecionados);
  }

  /**
   * Limpa todos os filtros resetando para null e emite evento.
   * Permite parent component mostrar todos os pedidos novamente.
   */
  limparFiltros(): void {
    this.filtrosSelecionados = {
      distrito_id: null,
      idioma_id: null,
      urgencia: null,
      status: null
    };
    this.filtrosAlterados.emit(this.filtrosSelecionados);
  }
}
