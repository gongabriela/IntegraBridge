import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { PedidoService } from '../../services/pedido';
import { ICriarPedido, PedidoStatus, PedidoUrgencia, IDistrito, IIdioma, LISTA_STATUS, LISTA_URGENCIA} from '../../models/pedido.model';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';

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

  // Listas originais que vêm da Base de Dados
  idiomas: IIdioma[] = [];
  distritos: IDistrito[] = [];
  
  // ENUMs para os dropdowns fixos
  readonly opcoesStatus = LISTA_STATUS;
  readonly opcoesUrgencia = LISTA_URGENCIA;

  mostrarModal = false;
  modalConfig = { titulo: '', mensagem: '', tipo: 'sucesso' as 'sucesso' | 'erro', redirecionar: false };

  // Formulário Tipado e Seguro
  readonly pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    status: ['pendente' as PedidoStatus, [Validators.required]],
    urgencia: ['media' as PedidoUrgencia, [Validators.required]],
    distrito_id: ['', [Validators.required]],
    idioma_id: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.carregarDependencias();
  }

  /**
   * Preenche os dropdown menus com a lista de distritos e idiomas da API
   */
  private carregarDependencias(): void {
    forkJoin({
      distritos: this.pedidoService.obterDistritos(),
      idiomas: this.pedidoService.obterIdiomas()
    }).subscribe({
      next: (dados) => {
        this.idiomas = dados.idiomas;
        this.distritos = dados.distritos;
      },
      error: (err) => console.error('Erro ao carregar lookups:', err)
    });
  }

  onSubmit(): void {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    //passamos a responsabilidade de envio para o servico
    this.pedidoService.criarPedido(this.mapearParaDTO()).subscribe({
      next: () => {
        this.modalConfig = {
          titulo: 'Pedido Criado!',
          mensagem: 'O seu pedido de ajuda foi registado com sucesso na comunidade.',
          tipo: 'sucesso',
          redirecionar: true
        };
        this.mostrarModal = true;
      },
      error: (error: HttpErrorResponse) => {
        this.modalConfig = {
          titulo: 'Oops! Ocorreu um erro',
          mensagem: error.error?.erro || 'Não foi possível criar o pedido. Tente novamente mais tarde.',
          tipo: 'erro',
          redirecionar: false
        };
        this.mostrarModal = true;
      }
    });
  }

  aoFecharModal(): void {
    this.mostrarModal = false;
    if (this.modalConfig.redirecionar) {
      this.router.navigate(['/dashboard']);
    }
  }
  /**
   * Converte os valores do formulário para o formato exigido pelo Supabase.
   * Os IDs (distrito e idioma) são convertidos de String para Number.
   */
  private mapearParaDTO(): ICriarPedido {
    const raw = this.pedidoForm.getRawValue();
    return {
      titulo: raw.titulo,
      descricao: raw.descricao,
      status: raw.status as PedidoStatus,
      urgencia: raw.urgencia as PedidoUrgencia,
      distrito_id: Number(raw.distrito_id),
      idioma_id: Number(raw.idioma_id)
    } as ICriarPedido;
  }
}