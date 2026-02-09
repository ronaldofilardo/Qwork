import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const main = async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de testes');

    // Cria a tabela contratos (sem FKs para permitir criação even if referenced tables don't exist)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contratos (
        id SERIAL PRIMARY KEY,
        tomador_id INTEGER,
        plano_id INTEGER,
        numero_funcionarios INTEGER,
        numero_funcionarios_estimado INTEGER,
        valor_total DECIMAL(12,2),
        valor_personalizado DECIMAL(12,2),
        conteudo TEXT,
        conteudo_gerado TEXT,
        aceito BOOLEAN DEFAULT FALSE,
        ip_aceite VARCHAR(45),
        data_aceite TIMESTAMP,
        status VARCHAR(50) DEFAULT 'generated',
        payment_link_token VARCHAR(128),
        payment_link_expiracao TIMESTAMP,
        link_enviado_em TIMESTAMP,
        criado_por_cpf VARCHAR(11),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos (status);
      CREATE INDEX IF NOT EXISTS idx_contratos_numero_funcionarios ON contratos (numero_funcionarios);
      CREATE INDEX IF NOT EXISTS idx_contratos_tomador ON contratos (tomador_id);
      CREATE UNIQUE INDEX IF NOT EXISTS ux_contratos_payment_link_token ON contratos (payment_link_token) WHERE payment_link_token IS NOT NULL;

      COMMENT ON TABLE contratos IS 'Contratos gerados para tomadors. Fluxo simplificado.';
      COMMENT ON COLUMN contratos.valor_personalizado IS 'Valor negociado por funcionário para contratos personalizados';
    `;

    await client.query(createTableSQL);
    console.log('Tabela contratos criada com sucesso');

    // Verifica se a tabela foi criada
    const verifySQL = `
      SELECT to_regclass('public.contratos') as exists,
             count(*) as total_tables
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    const result = await client.query(verifySQL);
    console.log('Verificação:', result.rows[0]);
  } catch (error) {
    console.error('Erro ao aplicar migration:', error);
  } finally {
    await client.end();
    console.log('Conexão fechada');
  }
};

main().catch((err) => {
  console.error('Erro no script:', err);
  process.exit(1);
});
