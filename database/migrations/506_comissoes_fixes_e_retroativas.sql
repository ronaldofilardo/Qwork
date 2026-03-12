-- ============================================================================
-- MIGRATION 506: Correções na máquina de estados de comissões + retroativas
-- Descrição:
--   1. Índice UNIQUE em lote_pagamento_id (uma comissão por lote)
--   2. Índice em clinica_id para JOINs
--   3. Geração retroativa de comissões para lotes pagos que não têm comissão
-- Data: 2026-03-04
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ÍNDICE UNIQUE: uma comissão por lote_pagamento_id (F-20)
--    Substitui a lógica de duplicação por (lote+representante)
-- ============================================================================

-- Remover índice parcial se existir
DROP INDEX IF EXISTS idx_comissoes_lote_pagamento_unique;

CREATE UNIQUE INDEX idx_comissoes_lote_pagamento_unique
  ON public.comissoes_laudo (lote_pagamento_id)
  WHERE lote_pagamento_id IS NOT NULL;

COMMENT ON INDEX idx_comissoes_lote_pagamento_unique IS
  'Garante no máximo uma comissão por lote de pagamento.';

-- ============================================================================
-- 2. ÍNDICE em clinica_id para performance de JOINs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comissoes_clinica_id
  ON public.comissoes_laudo (clinica_id)
  WHERE clinica_id IS NOT NULL;

-- ============================================================================
-- 3. GERAÇÃO RETROATIVA DE COMISSÕES
--    Para cada lote de avaliação com status_pagamento='pago' que NÃO tenha
--    comissão associada, e cujo dono (entidade ou clínica) tenha um vínculo
--    de comissão ativo/inativo com um representante que:
--      - tenha percentual_comissao definido
--      - não esteja desativado/rejeitado
-- ============================================================================

-- Comissões retroativas para ENTIDADES
INSERT INTO public.comissoes_laudo (
  vinculo_id, representante_id, entidade_id, clinica_id, laudo_id,
  lote_pagamento_id, valor_laudo, percentual_comissao, valor_comissao,
  status, mes_emissao, data_emissao_laudo, data_aprovacao
)
SELECT
  v.id AS vinculo_id,
  v.representante_id,
  la.entidade_id,
  NULL::integer AS clinica_id,
  NULL::integer AS laudo_id,
  la.id AS lote_pagamento_id,
  -- valor_total = valor_por_funcionario * qtd avaliações
  COALESCE(la.valor_por_funcionario, 0) * cnt.qtd AS valor_laudo,
  r.percentual_comissao,
  ROUND((COALESCE(la.valor_por_funcionario, 0) * cnt.qtd * r.percentual_comissao / 100)::numeric, 2) AS valor_comissao,
  -- Status: se rep é apto → pendente_nf, senão → retida
  CASE WHEN r.status = 'apto' THEN 'pendente_nf'::status_comissao
       ELSE 'retida'::status_comissao END AS status,
  DATE_TRUNC('month', la.pago_em)::date AS mes_emissao,
  la.pago_em AS data_emissao_laudo,
  CASE WHEN r.status = 'apto' THEN la.pago_em ELSE NULL END AS data_aprovacao
FROM lotes_avaliacao la
INNER JOIN (
  SELECT a.lote_id, COUNT(*) AS qtd
  FROM avaliacoes a
  GROUP BY a.lote_id
) cnt ON cnt.lote_id = la.id
INNER JOIN vinculos_comissao v
  ON v.entidade_id = la.entidade_id
  AND v.status IN ('ativo', 'inativo')
INNER JOIN representantes r
  ON r.id = v.representante_id
  AND r.status NOT IN ('desativado', 'rejeitado')
  AND r.percentual_comissao IS NOT NULL
WHERE la.status_pagamento = 'pago'
  AND la.entidade_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  )
  AND COALESCE(la.valor_por_funcionario, 0) * cnt.qtd > 0;

-- Comissões retroativas para CLÍNICAS (RH-flow sem entidade espelho)
INSERT INTO public.comissoes_laudo (
  vinculo_id, representante_id, entidade_id, clinica_id, laudo_id,
  lote_pagamento_id, valor_laudo, percentual_comissao, valor_comissao,
  status, mes_emissao, data_emissao_laudo, data_aprovacao
)
SELECT
  v.id AS vinculo_id,
  v.representante_id,
  NULL::integer AS entidade_id,
  la.clinica_id,
  NULL::integer AS laudo_id,
  la.id AS lote_pagamento_id,
  COALESCE(la.valor_por_funcionario, 0) * cnt.qtd AS valor_laudo,
  r.percentual_comissao,
  ROUND((COALESCE(la.valor_por_funcionario, 0) * cnt.qtd * r.percentual_comissao / 100)::numeric, 2) AS valor_comissao,
  CASE WHEN r.status = 'apto' THEN 'pendente_nf'::status_comissao
       ELSE 'retida'::status_comissao END AS status,
  DATE_TRUNC('month', la.pago_em)::date AS mes_emissao,
  la.pago_em AS data_emissao_laudo,
  CASE WHEN r.status = 'apto' THEN la.pago_em ELSE NULL END AS data_aprovacao
FROM lotes_avaliacao la
INNER JOIN (
  SELECT a.lote_id, COUNT(*) AS qtd
  FROM avaliacoes a
  GROUP BY a.lote_id
) cnt ON cnt.lote_id = la.id
INNER JOIN vinculos_comissao v
  ON v.clinica_id = la.clinica_id
  AND v.status IN ('ativo', 'inativo')
INNER JOIN representantes r
  ON r.id = v.representante_id
  AND r.status NOT IN ('desativado', 'rejeitado')
  AND r.percentual_comissao IS NOT NULL
WHERE la.status_pagamento = 'pago'
  AND la.clinica_id IS NOT NULL
  AND la.entidade_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  )
  AND COALESCE(la.valor_por_funcionario, 0) * cnt.qtd > 0;

-- Registrar auditoria para todas as comissões retroativas geradas
INSERT INTO public.comissionamento_auditoria (
  tabela, registro_id, status_anterior, status_novo, triggador, motivo
)
SELECT
  'comissoes_laudo',
  cl.id,
  NULL,
  cl.status::text,
  'sistema',
  'Comissão retroativa gerada pela migration 506 para lote pago sem comissão'
FROM comissoes_laudo cl
WHERE cl.criado_em >= NOW() - INTERVAL '5 seconds'
  AND NOT EXISTS (
    SELECT 1 FROM comissionamento_auditoria ca
    WHERE ca.registro_id = cl.id
      AND ca.tabela = 'comissoes_laudo'
      AND ca.motivo LIKE 'Comissão retroativa%'
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_total_retroativas BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_retroativas
  FROM comissoes_laudo
  WHERE criado_em >= NOW() - INTERVAL '10 seconds';

  RAISE NOTICE '✅ Migration 506 concluída. Comissões retroativas geradas: %', v_total_retroativas;
END
$$;

COMMIT;
