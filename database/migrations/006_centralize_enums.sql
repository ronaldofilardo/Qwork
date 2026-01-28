-- ==========================================
-- MIGRATION 006: Padronização de ENUMs e Perfis
-- Descrição: Centraliza definições de perfis e tipos usando ENUMs nativos
-- Data: 2025-12-14
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo 'Criando ENUMs centralizados...'

-- ==========================================
-- 1. CRIAR ENUM PARA PERFIS DE USUÁRIO
-- ==========================================

-- Criar ENUM para perfis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario_enum') THEN
        CREATE TYPE perfil_usuario_enum AS ENUM ('funcionario', 'rh', 'admin', 'emissor');
        RAISE NOTICE 'ENUM perfil_usuario_enum criado';
    ELSE
        RAISE NOTICE 'ENUM perfil_usuario_enum já existe';
    END IF;
END $$;

COMMENT ON TYPE perfil_usuario_enum IS 'Perfis válidos de usuários no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionários), admin (administração geral), emissor (emite laudos)';

-- ==========================================
-- 2. CRIAR ENUM PARA STATUS DE AVALIAÇÃO
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_avaliacao_enum') THEN
        CREATE TYPE status_avaliacao_enum AS ENUM ('iniciada', 'em_andamento', 'concluida', 'inativada');
        RAISE NOTICE 'ENUM status_avaliacao_enum criado';
    ELSE
        RAISE NOTICE 'ENUM status_avaliacao_enum já existe';
    END IF;
END $$;

COMMENT ON TYPE status_avaliacao_enum IS 'Status de avaliações: iniciada (criada mas não respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';

-- ==========================================
-- 3. CRIAR ENUM PARA STATUS DE LOTE
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lote_enum') THEN
        CREATE TYPE status_lote_enum AS ENUM ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho');
        RAISE NOTICE 'ENUM status_lote_enum criado';
    ELSE
        RAISE NOTICE 'ENUM status_lote_enum já existe';
    END IF;
END $$;

COMMENT ON TYPE status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo), rascunho (em criação)';

-- ==========================================
-- 4. CRIAR ENUM PARA STATUS DE LAUDO
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_laudo_enum') THEN
        CREATE TYPE status_laudo_enum AS ENUM ('rascunho', 'emitido', 'enviado');
        RAISE NOTICE 'ENUM status_laudo_enum criado';
    ELSE
        RAISE NOTICE 'ENUM status_laudo_enum já existe';
    END IF;
END $$;

COMMENT ON TYPE status_laudo_enum IS 'Status de laudos: rascunho (em edição), emitido (finalizado), enviado (enviado ao cliente)';

-- ==========================================
-- 5. CRIAR ENUM PARA TIPO DE LOTE
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_lote_enum') THEN
        CREATE TYPE tipo_lote_enum AS ENUM ('completo', 'operacional', 'gestao');
        RAISE NOTICE 'ENUM tipo_lote_enum criado';
    ELSE
        RAISE NOTICE 'ENUM tipo_lote_enum já existe';
    END IF;
END $$;

COMMENT ON TYPE tipo_lote_enum IS 'Tipo de lote: completo (todos funcionários), operacional (apenas operacionais), gestao (apenas gestores)';

-- ==========================================
-- 6. FUNÇÃO HELPER PARA VALIDAR PERFIL
-- ==========================================

CREATE OR REPLACE FUNCTION is_valid_perfil(p_perfil TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_perfil::perfil_usuario_enum IS NOT NULL;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_perfil (TEXT) IS 'Valida se um texto corresponde a um perfil válido do ENUM';

-- ==========================================
-- 7. RELATÓRIO DE CONCLUSÃO
-- ==========================================

\echo '=== MIGRAÇÃO 006 CONCLUÍDA COM SUCESSO ==='

SELECT 
    typname as enum_name,
    array_length(enum_range(NULL::perfil_usuario_enum), 1) as total_valores
FROM pg_type 
WHERE typname IN ('perfil_usuario_enum', 'status_avaliacao_enum', 'status_lote_enum', 'status_laudo_enum', 'tipo_lote_enum', 'nivel_cargo_enum')
ORDER BY typname;

COMMIT;