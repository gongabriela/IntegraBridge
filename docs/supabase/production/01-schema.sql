-- ============================================================================
-- INTEGRABRIDGE - SCHEMA INICIAL (EXECUÇÃO ÚNICA)
-- ============================================================================
-- Cria estrutura base: tipos, tabelas e dados iniciais
-- Executar no Supabase SQL Editor: https://app.supabase.com
-- ============================================================================

-- Limpeza (seguro para re-execução)
DROP TABLE IF EXISTS pedidos_ajuda CASCADE;
DROP TYPE IF EXISTS status_pedido;
DROP TYPE IF EXISTS urgencia_pedido;

-- ENUMs para validação
CREATE TYPE status_pedido AS ENUM ('pendente', 'em_progresso', 'concluido');
CREATE TYPE urgencia_pedido AS ENUM ('baixa', 'media', 'alta');

-- Tabelas de lookup (dados de referência)
CREATE TABLE distritos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE idiomas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL
);

-- Dados iniciais para lookup tables
INSERT INTO distritos (nome) VALUES 
  ('Aveiro'), ('Beja'), ('Braga'), ('Bragança'), ('Castelo Branco'), 
  ('Coimbra'), ('Évora'), ('Faro'), ('Guarda'), ('Leiria'), 
  ('Lisboa'), ('Portalegre'), ('Porto'), ('Santarém'), ('Setúbal'), 
  ('Viana do Castelo'), ('Vila Real'), ('Viseu'), ('Açores'), ('Madeira');

INSERT INTO idiomas (nome) VALUES 
  ('Português'), ('Inglês'), ('Espanhol'), ('Francês'), ('Ucraniano'), ('Árabe');

-- Tabela principal de pedidos
CREATE TABLE pedidos_ajuda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  distrito_id INT REFERENCES distritos(id) NOT NULL,
  idioma_id INT REFERENCES idiomas(id) NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  status status_pedido DEFAULT 'pendente',
  urgencia urgencia_pedido NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  helper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Constraint: user não pode ajudar próprio pedido
ALTER TABLE pedidos_ajuda
ADD CONSTRAINT dono_nao_pode_ser_ajudante CHECK (user_id != helper_id);

-- Row Level Security
ALTER TABLE pedidos_ajuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE distritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE idiomas ENABLE ROW LEVEL SECURITY;

-- Policies para pedidos_ajuda
CREATE POLICY "Autenticados podem ver pedidos" ON pedidos_ajuda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem criar pedidos" ON pedidos_ajuda FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Donos podem editar/apagar" ON pedidos_ajuda FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Donos podem apagar" ON pedidos_ajuda FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies para lookup tables (leitura pública)
CREATE POLICY "Permitir leitura de distritos" ON distritos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de idiomas" ON idiomas FOR SELECT USING (true);