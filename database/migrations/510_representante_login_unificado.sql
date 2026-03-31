-- Migration: Permitir login unificado de representantes via CPF + senha
-- A coluna senha_hash armazena o bcrypt do codigo do representante
-- Assim o representante pode logar na tela principal (CPF + senha = codigo)

-- 1) Adicionar coluna senha_hash (nullable para retrocompatibilidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'representantes'
      AND column_name = 'senha_hash'
  ) THEN
    ALTER TABLE public.representantes ADD COLUMN senha_hash VARCHAR(60);
    COMMENT ON COLUMN public.representantes.senha_hash IS 'Hash bcrypt do codigo — permite login unificado via CPF + senha';
  END IF;
END $$;
