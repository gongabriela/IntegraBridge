import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css'
})
export class AlertModalComponent {
  // Os dados que o componente pai (CriarPedido) envia para aqui
  @Input() titulo = '';
  @Input() mensagem = '';
  @Input() tipo: 'sucesso' | 'erro' = 'sucesso';
  
  // O evento que avisa o componente pai que o botão ou o fundo foi clicado
  @Output() fechar = new EventEmitter<void>(); 
}