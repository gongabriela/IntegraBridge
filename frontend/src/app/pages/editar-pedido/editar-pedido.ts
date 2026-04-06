import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { PedidoService } from '../../services/pedido';
import { IDistrito, IIdioma, PedidoStatus, PedidoUrgencia, LISTA_STATUS, LISTA_URGENCIA } from '../../models/pedido.model';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';

/**
 * Componente para edição de pedidos de ajuda existentes.
 * Carrega pedido por ID, preenche formulário e permite atualizar. Status não é editável.
 */
@Component({
  selector: 'app-editar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertModalComponent],
  templateUrl: './editar-pedido.html',
  styleUrl: './editar-pedido.css'
})
export class EditarPedidoComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  /** ID do pedido a editar (extraído da rota) */
  pedidoId: string = '';
  
  /** Indica se dados estão carregando */
  carregando: boolean = true;
  
  /** Indica se salvamento está em progresso */
  salvando: boolean = false;
  
  /** Mensagem de erro caso carregamento falhe */
  erro: string = '';

  /** Lista de idiomas disponíveis */
  idiomas: IIdioma[] = [];
  
  /** Lista de distritos disponíveis */
  distritos: IDistrito[] = [];
  
  /** Opções de urgência (constante) */
  readonly opcoesUrgencia = LISTA_URGENCIA;

  /** Controla exibição do modal de feedback */
  mostrarAlert = false;
  
  /** Configuração do alert modal */
  alertConfig = { titulo: '', mensagem: '', tipo: 'sucesso' as 'sucesso' | 'erro', redirecionar: false };
  
  /** Status original do pedido (não editável, mantido no update) */
  statusOriginal: PedidoStatus = 'pendente';
  
  /** Formulário reativo de edição */
  pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    urgencia: [this.opcoesUrgencia[1], [Validators.required]],
    distrito_id: [0, [Validators.required]],
    idioma_id: [0, [Validators.required]]
  });

  ngOnInit(): void {
    this.pedidoId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.pedidoId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.carregarDados();
  }

  /**
   * Carrega dados do pedido e dropdowns (distritos/idiomas) em paralelo usando forkJoin.
   * Preenche formulário com valores atuais do pedido.
   */
  private carregarDados(): void {
    forkJoin({
      pedido: this.pedidoService.obterPorId(this.pedidoId),
      distritos: this.pedidoService.obterDistritos(),
      idiomas: this.pedidoService.obterIdiomas()
    }).pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (dados) => {
        this.distritos = dados.distritos;
        this.idiomas = dados.idiomas;
        const p = dados.pedido; 
        
        this.statusOriginal = p.status;

        this.pedidoForm.patchValue({
          titulo: p.titulo,
          descricao: p.descricao,
          urgencia: p.urgencia,
          distrito_id: p.distrito_id || 0,
          idioma_id: p.idioma_id || 0
        });
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.erro = 'Não foi possível carregar o pedido para edição.';
      }
    });
  }

  /**
   * Submete alterações do formulário.
   * Mantém status original (não permite alteração). Mostra modal de sucesso/erro.
   */
  onSubmit(): void {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const raw = this.pedidoForm.getRawValue();
    const payload = {
      titulo: raw.titulo,
      descricao: raw.descricao,
      status: this.statusOriginal,
      urgencia: raw.urgencia as PedidoUrgencia,
      distrito_id: raw.distrito_id || 0,
      idioma_id: raw.idioma_id || 0
    };
    this.pedidoService.atualizarPedido(this.pedidoId, payload)
      .pipe(finalize(() => this.salvando = false))
      .subscribe({
        next: () => {
          this.alertConfig = {
            titulo: 'Alterações Guardadas',
            mensagem: 'O pedido foi atualizado com sucesso.',
            tipo: 'sucesso',
            redirecionar: true
          };
          this.mostrarAlert = true;
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (err) => {
          console.error('Erro ao guardar:', err);
          this.alertConfig = {
            titulo: 'Erro ao guardar',
            mensagem: 'Não foi possível atualizar o pedido. Tente novamente mais tarde.',
            tipo: 'erro',
            redirecionar: false
          };
          this.mostrarAlert = true;
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
  }

  /**
   * Callback ao fechar modal.
   * Se redirecionar: true, navega para página de detalhe do pedido.
   */
  aoFecharAlert(): void {
    this.mostrarAlert = false;
    if (this.alertConfig.redirecionar) {
      this.router.navigate(['/pedido', this.pedidoId]);
    }
  }
}