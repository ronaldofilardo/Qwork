-- Migration: Remover lógica incorreta de sync_contratacao_status_to_contratante
-- Data: 2026-01-24
-- Descrição: Remove tentativa de sincronizar status 'valor_definido' que não existe em status_aprovacao_enum
--           A função estava causando erro "operador não existe: text = status_aprovacao_enum"

-- A função tentava setar status='valor_definido' em contratantes, mas esse valor não existe no enum
-- Simplificamos para não fazer nada - podemos implementar lógica correta mais tarde

CREATE OR REPLACE FUNCTION public.sync_contratacao_status_to_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- TODO: Implementar sync correto quando necessário
  -- Por ora, desabilitado para evitar erros de enum
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_contratacao_status_to_contratante() IS 'Desabilitado temporariamente - valor_definido não está no enum status_aprovacao_enum';
