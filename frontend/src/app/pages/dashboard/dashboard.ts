import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido, PedidoStatus, PedidoUrgencia } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
import { AuthService } from '../../services/auth';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardPedidoComponent], // 2. Importamos o componente do cartão aqui
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {

  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  meusPedidos: IPedido[] = [];

  ngOnInit(): void {
      this.authService.supabase.auth.getUser().then(res => {
    console.log('ID do utilizador atual:', res.data.user?.id);
  });
    this.pedidoService.obterPedidos().subscribe({
      next: (dados) => {
        this.meusPedidos = dados;
        console.log('Pedidos obtidos:', this.meusPedidos);
        this.cdr.detectChanges(); // Força a detecção de mudanças
      },
      error: (erro) => {
        console.error('Erro ao obter pedidos:', erro);
      }
    });
  }
}