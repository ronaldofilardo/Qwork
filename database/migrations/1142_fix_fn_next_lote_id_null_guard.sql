-- Migration 1142: Fix fn_next_lote_id() retornando NULL
-- Data: 05/04/2026
-- Problema: fn_next_lote_id() faz UPDATE em lote_id_allocator, mas se a tabela estiver
--   vazia (0 rows), o UPDATE não afeta nenhuma linha e v_next permanece NULL,
--   causando: "null value in column 'id' of relation 'lotes_avaliacao' violates not-null constraint"
-- Afeta: /api/entidade/liberar-lote e /api/rh/liberar-lote
-- Solução: 
--   1) Limpar rows inválidas (pode existir mais de 1 por race condition sem UNIQUE constraint)
--   2) Reinicializar com COALESCE(MAX(id), 0) de lotes_avaliacao
--   3) Recriar fn_next_lote_id() com NULL-guard explícito + RAISE EXCEPTION descritivo

BEGIN;

-- ==========================================
-- PARTE 1: DIAGNÓSTICO
-- ==========================================

DO $$
DECLARE
  v_rows  bigint;
  v_maxid bigint;
  v_maxlote bigint;
BEGIN
  SELECT COUNT(*), COALESCE(MAX(last_id), -1)
    INTO v_rows, v_maxid
  FROM lote_id_allocator;

  SELECT COALESCE(MAX(id), 0)
    INTO v_maxlote
  FROM lotes_avaliacao;

  RAISE NOTICE '[1142] lote_id_allocator: % row(s), last_id=%, max lote id=%',
    v_rows, v_maxid, v_maxlote;

  IF v_rows = 0 THEN
    RAISE WARNING '[1142] CAUSA DO BUG: lote_id_allocator está VAZIA — fn_next_lote_id() retornava NULL';
  ELSIF v_rows > 1 THEN
    RAISE WARNING '[1142] ANOMALIA: lote_id_allocator tem % rows (race condition anterior)', v_rows;
  ELSE
    RAISE NOTICE '[1142] lote_id_allocator OK (1 row), mas corrigiremos a função mesmo assim';
  END IF;
END $$;

-- ==========================================
-- PARTE 2: REINICIALIZAR lote_id_allocator
-- ==========================================

-- Remover rows inválidas/extras (tabela deve ter exatamente 1 row)
DELETE FROM lote_id_allocator;

-- Inserir com valor correto: max id de lotes existentes (ou 0 se nenhum)
INSERT INTO lote_id_allocator (last_id)
  SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao;

DO $$
DECLARE
  v_last bigint;
BEGIN
  SELECT last_id INTO v_last FROM lote_id_allocator;
  RAISE NOTICE '[1142] lote_id_allocator reinicializado: last_id=%', v_last;
END $$;

-- ==========================================
-- PARTE 3: RECRIAR fn_next_lote_id() com NULL-guard
-- ==========================================

CREATE OR REPLACE FUNCTION fn_next_lote_id()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_next        bigint;
  v_max_existing bigint;
  v_retries     int := 0;
  v_max_retries int := 5;
BEGIN
  -- Referência do MAX atual para evitar colisão com rows inseridas fora do allocator
  SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;

  LOOP
    -- Atualiza atomicamente; GREATEST garante não regredir abaixo do MAX existente
    UPDATE lote_id_allocator
       SET last_id = GREATEST(last_id + 1, v_max_existing + 1)
    RETURNING last_id INTO v_next;

    -- NULL-guard: tabela estava vazia — inicializa e tenta mais 1 vez
    IF v_next IS NULL THEN
      IF v_retries > 0 THEN
        RAISE EXCEPTION '[fn_next_lote_id] lote_id_allocator vazia mesmo após tentativa de inicialização. '
                        'Execute: INSERT INTO lote_id_allocator (last_id) SELECT COALESCE(MAX(id),0) FROM lotes_avaliacao;';
      END IF;

      -- Inicialização de emergência (evita NULL silencioso)
      INSERT INTO lote_id_allocator (last_id)
        SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao;

      v_retries := v_retries + 1;
      CONTINUE;
    END IF;

    -- Verificar colisão com id já existente
    IF NOT EXISTS (SELECT 1 FROM lotes_avaliacao WHERE id = v_next) THEN
      RETURN v_next;
    END IF;

    -- Colisão: sincronizar e tentar novamente
    v_retries := v_retries + 1;
    IF v_retries >= v_max_retries THEN
      RAISE EXCEPTION '[fn_next_lote_id] Falha ao gerar ID único após % tentativas (último candidato: %)',
        v_max_retries, v_next;
    END IF;

    RAISE WARNING '[fn_next_lote_id] Colisão no ID %. Tentativa % de %', v_next, v_retries, v_max_retries;

    -- Re-ler max para nova tentativa
    SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION fn_next_lote_id() IS
'Retorna próximo ID para lotes_avaliacao de forma atômica.
Migration 1142 (05/04/2026): adicionado NULL-guard explícito, RAISE EXCEPTION descritivo
e inicialização de emergência. GREATEST() previne colisão com INSERTs externos ao allocator.';

-- ==========================================
-- PARTE 4: VALIDAÇÃO
-- ==========================================

DO $$
DECLARE
  v_id1 bigint;
  v_id2 bigint;
  v_last bigint;
BEGIN
  -- Testar a função (sem INSERT real)
  v_id1 := fn_next_lote_id();
  v_id2 := fn_next_lote_id();

  IF v_id1 IS NULL OR v_id2 IS NULL THEN
    RAISE EXCEPTION '[1142] VALIDAÇÃO FALHOU: fn_next_lote_id() ainda retorna NULL! id1=%, id2=%', v_id1, v_id2;
  END IF;

  IF v_id2 <= v_id1 THEN
    RAISE EXCEPTION '[1142] VALIDAÇÃO FALHOU: IDs não incrementam. id1=%, id2=%', v_id1, v_id2;
  END IF;

  -- Reverter os 2 IDs gerados no teste (não houve INSERT real em lotes_avaliacao)
  UPDATE lote_id_allocator SET last_id = last_id - 2;
  SELECT last_id INTO v_last FROM lote_id_allocator;

  RAISE NOTICE '[1142] VALIDAÇÃO OK: fn_next_lote_id() funciona corretamente. Alocador restaurado para %', v_last;
END $$;

COMMIT;
