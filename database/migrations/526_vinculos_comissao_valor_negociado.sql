-- ============================================================================
-- Migration 526: Adicionar valor_negociado à tabela vinculos_comissao
-- Data: 12/03/2026
-- Descrição: Quando o admin associa manualmente um representante a um tomador
--            (sem lead), o campo valor_negociado permite registrar o valor
--            acordado por avaliação/funcionário. O campo é opcional (nullable).
--            A view v_solicitacoes_emissao é atualizada para usar
--            COALESCE(lr.valor_negociado, vc.valor_negociado) como
--            lead_valor_negociado, priorizando o valor do lead quando existir.
-- COMPATÍVEL COM: nr-bps_db (full schema) e nr-bps_db_test (schema reduzido)
-- ============================================================================

BEGIN;

-- 1. Adicionar coluna valor_negociado NULLABLE em vinculos_comissao
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS valor_negociado NUMERIC(12,2) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'vinculos_comissao'
      AND constraint_name = 'vinculo_valor_negociado_positivo'
  ) THEN
    ALTER TABLE public.vinculos_comissao
      ADD CONSTRAINT vinculo_valor_negociado_positivo
        CHECK (valor_negociado IS NULL OR valor_negociado >= 0);
  END IF;
END;
$$;

COMMENT ON COLUMN public.vinculos_comissao.valor_negociado IS
  'Valor negociado por avaliação/funcionário informado pelo admin ao associar'
  ' manualmente um representante. Nullable — NULL quando vem de um lead.';

-- 2. Recriar view v_solicitacoes_emissao de forma adaptativa ao schema
DO $$
DECLARE
  v_full_schema BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'clinicas'
      AND column_name  = 'entidade_id'
  ) INTO v_full_schema;

  IF v_full_schema THEN
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
      COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
      u.nome AS solicitante_nome,
      u.cpf AS solicitante_cpf,
      COUNT(a.id) AS num_avaliacoes_concluidas,
      la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
      la.criado_em AS lote_criado_em,
      la.liberado_em AS lote_liberado_em,
      la.status AS lote_status,
      l.id AS laudo_id,
      l.status AS laudo_status,
      l.hash_pdf IS NOT NULL AS laudo_tem_hash,
      l.emitido_em AS laudo_emitido_em,
      l.enviado_em AS laudo_enviado_em,
      CASE
        WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true
        ELSE false
      END AS laudo_ja_emitido,
      CASE
        WHEN c.id IS NOT NULL THEN 'rh'
        WHEN la.entidade_id IS NOT NULL THEN 'gestor'
        ELSE 'desconhecido'
      END AS tipo_solicitante,
      c.id AS clinica_id,
      c.nome AS clinica_nome,
      COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
      e.id AS empresa_id,
      vc.id AS vinculo_id,
      r.id AS representante_id,
      r.nome AS representante_nome,
      r.codigo AS representante_codigo,
      r.tipo_pessoa AS representante_tipo_pessoa,
      r.percentual_comissao AS representante_percentual_comissao,
      EXISTS(
        SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
      ) AS comissao_gerada,
      COALESCE(lr.valor_negociado, vc.valor_negociado) AS lead_valor_negociado
    FROM lotes_avaliacao la
    LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
    LEFT JOIN clinicas c ON c.id = la.clinica_id
    LEFT JOIN entidades ent ON ent.id = la.entidade_id
    LEFT JOIN usuarios u ON u.cpf = la.liberado_por
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    LEFT JOIN laudos l ON l.lote_id = la.id
    LEFT JOIN vinculos_comissao vc
      ON vc.status IN ('ativo', 'inativo')
      AND vc.data_expiracao > CURRENT_DATE
      AND (
        (
          COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL
          AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
        )
        OR
        (
          COALESCE(la.entidade_id, c.entidade_id) IS NULL
          AND la.clinica_id IS NOT NULL
          AND vc.clinica_id = la.clinica_id
        )
      )
    LEFT JOIN representantes r ON r.id = vc.representante_id
    LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
    WHERE la.status_pagamento IS NOT NULL
    GROUP BY
      la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome,
      u.nome, u.cpf,
      l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
      la.entidade_id,
      vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao,
      lr.valor_negociado, vc.valor_negociado
    ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

    COMMENT ON VIEW public.v_solicitacoes_emissao IS
      'lead_valor_negociado = COALESCE(lead.valor_negociado, vinculo.valor_negociado). '
      'Atualizada em 12/03/2026 (migration 526).';

    RAISE NOTICE 'OK: view v_solicitacoes_emissao recriada com vc.valor_negociado (full schema)';
  ELSE
    RAISE NOTICE 'SKIP: schema reduzido — view v_solicitacoes_emissao mantida sem alteração';
  END IF;
END;
$$;

-- Verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'vinculos_comissao'
      AND column_name  = 'valor_negociado'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna valor_negociado não encontrada em vinculos_comissao';
  END IF;
  RAISE NOTICE 'OK: Migration 526 aplicada — valor_negociado adicionado em vinculos_comissao';
END;
$$;

COMMIT;
