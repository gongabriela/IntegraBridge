import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IPedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalhe-pedido.html',
  styleUrl: './detalhe-pedido.css'
})
export class DetalhePedidoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);
  
  // Agora o pedido começa vazio (null) e temos um estado de loading
  pedido: IPedido | null = null;
  carregando: boolean = true;
  erro: string = '';

  ajudantesAtribuidos: number = 0; // Vai ficar a 0 por enquanto

  mostrarModalApagar: boolean = false;

  ngOnInit(): void {
    // 1. Apanhar o ID que está no URL
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.carregarPedido(id);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private carregarPedido(id: string): void {
    this.pedidoService.obterPorId(id)
      .pipe(finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (dados) => { this.pedido = dados;},
        error: (err) => {
          console.error('Erro ao carregar pedido:', err);
          this.erro = 'Não foi possível carregar os detalhes deste pedido.';
        }
      });
  }

  abrirModalApagar(): void {
    this.mostrarModalApagar = true;
  }

  fecharModalApagar(): void {
    this.mostrarModalApagar = false;
  }

  confirmarApagar(): void {
    console.log('Faremos o delete aqui mais tarde');
    this.fecharModalApagar();
  }
}