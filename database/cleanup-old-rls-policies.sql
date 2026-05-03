-- ================================================================
-- SCRIPT DE LIMPEZA - REMOVER POLÍTICAS RLS ANTIGAS
-- ================================================================
-- Data: 11/12/2025
-- Descrição: Remove todas as políticas RLS existentes antes de aplicar as novas
-- ================================================================

BEGIN;

-- ================================================================
-- REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
-- ================================================================

-- FUNCIONARIOS - Remover políticas antigas
DROP POLICY IF EXISTS "funcionarios_own_select" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_rh_select" ON funcionarios;


-- AVALIACOES - Remover políticas antigas
DROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_own_insert" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_own_update" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_rh_clinica" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_admin_all" ON avaliacoes;

-- EMPRESAS_CLIENTES - Remover políticas antigas
DROP POLICY IF EXISTS "empresas_rh_clinica" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_rh_insert" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_rh_update" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_admin_all" ON empresas_clientes;

-- CLINICAS - Remover políticas antigas
DROP POLICY IF EXISTS "clinicas_own_select" ON clinicas;


-- LOTES_AVALIACAO - Remover políticas antigas
DROP POLICY IF EXISTS "lotes_funcionario_select" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_clinica" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_insert" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_update" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_emissor_select" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_admin_all" ON lotes_avaliacao;

-- LAUDOS - Remover políticas antigas
DROP POLICY IF EXISTS "laudos_emissor_select" ON laudos;

DROP POLICY IF EXISTS "laudos_emissor_insert" ON laudos;

DROP POLICY IF EXISTS "laudos_emissor_update" ON laudos;

DROP POLICY IF EXISTS "laudos_rh_clinica" ON laudos;

DROP POLICY IF EXISTS "laudos_admin_all" ON laudos;

-- RESPOSTAS - Remover políticas antigas
DROP POLICY IF EXISTS "respostas_own_select" ON respostas;

DROP POLICY IF EXISTS "respostas_own_insert" ON respostas;

DROP POLICY IF EXISTS "respostas_own_update" ON respostas;

DROP POLICY IF EXISTS "respostas_rh_clinica" ON respostas;

DROP POLICY IF EXISTS "respostas_admin_all" ON respostas;

-- RESULTADOS - Remover políticas antigas
DROP POLICY IF EXISTS "resultados_own_select" ON resultados;

DROP POLICY IF EXISTS "resultados_rh_clinica" ON resultados;

DROP POLICY IF EXISTS "resultados_admin_all" ON resultados;

COMMIT;

-- ================================================
-- LIMPEZA CONCLUÍDA!
-- ================================================
-- Todas as políticas RLS antigas foram removidas.
-- Agora execute o script de migração novamente.
-- ================================================
