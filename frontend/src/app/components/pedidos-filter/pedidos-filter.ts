import { Component, EventEmitter, Input, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFiltrosPedidos, IFiltroConfig } from '../../models/filter.model';
import { IDistrito, IIdioma, LISTA_STATUS, LISTA_URGENCIA } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';

@Component({
  selector: 'app-pedidos-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-filter.html',
  styleUrl: './pedidos-filter.css',
})
export class PedidosFilter implements OnInit {
  @Input() config: IFiltroConfig = {
    mostrarDistrito: true,
    mostrarIdioma: true,
    mostrarUrgencia: true,
    mostrarStatus: true
  };

  @Output() filtrosAlterados = new EventEmitter<IFiltrosPedidos>();

  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  distritos: IDistrito[] = [];
  idiomas: IIdioma[] = [];
  
  listaStatus = LISTA_STATUS;
  listaUrgencia = LISTA_URGENCIA;

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
   * Aplica os filtros selecionados.
   * Emite um evento para o componente pai.
   */
  aplicarFiltros(): void {
    this.filtrosAlterados.emit(this.filtrosSelecionados);
  }

  /**
   * Limpa todos os filtros.
   * Reseta para valores null e emite evento.
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
