#!/usr/bin/env node

/**
 * Script: Seed usuários no staging (neondb_staging)
 *
 * Usuários criados:
 *   - Admin: CPF 00000000000, Senha 5978rdF*
 *   - Suporte: CPF 11111111111, Senha Amanda2026*
 *   - Comercial: CPF 22222222222, Senha Talita2026*
 *
 * Uso:
 *   node scripts/seed-staging-usuarios.cjs
 *
 * Variáveis de ambiente:
 *   DATABASE_URL (padrão) ou DATABASE_URL_STAGING
 */

'use strict';

require('dotenv').config({ path: '.env.staging' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const STAGING_URL =
  process.env.DATABASE_URL || process.env.DATABASE_URL_STAGING;

if (!STAGING_URL) {
  console.error('❌ DATABASE_URL não encontrada in .env.staging');
  process.exit(1);
}

if (!STAGING_URL.includes('neondb_staging')) {
  console.error(`❌ ⚠️  ABORTADO: DATABASE_URL não aponta para neondb_staging`);
  console.error(`   URL: ${STAGING_URL.replace(/:[^@]+@/, ':***@')}`);
  process.exit(1);
}

async function main() {
  console.log('=== Seed staging usuarios ===');
  console.log(`DB: ${STAGING_URL.replace(/:[^@]+@/, ':***@')}\n`);

  const client = new Client({
    connectionString: STAGING_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao staging (neondb_staging).\n');

    // Ler e executar o arquivo SQL
    const sqlPath = path.join(
      __dirname,
      '../database/seeds/seed_staging_usuarios.sql'
    );
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executando seed SQL...\n');
    await client.query(sql);

    // Verificar resultado
    const result = await client.query(`
      SELECT cpf, nome, tipo_usuario, ativo
      FROM usuarios
      WHERE cpf IN ('00000000000', '11111111111', '22222222222')
      ORDER BY cpf
    `);

    console.log('\n✅ Seed executado com sucesso!\n');
    console.log('Usuários no staging:');
    result.rows.forEach((u) => {
      console.log(
        `  ${u.cpf} | ${u.nome.padEnd(20)} | ${u.tipo_usuario.padEnd(12)} | ativo=${u.ativo}`
      );
    });

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message || err);
    process.exit(1);
  }
}

main();
