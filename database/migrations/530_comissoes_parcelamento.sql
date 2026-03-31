-- Migration 530: Suporte a comissões parceladas
-- Quando o tomador parcela o pagamento de um lote (ex: 3x no boleto),
-- o representante recebe N comissões proporcionais (uma por parcela).
--
-- parcela_numero: 1-based (1 = à vista ou 1ª parcela)
-- total_parcelas: 1 = à vista, N = parcelado

-- 1. Adicionar colunas de parcelamento
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS parcela_numero INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_parcelas INTEGER NOT NULL DEFAULT 1;

-- 2. Constraint de sanidade
ALTER TABLE public.comissoes_laudo
  ADD CONSTRAINT chk_parcela_numero_valido
  CHECK (parcela_numero >= 1 AND parcela_numero <= total_parcelas);

ALTER TABLE public.comissoes_laudo
  ADD CONSTRAINT chk_total_parcelas_valido
  CHECK (total_parcelas >= 1 AND total_parcelas <= 12);

-- 3. Índice único para impedir duplicata de (lote, parcela)
-- Apenas quando lote_pagamento_id é NOT NULL (comissões geradas manualmente pelo admin)
CREATE UNIQUE INDEX IF NOT EXISTS idx_comissoes_laudo_lote_parcela
  ON public.comissoes_laudo (lote_pagamento_id, parcela_numero)
  WHERE lote_pagamento_id IS NOT NULL;

-- 4. Comentários
COMMENT ON COLUMN public.comissoes_laudo.parcela_numero IS 'Número da parcela (1-based). 1 para pagamento à vista.';
COMMENT ON COLUMN public.comissoes_laudo.total_parcelas IS 'Total de parcelas do pagamento. 1 para à vista, até 12 para parcelado.';
