import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { PedidoService } from '../../services/pedido';
import { IDistrito, IIdioma, PedidoStatus, PedidoUrgencia } from '../../models/pedido.model';

@Component({
  selector: 'app-editar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editar-pedido.html',
  styleUrl: './editar-pedido.css'
})
export class EditarPedidoComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  // Variáveis de Estado
  pedidoId: string = '';
  carregando: boolean = true;
  salvando: boolean = false;
  erro: string = '';

  // Listas para os Dropdowns
  idiomas: IIdioma[] = [];
  distritos: IDistrito[] = [];
  opcoesStatus: PedidoStatus[] = ['pendente', 'em_progresso', 'concluido'];
  opcoesUrgencia: PedidoUrgencia[] = ['baixa', 'media', 'alta'];

  // Formulário Tipado
  pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    status: ['pendente' as PedidoStatus, [Validators.required]],
    urgencia: ['media' as PedidoUrgencia, [Validators.required]],
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

  private carregarDados(): void {
    // forkJoin faz os 3 pedidos HTTP ao mesmo tempo e espera que todos terminem!
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

        // O Supabase devolve as foreign keys (distrito_id) além dos objetos populados.
        // Fazemos cast para 'any' temporariamente para ler esses IDs de forma segura.
        const p = dados.pedido as any; 

        // Preencher o formulário com os dados antigos
        this.pedidoForm.patchValue({
          titulo: p.titulo,
          descricao: p.descricao,
          status: p.status,
          urgencia: p.urgencia,
          distrito_id: p.distrito_id,
          idioma_id: p.idioma_id
        });
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.erro = 'Não foi possível carregar o pedido para edição.';
      }
    });
  }

  onSubmit(): void {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const raw = this.pedidoForm.getRawValue();
    
    // Construir o pacote com os dados atualizados
    const payload = {
      titulo: raw.titulo,
      descricao: raw.descricao,
      status: raw.status as PedidoStatus,
      urgencia: raw.urgencia as PedidoUrgencia,
      distrito_id: Number(raw.distrito_id),
      idioma_id: Number(raw.idioma_id)
    };

    // Enviar o PUT para a API
    this.pedidoService.atualizarPedido(this.pedidoId, payload)
      .pipe(finalize(() => this.salvando = false))
      .subscribe({
        next: () => {
          // Sucesso! Volta à página de detalhes para ver como ficou
          this.router.navigate(['/pedido', this.pedidoId]);
        },
        error: (err) => {
          console.error('Erro ao atualizar:', err);
          alert('Ocorreu um erro ao guardar as alterações. Verifique as suas permissões.');
        }
      });
  }
}