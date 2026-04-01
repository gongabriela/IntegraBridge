import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido } from '../../models/pedido.model';
import { VoluntariadoService } from '../../services/voluntariado';

@Component({
  selector: 'app-meus-pedidos',
  standalone: true,
  imports: [CardPedidoComponent, RouterModule],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.css'
})
export class MeusPedidosComponent implements OnInit {
  private voluntariadoService = inject(VoluntariadoService);
  private cdr = inject(ChangeDetectorRef);
  
  // Estado da Página
  meusPedidos: IPedido[] = [];
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
        },
        error: (erro) => {
          console.error('Erro ao carregar meus pedidos:', erro);
          this.erro = 'Não foi possível carregar os teus pedidos. Verifica a tua ligação.';
        }
      });
  }
}