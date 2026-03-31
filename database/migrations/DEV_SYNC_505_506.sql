-- ============================================================================
-- SYNC DEV: Aplica migrações 505 e 506 no banco de desenvolvimento
--
-- Este script é seguro para re-executar (idempotente).
-- Execute na seguinte ordem:
--   1. Parte A (505): altera o enum e migra dados
--   2. Parte B (506): cria índices e gera comissões retroativas
--
-- Pré-requisito: migrações 500-504 já aplicadas (enum status_comissao existe
--   com os valores: retida, aprovada, congelada_rep_suspenso,
--   congelada_aguardando_admin, liberada, paga, cancelada)
-- ============================================================================

-- ============================================================================
-- PARTE A — Migration 505: Revisão do enum status_comissao
-- ============================================================================

BEGIN;

-- 1. Adicionar novos valores ao enum (idempotente via IF NOT EXISTS)
ALTER TYPE status_comissao ADD VALUE IF NOT EXISTS 'pendente_nf';
ALTER TYPE status_comissao ADD VALUE IF NOT EXISTS 'nf_em_analise';

COMMIT;

-- Enum changes precisam ser commitadas antes de usar os novos valores
BEGIN;

-- 2. Migrar dados: 'aprovada' → 'pendente_nf'
UPDATE comissoes_laudo
SET status = 'pendente_nf',
    atualizado_em = NOW()
WHERE status::text = 'aprovada';

-- 3. Comissões com NF já enviada → 'nf_em_analise'
UPDATE comissoes_laudo
SET status = 'nf_em_analise',
    atualizado_em = NOW()
WHERE status::text = 'pendente_nf'
  AND nf_rpa_enviada_em IS NOT NULL
  AND nf_rpa_aprovada_em IS NULL
  AND nf_rpa_rejeitada_em IS NULL;

-- 4. Limpar motivo_congelamento obsoleto
UPDATE comissoes_laudo
SET motivo_congelamento = NULL
WHERE motivo_congelamento::text = 'nf_rpa_pendente';

-- 5. Limpar colunas que serão removidas (null-out primeiro)
UPDATE comissoes_laudo
SET auto_cancelamento_em = NULL,
    sla_admin_aviso_em = NULL
WHERE auto_cancelamento_em IS NOT NULL OR sla_admin_aviso_em IS NOT NULL;

-- 6. Remover índice legado
DROP INDEX IF EXISTS idx_comissoes_auto_cancelamento;

-- 7. Remover colunas legado
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS auto_cancelamento_em;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS sla_admin_aviso_em;

-- 8. Remover função legado
DROP FUNCTION IF EXISTS executar_corte_nf_manual(DATE);

-- 9. Registrar auditoria (ignora erro de duplicata)
INSERT INTO comissionamento_auditoria (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
SELECT 'comissoes_laudo', 0, 'aprovada', 'pendente_nf', 'sistema',
       'Migration 505 (DEV SYNC): enum aprovada→pendente_nf + adição nf_em_analise'
WHERE NOT EXISTS (
  SELECT 1 FROM comissionamento_auditoria
  WHERE motivo LIKE 'Migration 505%'
);

COMMIT;

-- ============================================================================
-- PARTE B — Migration 506: Índices e comissões retroativas
-- ============================================================================

BEGIN;

-- 1. ÍNDICE UNIQUE: uma comissão por lote_pagamento_id
DROP INDEX IF EXISTS idx_comissoes_lote_pagamento_unique;

CREATE UNIQUE INDEX idx_comissoes_lote_pagamento_unique
  ON public.comissoes_laudo (lote_pagamento_id)
  WHERE lote_pagamento_id IS NOT NULL;

COMMENT ON INDEX idx_comissoes_lote_pagamento_unique IS
  'Garante no máximo uma comissão por lote de pagamento.';

-- 2. Índice em clinica_id para performance
CREATE INDEX IF NOT EXISTS idx_comissoes_clinica_id
  ON public.comissoes_laudo (clinica_id)
  WHERE clinica_id IS NOT NULL;

-- 3. Comissões retroativas para ENTIDADES
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

-- 4. Comissões retroativas para CLÍNICAS (sem entidade)
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

-- 5. Auditoria das comissões retroativas
INSERT INTO public.comissionamento_auditoria (
  tabela, registro_id, status_anterior, status_novo, triggador, motivo
)
SELECT
  'comissoes_laudo',
  cl.id,
  NULL,
  cl.status::text,
  'sistema',
  'Comissão retroativa gerada pela migration 506 (DEV SYNC) para lote pago sem comissão'
FROM comissoes_laudo cl
WHERE cl.criado_em >= NOW() - INTERVAL '5 seconds'
  AND NOT EXISTS (
    SELECT 1 FROM comissionamento_auditoria ca
    WHERE ca.registro_id = cl.id
      AND ca.tabela = 'comissoes_laudo'
      AND ca.motivo LIKE 'Comissão retroativa%'
  );

DO $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM comissoes_laudo
  WHERE criado_em >= NOW() - INTERVAL '10 seconds';
  RAISE NOTICE '✅ DEV SYNC concluído. Comissões retroativas geradas: %', v_total;
END
$$;

COMMIT;
