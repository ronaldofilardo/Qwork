#!/usr/bin/env tsx
/**
 * Diagnóstico específico: Por que funcionarios não copia?
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
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('DIAGNÓSTICO: Por que FUNCIONARIOS não copia?\n');

    // 1. Verificar FKs de funcionarios
    console.log('1️⃣  FOREIGN KEYS VERIFICAÇÃO:\n');

    const funcionarios = await devPool.query(`
      SELECT 
        f.id,
        f.nome,
        f.clinica_id,
        c.id AS clinica_existe,
        f.empresa_id,
        e.id AS empresa_existe,
        f.contratante_id,
        ent.id AS contratante_existe,
        ent.tipo AS contratante_tipo
      FROM funcionarios f
      LEFT JOIN clinicas c ON c.id = f.clinica_id
      LEFT JOIN empresas_clientes e ON e.id = f.empresa_id
      LEFT JOIN entidades ent ON ent.id = f.contratante_id
      LIMIT 5
    `);

    for (const row of funcionarios.rows) {
      console.log(`   Funcionário ${row.id}: ${row.nome}`);

      const clinicaIcon = row.clinica_existe
        ? '✅'
        : row.clinica_id
          ? '❌'
          : '⚠️';
      const empresaIcon = row.empresa_existe
        ? '✅'
        : row.empresa_id
          ? '❌'
          : '⚠️';
      const contratanteIcon = row.contratante_existe
        ? '✅'
        : row.contratante_id
          ? '❌'
          : '⚠️';

      console.log(
        `      ${clinicaIcon} clinica_id: ${row.clinica_id || 'NULL'} ${row.clinica_existe ? 'OK' : row.clinica_id ? 'NÃO EXISTE' : 'NULL'}`
      );
      console.log(
        `      ${empresaIcon} empresa_id: ${row.empresa_id || 'NULL'} ${row.empresa_existe ? 'OK' : row.empresa_id ? 'NÃO EXISTE' : 'NULL'}`
      );
      console.log(
        `      ${contratanteIcon} contratante_id: ${row.contratante_id || 'NULL'} ${row.contratante_existe ? `OK (${row.contratante_tipo})` : row.contratante_id ? 'NÃO EXISTE' : 'NULL'}\n`
      );
    }

    // 2. Verificar se clinicas existem em PROD
    console.log('2️⃣  CLINICAS EM PROD:\n');

    const clinicasProd = await prodPool.query('SELECT id, nome FROM clinicas');
    console.log(`   Total: ${clinicasProd.rows.length}`);
    for (const c of clinicasProd.rows) {
      console.log(`      ID ${c.id}: ${c.nome}`);
    }

    // 3. Verificar empresas_clientes
    console.log('\n3️⃣  EMPRESAS_CLIENTES:\n');

    const empresasDev = await devPool.query(
      'SELECT id, nome FROM empresas_clientes'
    );
    const empresasProd = await prodPool.query(
      'SELECT id, nome FROM empresas_clientes'
    );

    console.log(`   DEV:  ${empresasDev.rows.length} registros`);
    console.log(`   PROD: ${empresasProd.rows.length} registros`);

    if (empresasDev.rows.length > 0) {
      console.log('\n   Empresas em DEV:');
      for (const emp of empresasDev.rows) {
        console.log(`      ID ${emp.id}: ${emp.nome}`);
      }
    }

    // 4. Tentar inserir um funcionário manualmente
    console.log('\n4️⃣  TESTE DE INSERÇÃO MANUAL:\n');

    const func = funcionarios.rows[0];
    if (func) {
      try {
        await prodPool.query('BEGIN');
        await prodPool.query(
          'ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY'
        );

        await prodPool.query(
          `
          INSERT INTO funcionarios (id, cpf, nome, clinica_id, empresa_id, contratante_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `,
          [
            func.id,
            func.cpf || '00000000000',
            func.nome,
            func.clinica_id,
            func.empresa_id,
            func.contratante_id,
          ]
        );

        console.log('   ✅ Inserção manual funcionou!');

        await prodPool.query('ROLLBACK');
      } catch (error: any) {
        await prodPool.query('ROLLBACK');
        console.log('   ❌ Erro na inserção:');
        console.log(`      ${error.message.substring(0, 200)}`);
      }
    }

    console.log(
      '\n═══════════════════════════════════════════════════════════════\n'
    );
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
