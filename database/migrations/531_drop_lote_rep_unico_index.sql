-- Migration 531: Remover índice único (lote_pagamento_id, representante_id)
--
-- idx_comissoes_lote_pagamento_unique foi criado em migration 506 permitindo
-- apenas UMA comissão por lote (UNIQUE em lote_pagamento_id).
-- Com a migration 530 (suporte a parcelamento), lotes parcelados geram N comissões
-- (uma por parcela) para o mesmo lote, o que viola esse índice.
--
-- A unicidade correta agora é garantida por idx_comissoes_laudo_lote_parcela
-- em (lote_pagamento_id, parcela_numero), criado em migration 530.
--
-- idx_comissoes_lote_rep_unico (lote_pagamento_id, representante_id) também é
-- incompatível com parcelamento pelo mesmo motivo — dropado se existir.

DROP INDEX IF EXISTS public.idx_comissoes_lote_pagamento_unique;
DROP INDEX IF EXISTS public.idx_comissoes_lote_rep_unico;
