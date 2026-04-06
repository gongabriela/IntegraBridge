import { describe, it, expect } from 'vitest';
import { LISTA_STATUS, LISTA_URGENCIA, ICriarPedido } from './pedido.model';

describe('Pedido Model', () => {
  
  it('deve ter todos os valores de PedidoStatus em LISTA_STATUS', () => {
    expect(LISTA_STATUS).toContain('pendente');
    expect(LISTA_STATUS).toContain('em_progresso');
    expect(LISTA_STATUS).toContain('concluido');
    expect(LISTA_STATUS).toHaveLength(3);
  });

  it('deve ter todos os valores de PedidoUrgencia em LISTA_URGENCIA', () => {
    expect(LISTA_URGENCIA).toContain('baixa');
    expect(LISTA_URGENCIA).toContain('media');
    expect(LISTA_URGENCIA).toContain('alta');
    expect(LISTA_URGENCIA).toHaveLength(3);
  });

  it('deve criar um objeto ICriarPedido válido', () => {
    const pedido: ICriarPedido = {
      titulo: 'Ajuda com documentos',
      descricao: 'Preciso de ajuda para preencher formulários',
      status: 'pendente',
      urgencia: 'media',
      distrito_id: 1,
      idioma_id: 1
    };

    expect(pedido.titulo).toBe('Ajuda com documentos');
    expect(pedido.status).toBe('pendente');
    expect(pedido.urgencia).toBe('media');
    expect(pedido.distrito_id).toBe(1);
    expect(pedido.idioma_id).toBe(1);
  });
});