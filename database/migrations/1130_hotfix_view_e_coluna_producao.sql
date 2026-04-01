-- ============================================================================
-- Migration 1130: Hotfix — Criação da view v_solicitacoes_emissao e coluna
--                 vinculos_comissao.valor_negociado em produção
-- Data: 2026-03-31
-- Motivo: Produção (neondb) está sem a view e coluna que foram criadas nas
--         migrations 524-526 (aplicadas em DEV/staging, mas não em PROD).
-- Erros corrigidos:
--   - NeonDbError: relation "v_solicitacoes_emissao" does not exist  (api/admin/emissoes)
--   - error: column v.valor_negociado does not exist  (api/admin/entidades)
-- Safe: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW  → idempotente
-- ============================================================================

BEGIN;

-- =========================================================
-- PARTE 1: Adicionar coluna valor_negociado em vinculos_comissao
-- =========================================================
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS valor_negociado NUMERIC(12,2) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name   = 'vinculos_comissao'
      AND constraint_name = 'vinculo_valor_negociado_positivo'
  ) THEN
    ALTER TABLE public.vinculos_comissao
      ADD CONSTRAINT vinculo_valor_negociado_positivo
        CHECK (valor_negociado IS NULL OR valor_negociado >= 0);
  END IF;
END;
$$;

COMMENT ON COLUMN public.vinculos_comissao.valor_negociado IS
  'Valor negociado por avaliação/funcionário informado pelo admin ao associar '
  'manualmente um representante. Nullable — NULL quando vem de um lead.';

-- =========================================================
-- PARTE 2: Criar/recriar view v_solicitacoes_emissao
-- Compatível com schema sem clinicas.entidade_id e sem
-- vinculos_comissao.clinica_id / representantes.percentual_comissao
-- =========================================================
CREATE OR REPLACE VIEW public.v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  la.link_pagamento_token,
  la.link_pagamento_enviado_em,
  la.pagamento_metodo,
  la.pagamento_parcelas,
  la.pago_em,
  e.nome AS empresa_nome,
  COALESCE(c.nome, ent.nome, e.nome) AS nome_tomador,
  u.nome AS solicitante_nome,
  u.cpf AS solicitante_cpf,
  COUNT(a.id) AS num_avaliacoes_concluidas,
  la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
  la.criado_em AS lote_criado_em,
  la.liberado_em AS lote_liberado_em,
  la.status AS lote_status,
  -- Informações do laudo
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS laudo_tem_hash,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  CASE
    WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true
    ELSE false
  END AS laudo_ja_emitido,
  -- Tipo de solicitante
  CASE
    WHEN c.id IS NOT NULL THEN 'rh'
    WHEN la.entidade_id IS NOT NULL THEN 'gestor'
    ELSE 'desconhecido'
  END AS tipo_solicitante,
  c.id AS clinica_id,
  c.nome AS clinica_nome,
  la.entidade_id AS entidade_id,
  e.id AS empresa_id,
  -- Representante vinculado (baseado em entidade_id do lote)
  vc.id AS vinculo_id,
  r.id AS representante_id,
  r.nome AS representante_nome,
  r.codigo AS representante_codigo,
  r.tipo_pessoa AS representante_tipo_pessoa,
  -- Flag de comissão gerada
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada,
  -- Valor negociado: prioriza lead, fallback vínculo manual
  COALESCE(lr.valor_negociado, vc.valor_negociado) AS lead_valor_negociado
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes e   ON e.id = la.empresa_id
LEFT JOIN clinicas c            ON c.id = la.clinica_id
LEFT JOIN entidades ent         ON ent.id = la.entidade_id
LEFT JOIN usuarios u            ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a          ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l              ON l.lote_id = la.id
LEFT JOIN vinculos_comissao vc
  ON vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
  AND la.entidade_id IS NOT NULL
  AND vc.entidade_id = la.entidade_id
LEFT JOIN representantes r      ON r.id = vc.representante_id
LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, ent.nome,
  u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa,
  lr.valor_negociado, vc.valor_negociado
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW public.v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão de laudos. '
  'lead_valor_negociado = COALESCE(lead.valor_negociado, vinculo.valor_negociado). '
  'Hotfix 1130 aplicado em 2026-03-31.';

-- =========================================================
-- VERIFICAÇÃO
-- =========================================================
DO $$
BEGIN
  -- Checar coluna
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'vinculos_comissao'
      AND column_name  = 'valor_negociado'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna valor_negociado não encontrada em vinculos_comissao';
  END IF;

  -- Checar view
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name   = 'v_solicitacoes_emissao'
  ) THEN
    RAISE EXCEPTION 'FALHA: view v_solicitacoes_emissao não foi criada';
  END IF;

  RAISE NOTICE 'OK: Migration 1130 aplicada com sucesso';
  RAISE NOTICE '  - vinculos_comissao.valor_negociado ✓';
  RAISE NOTICE '  - view v_solicitacoes_emissao ✓';
END;
$$;

COMMIT;

