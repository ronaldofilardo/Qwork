-- verify-no-master.sql
-- Queries to validate removal of legacy profiles/roles

SELECT COUNT(*) AS legacy_funcionarios_count FROM funcionarios WHERE perfil IN ('master','super');

SELECT * FROM public.roles WHERE name IN ('master','super');

SELECT COUNT(*) AS policy_backups_with_master FROM public.policy_expression_backups WHERE using_expr ILIKE '%master%' OR with_check_expr ILIKE '%master%';

-- If any of these return non-zero / rows, manual review is required.