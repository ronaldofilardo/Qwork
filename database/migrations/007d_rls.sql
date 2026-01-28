-- ==========================================
-- MIGRATION 007d: Row Level Security
-- Parte 4 da refatoração de status e fila de emissão
-- Data: 2025-01-03
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007d: Configurando Row Level Security ==='

-- 5. Configurando Row Level Security
-- 5.1. Ativar RLS nas tabelas
ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

\echo '5.1. RLS ativado em lotes_avaliacao e laudos'

-- 5.2. Políticas antigas já foram removidas no início da migração
\echo '5.2. Políticas antigas removidas'

-- 5.3. Criar políticas para lotes_avaliacao
-- Emissor só vê lotes com status IN ('pendente', 'em_processamento', 'concluido')
CREATE POLICY policy_lotes_emissor ON lotes_avaliacao
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) = 'emissor' AND
  status IN ('pendente', 'em_processamento', 'concluido')
);

-- RH/Entidade só vê lotes do seu contratante
CREATE POLICY policy_lotes_entidade ON lotes_avaliacao
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) IN ('rh', 'entidade') AND
  contratante_id = NULLIF(current_setting('app.current_contratante_id', TRUE), '')::INTEGER
);

-- Admin vê tudo (mas só leitura)
CREATE POLICY policy_lotes_admin ON lotes_avaliacao
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'admin');

\echo '5.3. Políticas RLS para lotes_avaliacao criadas'

-- 5.4. Criar políticas para laudos
-- Emissor pode ver todos os laudos
CREATE POLICY policy_laudos_emissor ON laudos
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'emissor');

-- Admin vê tudo
CREATE POLICY policy_laudos_admin ON laudos
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'admin');

-- RH/Entidade pode ver laudos dos seus lotes
CREATE POLICY policy_laudos_entidade ON laudos
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) IN ('rh', 'entidade') AND
  EXISTS (
    SELECT 1 FROM lotes_avaliacao
    WHERE lotes_avaliacao.id = laudos.lote_id
    AND lotes_avaliacao.contratante_id = NULLIF(current_setting('app.current_contratante_id', TRUE), '')::INTEGER
  )
);

\echo '5.4. Políticas RLS para laudos criadas'

COMMIT;

\echo '=== MIGRATION 007d: Concluída com sucesso ==='