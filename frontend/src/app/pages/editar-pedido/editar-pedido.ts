import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-editar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editar-pedido.html',
  styleUrl: './editar-pedido.css'
})
export class EditarPedidoComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);

  // DADOS FALSOS (MOCK) PARA A FASE 1
  idiomas = [{ id: 1, nome: 'Inglês' }, { id: 2, nome: 'Português' }, { id: 3, nome: 'Espanhol' }];
  distritos = [{ id: 1, nome: 'Setúbal' }, { id: 2, nome: 'Lisboa' }, { id: 3, nome: 'Porto' }];
  
  opcoesStatus = ['pendente', 'em_progresso', 'concluido'];
  opcoesUrgencia = ['baixa', 'media', 'alta'];

  // O ID do pedido falso para o botão "Cancelar" saber para onde voltar
  pedidoId = '4902-ABCD-EFGH';

  pedidoForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    status: ['pendente', [Validators.required]],
    urgencia: ['media', [Validators.required]],
    distrito_id: [0, [Validators.required]],
    idioma_id: [0, [Validators.required]]
  });

  ngOnInit(): void {
    // Simulamos a receção dos dados antigos e preenchemos o formulário
    this.pedidoForm.patchValue({
      titulo: 'Legal Documentation Support for Asylum Application',
      descricao: 'The applicant is seeking comprehensive assistance in translating...',
      status: 'em_progresso',
      urgencia: 'alta',
      distrito_id: 1,
      idioma_id: 1
    });
  }

  onSubmit(): void {
    // Na Fase 2, isto enviará o PUT para a API
    console.log('Formulário a submeter:', this.pedidoForm.getRawValue());
  }
}