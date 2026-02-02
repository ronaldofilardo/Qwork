-- Migration 999: Reservar ID do laudo ao criar lote
-- Data: 2026-02-02
-- Descrição: Garante que SEMPRE que um lote é criado, um laudo com mesmo ID é reservado
--
-- IMPORTANTE:
-- - laudo.id SEMPRE === lote.id
-- - Laudo é criado em status='rascunho' (apenas reserva de ID)
-- - Laudo é preenchido quando emissor clica "Gerar Laudo"
-- - Emissor só vê lotes que foram SOLICITADOS para emissão (fila_emissao)

BEGIN;

-- Criar função que reserva ID do laudo ao criar lote
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir laudo com mesmo ID do lote (apenas reserva)
  INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert IS 
'Reserva ID do laudo (igual ao ID do lote) quando lote é criado.
Laudo fica em status=rascunho até emissor gerar o PDF.
Garante que laudo.id === lote.id sempre.';

-- Criar trigger AFTER INSERT em lotes_avaliacao
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
  AFTER INSERT ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

COMMENT ON TRIGGER trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao IS
'Reserva automaticamente ID do laudo quando lote é criado.
Laudo fica em status=rascunho até emissor processar.';

COMMIT;
