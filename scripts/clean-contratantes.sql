-- ==========================================
-- SCRIPT DE LIMPEZA: REMOVER TODAS AS ENTIDADES
-- Data: 2025-12-22
-- ÚLTIMA ATUALIZAÇÃO: 2026-02-06 (Renomeação tomadores → entidades)
-- Objetivo: Limpar todos os dados de entidades do banco nr-bps_db
-- 
-- ⚠️  ATENÇÃO CRÍTICA: ESTE SCRIPT REMOVE TODOS OS DADOS DE ENTIDADES!
-- ⚠️  SENHAS NÃO SÃO MAIS DELETADAS AUTOMATICAMENTE (Proteção implementada)
-- ⚠️  Execute apenas em ambiente de DESENVOLVIMENTO/TESTE
-- ⚠️  NUNCA execute este script em PRODUÇÃO!
-- ==========================================

BEGIN;

-- ==========================================
-- 1. LOG DE SEGURANÇA - CONTAR ANTES DA LIMPEZA
-- ==========================================

DO $$
DECLARE
    v_total_entidades INTEGER;
    v_total_entidades_senhas INTEGER;
    v_total_contratos INTEGER;
    v_total_pagamentos INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_entidades FROM entidades;
    SELECT COUNT(*) INTO v_total_entidades_senhas FROM entidades_senhas;
    SELECT COUNT(*) INTO v_total_contratos FROM contratos;
    SELECT COUNT(*) INTO v_total_pagamentos FROM pagamentos;

    RAISE NOTICE '=== CONTAGEM ANTES DA LIMPEZA ===';
    RAISE NOTICE 'Entidades: %', v_total_entidades;
    RAISE NOTICE 'entidades_senhas: %', v_total_entidades_senhas;
    RAISE NOTICE 'Contratos: %', v_total_contratos;
    RAISE NOTICE 'Pagamentos: %', v_total_pagamentos;
    RAISE NOTICE '================================';
END $$;

-- ==========================================
-- 2. REMOVER DADOS EM ORDEM DE DEPENDÊNCIA
-- ==========================================

-- Remover notificações financeiras relacionadas a contratos
DELETE FROM notificacoes_financeiras
WHERE contrato_id IN (
    SELECT id FROM contratos WHERE contratante_id IN (
        SELECT id FROM entidades
    )
);

-- Remover pagamentos relacionados a contratos
DELETE FROM pagamentos
WHERE contrato_id IN (
    SELECT id FROM contratos WHERE contratante_id IN (
        SELECT id FROM entidades
    )
);

-- Remover contratos
DELETE FROM contratos
WHERE contratante_id IN (
    SELECT id FROM entidades
);

-- PROTEÇÃO CRÍTICA: Senhas NÃO são mais deletadas automaticamente!
-- Use fn_delete_senha_autorizado() se realmente precisar deletar senhas
-- DELETE FROM entidades_senhas foi REMOVIDO para evitar perda de dados
-- Ver migração 030_protecao_senhas_critica.sql para mais detalhes

-- Se você REALMENTE precisa deletar senhas (CUIDADO!):
-- SELECT fn_delete_senha_autorizado(contratante_id, 'motivo da deleção');

-- Remover vínculos funcionário-entidade
DELETE FROM entidades_funcionarios
WHERE entidade_id IN (
    SELECT id FROM entidades
);

-- Remover contratos_plano (se existir)
DELETE FROM contratos_planos
WHERE contratante_id IN (
    SELECT id FROM entidades
);

-- POR FIM: Remover todas as entidades
DELETE FROM entidades;

-- ==========================================
-- 3. RESETAR SEQUENCES PARA COMEÇAR DO 1
-- ==========================================

-- Reset sequences para começar do 1
ALTER SEQUENCE IF EXISTS entidades_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contratos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS pagamentos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS entidades_senhas_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notificacoes_financeiras_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contratos_planos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS entidades_funcionarios_id_seq RESTART WITH 1;

-- ==========================================
-- 4. LOG DE VERIFICAÇÃO - CONTAR APÓS LIMPEZA
-- ==========================================

DO $$
DECLARE
    v_total_entidades INTEGER;
    v_total_entidades_senhas INTEGER;
    v_total_contratos INTEGER;
    v_total_pagamentos INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_entidades FROM entidades;
    SELECT COUNT(*) INTO v_total_entidades_senhas FROM entidades_senhas;
    SELECT COUNT(*) INTO v_total_contratos FROM contratos;
    SELECT COUNT(*) INTO v_total_pagamentos FROM pagamentos;

    RAISE NOTICE '=== CONTAGEM APÓS LIMPEZA ===';
    RAISE NOTICE 'Entidades: %', v_total_entidades;
    RAISE NOTICE 'entidades_senhas: %', v_total_entidades_senhas;
    RAISE NOTICE 'Contratos: %', v_total_contratos;
    RAISE NOTICE 'Pagamentos: %', v_total_pagamentos;
    RAISE NOTICE '==============================';

    IF v_total_entidades = 0 AND v_total_entidades_senhas = 0 AND
       v_total_contratos = 0 AND v_total_pagamentos = 0 THEN
        RAISE NOTICE '✅ LIMPEZA CONCLUÍDA COM SUCESSO!';
    ELSE
        RAISE EXCEPTION '❌ LIMPEZA NÃO FOI COMPLETA. VERIFICAR DEPENDÊNCIAS.';
    END IF;
END $$;

COMMIT;

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================