-- Migration 1106: Atualizar trigger de avaliação para escrever indice_avaliacao per-vinculo
-- Data: 2026-06-03
-- Depende: 1103_add_job_fields_to_vinculo_tables.sql, 1104_update_elegibilidade_per_vinculo.sql
-- Contexto: O trigger atualizar_ultima_avaliacao_funcionario() escreve apenas em `funcionarios`.
-- Com multi-empresa, indice_avaliacao e data_ultimo_lote devem ficar em funcionarios_clinicas/entidades.

BEGIN;

-- =============================================
-- 1. RECRIAR TRIGGER FUNCTION PARA INCLUIR VINCULO
-- =============================================
CREATE OR REPLACE FUNCTION public.atualizar_ultima_avaliacao_funcionario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_empresa_id INTEGER;
  v_entidade_id INTEGER;
  v_lote_numero INTEGER;
BEGIN
  -- Buscar empresa_id e entidade_id do lote
  SELECT la.empresa_id, la.entidade_id, la.numero_ordem
  INTO v_empresa_id, v_entidade_id, v_lote_numero
  FROM lotes_avaliacao la
  WHERE la.id = NEW.lote_id;

  -- 1. Sempre atualizar o registro global em funcionarios (compatibilidade)
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  -- 2. Atualizar indice_avaliacao e data_ultimo_lote no vinculo correto
  IF v_empresa_id IS NOT NULL THEN
    -- Lote de empresa (via clinica)
    UPDATE funcionarios_clinicas fc
    SET 
      indice_avaliacao = COALESCE(v_lote_numero, fc.indice_avaliacao),
      data_ultimo_lote = COALESCE(NEW.envio, NEW.inativada_em, NOW()),
      atualizado_em = NOW()
    FROM funcionarios f
    WHERE fc.funcionario_id = f.id
      AND f.cpf = NEW.funcionario_cpf
      AND fc.empresa_id = v_empresa_id
      AND fc.ativo = true
      AND (
        fc.indice_avaliacao IS NULL
        OR fc.indice_avaliacao = 0
        OR v_lote_numero > fc.indice_avaliacao
      );
  END IF;

  IF v_entidade_id IS NOT NULL THEN
    -- Lote de entidade
    UPDATE funcionarios_entidades fe
    SET 
      indice_avaliacao = COALESCE(v_lote_numero, fe.indice_avaliacao),
      data_ultimo_lote = COALESCE(NEW.envio, NEW.inativada_em, NOW()),
      atualizado_em = NOW()
    FROM funcionarios f
    WHERE fe.funcionario_id = f.id
      AND f.cpf = NEW.funcionario_cpf
      AND fe.entidade_id = v_entidade_id
      AND fe.ativo = true
      AND (
        fe.indice_avaliacao IS NULL
        OR fe.indice_avaliacao = 0
        OR v_lote_numero > fe.indice_avaliacao
      );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION atualizar_ultima_avaliacao_funcionario() IS
'Atualiza dados de ultima avaliacao no funcionario E no vinculo (per-empresa/entidade). Migration 1106.';


-- =============================================
-- 2. BACKFILL: Popular indice_avaliacao em funcionarios_clinicas
-- =============================================
UPDATE funcionarios_clinicas fc
SET 
  indice_avaliacao = sub.max_numero_ordem,
  data_ultimo_lote = sub.ultima_data
FROM (
  SELECT 
    f.id AS funcionario_id,
    la.empresa_id,
    MAX(la.numero_ordem) AS max_numero_ordem,
    MAX(COALESCE(a.envio, a.inativada_em)) AS ultima_data
  FROM avaliacoes a
  JOIN funcionarios f ON f.cpf = a.funcionario_cpf
  JOIN lotes_avaliacao la ON la.id = a.lote_id
  WHERE a.status IN ('concluida', 'inativada')
    AND la.empresa_id IS NOT NULL
  GROUP BY f.id, la.empresa_id
) sub
WHERE fc.funcionario_id = sub.funcionario_id
  AND fc.empresa_id = sub.empresa_id
  AND fc.ativo = true
  AND (fc.indice_avaliacao IS NULL OR fc.indice_avaliacao = 0);


-- =============================================
-- 3. BACKFILL: Popular indice_avaliacao em funcionarios_entidades
-- =============================================
UPDATE funcionarios_entidades fe
SET 
  indice_avaliacao = sub.max_numero_ordem,
  data_ultimo_lote = sub.ultima_data
FROM (
  SELECT 
    f.id AS funcionario_id,
    la.entidade_id,
    MAX(la.numero_ordem) AS max_numero_ordem,
    MAX(COALESCE(a.envio, a.inativada_em)) AS ultima_data
  FROM avaliacoes a
  JOIN funcionarios f ON f.cpf = a.funcionario_cpf
  JOIN lotes_avaliacao la ON la.id = a.lote_id
  WHERE a.status IN ('concluida', 'inativada')
    AND la.entidade_id IS NOT NULL
  GROUP BY f.id, la.entidade_id
) sub
WHERE fe.funcionario_id = sub.funcionario_id
  AND fe.entidade_id = sub.entidade_id
  AND fe.ativo = true
  AND (fe.indice_avaliacao IS NULL OR fe.indice_avaliacao = 0);


-- =============================================
-- VERIFICAÇÃO
-- =============================================
DO $$
DECLARE
  v_func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'atualizar_ultima_avaliacao_funcionario'
  ) INTO v_func_exists;

  IF v_func_exists THEN
    RAISE NOTICE 'Migration 1106: Trigger atualizado para per-vinculo e backfill executado com sucesso';
  ELSE
    RAISE EXCEPTION 'Migration 1106: FALHA — função não encontrada';
  END IF;
END;
$$;

COMMIT;
