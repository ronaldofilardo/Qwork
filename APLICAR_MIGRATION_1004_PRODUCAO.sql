-- ============================================================================
-- APLICAÇÃO DA MIGRATION 1004 EM PRODUÇÃO
-- ============================================================================
-- Data: 2026-02-10
-- Objetivo: Corrigir fn_reservar_id_laudo_on_lote_insert para usar status='rascunho'
--
-- INSTRUÇÕES:
-- 1. Acesse https://console.neon.tech/
-- 2. Selecione o projeto de produção
-- 3. Abra SQL Editor
-- 4. Copie e cole o SQL abaixo
-- 5. Execute
-- ============================================================================

BEGIN;

-- Recriar função com status explícito
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Reservar o ID do laudo (id = lote_id) em status 'rascunho'
  -- Status 'rascunho' permite criar laudo sem hash_pdf/emissor_cpf/emitido_em
  -- Isso evita disparar a trigger de validação fn_validar_laudo_emitido
  INSERT INTO laudos (id, lote_id, status)
  VALUES (NEW.id, NEW.id, 'rascunho')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS 
  'Reserva ID do laudo (igual ao lote) em status rascunho ao criar lote. Status rascunho permite criar sem hash_pdf, evitando erro de validação.';

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- Execute este SELECT para confirmar que a função foi atualizada:
-- 
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'fn_reservar_id_laudo_on_lote_insert';
--
-- Deve conter: VALUES (NEW.id, NEW.id, 'rascunho')
-- ============================================================================
