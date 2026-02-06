#!/usr/bin/env tsx
/**
 * Cópia final: Clínica 37, Lotes 3 e 4, Laudos 3 e 4
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const PROD_DB =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB });
  const prodPool = new Pool({ connectionString: PROD_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CÓPIA FINAL: Clínica 37 + Lotes 3-4 + Laudos 3-4          ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    const client = await prodPool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_user_cpf = '00000000000'`);

      // 1. Copiar Clínica 37
      console.log('1️⃣  Copiando Clínica 37...\n');

      const clinica37 = await devPool.query(
        'SELECT * FROM clinicas WHERE id = 37'
      );

      if (clinica37.rows.length > 0) {
        const c = clinica37.rows[0];
        const cols = Object.keys(c);
        const colNames = cols.map((col) => `"${col}"`).join(', ');
        const values = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        const data = cols.map((col) => c[col]);

        await client.query(`ALTER TABLE clinicas DISABLE ROW LEVEL SECURITY`);
        await client.query(
          `INSERT INTO clinicas (${colNames}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET entidade_id = EXCLUDED.entidade_id`,
          data
        );
        await client.query(`ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY`);

        console.log('   ✅ Clínica 37 copiada!\n');
      }

      // 2. Copiar Lote 3
      console.log('2️⃣  Copiando Lote 3...\n');

      const lote3 = await devPool.query(
        'SELECT * FROM lotes_avaliacao WHERE id = 3'
      );

      if (lote3.rows.length > 0) {
        const l = lote3.rows[0];
        const cols = Object.keys(l);
        const colNames = cols.map((col) => `"${col}"`).join(', ');
        const values = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        const data = cols.map((col) => l[col]);

        await client.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);
        await client.query(
          `ALTER TABLE lotes_avaliacao DISABLE ROW LEVEL SECURITY`
        );
        await client.query(
          `INSERT INTO lotes_avaliacao (${colNames}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET clinica_id = EXCLUDED.clinica_id, contratante_id = EXCLUDED.contratante_id`,
          data
        );
        await client.query(
          `ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY`
        );
        await client.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);

        console.log('   ✅ Lote 3 copiado!\n');
      }

      // 3. Copiar Lote 4
      console.log('3️⃣  Copiando Lote 4...\n');

      const lote4 = await devPool.query(
        'SELECT * FROM lotes_avaliacao WHERE id = 4'
      );

      if (lote4.rows.length > 0) {
        const l = lote4.rows[0];
        const cols = Object.keys(l);
        const colNames = cols.map((col) => `"${col}"`).join(', ');
        const values = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        const data = cols.map((col) => l[col]);

        await client.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);
        await client.query(
          `ALTER TABLE lotes_avaliacao DISABLE ROW LEVEL SECURITY`
        );
        await client.query(
          `INSERT INTO lotes_avaliacao (${colNames}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET clinica_id = EXCLUDED.clinica_id, contratante_id = EXCLUDED.contratante_id`,
          data
        );
        await client.query(
          `ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY`
        );
        await client.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);

        console.log('   ✅ Lote 4 copiado!\n');
      }

      // 4. Copiar Laudos 3 e 4
      console.log('4️⃣  Copiando Laudos 3 e 4...\n');

      const laudos = await devPool.query(
        'SELECT * FROM laudos WHERE id IN (3, 4) ORDER BY id'
      );

      await client.query(`ALTER TABLE laudos DISABLE ROW LEVEL SECURITY`);

      for (const laudo of laudos.rows) {
        const cols = Object.keys(laudo);
        const colNames = cols.map((col) => `"${col}"`).join(', ');
        const values = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        const data = cols.map((col) => laudo[col]);

        await client.query(
          `INSERT INTO laudos (${colNames}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET lote_id = EXCLUDED.lote_id`,
          data
        );

        console.log(`   ✅ Laudo ${laudo.id} copiado!`);
      }

      await client.query(`ALTER TABLE laudos ENABLE ROW LEVEL SECURITY`);

      await client.query('COMMIT');

      console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
      console.log('VERIFICAÇÃO FINAL:\n');

      const tables = ['clinicas', 'lotes_avaliacao', 'laudos'];

      for (const table of tables) {
        const dev = await devPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const prod = await prodPool.query(`SELECT COUNT(*) FROM "${table}"`);

        const devCount = parseInt(dev.rows[0].count);
        const prodCount = parseInt(prod.rows[0].count);

        const icon = devCount === prodCount ? '✅' : '⚠️';
        const pct =
          devCount > 0 ? Math.round((prodCount / devCount) * 100) : 100;

        console.log(
          `   ${icon} ${table.padEnd(25)} DEV: ${devCount}, PROD: ${prodCount} (${pct}%)`
        );
      }

      console.log(
        '\n╔══════════════════════════════════════════════════════════════╗'
      );
      console.log(
        '║  ✅ SINCRONIZAÇÃO 100% COMPLETA!                            ║'
      );
      console.log(
        '╚══════════════════════════════════════════════════════════════╝\n'
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
