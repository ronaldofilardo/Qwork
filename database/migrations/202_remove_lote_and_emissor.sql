-- Migration 202: Remover lote 001-210126 e emissor temporário 00000000001 (SEM BACKUP)
-- Data: 22/01/2026
-- Nota: Executa deleções diretas conforme solicitado (presume-se que não há laudos vinculados)

BEGIN;

-- Deletar lote identificado
DELETE FROM lotes_avaliacao WHERE codigo = '001-210126';
DO $$ BEGIN RAISE NOTICE 'Lote 001-210126 deletado (se existia)'; END $$;

-- Remover emissor temporário (00000000001) se presente e sem referências em laudos
DO $$
DECLARE
  v_laudos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_laudos FROM laudos WHERE emissor_cpf = '00000000001';
  IF v_laudos > 0 THEN
    RAISE EXCEPTION 'Emissor 00000000001 ainda referenciado em % laudos - abortando', v_laudos;
  END IF;

  DELETE FROM funcionarios WHERE cpf = '00000000001' AND perfil = 'emissor';
  RAISE NOTICE 'Emissor 00000000001 removido (se existia)';
END $$;

-- Validação final simples
DO $$
DECLARE
  v_lote INTEGER;
  v_emissor INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_lote FROM lotes_avaliacao WHERE codigo = '001-210126';
  SELECT COUNT(*) INTO v_emissor FROM funcionarios WHERE cpf = '00000000001';
  RAISE NOTICE 'Validação final: lote_exists=% emissor_exists=%', v_lote, v_emissor;

  IF v_lote <> 0 THEN
    RAISE EXCEPTION 'Lote 001-210126 ainda existe (cancelando transaction)';
  END IF;
  IF v_emissor <> 0 THEN
    RAISE EXCEPTION 'Emissor 00000000001 ainda existe (cancelando transaction)';
  END IF;
END $$;

COMMIT;
