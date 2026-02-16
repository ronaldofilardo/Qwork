-- Migração 165: Corrigir função trigger atualizar_ultima_avaliacao_funcionario
-- Contexto: A migração 160 removeu as colunas denormalizadas ultimo_lote_codigo e ultimo_motivo_inativacao
-- Problema: A função trigger ainda tenta acessar l.codigo (coluna inexistente) e atualizar colunas removidas
-- Solução: Atualizar a função para não tentar acessar/atualizar colunas inexistentes

BEGIN;

-- Recriar a função sem as referências a colunas inexistentes
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar campos de denormalização que ainda existem
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

COMMENT ON FUNCTION atualizar_ultima_avaliacao_funcionario IS 'Atualiza campos denormalizados de última avaliação do funcionário (refatorado em 165: removidas referências a colunas inexistentes)';
