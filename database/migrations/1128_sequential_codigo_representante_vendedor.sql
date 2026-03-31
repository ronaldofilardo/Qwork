-- Migration 1128: Códigos sequenciais para representantes e vendedores
-- A partir de agora, novos códigos serão números sequenciais iniciando em 100.
-- Códigos existentes (alfanuméricos) permanecem inalterados.
--
-- Data: 2026-03-25

-- Sequência para representantes (inicia em 100)
CREATE SEQUENCE IF NOT EXISTS public.seq_representante_codigo
  START WITH 100
  INCREMENT BY 1
  NO MAXVALUE
  NO CYCLE;

COMMENT ON SEQUENCE public.seq_representante_codigo IS
  'Sequência para geração de códigos numéricos de representantes (a partir de 100)';

-- Sequência para vendedores (inicia em 100)
CREATE SEQUENCE IF NOT EXISTS public.seq_vendedor_codigo
  START WITH 100
  INCREMENT BY 1
  NO MAXVALUE
  NO CYCLE;

COMMENT ON SEQUENCE public.seq_vendedor_codigo IS
  'Sequência para geração de códigos numéricos de vendedores (a partir de 100)';

-- Substituir função gerar_codigo_representante() para usar sequência
CREATE OR REPLACE FUNCTION public.gerar_codigo_representante()
  RETURNS VARCHAR(12) AS $$
BEGIN
  RETURN nextval('public.seq_representante_codigo')::text;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.gerar_codigo_representante() IS
  'Gera código numérico sequencial para representante (a partir de 100). Códigos anteriores alfanuméricos permanecem.';
