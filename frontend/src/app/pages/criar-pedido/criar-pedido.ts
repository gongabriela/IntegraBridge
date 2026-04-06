import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PedidoService } from '../../services/pedido';
import { ICriarPedido, PedidoStatus, PedidoUrgencia, IDistrito, IIdioma, LISTA_STATUS, LISTA_URGENCIA} from '../../models/pedido.model';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';

/**
 * Componente para criar novos pedidos de ajuda.
 * Usa Reactive Forms com validações e forkJoin para carregar lookups em paralelo.
 * Mostra modal de sucesso/erro após submissão.
 */
@Component({
  selector: 'app-criar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertModalComponent],
  templateUrl: './criar-pedido.html',
  styleUrl: './criar-pedido.css',
})

export class CriarPedido implements OnInit {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  /** Lista de idiomas carregada da API para dropdown */
  idiomas: IIdioma[] = [];
  
  /** Lista de distritos carregada da API para dropdown */
  distritos: IDistrito[] = [];
  
  /** Opções de urgência (constante do model) */
  readonly opcoesUrgencia = LISTA_URGENCIA;

  /** Controla visibilidade da modal de sucesso/erro */
  mostrarModal = false;
  
  /** Configuração da modal (titulo, mensagem, tipo, redirecionar) */
  modalConfig = { titulo: '', mensagem: '', tipo: 'sucesso' as 'sucesso' | 'erro', redirecionar: false };

  /** 
   * Formulário reativo com validações.
   * - titulo: min 5 caracteres
   * - descricao: min 10 caracteres
   * - urgencia: default 'media' (index 1)
   * - distrito_id e idioma_id: required
   */
  readonly pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    urgencia: [this.opcoesUrgencia[1], [Validators.required]],
    distrito_id: ['', [Validators.required]],
    idioma_id: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.carregarDependencias();
  }

  /**
   * Carrega distritos e idiomas em paralelo usando forkJoin.
   * Preenche arrays para os dropdowns do formulário.
   */
  private carregarDependencias(): void {
    forkJoin({
      distritos: this.pedidoService.obterDistritos(),
      idiomas: this.pedidoService.obterIdiomas()
    }).subscribe({
      next: (dados) => {
        this.idiomas = dados.idiomas;
        this.distritos = dados.distritos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar lookups:', err)
    });
  }

  /**
   * Processa submissão do formulário.
   * Valida dados, chama service para criar pedido, e mostra modal de sucesso/erro.
   * Redireciona para /dashboard após sucesso.
   */
  onSubmit(): void {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    this.pedidoService.criarPedido(this.mapearParaDTO()).subscribe({
      next: () => {
        this.modalConfig = {
          titulo: 'Pedido Criado!',
          mensagem: 'O seu pedido de ajuda foi registado com sucesso na comunidade.',
          tipo: 'sucesso',
          redirecionar: true
        };
        this.mostrarModal = true;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.modalConfig = {
          titulo: 'Oops! Ocorreu um erro',
          mensagem: error.error?.erro || 'Não foi possível criar o pedido. Tente novamente mais tarde.',
          tipo: 'erro',
          redirecionar: false
        };
        this.mostrarModal = true;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Callback ao fechar modal.
   * Se redirecionar=true (sucesso), navega para /dashboard.
   */
  aoFecharModal(): void {
    this.mostrarModal = false;
    if (this.modalConfig.redirecionar) {
      this.router.navigate(['/dashboard']);
    }
  }
  
  /**
   * Mapeia valores do formulário para DTO esperado pela API.
   * Converte distrito_id e idioma_id de string para number.
   * Define status como 'pendente' para novos pedidos.
   * @returns Objeto ICriarPedido pronto para enviar ao backend
   */
  private mapearParaDTO(): ICriarPedido {
    const raw = this.pedidoForm.getRawValue();
    return {
      titulo: raw.titulo,
      descricao: raw.descricao,
      status: 'pendente' as PedidoStatus,
      urgencia: raw.urgencia as PedidoUrgencia,
      distrito_id: Number(raw.distrito_id),
      idioma_id: Number(raw.idioma_id)
    } as ICriarPedido;
  }
}