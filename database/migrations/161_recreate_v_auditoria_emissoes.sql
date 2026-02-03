-- Migration 161: Recriar view v_auditoria_emissoes sem dependência de 'codigo'
-- Data: 2026-02-03
-- Objetivo: Criar versão da view de auditoria que não referencia lotes_avaliacao.codigo (usa apenas ids)

BEGIN;

-- Remover (se existir) versão antiga
DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE;

-- Criar nova view sem coluna 'lote_codigo'
CREATE OR REPLACE VIEW v_auditoria_emissoes AS
SELECT 
    l.id AS laudo_id,
    l.lote_id,
    la.id AS lote_id_ref,
    la.titulo AS lote_titulo,
    la.contratante_id,
    la.empresa_id,
    -- Solicitante (da fila_emissao)
    fe.solicitado_por AS solicitante_cpf,
    fe.tipo_solicitante AS solicitante_perfil,
    fe.solicitado_em AS solicitado_em,
    -- Emissor (de laudos)
    l.emissor_cpf,
    l.emitido_em,
    -- Status
    l.status AS laudo_status,
    la.status AS lote_status,
    -- Hash (imutabilidade)
    l.hash_pdf,
    -- Auditoria
    al.acao AS ultima_acao,
    al.criado_em AS auditoria_em
FROM laudos l
INNER JOIN lotes_avaliacao la ON l.lote_id = la.id
LEFT JOIN fila_emissao fe ON l.lote_id = fe.lote_id
LEFT JOIN LATERAL (
    SELECT acao, criado_em
    FROM auditoria_laudos
    WHERE lote_id = l.lote_id
    ORDER BY criado_em DESC
    LIMIT 1
) al ON true
ORDER BY l.emitido_em DESC NULLS LAST;

COMMENT ON VIEW v_auditoria_emissoes IS 
'View consolidada para auditoria: liga solicitante → emissor → laudo com rastreabilidade completa (sem lote.codigo)';

COMMIT;