import { Component, inject, OnInit } from '@angular/core';
import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido, PedidoStatus, PedidoUrgencia } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardPedidoComponent], // 2. Importamos o componente do cartão aqui
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {

  private pedidoService = inject(PedidoService);
  meusPedidos: IPedido[] = [];

  ngOnInit(): void {
    this.pedidoService.obterPedidos().subscribe({
      next: (dados) => {
        this.meusPedidos = dados;
        console.log('Pedidos obtidos:', this.meusPedidos);
      },
      error: (erro) => {
        console.error('Erro ao obter pedidos:', erro);
      }
    });
  }
}