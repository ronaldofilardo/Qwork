-- ============================================================================
-- MIGRATION 502: Ajustes no sistema de comissionamento
-- Descrição: Corrige fórmula de cálculo (25% custas + 40% rep), remove trigger
--            automático, adiciona campos de NF/RPA e lote de pagamento.
-- Data: 2026-03-03
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. NOVAS COLUNAS em comissoes_laudo
-- ============================================================================

-- Percentual de custas da plataforma (desconto aplicado antes de calcular comissão)
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS percentual_custas_plataforma DECIMAL(5,2) NOT NULL DEFAULT 25.00;

COMMENT ON COLUMN public.comissoes_laudo.percentual_custas_plataforma IS
  'Percentual de custas da plataforma descontado do valor bruto do laudo antes de calcular a base comissionável. Padrão: 25%.';

-- Valor comissionável = valor_laudo × (1 - percentual_custas/100)
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS valor_comissionavel DECIMAL(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.comissoes_laudo.valor_comissionavel IS
  'Base de cálculo da comissão: valor_laudo × (1 - percentual_custas_plataforma/100). Armazenado para auditabilidade.';

-- Caminho do arquivo de NF/RPA enviado pelo representante
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS nf_path TEXT;

COMMENT ON COLUMN public.comissoes_laudo.nf_path IS
  'Caminho relativo do arquivo NF/RPA no storage. DEV: /storage/NF/{codigo_rep}/. PROD: Backblaze.';

-- Nome original do arquivo NF/RPA
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS nf_nome_arquivo TEXT;

COMMENT ON COLUMN public.comissoes_laudo.nf_nome_arquivo IS
  'Nome original do arquivo NF/RPA enviado pelo representante (ex: NF-2026-03.pdf).';

-- FK para o lote de avaliação que originou a comissão
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS lote_pagamento_id INTEGER REFERENCES public.lotes_avaliacao(id);

COMMENT ON COLUMN public.comissoes_laudo.lote_pagamento_id IS
  'FK para o lote de avaliação cujo pagamento originou esta comissão. Usado para prevenir duplicatas.';

-- Índice para prevenir comissão duplicada por lote + representante
CREATE UNIQUE INDEX IF NOT EXISTS idx_comissoes_lote_rep_unico
  ON public.comissoes_laudo (lote_pagamento_id, representante_id)
  WHERE lote_pagamento_id IS NOT NULL;

-- ============================================================================
-- 2. ATUALIZAR DEFAULT do percentual_comissao (2.50 → 40.00)
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ALTER COLUMN percentual_comissao SET DEFAULT 40.00;

COMMENT ON COLUMN public.comissoes_laudo.percentual_comissao IS
  'Percentual do representante aplicado sobre a base comissionável (valor_comissionavel). Padrão: 40%.';

COMMENT ON COLUMN public.comissoes_laudo.valor_comissao IS
  'Valor final da comissão: valor_comissionavel × percentual_comissao / 100. Armazenado para auditabilidade.';

-- ============================================================================
-- 3. REMOVER TRIGGER automático (comissão agora é ato do admin)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_laudo_emitido_gerar_comissao ON public.laudos;
DROP FUNCTION IF EXISTS public.trg_criar_comissao_ao_emitir_laudo();

-- ============================================================================
-- 4. FUNÇÃO: Corte manual de NF (executada pelo admin, sem cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.executar_corte_nf_manual(p_mes_referencia DATE)
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  -- Congela comissões aprovadas sem NF enviada para o mês de pagamento informado
  UPDATE public.comissoes_laudo
  SET    status                = 'congelada_aguardando_admin',
         motivo_congelamento   = 'nf_rpa_pendente',
         auto_cancelamento_em  = NOW() + INTERVAL '30 days'
  WHERE  status = 'aprovada'
    AND  nf_rpa_enviada_em IS NULL
    AND  mes_pagamento = p_mes_referencia;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.executar_corte_nf_manual(DATE) IS
  'Executada manualmente pelo admin após dia 5 do mês. Congela comissões aprovadas '
  'que não receberam NF/RPA no prazo. O parâmetro p_mes_referencia é o primeiro dia '
  'do mês de pagamento (ex: 2026-04-01).';

-- ============================================================================
-- 5. ATUALIZAR VIEW v_solicitacoes_emissao com dados de representante
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
  la.entidade_id,
  e.id AS empresa_id,
  -- NOVO: Dados do representante vinculado
  vc.id AS vinculo_id,
  r.id AS representante_id,
  r.nome AS representante_nome,
  r.codigo AS representante_codigo,
  r.tipo_pessoa AS representante_tipo_pessoa,
  -- NOVO: Flag indicando se comissão já foi gerada para este lote
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
-- JOIN com vínculos de comissão ativos para a entidade do lote
LEFT JOIN vinculos_comissao vc
  ON vc.entidade_id = la.entidade_id
  AND vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
LEFT JOIN representantes r ON r.id = vc.representante_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão. '
  'Inclui dados de representante vinculado e flag de comissão gerada. '
  'Atualizada em 03/03/2026 (migration 502).';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  -- Verificar novas colunas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'percentual_custas_plataforma'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna percentual_custas_plataforma não encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'valor_comissionavel'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna valor_comissionavel não encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'nf_path'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna nf_path não encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comissoes_laudo'
      AND column_name = 'lote_pagamento_id'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna lote_pagamento_id não encontrada';
  END IF;

  -- Verificar que trigger foi removido
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_laudo_emitido_gerar_comissao'
  ) THEN
    RAISE EXCEPTION 'FALHA: trigger trg_laudo_emitido_gerar_comissao ainda existe';
  END IF;

  RAISE NOTICE 'OK: Migration 502 aplicada com sucesso';
END;
$$;

COMMIT;
