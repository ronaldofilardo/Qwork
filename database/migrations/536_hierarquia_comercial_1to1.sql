-- Migration 536: Enforça regra de negócio 1 vendedor = 1 representante ativo
-- Um vendedor não pode ser vinculado a dois representantes ao mesmo tempo.

-- Cria índice parcial único: (vendedor_id) WHERE ativo = true
-- Garante que cada vendedor tenha no máximo 1 registro ativo na hierarquia
CREATE UNIQUE INDEX IF NOT EXISTS idx_hierarquia_comercial_vendedor_ativo_unico
  ON public.hierarquia_comercial (vendedor_id)
  WHERE ativo = true;

COMMENT ON INDEX idx_hierarquia_comercial_vendedor_ativo_unico IS
  'Regra de negócio: 1 vendedor pode ter no máximo 1 representante ativo vinculado.';
