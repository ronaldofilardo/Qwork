#!/usr/bin/env tsx
/**
 * Diagnóstico de problemas de FKs
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';

async function main() {
  const pool = new Pool({ connectionString: DEV_DB });

  try {
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('DIAGNÓSTICO: Verificando dados com FKs quebradas\n');

    // 1. Verificar clinicas
    console.log('1️⃣  CLINICAS');
    console.log(
      '─────────────────────────────────────────────────────────────'
    );

    const clinicas = await pool.query(`
      SELECT 
        c.id AS clinica_id,
        c.nome_fantasia,
        c.entidade_id,
        e.id AS entidade_existe
      FROM clinicas c
      LEFT JOIN entidades e ON e.id = c.entidade_id
    `);

    for (const row of clinicas.rows) {
      const icon = row.entidade_existe ? '✅' : '❌';
      console.log(
        `   ${icon} Clínica ${row.clinica_id} (${row.nome_fantasia})`
      );
      console.log(
        `      → entidade_id: ${row.entidade_id} ${row.entidade_existe ? 'OK' : 'NÃO EXISTE'}`
      );
    }

    // 2. Verificar funcionarios
    console.log('\n2️⃣  FUNCIONARIOS');
    console.log(
      '─────────────────────────────────────────────────────────────'
    );

    const funcionarios = await pool.query(`
      SELECT 
        f.id,
        f.nome,
        f.cpf,
        f.entidade_id,
        e.id AS entidade_existe
      FROM funcionarios f
      LEFT JOIN entidades e ON e.id = f.entidade_id
      LIMIT 5
    `);

    for (const row of funcionarios.rows) {
      const icon = row.entidade_existe ? '✅' : '❌';
      console.log(`   ${icon} Funcionário ${row.id} (${row.nome})`);
      console.log(
        `      → entidade_id: ${row.entidade_id} ${row.entidade_existe ? 'OK' : 'NÃO EXISTE'}`
      );
    }

    // 3. Verificar lotes_avaliacao
    console.log('\n3️⃣  LOTES_AVALIACAO');
    console.log(
      '─────────────────────────────────────────────────────────────'
    );

    const lotes = await pool.query(`
      SELECT 
        l.id,
        l.numero_lote,
        l.clinica_id,
        c.id AS clinica_existe
      FROM lotes_avaliacao l
      LEFT JOIN clinicas c ON c.id = l.clinica_id
      LIMIT 5
    `);

    for (const row of lotes.rows) {
      const icon = row.clinica_existe ? '✅' : '❌';
      console.log(`   ${icon} Lote ${row.id} (${row.numero_lote})`);
      console.log(
        `      → clinica_id: ${row.clinica_id} ${row.clinica_existe ? 'OK' : 'NÃO EXISTE'}`
      );
    }

    // 4. Verificar laudos
    console.log('\n4️⃣  LAUDOS');
    console.log(
      '─────────────────────────────────────────────────────────────'
    );

    const laudos = await pool.query(`
      SELECT 
        ld.id,
        ld.numero_laudo,
        ld.funcionario_id,
        f.id AS funcionario_existe,
        ld.avaliacao_id,
        a.id AS avaliacao_existe
      FROM laudos ld
      LEFT JOIN funcionarios f ON f.id = ld.funcionario_id
      LEFT JOIN avaliacoes a ON a.id = ld.avaliacao_id
      LIMIT 5
    `);

    for (const row of laudos.rows) {
      const funcIcon = row.funcionario_existe ? '✅' : '❌';
      const avalIcon = row.avaliacao_existe ? '✅' : '❌';

      console.log(`   Laudo ${row.id} (${row.numero_laudo})`);
      console.log(
        `      ${funcIcon} funcionario_id: ${row.funcionario_id} ${row.funcionario_existe ? 'OK' : 'NÃO EXISTE'}`
      );
      console.log(
        `      ${avalIcon} avaliacao_id: ${row.avaliacao_id} ${row.avaliacao_existe ? 'OK' : 'NÃO EXISTE'}`
      );
    }

    // 5. Verificar entidades disponíveis
    console.log('\n5️⃣  ENTIDADES DISPONÍVEIS');
    console.log(
      '─────────────────────────────────────────────────────────────'
    );

    const entidades = await pool.query(
      `SELECT id, nome, tipo FROM entidades ORDER BY id`
    );
    for (const row of entidades.rows) {
      console.log(`   ID ${row.id}: ${row.nome} (${row.tipo})`);
    }

    console.log(
      '\n═══════════════════════════════════════════════════════════════\n'
    );
  } finally {
    await pool.end();
  }
}

main();
