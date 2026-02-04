-- Migration 303: CORRIGIR TRIGGER DE RESERVA DE ID PARA STATUS='RASCUNHO'
-- Objetivo: Garantir que laudos de reserva de ID sejam criados com status='rascunho'
-- Data: 2026-02-04
-- Autor: Sistema de Migração QWork

-- ============================================================================
-- PROBLEMA IDENTIFICADO
-- ============================================================================
-- O trigger fn_reservar_id_laudo_on_lote_insert cria laudos com:
--   INSERT INTO laudos (id, lote_id) VALUES (NEW.id, NEW.id)
-- 
-- Isso deixa o campo 'status' como NULL (não usa o default da coluna),
-- causando laudos "fantasma" que a migration 302 identifica como órfãos.
--
-- SOLUÇÃO: Criar laudos com status='rascunho' explicitamente
-- ============================================================================

-- Drop e recriar a função com status='rascunho' explícito
CREATE OR REPLACE FUNCTION public.fn_reservar_id_laudo_on_lote_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Inserir registro com status='rascunho' para reservar o ID do laudo
  -- Constraint: lote.id = laudo.id (laudos_id_equals_lote_id)
  -- Status 'rascunho' indica que é apenas reserva de ID, não laudo emitido
  INSERT INTO laudos (id, lote_id, status)
  VALUES (NEW.id, NEW.id, 'rascunho')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- LIMPAR LAUDOS COM STATUS NULL (CRIADOS PELO TRIGGER ANTIGO)
-- ============================================================================

-- Remove laudos órfãos com status=NULL criados pelo trigger antigo
-- Esses são os "fantasmas" que nunca foram usados
DELETE FROM laudos
WHERE status IS NULL
  AND hash_pdf IS NULL
  AND emissor_cpf IS NULL
  AND emitido_em IS NULL;

-- Registra quantos foram removidos
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'LIMPEZA: % laudos órfãos (status=NULL) removidos', v_count;
  ELSE
    RAISE NOTICE 'LIMPEZA: Nenhum laudo órfão encontrado';
  END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Testa o trigger criando e deletando um lote temporário
DO $$
DECLARE
  v_test_lote_id INTEGER;
  v_laudo_status TEXT;
BEGIN
  -- Cria lote de teste
  INSERT INTO lotes_avaliacao (
    clinica_id, 
    empresa_id, 
    descricao, 
    tipo, 
    status,
    contratante_id
  ) VALUES (
    1, 
    1, 
    'TESTE Migration 303 - Deletar após validação', 
    'completo', 
    'rascunho',
    1
  ) RETURNING id INTO v_test_lote_id;
  
  -- Verifica se laudo foi criado com status='rascunho'
  SELECT status INTO v_laudo_status
  FROM laudos
  WHERE id = v_test_lote_id;
  
  IF v_laudo_status = 'rascunho' THEN
    RAISE NOTICE '✅ TESTE PASSOU: Trigger criou laudo com status=rascunho para lote %', v_test_lote_id;
  ELSE
    RAISE WARNING '❌ TESTE FALHOU: Laudo tem status=% (esperado: rascunho)', COALESCE(v_laudo_status, 'NULL');
  END IF;
  
  -- Limpa lote de teste (CASCADE remove laudo)
  DELETE FROM lotes_avaliacao WHERE id = v_test_lote_id;
  
  RAISE NOTICE 'Lote de teste % removido', v_test_lote_id;
END $$;

-- ============================================================================
-- ESTATÍSTICAS FINAIS
-- ============================================================================

DO $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'rascunho' AND hash_pdf IS NULL) as reservas_id,
    COUNT(*) FILTER (WHERE status = 'emitido' OR status = 'enviado') as laudos_reais,
    COUNT(*) FILTER (WHERE status IS NULL) as laudos_orfaos
  INTO v_stats
  FROM laudos;
  
  RAISE NOTICE '=== ESTATÍSTICAS DE LAUDOS ===';
  RAISE NOTICE 'Reservas de ID (rascunho): %', v_stats.reservas_id;
  RAISE NOTICE 'Laudos reais (emitido/enviado): %', v_stats.laudos_reais;
  RAISE NOTICE 'Laudos órfãos (status NULL): %', v_stats.laudos_orfaos;
  
  IF v_stats.laudos_orfaos > 0 THEN
    RAISE WARNING 'ATENÇÃO: Ainda existem % laudos órfãos com status NULL!', v_stats.laudos_orfaos;
  END IF;
END $$;

-- ============================================================================
-- DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS 
  'Trigger que reserva ID para laudo ao criar lote. Cria registro em laudos com status=rascunho para garantir constraint lote.id=laudo.id. Migration 303: Corrigido para usar status=rascunho (antes criava com NULL).';

-- Registra migração em tabela de histórico (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    INSERT INTO schema_migrations (version, applied_at, description)
    VALUES (303, NOW(), 'Corrigir trigger de reserva ID para usar status=rascunho')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRAÇÃO 303
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'MIGRATION 303 CONCLUÍDA';
RAISE NOTICE '========================================';
RAISE NOTICE 'Trigger fn_reservar_id_laudo_on_lote_insert corrigido';
RAISE NOTICE 'Laudos órfãos (status=NULL) removidos';
RAISE NOTICE 'Novos lotes criarão laudos com status=rascunho';
RAISE NOTICE '';
