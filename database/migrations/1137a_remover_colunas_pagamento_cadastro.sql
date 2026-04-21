-- Migration 1137: Remover colunas pagamento_confirmado e data_liberacao_login
-- Essas colunas pertenciam ao sistema legado de "pagamento para liberar cadastro"
-- que foi completamente removido. Pagamento agora ocorre apenas na emissão de laudos.
-- Data: 2026-04-01

BEGIN;

-- 1. Dropar views dependentes (CASCADE faria isso, mas preferimos controle explícito)
DROP VIEW IF EXISTS public.v_relatorio_emissoes;
DROP VIEW IF EXISTS public.tomadores;

-- 2. Dropar índice legado
DROP INDEX IF EXISTS public.idx_contratantes_data_liberacao;

-- 3. Remover colunas de entidades
ALTER TABLE public.entidades DROP COLUMN IF EXISTS pagamento_confirmado;
ALTER TABLE public.entidades DROP COLUMN IF EXISTS data_liberacao_login;

-- 4. Remover colunas de clinicas
ALTER TABLE public.clinicas DROP COLUMN IF EXISTS pagamento_confirmado;
ALTER TABLE public.clinicas DROP COLUMN IF EXISTS data_liberacao_login;

-- 5. Recriar VIEW tomadores SEM pagamento_confirmado
CREATE VIEW public.tomadores AS
  SELECT
    entidades.id,
    entidades.nome,
    entidades.cnpj,
    'entidade'::character varying(20) AS tipo,
    entidades.email,
    entidades.responsavel_nome,
    entidades.responsavel_cpf,
    entidades.responsavel_email,
    entidades.responsavel_celular,
    entidades.ativa,
    entidades.status,
    entidades.numero_funcionarios_estimado,
    entidades.criado_em,
    entidades.atualizado_em
  FROM entidades
  WHERE entidades.id IS NOT NULL
  UNION ALL
  SELECT
    clinicas.id,
    clinicas.nome,
    clinicas.cnpj,
    'clinica'::character varying(20) AS tipo,
    clinicas.email,
    clinicas.responsavel_nome,
    clinicas.responsavel_cpf,
    clinicas.responsavel_email,
    clinicas.responsavel_celular,
    clinicas.ativa,
    clinicas.status,
    clinicas.numero_funcionarios_estimado,
    clinicas.criado_em,
    clinicas.atualizado_em
  FROM clinicas
  WHERE clinicas.id IS NOT NULL;

-- 6. Recriar VIEW v_relatorio_emissoes (depende de tomadores)
CREATE VIEW public.v_relatorio_emissoes AS
  SELECT
    l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
    CASE
      WHEN l.clinica_id IS NOT NULL THEN 'clinica'::text
      WHEN l.entidade_id IS NOT NULL THEN 'entidade'::text
      ELSE NULL::text
    END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome,
    l.empresa_id,
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    COUNT(DISTINCT a.id) AS total_avaliacoes,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status::text = 'concluida'::text) AS avaliacoes_concluidas
  FROM lotes_avaliacao l
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN tomadores t ON t.id = l.entidade_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
    LEFT JOIN laudos ld ON ld.lote_id = l.id
    LEFT JOIN avaliacoes a ON a.lote_id = l.id
  GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id,
           c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;

-- 7. Grants (manter acesso)
GRANT SELECT ON public.tomadores TO authenticated;
GRANT SELECT ON public.v_relatorio_emissoes TO authenticated;

COMMIT;
