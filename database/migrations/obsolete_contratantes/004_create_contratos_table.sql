-- Migration: Criar tabela contratos
-- Data: 2026-01-15
-- Descrição: Cria tabela de contratos para suportar fluxo contract-first
-- Nota: Referencia tabela 'entidades' (renomeada de 'tomadores' na Migration 420)

DO $$
DECLARE
    v_entidades_table_name TEXT;
BEGIN
  -- Detectar nome correto da tabela (entidades ou tomadores)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
    v_entidades_table_name := 'entidades';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores') THEN
    v_entidades_table_name := 'tomadores';
  ELSE
    RAISE EXCEPTION 'Tabela entidades ou tomadores não encontrada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
    -- Criar com nome correto da coluna baseado na tabela existente
    IF v_entidades_table_name = 'entidades' THEN
      EXECUTE '
        CREATE TABLE contratos (
          id SERIAL PRIMARY KEY,
          entidade_id INTEGER NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
          plano_id INTEGER NULL REFERENCES planos(id),
          numero_funcionarios INTEGER NULL,
          valor_total NUMERIC(12,2) NULL,
          status status_aprovacao_enum NOT NULL DEFAULT ''pendente'',
          aceito BOOLEAN NOT NULL DEFAULT FALSE,
          pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
          conteudo TEXT NULL,
          criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          atualizado_em TIMESTAMP WITHOUT TIME ZONE,
          aceito_em TIMESTAMP WITHOUT TIME ZONE
        )';
      CREATE INDEX IF NOT EXISTS idx_contratos_entidade_id ON contratos(entidade_id);
      RAISE NOTICE 'Tabela contratos criada com entidade_id';
    ELSE
      EXECUTE '
        CREATE TABLE contratos (
          id SERIAL PRIMARY KEY,
          contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
          plano_id INTEGER NULL REFERENCES planos(id),
          numero_funcionarios INTEGER NULL,
          valor_total NUMERIC(12,2) NULL,
          status status_aprovacao_enum NOT NULL DEFAULT ''pendente'',
          aceito BOOLEAN NOT NULL DEFAULT FALSE,
          pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
          conteudo TEXT NULL,
          criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          atualizado_em TIMESTAMP WITHOUT TIME ZONE,
          aceito_em TIMESTAMP WITHOUT TIME ZONE
        )';
      CREATE INDEX IF NOT EXISTS idx_contratos_contratante_id ON contratos(contratante_id);
      RAISE NOTICE 'Tabela contratos criada com contratante_id (será renomeado para entidade_id na Migration 420)';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela contratos já existe';
  END IF;
END $$;

-- Exibir estrutura rápida
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contratos'
ORDER BY ordinal_position;
