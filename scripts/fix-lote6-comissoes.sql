-- =============================================================================
-- FIX: Comissões do Lote #6 (custo_fixo)
--
-- Ação 1: Atualiza valor_comissao e valor_comissao_comercial da parcela 1/4
--         conforme a nova fórmula custo_fixo:
--           margem_por_parcela = (neg - custo_fixo) / neg × (valor_laudo / total_parcelas)
--           comercial_por_parcela = percentual_comissao_comercial% × margem_por_parcela
--
-- Ação 2: Reverte parcela 2/4 de 'paga' → 'retida'
--         (parcela 2/4 foi marcada 'paga' incorretamente; tomador ainda não pagou)
--
-- Execute em TRANSAÇÃO: psql -h <host> -d <db> -U <user> -f fix-lote6-comissoes.sql
-- Valide o SELECT antes de confirmar o COMMIT.
-- =============================================================================

BEGIN;

-- ───────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO: ver estado atual
-- ───────────────────────────────────────────────────────────────────────
SELECT
  cl.id,
  cl.parcela_numero,
  cl.total_parcelas,
  cl.status,
  cl.valor_laudo,
  cl.valor_comissao,
  cl.valor_comissao_comercial,
  cl.percentual_comissao,
  cl.percentual_comissao_comercial,
  v.valor_negociado,
  r.modelo_comissionamento,
  CASE
    WHEN cl.entidade_id IS NOT NULL THEN r.valor_custo_fixo_entidade
    ELSE r.valor_custo_fixo_clinica
  END AS custo_fixo_rep,
  -- cálculo esperado da margem por parcela
  ROUND(
    ((v.valor_negociado::NUMERIC - COALESCE(
        CASE WHEN cl.entidade_id IS NOT NULL THEN r.valor_custo_fixo_entidade
             ELSE r.valor_custo_fixo_clinica END, 0))
     / NULLIF(v.valor_negociado::NUMERIC, 0))
    * (cl.valor_laudo::NUMERIC / cl.total_parcelas), 2
  ) AS margem_por_parcela_calc,
  -- cálculo esperado do comercial por parcela
  ROUND(
    cl.percentual_comissao_comercial::NUMERIC / 100
    * ((v.valor_negociado::NUMERIC - COALESCE(
        CASE WHEN cl.entidade_id IS NOT NULL THEN r.valor_custo_fixo_entidade
             ELSE r.valor_custo_fixo_clinica END, 0))
       / NULLIF(v.valor_negociado::NUMERIC, 0))
    * (cl.valor_laudo::NUMERIC / cl.total_parcelas), 2
  ) AS comercial_por_parcela_calc
FROM comissoes_laudo cl
JOIN vinculos_comissao v ON v.id = cl.vinculo_id
JOIN representantes   r ON r.id = cl.representante_id
WHERE cl.lote_pagamento_id = 6
ORDER BY cl.parcela_numero;

-- ───────────────────────────────────────────────────────────────────────
-- AÇÃO 1: Corrigir valor_comissao e valor_comissao_comercial — parcela 1/4
-- ───────────────────────────────────────────────────────────────────────
UPDATE comissoes_laudo cl
SET
  valor_comissao = ROUND(
    ((v.valor_negociado::NUMERIC - COALESCE(
        CASE WHEN cl.entidade_id IS NOT NULL THEN r.valor_custo_fixo_entidade
             ELSE r.valor_custo_fixo_clinica END, 0))
     / NULLIF(v.valor_negociado::NUMERIC, 0))
    * (cl.valor_laudo::NUMERIC / cl.total_parcelas), 2
  ),
  valor_comissao_comercial = ROUND(
    cl.percentual_comissao_comercial::NUMERIC / 100
    * ((v.valor_negociado::NUMERIC - COALESCE(
        CASE WHEN cl.entidade_id IS NOT NULL THEN r.valor_custo_fixo_entidade
             ELSE r.valor_custo_fixo_clinica END, 0))
       / NULLIF(v.valor_negociado::NUMERIC, 0))
    * (cl.valor_laudo::NUMERIC / cl.total_parcelas), 2
  ),
  atualizado_em = NOW()
FROM vinculos_comissao v, representantes r
WHERE cl.vinculo_id  = v.id
  AND cl.representante_id = r.id
  AND cl.lote_pagamento_id = 6
  AND cl.parcela_numero    = 1;

-- ───────────────────────────────────────────────────────────────────────
-- AÇÃO 2: Reverter parcela 2/4 → 'retida' (tomador ainda não pagou)
-- ───────────────────────────────────────────────────────────────────────
UPDATE comissoes_laudo
SET
  status                    = 'retida'::status_comissao,
  data_pagamento            = NULL,
  parcela_confirmada_em     = NULL,
  asaas_split_executado     = FALSE,
  asaas_split_confirmado_em = NULL,
  data_aprovacao            = NULL,
  atualizado_em             = NOW()
WHERE lote_pagamento_id = 6
  AND parcela_numero    = 2;

-- ───────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-UPDATE
-- ───────────────────────────────────────────────────────────────────────
SELECT
  cl.id,
  cl.parcela_numero,
  cl.status,
  cl.valor_comissao,
  cl.valor_comissao_comercial,
  cl.parcela_confirmada_em,
  cl.data_pagamento
FROM comissoes_laudo cl
WHERE cl.lote_pagamento_id = 6
ORDER BY cl.parcela_numero;

-- Confirme visualmente os resultados acima antes de rodar COMMIT.
-- Se os valores estiverem corretos: COMMIT;
-- Se houver algum problema: ROLLBACK;
COMMIT;
