import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardPedidoComponent, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);
  
  // Estado da Página
  meusPedidos: IPedido[] = [];
  carregando: boolean = true;
  erro: string = '';

  ngOnInit(): void {
    this.carregarPedidos();
  }

  private carregarPedidos(): void {
    this.pedidoService.obterPedidos()
      .pipe(
        // O finalize corre sempre, quer haja sucesso ou erro
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (dados) => {
          this.meusPedidos = dados;
        },
        error: (erro) => {
          console.error('Erro de API:', erro);
          this.erro = 'Não foi possível carregar os teus pedidos. Verifica a tua ligação.';
        }
      });
  }
}