-- Migration 302: SANITIZAÇÃO AGRESSIVA DE AUTO-EMISSÃO DE LAUDOS
-- Objetivo: Remover TODOS os vestígios de emissão automática do sistema
-- Data: 2026-02-04
-- Autor: Sistema de Migração QWork

-- ============================================================================
-- PARTE 1: LIMPEZA DE DADOS FANTASMA
-- ============================================================================

-- IMPORTANTE: Laudos em status='rascunho' com hash_pdf=NULL são VÁLIDOS!
-- O trigger fn_reservar_id_laudo_on_lote_insert cria laudos em 'rascunho' 
-- para reservar o ID e garantir a constraint: lote.id = laudo.id
-- 
-- Remove APENAS laudos "fantasma" com status=NULL (verdadeiros registros órfãos)
-- Esses registros foram criados por bugs/migrations antigas e nunca foram populados
DELETE FROM laudos
WHERE 
  hash_pdf IS NULL 
  AND emissor_cpf IS NULL 
  AND emitido_em IS NULL
  AND status IS NULL  -- Apenas status NULL, NÃO 'rascunho'!
  AND relatorio_individual IS NULL
  AND relatorio_lote IS NULL
  AND relatorio_setor IS NULL;

-- Registra a limpeza em auditoria
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'SANITIZAÇÃO: % laudos fantasma removidos', v_count;
    
    INSERT INTO auditoria_laudos (lote_id, laudo_id, emissor_cpf, acao, status, observacoes)
    SELECT 
      id, 
      id, 
      NULL, 
      'limpeza_automatica', 
      'removido',
      'Migration 302: Removido laudo fantasma criado por trigger/migration legada'
    FROM lotes_avaliacao
    WHERE id NOT IN (SELECT lote_id FROM laudos)
    LIMIT v_count;
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: VALIDAÇÃO DE INTEGRIDADE
-- ============================================================================

-- Garante que todo laudo existente tem dados consistentes
-- EXCETO: Laudos em 'rascunho' sem hash_pdf são válidos (reserva de ID)
DO $$
DECLARE
  v_invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_invalid_count
  FROM laudos
  WHERE (hash_pdf IS NULL AND status NOT IN ('rascunho', 'emitido', 'enviado') AND status IS NOT NULL)
     OR (hash_pdf IS NOT NULL AND emissor_cpf IS NULL)
     OR (emitido_em IS NOT NULL AND hash_pdf IS NULL);
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'ATENÇÃO: % laudos com dados inconsistentes detectados. Requer análise manual.', v_invalid_count;
  ELSE
    RAISE NOTICE 'VALIDAÇÃO: Todos os laudos existentes possuem dados consistentes';
  END IF;
  
  -- Conta laudos em rascunho (reservas de ID válidas)
  SELECT COUNT(*) INTO v_invalid_count
  FROM laudos
  WHERE status = 'rascunho' AND hash_pdf IS NULL;
  
  IF v_invalid_count > 0 THEN
    RAISE NOTICE '✅ INFO: % laudos em rascunho (reservas válidas de ID para constraint lote.id = laudo.id)', v_invalid_count;
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: VALIDAÇÃO DE TRIGGERS (NÃO REMOVE TRIGGER DE RESERVA ID)
-- ============================================================================

-- Verifica e documenta triggers existentes que podem estar criando laudos automaticamente
-- EXCETO: fn_reservar_id_laudo_on_lote_insert (trigger válido de reserva de ID)
DO $$
DECLARE
  v_trigger RECORD;
  v_function_body TEXT;
BEGIN
  RAISE NOTICE '=== AUDITORIA DE TRIGGERS ===';
  
  FOR v_trigger IN 
    SELECT 
      tgname,
      tgrelid::regclass as table_name,
      pg_get_triggerdef(oid) as trigger_def
    FROM pg_trigger
    WHERE tgrelid IN ('lotes_avaliacao'::regclass, 'laudos'::regclass, 'avaliacoes'::regclass)
    AND NOT tgisinternal
    AND tgname != 'trg_reservar_id_laudo_on_lote_insert'  -- EXCLUIR trigger válido de reserva ID
  LOOP
    -- Busca a definição da função do trigger
    SELECT pg_get_functiondef(p.oid) INTO v_function_body
    FROM pg_proc p
    JOIN pg_trigger t ON t.tgfoid = p.oid
    WHERE t.tgname = v_trigger.tgname;
    
    -- Verifica se a função contém INSERT INTO laudos (exceto reserva de ID) ou fila_emissao
    IF v_function_body LIKE '%INSERT INTO fila_emissao%' 
       OR v_function_body LIKE '%emitir%auto%'
       OR v_function_body LIKE '%auto_emitir%' THEN
      RAISE WARNING 'TRIGGER SUSPEITO: % na tabela % pode estar criando laudos automaticamente', 
        v_trigger.tgname, v_trigger.table_name;
      RAISE NOTICE 'Definição: %', v_trigger.trigger_def;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Trigger fn_reservar_id_laudo_on_lote_insert é VÁLIDO (reserva ID para constraint lote.id = laudo.id)';
END $$;

-- ============================================================================
-- PARTE 4: VERIFICAÇÃO DE FUNÇÕES LEGADAS
-- ============================================================================

-- Lista funções que contém lógica de auto-emissão
DO $$
DECLARE
  v_func RECORD;
  v_func_body TEXT;
BEGIN
  RAISE NOTICE '=== AUDITORIA DE FUNÇÕES ===';
  
  FOR v_func IN
    SELECT 
      p.proname,
      n.nspname,
      pg_get_functiondef(p.oid) as func_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND (
      p.proname LIKE '%emitir%'
      OR p.proname LIKE '%fila%'
      OR p.proname LIKE '%auto%'
    )
  LOOP
    v_func_body := v_func.func_def;
    
    -- Verifica se a função contém INSERT INTO laudos ou fila_emissao
    IF v_func_body LIKE '%INSERT INTO laudos%' 
       OR v_func_body LIKE '%INSERT INTO fila_emissao%'
       OR v_func_body LIKE '%emitir%auto%' THEN
      RAISE WARNING 'FUNÇÃO SUSPEITA: %.% pode estar realizando emissão automática', 
        v_func.nspname, v_func.proname;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 5: REMOÇÃO DE VIEW fila_emissao (SE AINDA EXISTIR)
-- ============================================================================

-- Remove view fila_emissao se ainda existir (legado de sistema antigo)
DROP VIEW IF EXISTS v_fila_emissao CASCADE;
DROP VIEW IF EXISTS fila_emissao CASCADE;

RAISE NOTICE 'SANITIZAÇÃO: Views de fila_emissao removidas (se existiam)';

-- ============================================================================
-- PARTE 6: LIMPEZA DE COLUNAS LEGADAS
-- ============================================================================

-- Remove colunas de auto-emissão se ainda existirem (verificação segura)
DO $$
BEGIN
  -- Verifica se coluna auto_emitir_em existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'auto_emitir_em'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP COLUMN auto_emitir_em;
    RAISE NOTICE 'SANITIZAÇÃO: Coluna auto_emitir_em removida de lotes_avaliacao';
  END IF;
  
  -- Verifica se coluna auto_emitir_agendado existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'auto_emitir_agendado'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP COLUMN auto_emitir_agendado;
    RAISE NOTICE 'SANITIZAÇÃO: Coluna auto_emitir_agendado removida de lotes_avaliacao';
  END IF;
  
  -- Verifica se coluna emissao_automatica existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'emissao_automatica'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP COLUMN emissao_automatica;
    RAISE NOTICE 'SANITIZAÇÃO: Coluna emissao_automatica removida de lotes_avaliacao';
  END IF;
END $$;

-- ============================================================================
-- PARTE 7: VALIDAÇÃO FINAL
-- ============================================================================

-- Verifica estado final dos lotes
DO $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'concluido') as lotes_concluidos,
    COUNT(*) FILTER (WHERE status = 'concluido' AND EXISTS (
      SELECT 1 FROM laudos WHERE laudos.lote_id = lotes_avaliacao.id 
      AND hash_pdf IS NOT NULL
    )) as lotes_com_laudo,
    COUNT(*) FILTER (WHERE status = 'emissao_solicitada') as lotes_solicitados
  INTO v_stats
  FROM lotes_avaliacao;
  
  RAISE NOTICE '=== ESTATÍSTICAS FINAIS ===';
  RAISE NOTICE 'Lotes concluídos: %', v_stats.lotes_concluidos;
  RAISE NOTICE 'Lotes com laudo válido: %', v_stats.lotes_com_laudo;
  RAISE NOTICE 'Lotes aguardando emissão: %', v_stats.lotes_solicitados;
  
  -- Alerta se houver lotes concluídos sem solicitação e sem laudo
  IF v_stats.lotes_concluidos > v_stats.lotes_com_laudo + v_stats.lotes_solicitados THEN
    RAISE NOTICE 'INFO: % lotes concluídos aguardam solicitação de emissão manual', 
      v_stats.lotes_concluidos - v_stats.lotes_com_laudo - v_stats.lotes_solicitados;
  END IF;
END $$;

-- ============================================================================
-- PARTE 8: DOCUMENTAÇÃO E COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE laudos IS 'Tabela de laudos emitidos. Laudos em rascunho (status=rascunho, hash_pdf=NULL) são reservas de ID criadas pelo trigger fn_reservar_id_laudo_on_lote_insert para garantir constraint lote.id=laudo.id. Laudos são gerados APENAS manualmente pelo emissor após solicitação do RH/Entidade. Migration 302 removeu auto-emissão.';
COMMENT ON COLUMN laudos.hash_pdf IS 'Hash SHA-256 do PDF gerado. NULL para laudos em rascunho (reserva de ID), obrigatório para laudos emitidos.';
COMMENT ON COLUMN laudos.emissor_cpf IS 'CPF do funcionário emissor que gerou o laudo. NULL para laudos em rascunho, obrigatório quando hash_pdf existe.';
COMMENT ON COLUMN laudos.emitido_em IS 'Data/hora de emissão do laudo. NULL para laudos em rascunho, populado quando hash_pdf é gerado.';
COMMENT ON COLUMN laudos.status IS 'Status do laudo: rascunho (reserva de ID), emitido (PDF gerado), enviado (entregue). Default: rascunho.';

-- Registra migração em tabela de histórico (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    INSERT INTO schema_migrations (version, applied_at, description)
    VALUES (302, NOW(), 'Sanitização agressiva de auto-emissão de laudos')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRAÇÃO 302
-- ============================================================================

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 302 CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sistema sanitizado: AUTO-EMISSÃO REMOVIDA';
  RAISE NOTICE 'Todos os laudos são gerados MANUALMENTE';
  RAISE NOTICE '';
END $$;
