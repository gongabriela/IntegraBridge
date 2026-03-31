import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IPedido } from '../../models/pedido.model';

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalhe-pedido.html',
  styleUrl: './detalhe-pedido.css'
})
export class DetalhePedidoComponent implements OnInit {
  
  // DADOS FALSOS (MOCK) APENAS PARA A FASE 1
  pedido: IPedido = {
    id: '4902-ABCD-EFGH',
    user_id: 'user-123',
    titulo: 'Legal Documentation Support for Asylum Application',
    descricao: 'The applicant is seeking comprehensive assistance in translating and notarizing official identification documents and educational transcripts from their country of origin for a pending asylum application process.\n\nCritical documents include: Original Birth Certificate, University Diploma in Civil Engineering, and a detailed personal statement that requires linguistic refinement for official submission.\n\nPriority is marked as high due to an upcoming hearing scheduled for early December.',
    status: 'em_progresso',
    urgencia: 'alta',
    created_at: new Date().toISOString(),
    distritos: { nome: 'Setúbal' },
    idiomas: { nome: 'Inglês' }
  };

  // Variável para a secção de utilizadores atribuídos que pediste
  ajudantesAtribuidos: number = 2;
  // 1. Variável de controlo da Modal
  mostrarModalApagar: boolean = false;

  ngOnInit(): void {
    // Na Fase 2, faremos a subscrição do ActivatedRoute e chamaremos a API aqui.
  }

  // 2. Métodos de controlo
  abrirModalApagar(): void {
    this.mostrarModalApagar = true;
  }

  fecharModalApagar(): void {
    this.mostrarModalApagar = false;
  }

  confirmarApagar(): void {
    // depois chamaremos o this.pedidoService.apagarPedido() aqui
    console.log('A apagar o pedido:', this.pedido.id);
    this.fecharModalApagar(); 
  }
}