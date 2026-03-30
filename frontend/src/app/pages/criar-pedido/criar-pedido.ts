import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { PedidoService } from '../../services/pedido';
import { ICriarPedido, PedidoStatus, PedidoUrgencia, IDistrito, IIdioma } from '../../models/pedido.model';

@Component({
  selector: 'app-criar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
  readonly opcoesStatus: PedidoStatus[] = ['pendente', 'em_progresso', 'concluido'];
  readonly opcoesUrgencia: PedidoUrgencia[] = ['baixa', 'media', 'alta'];

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
   * Carrega os dados do Backend em paralelo
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

    const payload = this.mapearParaDTO();

    this.pedidoService.criarPedido(payload).subscribe({
      next: () => {
        alert('Pedido registado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        alert('Erro ao criar o pedido: ' + (error.error?.erro || 'Tente novamente mais tarde.'));
      }
    });
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
    };
  }
}