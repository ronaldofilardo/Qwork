#!/usr/bin/env node

const { Pool } = require('pg');

const dbUrl = process.env.TEST_DATABASE_URL;
if (!dbUrl) {
  console.error(
    'TEST_DATABASE_URL não definida; não é possível aplicar correção de FK duplicada.'
  );
  process.exit(1);
}

(async () => {
  const pool = new Pool({ connectionString: dbUrl });
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.warn(
      '⚠️  Não foi possível conectar ao banco de testes. Pulando correção de FK duplicada.'
    );
    console.warn(connErr.message || connErr);
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }

  try {
    console.log(
      'Verificando e removendo FK duplicada lotes_avaliacao_liberado_por_fkey1 (se existir)...'
    );
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'lotes_avaliacao' AND constraint_name = 'lotes_avaliacao_liberado_por_fkey1'
        ) THEN
          ALTER TABLE ONLY public.lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_liberado_por_fkey1;
          RAISE NOTICE 'Constraint lotes_avaliacao_liberado_por_fkey1 removida (se existia)';
        END IF;
      END
      $$;
    `);
    console.log('Correção aplicada (se necessária).');
  } catch (err) {
    console.error('Erro ao aplicar correção de FK duplicada:', err);
    process.exit(1);
  } finally {
    try {
      client.release();
    } catch {}
    await pool.end();
  }
})();
