// 1. Espelhamos os ENUMs da Base de Dados
export type PedidoStatus = 'pendente' | 'em_progresso' | 'concluido';
export type PedidoUrgencia = 'baixa' | 'media' | 'alta';

// 2. O Contrato de Dados Real
export interface IPedido {
  id: string;               // Agora é um UUID longo do Supabase
  user_id: string;
  titulo: string;
  descricao: string;
  status: PedidoStatus;
  urgencia: PedidoUrgencia;
  created_at: string;       // Timestamp do Supabase
  
  // Como fizeste o `.select('*, distritos(nome), idiomas(nome)')` no backend, 
  // o Supabase devolve estes dados aninhados dentro de objetos:
  distritos: { nome: string };
  idiomas: { nome: string };
}