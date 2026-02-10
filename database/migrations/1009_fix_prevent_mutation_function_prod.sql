-- Migration 1009: CORREÇÃO URGENTE - Aplicar migrate 099 em PROD
-- Data: 10/02/2026
-- Problema: Função prevent_mutation_during_emission() ainda referencia processamento_em em PROD
-- Causa: Migration 099 não foi aplicada em produção
-- Impacto: Erro ao inativar avaliações (column "processamento_em" does not exist)

-- ============================================================================
-- VERIFICAÇÃO PRÉVIA: Checar se a coluna processamento_em ainda existe
-- ============================================================================
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lotes_avaliacao' 
    AND column_name = 'processamento_em'
  ) INTO v_column_exists;
  
  RAISE NOTICE '✓ Coluna processamento_em existe? %', v_column_exists;
END $$;

-- ============================================================================
-- CORREÇÃO: Substituir função sem referência a processamento_em
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 130
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante emissão
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informações do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo já foi emitido, prevenir mudanças críticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se está tentando mudar campos críticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário atualizado
COMMENT ON FUNCTION prevent_mutation_during_emission IS 
'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. 
Atualizada em migration 1009 (emergência) para remover referência ao campo processamento_em removido.
Migration 099 original não foi aplicada em PROD, causando erros em /inativar.';

-- ============================================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO: Validar que a função foi atualizada
-- ============================================================================
DO $$
DECLARE
  v_function_def TEXT;
  v_has_processamento_em BOOLEAN;
BEGIN
  -- Buscar definição da função
  SELECT pg_get_functiondef(oid) 
  INTO v_function_def
  FROM pg_proc 
  WHERE proname = 'prevent_mutation_during_emission' 
  AND pronamespace = 'public'::regnamespace;
  
  -- Verificar se ainda menciona processamento_em
  v_has_processamento_em := v_function_def LIKE '%processamento_em%';
  
  IF v_has_processamento_em THEN
    RAISE EXCEPTION 'CORREÇÃO FALHOU: Função ainda referencia processamento_em';
  ELSE
    RAISE NOTICE '✓ Função prevent_mutation_during_emission() corrigida com sucesso';
    RAISE NOTICE '✓ Query modificada: SELECT status, emitido_em (SEM processamento_em)';
  END IF;
END $$;

-- ============================================================================
-- AUDITORIA: Registrar correção
-- ============================================================================
INSERT INTO audit_logs (
  user_cpf,
  user_perfil,
  action,
  resource,
  details
) VALUES (
  'migration_1009',
  'system',
  'MIGRATION_APPLIED',
  'prevent_mutation_during_emission',
  'Correção urgente: Removida referência a processamento_em da função. Migration 099 não aplicada em prod.'
);

-- ============================================================================
-- ROLLBACK (se necessário)
-- ============================================================================
-- Se houver erro, reverter para versão anterior:
-- DROP FUNCTION IF EXISTS prevent_mutation_during_emission() CASCADE;
-- Então executar novamente a migração

-- ============================================================================
-- TESTE MANUAL RECOMENDADO APÓS APLICAÇÃO
-- ============================================================================
-- 1. Verificar definição da função:
--    SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);
--
-- 2. Testar inativação de avaliação:
--    UPDATE avaliacoes SET status = 'inativada' WHERE id = 10004;
--
-- 3. Verificar trigger está ativo:
--    SELECT * FROM pg_trigger WHERE tgname = 'trigger_prevent_avaliacao_mutation_during_emission';
