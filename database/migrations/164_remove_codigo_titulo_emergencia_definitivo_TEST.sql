-- ============================================================================
-- Migration 164 (TEST VERSION): Remove codigo, titulo, modo_emergencia, motivo_emergencia
-- Versão simplificada para banco de testes
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: REMOVER COLUNAS (CASCADE remove constraints automaticamente)
-- ============================================================================

ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS codigo CASCADE;
COMMENT ON TABLE lotes_avaliacao IS 'Colunas codigo, titulo, modo_emergencia e motivo_emergencia REMOVIDAS - usar somente ID';

ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS titulo CASCADE;
ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS modo_emergencia CASCADE;
ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS motivo_emergencia CASCADE;

-- ============================================================================
-- PARTE 2: RECRIAR VIEW V_AUDITORIA_EMISSOES (sem campos removidos)
-- ============================================================================

DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE;

CREATE OR REPLACE VIEW v_auditoria_emissoes AS
SELECT
    l.id AS laudo_id,
    l.lote_id,
    la.contratante_id,
    la.empresa_id,
    fe.solicitado_por AS solicitante_cpf,
    fe.tipo_solicitante AS solicitante_perfil,
    fe.solicitado_em,
    l.emissor_cpf,
    l.emitido_em,
    l.status AS laudo_status,
    la.status AS lote_status,
    l.hash_pdf,
    al.acao AS ultima_acao,
    al.criado_em AS auditoria_em
FROM laudos l
JOIN lotes_avaliacao la ON l.lote_id = la.id
LEFT JOIN fila_emissao fe ON l.lote_id = fe.lote_id
LEFT JOIN LATERAL (
    SELECT acao, criado_em
    FROM auditoria_laudos
    WHERE lote_id = l.lote_id
    ORDER BY criado_em DESC
    LIMIT 1
) al ON true
ORDER BY l.emitido_em DESC NULLS LAST;

COMMENT ON VIEW v_auditoria_emissoes IS 'View de auditoria de emissões de laudos - ID-only (sem codigo/titulo/emergencia)';

-- ============================================================================
-- PARTE 3: LIMPAR AUDIT_LOGS (se a tabela existir)
-- ============================================================================

DELETE FROM audit_logs 
WHERE 
  details ILIKE '%modo_emergencia%' 
  OR details ILIKE '%codigo%lote%'
  OR details ILIKE '%titulo%lote%'
  OR resource = 'lote' AND (
    old_data::text ILIKE '%codigo%'
    OR old_data::text ILIKE '%titulo%'
    OR new_data::text ILIKE '%modo_emergencia%'
  );

-- ============================================================================
-- PARTE 4: VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se laudos estão alinhados com lotes
    SELECT COUNT(*) INTO v_count
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE l.id <> l.lote_id;
    
    IF v_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: % laudos com ID desalinhado do lote_id!', v_count;
    ELSE
        RAISE NOTICE '✓ Validação OK: Todos os laudos têm ID = lote_id';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- FIM DA MIGRATION 164 (TEST VERSION)
-- ============================================================================
