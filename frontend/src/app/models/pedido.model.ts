export type PedidoStatus = 'pending' | 'in-progress' | 'completed' | 'urgent'

export interface IPedido {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pending' | 'in-progress' | 'completed' | 'urgent';
  categoria: string;
  data: string;
}