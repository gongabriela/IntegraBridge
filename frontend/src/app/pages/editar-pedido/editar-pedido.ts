import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { PedidoService } from '../../services/pedido';
import { IDistrito, IIdioma, PedidoStatus, PedidoUrgencia, LISTA_STATUS, LISTA_URGENCIA } from '../../models/pedido.model';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';

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

  // Variáveis de Estado
  pedidoId: string = '';
  carregando: boolean = true;
  salvando: boolean = false;
  erro: string = '';

  // Listas para os Dropdowns
  idiomas: IIdioma[] = [];
  distritos: IDistrito[] = [];
  readonly opcoesStatus = LISTA_STATUS;
  readonly opcoesUrgencia = LISTA_URGENCIA;

  mostrarAlert = false;
  alertConfig = { titulo: '', mensagem: '', tipo: 'sucesso' as 'sucesso' | 'erro', redirecionar: false };
  // Formulário Tipado
  pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    status: [this.opcoesStatus[0], [Validators.required]],
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

        // Preencher o formulário com os dados antigos
        this.pedidoForm.patchValue({
          titulo: p.titulo,
          descricao: p.descricao,
          status: p.status,
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
      status: raw.status as PedidoStatus,
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
        }
      });
  }

  aoFecharAlert(): void {
    this.mostrarAlert = false;
    if (this.alertConfig.redirecionar) {
      this.router.navigate(['/pedido', this.pedidoId]);
    }
  }
}