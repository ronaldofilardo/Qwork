#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dbUrl = process.env.TEST_DATABASE_URL;
if (!dbUrl) {
  console.error(
    'TEST_DATABASE_URL não definida; não é possível aplicar correção de detectar_anomalias_indice.'
  );
  process.exit(1);
}

const sqlFile = path.join(
  process.cwd(),
  'database',
  'legacy-fixes',
  'fix-detectar-anomalias-indice-final.sql'
);
if (!fs.existsSync(sqlFile)) {
  console.error('Arquivo SQL não encontrado:', sqlFile);
  process.exit(1);
}

(async () => {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const pool = new Pool({ connectionString: dbUrl });
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.warn(
      '⚠️  Não foi possível conectar ao banco de testes. Pulando correção detectar_anomalias_indice.'
    );
    console.warn(connErr.message || connErr);
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }

  try {
    console.log('Aplicando correção da função detectar_anomalias_indice...');
    await client.query(sql);
    console.log('Correção aplicada com sucesso.');
  } catch (err) {
    console.error('Erro ao aplicar correção:', err);
    process.exit(1);
  } finally {
    try {
      client.release();
    } catch {}
    await pool.end();
  }
})();
