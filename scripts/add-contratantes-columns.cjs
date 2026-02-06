require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    console.log('Applying ALTER TABLE contratantes...');
    await client.query(`ALTER TABLE contratantes
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS endereco TEXT,
      ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
      ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
      ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
      ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(100),
      ADD COLUMN IF NOT EXISTS responsavel_cpf VARCHAR(11),
      ADD COLUMN IF NOT EXISTS responsavel_cargo VARCHAR(100),
      ADD COLUMN IF NOT EXISTS responsavel_email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS responsavel_celular VARCHAR(20),
      ADD COLUMN IF NOT EXISTS cartao_cnpj_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS contrato_social_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS doc_identificacao_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT,
      ADD COLUMN IF NOT EXISTS observacoes_reanalise TEXT,
      ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP,
      ADD COLUMN IF NOT EXISTS aprovado_por_cpf VARCHAR(11)
    `);

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_contratantes_tipo ON contratantes (tipo)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_contratantes_status ON contratantes (status)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_contratantes_cnpj ON contratantes (cnpj)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_contratantes_ativa ON contratantes (ativa)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_contratantes_tipo_ativa ON contratantes (tipo, ativa)`
    );
    console.log('ALTER TABLE contratantes applied successfully');
  } catch (err) {
    console.error(
      'Error applying ALTER TABLE contratantes:',
      err.message || err
    );
    process.exit(1);
  } finally {
    await client.end();
  }
})();
