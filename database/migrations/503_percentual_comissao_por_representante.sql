-- ============================================================================
-- MIGRATION 503: Percentual de comissão individual por representante
-- Descrição: Adiciona coluna percentual_comissao em representantes (definido
--            pelo admin). Remove colunas obsoletas de comissoes_laudo
--            (percentual_custas_plataforma, valor_comissionavel).
--            Nova fórmula: valor_comissao = valor_laudo × percentual / 100.
--            Dia de pagamento passa de 10 para 15.
--            Atualiza view v_solicitacoes_emissao.
-- Data: 2026-03-03
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. NOVA COLUNA em representantes
-- ============================================================================

ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN public.representantes.percentual_comissao IS
  'Percentual de comissão individual definido pelo admin. '
  'Usado na fórmula: valor_comissao = valor_laudo × percentual_comissao / 100. '
  'NULL = não definido → bloqueia geração de comissão.';

-- ============================================================================
-- 2. REMOVER COLUNAS OBSOLETAS de comissoes_laudo
-- ============================================================================

-- percentual_custas_plataforma e valor_comissionavel não fazem mais parte
-- da fórmula (era: 25% custas + 40% rep). Nova fórmula é direta.
ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS percentual_custas_plataforma;

ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS valor_comissionavel;

-- Atualizar comentário de percentual_comissao (agora é % individual do rep)
COMMENT ON COLUMN public.comissoes_laudo.percentual_comissao IS
  'Percentual do representante aplicado diretamente sobre o valor_laudo. '
  'Fórmula: valor_comissao = valor_laudo × percentual_comissao / 100. '
  'Copiado de representantes.percentual_comissao no momento da geração.';

-- Atualizar comentário de valor_comissao
COMMENT ON COLUMN public.comissoes_laudo.valor_comissao IS
  'Valor final da comissão: valor_laudo × percentual_comissao / 100. '
  'Armazenado para auditabilidade e histórico.';

-- Remover DEFAULT antigo de percentual_comissao (40.00)
ALTER TABLE public.comissoes_laudo
  ALTER COLUMN percentual_comissao DROP DEFAULT;

-- ============================================================================
-- 3. ATUALIZAR VIEW v_solicitacoes_emissao
--    Adiciona r.percentual_comissao para que o frontend saiba o % do rep
-- ============================================================================

CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
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
  COALESCE(c.nome, e.nome) AS nome_tomador,
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
  -- COALESCE: lotes RH/clínica não preenchem la.entidade_id; resolver via clinicas.entidade_id
  COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
  e.id AS empresa_id,
  -- Dados do representante vinculado
  vc.id AS vinculo_id,
  r.id AS representante_id,
  r.nome AS representante_nome,
  r.codigo AS representante_codigo,
  r.tipo_pessoa AS representante_tipo_pessoa,
  -- NOVO: Percentual de comissão definido para o representante
  r.percentual_comissao AS representante_percentual_comissao,
  -- Flag indicando se comissão já foi gerada para este lote
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
-- JOIN com vínculos de comissão ativos (entidade resolvida via COALESCE)
LEFT JOIN vinculos_comissao vc
  ON vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
  AND vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
LEFT JOIN representantes r ON r.id = vc.representante_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão. '
  'Inclui dados de representante vinculado, percentual de comissão e flag de comissão gerada. '
  'Atualizada em 03/03/2026 (migration 503).';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  -- Verificar nova coluna em representantes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'representantes'
      AND column_name = 'percentual_comissao'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna percentual_comissao não encontrada em representantes';
  END IF;

  -- Verificar que colunas obsoletas foram removidas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'percentual_custas_plataforma'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna percentual_custas_plataforma ainda existe em comissoes_laudo';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'valor_comissionavel'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna valor_comissionavel ainda existe em comissoes_laudo';
  END IF;

  RAISE NOTICE 'OK: Migration 503 aplicada com sucesso';
END;
$$;

COMMIT;
