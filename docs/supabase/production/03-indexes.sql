-- ============================================================================
-- INTEGRABRIDGE - ÍNDICES E OTIMIZAÇÕES (EXECUÇÃO ÚNICA)
-- ============================================================================
-- Cria índices para melhorar performance das queries mais comuns
-- Executar após 01-schema.sql e 02-rpc-functions.sql
-- ============================================================================

-- Índices para queries frequentes na tabela pedidos_ajuda
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_user_id ON pedidos_ajuda(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_helper_id ON pedidos_ajuda(helper_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_status ON pedidos_ajuda(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_created_at ON pedidos_ajuda(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_distrito_id ON pedidos_ajuda(distrito_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_idioma_id ON pedidos_ajuda(idioma_id);

-- Índices compostos para filtros combinados
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_status_created ON pedidos_ajuda(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_ajuda_user_status ON pedidos_ajuda(user_id, status);

-- Índices para lookup tables (melhoram JOIN performance)
CREATE INDEX IF NOT EXISTS idx_distritos_nome ON distritos(nome);
CREATE INDEX IF NOT EXISTS idx_idiomas_nome ON idiomas(nome);