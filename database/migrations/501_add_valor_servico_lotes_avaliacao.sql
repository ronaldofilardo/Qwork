-- =============================================================================
-- Migration 501: Adiciona coluna valor_servico em lotes_avaliacao
-- =============================================================================
-- Problema: O trigger trg_criar_comissao_ao_emitir_laudo() referencia a coluna
-- valor_servico na tabela lotes_avaliacao, mas essa coluna nunca foi criada.
-- Isso causava erro 42703 ao emitir laudos, bloqueando todo o fluxo de emissão.
--
-- Solução: Adicionar a coluna com valor padrão NULL.
-- O trigger já usa COALESCE(valor_servico, 0), portanto:
--   - Lotes sem valor definido → retornam 0 → nenhuma comissão gerada (correto)
--   - Lotes com valor preenchido → comissão calculada normalmente
--
-- Data: 2026-03-03
-- =============================================================================

-- Adiciona coluna valor_servico em lotes_avaliacao
ALTER TABLE public.lotes_avaliacao
  ADD COLUMN IF NOT EXISTS valor_servico DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.lotes_avaliacao.valor_servico IS
  'Valor do serviço de avaliação para este lote. '
  'Utilizado pelo sistema de comissionamento para calcular comissões ao emitir o laudo. '
  'NULL significa sem valor definido — nenhuma comissão será gerada.';

-- Verificação (opcional, para confirmar a migração)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lotes_avaliacao'
      AND column_name = 'valor_servico'
  ) THEN
    RAISE NOTICE 'OK: coluna valor_servico adicionada com sucesso em lotes_avaliacao';
  ELSE
    RAISE EXCEPTION 'FALHA: coluna valor_servico NÃO encontrada em lotes_avaliacao';
  END IF;
END;
$$;
