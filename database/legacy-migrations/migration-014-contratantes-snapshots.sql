-- Migration 014: tomadores_snapshots (snapshots de cadastro)
-- Data: 2025-12-30

-- Tabela para armazenar snapshot dos dados no momento do cadastro
CREATE TABLE IF NOT EXISTS tomadores_snapshots (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por_cpf VARCHAR(11)
);

-- Índice para buscas por contratante
CREATE INDEX IF NOT EXISTS idx_tomadores_snapshots_contratante_id ON tomadores_snapshots (contratante_id);

-- Função auxiliar de trigger para inserir snapshot automaticamente em INSERT
CREATE OR REPLACE FUNCTION fn_tomadores_insert_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tomadores_snapshots (contratante_id, payload, criado_em)
    VALUES (NEW.id, to_jsonb(NEW), CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que chama a função após INSERT em tomadores
DROP TRIGGER IF EXISTS trg_tomadores_insert_snapshot ON tomadores;
CREATE TRIGGER trg_tomadores_insert_snapshot
AFTER INSERT ON tomadores
FOR EACH ROW
EXECUTE FUNCTION fn_tomadores_insert_snapshot();

-- Retro-popular snapshots para tomadores existentes do tipo 'clinica' (capturar estado atual como snapshot)
INSERT INTO tomadores_snapshots (contratante_id, payload, criado_em)
SELECT id, to_jsonb(t), criado_em FROM tomadores t WHERE tipo = 'clinica' AND NOT EXISTS (
  SELECT 1 FROM tomadores_snapshots s WHERE s.contratante_id = t.id
);
