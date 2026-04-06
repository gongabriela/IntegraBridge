-- ============================================================================
-- INTEGRABRIDGE - RPC FUNCTIONS (EXECUÇÃO ÚNICA)
-- ============================================================================
-- Cria stored procedures para lógica de negócio complexa
-- Executar após 01-schema.sql no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- RPC 1: OFERECER AJUDA 
-- ============================================================================
-- Atribui helper a um pedido pendente com validações atômicas

DROP FUNCTION IF EXISTS oferecer_ajuda(UUID, UUID);

CREATE OR REPLACE FUNCTION oferecer_ajuda(
  p_pedido_id UUID,
  p_helper_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido RECORD;
BEGIN
  SELECT user_id, helper_id, status
  INTO v_pedido
  FROM pedidos_ajuda
  WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF v_pedido.user_id = p_helper_id THEN
    RAISE EXCEPTION 'Não podes oferecer ajuda ao teu próprio pedido.' USING ERRCODE = '42501';
  END IF;

  IF v_pedido.status != 'pendente' THEN
    RAISE EXCEPTION 'Pedido não está pendente.' USING ERRCODE = '42501';
  END IF;

  IF v_pedido.helper_id IS NOT NULL THEN
    RAISE EXCEPTION 'Pedido já tem um helper atribuído.' USING ERRCODE = '42501';
  END IF;

  UPDATE pedidos_ajuda 
  SET helper_id = p_helper_id, status = 'em_progresso'
  WHERE id = p_pedido_id;
END;
$$;

-- ============================================================================
-- RPC 2: OBTER CONTACTO PARCEIRO
-- ============================================================================
-- Retorna dados de contacto entre dono e helper (com validações de segurança)

DROP FUNCTION IF EXISTS obter_contacto_parceiro(UUID, UUID);

CREATE OR REPLACE FUNCTION obter_contacto_parceiro(
  p_pedido_id UUID,
  p_caller_id UUID
)
RETURNS TABLE(
  nome TEXT,
  email TEXT,
  telefone TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dono_id UUID;
  v_helper_id UUID;
  v_parceiro_id UUID;
  v_role TEXT;
BEGIN
  SELECT user_id, helper_id
  INTO v_dono_id, v_helper_id
  FROM pedidos_ajuda
  WHERE id = p_pedido_id;

  IF v_dono_id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF v_helper_id IS NULL THEN
    RAISE EXCEPTION 'Pedido ainda não tem helper atribuído.' USING ERRCODE = 'P0003';
  END IF;

  IF p_caller_id = v_dono_id THEN
    v_parceiro_id := v_helper_id;
    v_role := 'helper';
  ELSIF p_caller_id = v_helper_id THEN
    v_parceiro_id := v_dono_id;
    v_role := 'dono';
  ELSE
    RAISE EXCEPTION 'Não autorizado a visualizar contactos deste pedido.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(u.raw_user_meta_data->>'nome_completo', 'Utilizador sem nome')::TEXT AS nome,
    u.email::TEXT AS email,
    (u.raw_user_meta_data->>'telefone')::TEXT AS telefone,
    v_role::TEXT AS role
  FROM auth.users u
  WHERE u.id = v_parceiro_id;
END;
$$;