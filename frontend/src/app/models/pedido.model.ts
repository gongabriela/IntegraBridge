// src/app/models/pedido.model.ts

export type PedidoStatus = 'pendente' | 'em_progresso' | 'concluido';
export type PedidoUrgencia = 'baixa' | 'media' | 'alta';

export interface IDistrito {
  id: number;
  nome: string;
}

export interface IIdioma {
  id: number;
  nome: string;
}

/**
 * 1. Interface para Criação (DTO)
 * Usamos o Pick para "escolher" apenas os campos que o formulário preenche.
 * Adicionamos os IDs que o formulário precisa enviar.
 */
export interface ICriarPedido {
  titulo: string;
  descricao: string;
  urgencia: PedidoUrgencia;
  distrito_id: number;
  idioma_id: number;
}

/**
 * 2. Interface original (MANTIDA IGUAL)
 * Não alteramos nada aqui para não quebrar o Dashboard ou os Cards.
 */
export interface IPedido {
  id: string;               
  user_id: string;
  titulo: string;
  descricao: string;
  status: PedidoStatus;
  urgencia: PedidoUrgencia;
  created_at: string;       
  
  // Os objetos que vêm do JOIN da base de dados
  distritos: { nome: string };
  idiomas: { nome: string };
}