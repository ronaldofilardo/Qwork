#!/usr/bin/env tsx
/**
 * Script para verificar inconsistências de dados antes da cópia
 */

import { Pool } from 'pg';

const DEV_DB = {
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
};

const PROD_DB = {
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
};

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log('🔍 Verificando estrutura e dados...\n');

    // Verificar tabelas entidades/contratantes
    console.log('📋 Tabela ENTIDADES no DEV:');
    const devEntidades = await devPool.query(
      'SELECT id, cnpj, nome, tipo FROM entidades ORDER BY id'
    );
    console.log(`   ${devEntidades.rows.length} registros:`);
    devEntidades.rows.forEach((r) => {
      console.log(`   - ID ${r.id}: ${r.nome} (${r.cnpj}) - Tipo: ${r.tipo}`);
    });

    console.log('\n📋 Tabela ENTIDADES no PROD:');
    const prodEntidades = await prodPool.query(
      'SELECT id, cnpj, nome, tipo FROM contratantes ORDER BY id'
    );
    console.log(`   ${prodEntidades.rows.length} registros:`);
    prodEntidades.rows.forEach((r) => {
      console.log(`   - ID ${r.id}: ${r.nome} (${r.cnpj}) - Tipo: ${r.tipo}`);
    });

    // Verificar clínicas
    console.log('\n📋 Tabela CLINICAS no DEV:');
    const devClinicas = await devPool.query(
      'SELECT id, nome, entidade_id FROM clinicas ORDER BY id'
    );
    console.log(`   ${devClinicas.rows.length} registros:`);
    devClinicas.rows.forEach((r) => {
      console.log(`   - ID ${r.id}: ${r.nome} - Entidade: ${r.entidade_id}`);
    });

    console.log('\n📋 Tabela CLINICAS no PROD:');
    const prodClinicas = await prodPool.query(
      'SELECT id, nome FROM clinicas ORDER BY id'
    );
    console.log(`   ${prodClinicas.rows.length} registros:`);
    prodClinicas.rows.forEach((r) => {
      console.log(`   - ID ${r.id}: ${r.nome}`);
    });

    // Verificar funcionários
    console.log('\n📋 Tabela FUNCIONARIOS no DEV:');
    const devFunc = await devPool.query(
      'SELECT id, cpf, nome, contratante_id, perfil FROM funcionarios ORDER BY id LIMIT 5'
    );
    console.log(`   ${devFunc.rows.length} primeiros registros:`);
    devFunc.rows.forEach((r) => {
      console.log(
        `   - ID ${r.id}: ${r.nome} (${r.cpf}) - Contratante: ${r.contratante_id}, Perfil: ${r.perfil}`
      );
    });
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main().catch(console.error);
