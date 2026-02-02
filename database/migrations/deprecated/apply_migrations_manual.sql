-- Script consolidado para aplicar migrations 063.5, 064, 065, 066, 067
-- Executar no psql conectado ao nr-bps_db

-- ====================================================================
-- MIGRATION 063.5: Criar função current_user_contratante_id()
-- ====================================================================

CREATE OR REPLACE FUNCTION current_user_contratante_id()
RETURNS INTEGER AS $$
DECLARE
    contratante_id_str VARCHAR(50);
    contratante_id_int INTEGER;
BEGIN
    contratante_id_str := nullif(current_setting('app.current_user_contratante_id', true), '');
    IF contratante_id_str IS NOT NULL THEN
        contratante_id_int := contratante_id_str::INTEGER;
        RETURN contratante_id_int;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_user_contratante_id() IS 'Retorna o contratante_id do contexto da sessão para RLS de entidades';

SELECT '✓ 063.5 Função current_user_contratante_id() criada' as status;

\echo '========================================='
\echo 'Migrations aplicadas com sucesso!'
\echo 'Execute agora: \\i database/migrations/064_fix_entidade_perfil_rls.sql'
\echo '========================================='

-- =========================================
-- MIGRATION 080: Atualização de verificar_inativacao_consecutiva
-- Para aplicar esta migration manualmente:
--   psql -U postgres -h <host> -p <port> -d nr-bps_db -f database/migrations/080_update_verificar_inativacao_consecutiva.sql
-- Testes relacionados (executar após aplicar):
--   pnpm test -- __tests__/api/avaliacoes/inativar-validacao.test.ts __tests__/api/avaliacoes/inativar-contratante.test.ts -i
-- =========================================
