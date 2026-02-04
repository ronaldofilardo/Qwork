-- ==========================================
-- MIGRATION 200: Adicionar estados de emissão na máquina de estados do lote
-- Descrição: Implementa estado 'emissao_solicitada' e 'emissao_em_andamento'
--            para evitar joins com fila_emissao e simplificar queries
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR NOVOS VALORES AO ENUM DE STATUS (se existir)
-- ==========================================

-- PostgreSQL não permite adicionar valores a CHECK constraints facilmente
-- então vamos dropar a constraint existente e recriar com novos valores

DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lotes_avaliacao_status_check'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_status_check;
  END IF;
END $$;

-- Adicionar nova constraint com todos os estados
ALTER TABLE lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_status_check 
CHECK (status IN (
  'rascunho',
  'ativo',
  'concluido',
  'emissao_solicitada',
  'emissao_em_andamento',
  'laudo_emitido',
  'cancelado',
  'finalizado'
));

-- ==========================================
-- 2. DESABILITAR TRIGGERS TEMPORARIAMENTE
-- ==========================================

-- Desabilitar triggers temporariamente para permitir UPDATE
ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL;

-- ==========================================
-- 3. MIGRAR DADOS EXISTENTES
-- ==========================================

-- Atualizar lotes que tem fila_emissao para 'emissao_solicitada'
UPDATE lotes_avaliacao la
SET status = 'emissao_solicitada',
    atualizado_em = NOW()
WHERE status = 'concluido'
  AND EXISTS (
    SELECT 1 FROM fila_emissao fe 
    WHERE fe.lote_id = la.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM laudos l
    WHERE l.lote_id = la.id
  );

-- Atualizar lotes que já tem laudo emitido para 'laudo_emitido'
UPDATE lotes_avaliacao la
SET status = 'laudo_emitido',
    atualizado_em = NOW()
WHERE status = 'concluido'
  AND EXISTS (
    SELECT 1 FROM laudos l
    WHERE l.lote_id = la.id
      AND l.status IN ('emitido', 'enviado')
  );

-- Reabilitar triggers
ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL;

-- ==========================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índice para buscar lotes prontos para emissão
CREATE INDEX IF NOT EXISTS idx_lotes_emissao_solicitada
ON lotes_avaliacao(status)
WHERE status = 'emissao_solicitada';

-- Índice para buscar lotes em andamento
CREATE INDEX IF NOT EXISTS idx_lotes_emissao_em_andamento
ON lotes_avaliacao(status)
WHERE status = 'emissao_em_andamento';

-- ==========================================
-- 5. CRIAR FUNÇÃO PARA VALIDAR TRANSIÇÕES
-- ==========================================

CREATE OR REPLACE FUNCTION fn_validar_transicao_status_lote()
RETURNS TRIGGER AS $$
DECLARE
  transicoes_validas TEXT[];
BEGIN
  -- Se status não mudou, permitir
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Definir transições válidas para cada status
  CASE OLD.status
    WHEN 'rascunho' THEN
      transicoes_validas := ARRAY['ativo', 'cancelado'];
    WHEN 'ativo' THEN
      transicoes_validas := ARRAY['concluido', 'cancelado'];
    WHEN 'concluido' THEN
      transicoes_validas := ARRAY['emissao_solicitada', 'cancelado'];
    WHEN 'emissao_solicitada' THEN
      transicoes_validas := ARRAY['emissao_em_andamento', 'concluido', 'cancelado'];
    WHEN 'emissao_em_andamento' THEN
      transicoes_validas := ARRAY['laudo_emitido', 'emissao_solicitada', 'cancelado'];
    WHEN 'laudo_emitido' THEN
      transicoes_validas := ARRAY['finalizado'];
    WHEN 'cancelado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote cancelado não pode ter status alterado';
    WHEN 'finalizado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote finalizado não pode ter status alterado';
    ELSE
      RAISE EXCEPTION 'Status desconhecido: %', OLD.status;
  END CASE;

  -- Verificar se transição é válida
  IF NOT (NEW.status = ANY(transicoes_validas)) THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %. Transições permitidas: %',
      OLD.status, NEW.status, array_to_string(transicoes_validas, ', ');
  END IF;

  -- Atualizar timestamp
  NEW.atualizado_em := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. CRIAR TRIGGER PARA VALIDAÇÃO
-- ==========================================

DROP TRIGGER IF EXISTS trg_validar_transicao_status_lote ON lotes_avaliacao;

CREATE TRIGGER trg_validar_transicao_status_lote
  BEFORE UPDATE OF status ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_transicao_status_lote();

-- ==========================================
-- 7. ADICIONAR COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN lotes_avaliacao.status IS 
'Status do lote: rascunho, ativo, concluido, emissao_solicitada, emissao_em_andamento, laudo_emitido, cancelado, finalizado';

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao IS
'Valida que status do lote está dentro dos valores permitidos pela máquina de estados';

COMMENT ON FUNCTION fn_validar_transicao_status_lote() IS
'Valida transições de status do lote conforme máquina de estados. Previne transições inválidas e garante integridade.';

COMMENT ON TRIGGER trg_validar_transicao_status_lote ON lotes_avaliacao IS
'Trigger que valida transições de status antes de atualizar o registro';

COMMIT;

-- ==========================================
-- ROLLBACK (se necessário)
-- ==========================================

/*
BEGIN;

-- Remover trigger e função
DROP TRIGGER IF EXISTS trg_validar_transicao_status_lote ON lotes_avaliacao;
DROP FUNCTION IF EXISTS fn_validar_transicao_status_lote();

-- Remover índices
DROP INDEX IF EXISTS idx_lotes_emissao_solicitada;
DROP INDEX IF EXISTS idx_lotes_emissao_em_andamento;

-- Reverter status para valores antigos
UPDATE lotes_avaliacao
SET status = 'concluido'
WHERE status IN ('emissao_solicitada', 'emissao_em_andamento', 'laudo_emitido');

-- Restaurar constraint antiga
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;
ALTER TABLE lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_status_check 
CHECK (status IN ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho'));

-- Remover registro de migração
DELETE FROM _migrations WHERE version = 200;

COMMIT;
*/
