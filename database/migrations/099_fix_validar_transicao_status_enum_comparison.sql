-- Migration: Corrigir comparação de enum em validar_transicao_status_contratante
-- Data: 2026-01-24
-- Descrição: Corrige comparações entre tipo enum status_aprovacao_enum e text
--           Cast explícito para ::text para permitir comparações

CREATE OR REPLACE FUNCTION public.validar_transicao_status_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.status::text = 'rejeitado' AND NEW.status::text != 'rejeitado' THEN
          RAISE EXCEPTION 'Contratante rejeitado não pode ter status alterado';
        END IF;

        IF OLD.status::text = 'aprovado' AND NEW.status::text NOT IN ('aprovado', 'cancelado') THEN
          RAISE EXCEPTION 'Contratante aprovado só pode ser cancelado';
        END IF;

        RETURN NEW;
      END;
      $$;

COMMENT ON FUNCTION public.validar_transicao_status_contratante() IS 'Valida transições de status. Cast ::text para comparar enums corretamente.';
