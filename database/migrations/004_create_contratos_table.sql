-- Migration: Criar tabela contratos
-- Data: 2026-01-15
-- Descrição: Cria tabela de contratos para suportar fluxo contract-first

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
    CREATE TABLE contratos (
      id SERIAL PRIMARY KEY,
      contratante_id INTEGER NOT NULL REFERENCES contratantes(id) ON DELETE CASCADE,
      plano_id INTEGER NULL REFERENCES planos(id),
      numero_funcionarios INTEGER NULL,
      valor_total NUMERIC(12,2) NULL,
      status status_aprovacao_enum NOT NULL DEFAULT 'pendente',
      aceito BOOLEAN NOT NULL DEFAULT FALSE,
      pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
      conteudo TEXT NULL,
      criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      atualizado_em TIMESTAMP WITHOUT TIME ZONE,
      aceito_em TIMESTAMP WITHOUT TIME ZONE
    );

    CREATE INDEX IF NOT EXISTS idx_contratos_contratante_id ON contratos(contratante_id);
    RAISE NOTICE 'Tabela contratos criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela contratos já existe';
  END IF;
END $$;

-- Exibir estrutura rápida
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contratos'
ORDER BY ordinal_position;
