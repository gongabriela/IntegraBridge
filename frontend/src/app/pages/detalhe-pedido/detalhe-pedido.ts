import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IPedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido';
import { AuthService } from '../../services/auth';
import { finalize } from 'rxjs';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';
import { IContacto } from '../../models/contacto.model';
import { VoluntariadoService } from '../../services/voluntariado';

/**
 * Página de detalhes de um pedido de ajuda.
 * Exibe informações completas e controla ações (oferecer ajuda, concluir, apagar, ver contacto).
 * Permissões dinâmicas baseadas no papel do user (dono/helper) e estado do pedido.
 */
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

  /** Dados completos do pedido carregado */
  pedido: IPedido | null = null;
  
  /** Estado de carregamento inicial */
  carregando = true;
  
  /** Mensagem de erro ao carregar pedido */
  erro = '';

  /** Número de ajudantes atribuídos ao pedido */
  ajudantesAtribuidos = 0;
  
  /** Controla visibilidade da modal de confirmação de apagar */
  mostrarModalApagar = false;
  
  /** Controla visibilidade da modal de confirmação de concluir */
  mostrarModalConcluir = false;
  
  /** ID do utilizador autenticado */
  usuarioAtualId: string | null = null;
  
  /** True se o user atual é o criador do pedido */
  isDonoDoPedido = false;
  
  /** True se o user atual é o helper atribuído */
  isHelperDoPedido = false;

  /** Controla visibilidade da modal de alerta */
  mostrarAlert = false;
  
  /** Configuração dinâmica da modal de alerta */
  alertConfig = { titulo: '', mensagem: '', tipo: 'erro' as const };

  /** Loading state do botão "Oferecer Ajuda" */
  carregandoAjuda = false;
  
  /** Loading state do botão "Marcar Concluído" */
  carregandoConcluir = false;
  
  /** Controla visibilidade da modal de contacto */
  mostrarModalContacto = false;
  
  /** Dados de contacto do parceiro (dono ou helper) */
  contactoParceiro: IContacto | null = null;
  
  /** Loading state do botão "Ver Contacto" */
  carregandoContacto = false;

  /**
   * Inicializa o componente obtendo o ID do pedido da rota.
   * Autentica o user atual e carrega dados do pedido.
   */
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

  /**
   * Carrega dados do pedido pelo ID e calcula permissões do user.
   * Define isDonoDoPedido e isHelperDoPedido para controle de UI.
   * @param id UUID do pedido a carregar
   */
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

  /** Abre modal de confirmação para apagar pedido */
  abrirModalApagar(): void { this.mostrarModalApagar = true; }
  
  /** Fecha modal de confirmação de apagar */
  fecharModalApagar(): void { this.mostrarModalApagar = false; }

  /**
   * Apaga permanentemente o pedido após confirmação.
   * Apenas o dono do pedido tem permissão. Redireciona para dashboard em sucesso.
   */
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
  
  /** Fecha modal de alerta */
  fecharAlert(): void {
    this.mostrarAlert = false;
  }

  /**
   * Oferece ajuda no pedido atual (transição pendente → em_progresso).
   * Atribui o user atual como helper e notifica o dono. Apenas disponível para não-donos.
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

  /** Abre modal de confirmação para concluir pedido */
  abrirModalConcluir(): void {
    this.mostrarModalConcluir = true;
  }

  /** Fecha modal de confirmação de concluir */
  fecharModalConcluir(): void {
    this.mostrarModalConcluir = false;
  }

  /**
   * Marca pedido como concluído (transição em_progresso → concluido).
   * Apenas dono ou helper podem marcar. Requer confirmação do user.
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
   * Obtém e exibe contacto do parceiro em modal.
   * Dono vê contacto do helper, helper vê contacto do dono. Requer pedido em_progresso/concluido.
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

  /** Fecha modal de contacto e limpa dados */
  fecharModalContacto(): void {
    this.mostrarModalContacto = false;
    this.contactoParceiro = null;
  }
}


