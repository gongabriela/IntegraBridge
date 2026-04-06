import { PedidoStatus, PedidoUrgencia } from './pedido.model';

/**
 * Interface para valores dos filtros aplicados aos pedidos.
 * Valores null indicam "não filtrar" (mostrar todos).
 */
export interface IFiltrosPedidos {
  distrito_id: number | null;
  idioma_id: number | null;
  urgencia: PedidoUrgencia | null;
  status: PedidoStatus | null;
}

/**
 * Interface de configuração do componente PedidosFilter.
 * Controla quais filtros são exibidos (true = mostrar, false = ocultar).
 */
export interface IFiltroConfig {
  mostrarDistrito: boolean;
  mostrarIdioma: boolean;
  mostrarUrgencia: boolean;
  mostrarStatus: boolean;
}