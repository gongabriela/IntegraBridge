import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente modal reutilizável para exibir alertas de sucesso ou erro.
 * Mostra overlay com mensagem e botão fechar. Tipo determina estilo visual (verde/vermelho).
 */
@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css'
})
export class AlertModalComponent {
  /** Título do modal exibido no topo */
  @Input() titulo = '';
  
  /** Mensagem principal do modal (corpo) */
  @Input() mensagem = '';
  
  /** Tipo do alerta: 'sucesso' (verde) ou 'erro' (vermelho) */
  @Input() tipo: 'sucesso' | 'erro' = 'sucesso';
  
  /** Emite evento quando user clica no botão fechar ou overlay */
  @Output() fechar = new EventEmitter<void>(); 
}