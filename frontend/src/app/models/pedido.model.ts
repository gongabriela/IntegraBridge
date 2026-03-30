export type PedidoStatus = 'pendente' | 'em_progresso' | 'concluido';
export type PedidoUrgencia = 'baixa' | 'media' | 'alta';

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