import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IPedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
import { AuthService } from '../../services/auth'; // <-- IMPORTANTE
import { finalize } from 'rxjs';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';
import { IContacto } from '../../models/contacto.model';
import { VoluntariadoService } from '../../services/voluntariado';

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, AlertModalComponent],
  templateUrl: './detalhe-pedido.html',
  styleUrl: './detalhe-pedido.css'
})
export class DetalhePedidoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private voluntariadoService = inject(VoluntariadoService);

  pedido: IPedido | null = null;
  carregando: boolean = true;
  erro: string = '';

  ajudantesAtribuidos: number = 0;
  mostrarModalApagar: boolean = false;
  mostrarModalConcluir: boolean = false;
  
  usuarioAtualId: string | null = null;
  isDonoDoPedido: boolean = false;
  isHelperDoPedido: boolean = false;

  mostrarAlert = false;
  alertConfig = { titulo: '', mensagem: '', tipo: 'erro' as 'erro' };

  carregandoAjuda: boolean = false;
  carregandoConcluir: boolean = false;
  
  mostrarModalContacto: boolean = false;
  contactoParceiro: IContacto | null = null;
  carregandoContacto: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.authService.obterUtilizadorAtual().then(user => {
        this.usuarioAtualId = user?.id || null;
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
          this.isDonoDoPedido = this.usuarioAtualId === this.pedido?.user_id;
          this.isHelperDoPedido = this.usuarioAtualId === this.pedido?.helper_id;
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
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao apagar:', err);
        this.fecharModalApagar();
        this.alertConfig = {
          titulo: 'Erro ao apagar',
          mensagem: 'Ocorreu um erro ao apagar o pedido. Verifique as suas permissões.',
          tipo: 'erro'
        };
        this.mostrarAlert = true;
      }
    });
  }
  fecharAlert(): void {
    this.mostrarAlert = false;
  }

  /**
   * Oferece ajuda no pedido atual.
   * Apenas disponível para pedidos pendentes e usuários que não são donos.
   */
  oferecerMinhaAjuda(): void {
    if (!this.pedido || this.carregandoAjuda) return;

    this.carregandoAjuda = true;
    this.voluntariadoService.oferecerAjuda(this.pedido.id)
      .pipe(finalize(() => {
        this.carregandoAjuda = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (pedidoAtualizado) => {
          if (this.pedido) {
            this.pedido.status = pedidoAtualizado.status;
            this.pedido.helper_id = pedidoAtualizado.helper_id;
          }
          this.isHelperDoPedido = true;
          
          this.alertConfig = {
            titulo: 'Sucesso!',
            mensagem: 'Ofereceste ajuda com sucesso! O dono do pedido foi notificado.',
            tipo: 'erro'
          };
          this.mostrarAlert = true;
        },
        error: (err) => {
          console.error('Erro ao oferecer ajuda:', err);
          this.alertConfig = {
            titulo: 'Erro ao oferecer ajuda',
            mensagem: err.error?.erro || 'Ocorreu um erro. Verifica se o pedido ainda está disponível.',
            tipo: 'erro'
          };
          this.mostrarAlert = true;
        }
      });
  }

  /**
   * Abre o modal de confirmação para concluir pedido.
   */
  abrirModalConcluir(): void {
    this.mostrarModalConcluir = true;
  }

  fecharModalConcluir(): void {
    this.mostrarModalConcluir = false;
  }

  /**
   * Marca o pedido como concluído.
   * Apenas disponível para o dono ou helper quando pedido está em progresso.
   */
  concluirPedido(): void {
    if (!this.pedido || this.carregandoConcluir) return;

    this.fecharModalConcluir();
    this.carregandoConcluir = true;
    
    this.voluntariadoService.marcarComoConcluido(this.pedido.id)
      .pipe(finalize(() => {
        this.carregandoConcluir = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (pedidoAtualizado) => {
          if (this.pedido) {
            this.pedido.status = pedidoAtualizado.status;
            this.pedido.helper_id = pedidoAtualizado.helper_id;
          }
          
          this.alertConfig = {
            titulo: 'Pedido Concluído!',
            mensagem: 'O pedido foi marcado como concluído com sucesso.',
            tipo: 'erro'
          };
          this.mostrarAlert = true;
        },
        error: (err) => {
          console.error('Erro ao concluir pedido:', err);
          this.alertConfig = {
            titulo: 'Erro ao concluir',
            mensagem: err.error?.erro || 'Ocorreu um erro ao concluir o pedido.',
            tipo: 'erro'
          };
          this.mostrarAlert = true;
        }
      });
  }

  /**
   * Obtém e exibe o contacto do parceiro (dono ou helper).
   * Apenas disponível quando pedido está em progresso/concluído e user é dono ou helper.
   */
  verContacto(): void {
    if (!this.pedido || this.carregandoContacto) return;

    this.carregandoContacto = true;
    this.voluntariadoService.obterContactoParceiro(this.pedido.id)
      .pipe(finalize(() => {
        this.carregandoContacto = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (contacto) => {
          if (contacto) {
            this.contactoParceiro = contacto;
            this.mostrarModalContacto = true;
          } else {
            this.alertConfig = {
              titulo: 'Acesso Negado',
              mensagem: 'Não tens permissão para ver o contacto deste pedido.',
              tipo: 'erro'
            };
            this.mostrarAlert = true;
          }
        },
        error: (err) => {
          console.error('Erro ao obter contacto:', err);
          this.alertConfig = {
            titulo: 'Erro',
            mensagem: 'Não foi possível obter o contacto. Tenta novamente.',
            tipo: 'erro'
          };
          this.mostrarAlert = true;
        }
      });
  }

  fecharModalContacto(): void {
    this.mostrarModalContacto = false;
    this.contactoParceiro = null;
  }
}


