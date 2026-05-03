// Reaplicar migrações 1203-1209 que estão registradas mas podem ter colunas faltantes
// (restaura consistência entre schema_migrations e schema real)
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_TO_REAPPLY = [
  '1203_percentual_comissao_comercial.sql',
  '1204_fix_comissao_constraints_e_snapshot_modelo.sql',
  '1205_asaas_split_tabelas.sql',
  '1206_representante_ativo.sql',
  '1207_representante_gestor_comercial.sql',
  '1208_representante_custo_fixo_entidade.sql',
  '1209_comissao_comercial_vinculos_pf_removal.sql',
];

async function applyMigrationIdempotent(dbUrl, filename) {
  const filePath = path.join(__dirname, '../database/migrations', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${filename} não encontrado`);
    return;
  }
  const sql = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('\\echo'))
    .join('\n');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("SET app.current_user_cpf = '00000000000'");
    await client.query(sql);
    console.log(`[OK] ${filename}`);
  } catch (e) {
    const msg = e.message.toLowerCase();
    if (
      msg.includes('already exists') ||
      msg.includes('já existe') ||
      msg.includes('duplicate key')
    ) {
      console.log(
        `[SKIP idempotente] ${filename}: ${e.message.split('\n')[0]}`
      );
    } else {
      console.error(`[ERRO] ${filename}: ${e.message.split('\n')[0]}`);
    }
  } finally {
    await client.end();
  }
}

async function run() {
  for (const db of ['nr-bps_db', 'nr-bps_db_test']) {
    console.log(`\n=== Re-aplicando em ${db} ===`);
    const dbUrl = `postgresql://postgres:123456@localhost:5432/${db}`;
    for (const m of MIGRATIONS_TO_REAPPLY) {
      await applyMigrationIdempotent(dbUrl, m);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
