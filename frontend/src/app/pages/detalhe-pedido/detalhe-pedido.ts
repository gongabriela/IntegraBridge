import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IPedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
import { AuthService } from '../../services/auth'; // <-- IMPORTANTE
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
  private authService = inject(AuthService); // <-- Injetar o AuthService
  private cdr = inject(ChangeDetectorRef);

  pedido: IPedido | null = null;
  carregando: boolean = true;
  erro: string = '';

  ajudantesAtribuidos: number = 0;
  mostrarModalApagar: boolean = false;
  
  // Novas variáveis de controlo
  usuarioAtualId: string | null = null;
  isDonoDoPedido: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      // 1. Primeiro descobrimos quem nós somos
      this.authService.supabase.auth.getUser().then(({ data }) => {
        this.usuarioAtualId = data.user?.id || null;
        // 2. Depois carregamos o pedido
        this.carregarPedido(id);
      });
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
        next: (dados) => {
          this.pedido = dados;
          // 3. Verificamos se somos os donos
          this.isDonoDoPedido = this.usuarioAtualId === this.pedido.user_id;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar pedido:', err);
          this.erro = 'Não foi possível carregar os detalhes deste pedido.';
        }
      });
  }

  abrirModalApagar(): void { this.mostrarModalApagar = true; }
  fecharModalApagar(): void { this.mostrarModalApagar = false; }

  // A LÓGICA REAL DE APAGAR
  confirmarApagar(): void {
    if (!this.pedido) return;

    this.pedidoService.apagarPedido(this.pedido.id).subscribe({
      next: () => {
        this.fecharModalApagar();
        // Volta para o dashboard e força o recarregamento
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao apagar:', err);
        this.fecharModalApagar();
        alert('Ocorreu um erro ao apagar o pedido. Verifique as suas permissões.');
      }
    });
  }
}