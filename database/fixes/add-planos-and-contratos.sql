BEGIN;

-- Add missing columns to planos if absent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='descricao') THEN
    ALTER TABLE planos ADD COLUMN descricao TEXT;
    RAISE NOTICE 'Column descricao added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='valor_por_funcionario') THEN
    ALTER TABLE planos ADD COLUMN valor_por_funcionario DECIMAL(10,2);
    RAISE NOTICE 'Column valor_por_funcionario added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='preco') THEN
    ALTER TABLE planos ADD COLUMN preco DECIMAL(10,2);
    RAISE NOTICE 'Column preco added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='limite_funcionarios') THEN
    ALTER TABLE planos ADD COLUMN limite_funcionarios INTEGER;
    RAISE NOTICE 'Column limite_funcionarios added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='caracteristicas') THEN
    ALTER TABLE planos ADD COLUMN caracteristicas TEXT;
    RAISE NOTICE 'Column caracteristicas added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='ativo') THEN
    ALTER TABLE planos ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Column ativo added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='created_at') THEN
    ALTER TABLE planos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Column created_at added to planos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos' AND column_name='updated_at') THEN
    ALTER TABLE planos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Column updated_at added to planos';
  END IF;
END $$;

-- Create contratos_planos if not exists
CREATE TABLE IF NOT EXISTS contratos_planos (
  id SERIAL PRIMARY KEY,
  plano_id INTEGER REFERENCES planos(id),
  clinica_id INTEGER REFERENCES clinicas(id),
  contratante_id INTEGER REFERENCES contratantes(id),
  tipo_contratante VARCHAR(20) NOT NULL CHECK (tipo_contratante IN ('clinica','entidade')),
  valor_personalizado_por_funcionario DECIMAL(10,2),
  inicio_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
  fim_vigencia DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mfa_codes if not exists
CREATE TABLE IF NOT EXISTS mfa_codes (
  id SERIAL PRIMARY KEY,
  cpf VARCHAR(11) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans if missing
INSERT INTO planos (tipo, nome, descricao, preco, limite_funcionarios, ativo)
SELECT 'fixo', 'Plano Fixo Básico', 'Até 50 funcionários', 1224.00, 50, true
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Plano Fixo Básico');

INSERT INTO planos (tipo, nome, descricao, preco, limite_funcionarios, ativo)
SELECT 'fixo', 'Plano Fixo Premium', 'Até 200 funcionários', 3999.99, 200, true
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Plano Fixo Premium');

COMMIT;
