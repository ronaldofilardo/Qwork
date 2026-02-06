-- ====================================================================
-- CORREÇÃO: Status do Lote 27
-- Data: 05/02/2026
-- Descrição: Corrigir status do lote 27 para 'concluido'
-- ====================================================================

BEGIN;

-- Verificar estado atual do lote 27
SELECT 
    id,
    status,
    contratante_id,
    clinica_id,
    criado_em,
    atualizado_em
FROM lotes_avaliacao
WHERE id = 27;

-- Atualizar status para 'concluido'
UPDATE lotes_avaliacao
SET 
    status = 'concluido',
    atualizado_em = CURRENT_TIMESTAMP
WHERE id = 27
  AND status != 'concluido';

-- Registrar auditoria da correção (condicional: se audit_log existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    INSERT INTO audit_log (
        resource,
        action,
        resource_id,
        cpf_usuario,
        perfil_usuario,
        details,
        ip_address,
        created_at
    )
    VALUES (
        'lotes_avaliacao',
        'UPDATE',
        '27',
        'system',
        'admin',
        'Correção manual: status alterado para concluido devido a erro corrigido após conclusão',
        'system-migration',
        CURRENT_TIMESTAMP
    );
  ELSE
    RAISE NOTICE 'Tabela audit_log não existe - pulando registro de auditoria.';
  END IF;
END $$;

COMMIT;

-- Verificar resultado
SELECT 
    '✅ Lote 27 atualizado' AS resultado,
    id,
    status,
    atualizado_em
FROM lotes_avaliacao
WHERE id = 27;
