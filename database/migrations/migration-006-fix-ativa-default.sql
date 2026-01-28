-- Migration: Corrigir default da coluna ativa
-- Data: 2025-12-26
-- Objetivo: Garantir que novos contratantes sejam criados inativos por padrão

-- Alterar default de ativa para false (consistente com ativação após confirmação de pagamento)
ALTER TABLE contratantes ALTER COLUMN ativa SET DEFAULT false;

COMMENT ON COLUMN contratantes.ativa IS 
'Indica se o contratante está ativo no sistema. DEFAULT false - ativação ocorre APENAS após confirmação de pagamento.';

-- Verificar se há contratantes ativos sem pagamento confirmado
DO $$
DECLARE
  total_inconsistentes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_inconsistentes
  FROM contratantes
  WHERE ativa = true AND pagamento_confirmado = false;
  
  IF total_inconsistentes > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Encontrados % contratantes ativos sem pagamento confirmado. Execute fn_corrigir_inconsistencias_contratantes() para corrigir.', total_inconsistentes;
  ELSE
    RAISE NOTICE 'OK: Nenhum contratante ativo sem pagamento confirmado encontrado.';
  END IF;
END;
$$;

-- Resumo
SELECT 'Migration 006 concluída: default de ativa alterado para false' AS status;
