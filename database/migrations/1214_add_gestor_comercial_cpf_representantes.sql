-- Migration 1214
-- Adiciona campo gestor_comercial_cpf na tabela representantes.
-- Suporta modelo de atribuição de representantes a usuários comerciais:
--   - NULL  → representante visível apenas para admin/suporte
--   - CPF   → representante gerenciado pelo usuário comercial com esse CPF
--
-- Não usa FK direta pois usuarios.cpf não é PRIMARY KEY.
-- A integridade é garantida pela API de atribuição (PATCH /api/admin/representantes/[id]/atribuir-comercial).

ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS gestor_comercial_cpf VARCHAR(11);

COMMENT ON COLUMN representantes.gestor_comercial_cpf IS
  'CPF do usuário comercial responsável por este representante. NULL = visível apenas para admin/suporte.';

CREATE INDEX IF NOT EXISTS idx_representantes_gestor_comercial_cpf
  ON representantes(gestor_comercial_cpf);
