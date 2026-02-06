-- ==========================================
-- MIGRATION 302: Permitir Admin GERENCIAR Contratantes
-- Status: OBSOLETA - Incorporada na Migration 301
-- Descrição: Admin precisa gerenciar contratantes (clínicas/entidades) para aprovar cadastros e vincular gestores
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================
-- OBSOLETO: Esta migration foi incorporada na migration 301 após correção.
-- As políticas de admin para contratantes agora são criadas na migration 301.
-- Esta migration pode ser removida ou ignorada.
-- ==========================================
-- JUSTIFICATIVA:
--   Admin precisa gerenciar contratantes para:
--   - Aprovar novos cadastros de clínicas/entidades
--   - Vincular usuários com perfis 'rh' e 'gestor'
--   - Auditar quais gestores estão vinculados a quais contratantes
--   - Suporte técnico e manutenção de informações básicas
--   - Gerenciar status ativo/inativo de contratantes
--
-- PERMISSÕES:
--   - Admin pode SELECT/INSERT/UPDATE/DELETE contratantes
--   - Admin continua SEM ACESSO a funcionários, avaliações, lotes
-- ==========================================

BEGIN;

\echo '⚠️  MIGRATION 302 ESTÁ OBSOLETA - Políticas já criadas na migration 301'
\echo '⚠️  NÃO EXECUTE ESTA MIGRATION - ela foi incorporada na 301'

-- Políticas movidas para migration 301 após correção
-- Esta migration pode ser removida do diretório

COMMIT;

-- Adicionar comentários explicativos
COMMENT ON POLICY "contratantes_admin_select" ON public.contratantes IS
'Admin pode visualizar todos os contratantes para gerenciar usuários gestores e aprovar cadastros.';

COMMENT ON POLICY "contratantes_admin_insert" ON public.contratantes IS
'Admin pode cadastrar novos contratantes (clínicas/entidades).';

COMMENT ON POLICY "contratantes_admin_update" ON public.contratantes IS
'Admin pode atualizar informações de contratantes existentes.';

COMMENT ON POLICY "contratantes_admin_delete" ON public.contratantes IS
'Admin pode excluir contratantes (usar com cuidado).';

-- Atualizar comentário da tabela
COMMENT ON TABLE public.contratantes IS
'Clínicas e entidades contratantes. Admin tem acesso completo para gerenciar cadastros e vincular gestores.';

\echo '✅ MIGRATION 302 CONCLUÍDA!'
\echo 'ℹ️  Admin agora pode: SELECT/INSERT/UPDATE/DELETE contratantes'
\echo 'ℹ️  Admin continua SEM ACESSO a: funcionários, avaliações, lotes'

\echo '✅ MIGRATION 302 CONCLUÍDA!'
\echo 'ℹ️  Admin agora pode: SELECT contratantes'
\echo 'ℹ️  Admin ainda NÃO pode: INSERT/UPDATE/DELETE contratantes'
\echo 'ℹ️  Admin continua SEM ACESSO a: funcionários, avaliações, lotes'

COMMIT;

-- ==========================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ==========================================
-- Execute os seguintes testes após aplicar esta migration:
-- 
-- 1. Testar SELECT de admin (DEVE FUNCIONAR):
--    SET LOCAL app.current_user_perfil = 'admin';
--    SELECT * FROM contratantes;
--
-- 2. Testar INSERT de admin (DEVE FALHAR):
--    SET LOCAL app.current_user_perfil = 'admin';
--    INSERT INTO contratantes (tipo, nome, cnpj) 
--    VALUES ('clinica', 'Teste', '12345678000190');
--
-- 3. Testar UPDATE de admin (DEVE FALHAR):
--    SET LOCAL app.current_user_perfil = 'admin';
--    UPDATE contratantes SET nome = 'Teste' WHERE id = (SELECT id FROM contratantes LIMIT 1);
--
-- 4. Testar DELETE de admin (DEVE FALHAR):
--    SET LOCAL app.current_user_perfil = 'admin';
--    DELETE FROM contratantes WHERE id = (SELECT id FROM contratantes LIMIT 1);
--
-- 5. Verificar query com gestores (DEVE FUNCIONAR):
--    SELECT 
--      c.nome, c.tipo,
--      u.nome as gestor, u.perfil
--    FROM contratantes c
--    LEFT JOIN usuarios u ON (
--      (c.tipo = 'clinica' AND u.clinica_id = c.id AND u.perfil = 'rh') OR
--      (c.tipo = 'entidade' AND u.entidade_id = c.id AND u.perfil = 'gestor')
--    )
--    ORDER BY c.tipo, c.nome;
