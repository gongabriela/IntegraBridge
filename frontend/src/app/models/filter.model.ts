import { PedidoStatus, PedidoUrgencia } from './pedido.model';

export interface IFiltrosPedidos {
  distrito_id: number | null;
  idioma_id: number | null;
  urgencia: PedidoUrgencia | null;
  status: PedidoStatus | null;
}

export interface IFiltroConfig {
  mostrarDistrito: boolean;
  mostrarIdioma: boolean;
  mostrarUrgencia: boolean;
  mostrarStatus: boolean;
}