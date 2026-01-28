-- Migration 202: Restringir admin_restricted_funcionarios para não acessar funcionários vinculados a entidades/empresas
-- Objetivo: Garantir que admin só possa gerir contas de plataforma (gestores RH/emissor) que NÃO estejam vinculadas a uma empresa ou contratante

BEGIN;

DROP POLICY IF EXISTS admin_restricted_funcionarios ON funcionarios;

CREATE POLICY admin_restricted_funcionarios
  ON funcionarios
  FOR ALL
  TO public
  USING (
    (current_setting('app.current_user_perfil', true) = 'admin')
    AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying])::text[]))
    AND (empresa_id IS NULL AND contratante_id IS NULL)
  );

COMMIT;
