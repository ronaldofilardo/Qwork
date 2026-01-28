-- Migração 016: Adicionar campos denormalizados de última avaliação aos funcionários
-- Objetivo: Performance otimizada para exibir última avaliação sem JOINs

BEGIN;

-- 1) Adicionar colunas denormalizadas
ALTER TABLE funcionarios 
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_id INTEGER,
  ADD COLUMN IF NOT EXISTS ultimo_lote_codigo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_data_conclusao TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ultimo_motivo_inativacao TEXT;

-- 2) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_ultima_avaliacao 
  ON funcionarios(ultima_avaliacao_id) 
  WHERE ultima_avaliacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funcionarios_ultima_avaliacao_status 
  ON funcionarios(ultima_avaliacao_status) 
  WHERE ultima_avaliacao_status IS NOT NULL;

-- 3) Adicionar foreign key (opcional, para integridade)
ALTER TABLE funcionarios 
  ADD CONSTRAINT fk_funcionarios_ultima_avaliacao 
  FOREIGN KEY (ultima_avaliacao_id) 
  REFERENCES avaliacoes(id) 
  ON DELETE SET NULL;

-- 4) Criar função para atualizar dados denormalizados
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_codigo VARCHAR(20);
  v_motivo_inativacao TEXT;
BEGIN
  -- Obter código do lote
  SELECT l.codigo INTO v_lote_codigo
  FROM lotes_avaliacao l
  WHERE l.id = NEW.lote_id;

  -- Obter motivo de inativação (se aplicável)
  IF NEW.status = 'inativada' THEN
    v_motivo_inativacao := NEW.motivo_inativacao;
  ELSE
    v_motivo_inativacao := NULL;
  END IF;

  -- Atualizar funcionário apenas se esta avaliação for mais recente
  -- Usar envio para concluídas, inativada_em para inativadas
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultimo_lote_codigo = v_lote_codigo,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    ultimo_motivo_inativacao = v_motivo_inativacao,
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

-- 5) Criar trigger para concluídas e inativadas
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes;

CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER UPDATE OF status, envio, inativada_em
ON avaliacoes
FOR EACH ROW
WHEN (
  (NEW.status IN ('concluida', 'inativada') AND OLD.status <> NEW.status)
  OR (NEW.envio IS NOT NULL AND OLD.envio IS NULL)
  OR (NEW.inativada_em IS NOT NULL AND OLD.inativada_em IS NULL)
)
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

-- 6) Popular dados existentes (todas avaliações concluídas ou inativadas)
WITH ultimas_avaliacoes AS (
  SELECT DISTINCT ON (a.funcionario_cpf)
    a.id AS avaliacao_id,
    a.funcionario_cpf,
    l.codigo AS lote_codigo,
    COALESCE(a.envio, a.inativada_em) AS data_conclusao,
    a.status,
    CASE 
      WHEN a.status = 'inativada' THEN a.motivo_inativacao
      ELSE NULL
    END AS motivo_inativacao
  FROM avaliacoes a
  INNER JOIN lotes_avaliacao l ON a.lote_id = l.id
  WHERE a.status IN ('concluida', 'inativada')
    AND (a.envio IS NOT NULL OR a.inativada_em IS NOT NULL)
  ORDER BY a.funcionario_cpf, COALESCE(a.envio, a.inativada_em) DESC, a.id DESC
)
UPDATE funcionarios f
SET 
  ultima_avaliacao_id = ua.avaliacao_id,
  ultimo_lote_codigo = ua.lote_codigo,
  ultima_avaliacao_data_conclusao = ua.data_conclusao,
  ultima_avaliacao_status = ua.status,
  ultimo_motivo_inativacao = ua.motivo_inativacao,
  atualizado_em = NOW()
FROM ultimas_avaliacoes ua
WHERE f.cpf = ua.funcionario_cpf;

COMMIT;

-- Comentários de documentação
COMMENT ON COLUMN funcionarios.ultima_avaliacao_id IS 'ID da última avaliação concluída ou inativada (denormalizado para performance)';
COMMENT ON COLUMN funcionarios.ultimo_lote_codigo IS 'Código do lote da última avaliação (denormalizado)';
COMMENT ON COLUMN funcionarios.ultima_avaliacao_data_conclusao IS 'Data de conclusão da última avaliação (denormalizado)';
COMMENT ON COLUMN funcionarios.ultima_avaliacao_status IS 'Status da última avaliação: concluida ou inativada (denormalizado)';
COMMENT ON COLUMN funcionarios.ultimo_motivo_inativacao IS 'Motivo de inativação quando ultima_avaliacao_status = inativada';
