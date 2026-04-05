/**
 * Seed: suporte + comercial no banco neondb_staging
 *
 * Replica exatamente o estado desses dois usuários do DEV:
 *   - suporte  (tipo_usuario = 'suporte')  CPF 11111111111  senha Amanda2026*
 *   - comercial (tipo_usuario = 'comercial') CPF 22222222222  senha Talita2026*
 *
 * Apenas a tabela `usuarios` precisa ser atualizada — em DEV esses usuários não
 * possuem vínculos em hierarquia_comercial, vendedores_perfil ou aceites_termos_usuario.
 *
 * Uso:
 *   node scripts/seed-staging-suporte-comercial.cjs
 *
 * Requer: DATABASE_URL_STAGING no ambiente (ou carrega de .env.staging)
 */

'use strict';

require('dotenv').config({ path: '.env.staging' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const STAGING_URL = process.env.DATABASE_URL;

if (!STAGING_URL) {
  console.error('❌ DATABASE_URL não encontrada. Certifique-se de que .env.staging existe.');
  process.exit(1);
}

if (!STAGING_URL.includes('neondb_staging')) {
  console.error(`❌ ABORTADO: DATABASE_URL não aponta para neondb_staging.\n   URL: ${STAGING_URL.replace(/:[^@]+@/, ':***@')}`);
  process.exit(1);
}

const USUARIOS = [
  {
    cpf: '11111111111',
    nome: 'Suporte Teste',
    email: 'suporte.teste@qwork.local',
    tipo_usuario: 'suporte',
    senha: 'Amanda2026*',
  },
  {
    cpf: '22222222222',
    nome: 'Comercial Teste',
    email: 'comercial.teste@qwork.local',
    tipo_usuario: 'comercial',
    senha: 'Talita2026*',
  },
];

const SALT_ROUNDS = 10;

async function main() {
  console.log('=== Seed staging: suporte + comercial ===');
  console.log(`DB: ${STAGING_URL.replace(/:[^@]+@/, ':***@')}\n`);

  const client = new Client({
    connectionString: STAGING_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao staging.\n');
    // Verificar se o enum usuario_tipo_enum tem os valores necessários
    const enumCheck = await client.query(
      "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='usuario_tipo_enum' ORDER BY enumsortorder"
    );
    const enumValues = enumCheck.rows.map(r => r.enumlabel);
    console.log('enum usuario_tipo_enum no staging:', enumValues);

    for (const tipo of ['suporte', 'comercial']) {
      if (!enumValues.includes(tipo)) {
        console.log(`⚠️  Adicionando '${tipo}' ao enum usuario_tipo_enum...`);
        await client.query(`ALTER TYPE usuario_tipo_enum ADD VALUE IF NOT EXISTS '${tipo}'`);
        console.log(`   ✓ '${tipo}' adicionado.`);
      }
    }

    // Gerar hashes bcrypt
    console.log('\nGerando hashes bcrypt...');
    const hashes = await Promise.all(
      USUARIOS.map(u => bcrypt.hash(u.senha, SALT_ROUNDS))
    );
    console.log('Hashes gerados.\n');

    // Verificar estado atual no staging
    const existentes = await client.query(
      "SELECT id, cpf, nome, tipo_usuario, ativo FROM usuarios WHERE cpf = ANY($1::varchar[])",
      [USUARIOS.map(u => u.cpf)]
    );
    console.log('Estado atual no staging:');
    if (existentes.rows.length === 0) {
      console.log('  (nenhum registro encontrado — será inserido)');
    } else {
      existentes.rows.forEach(r => console.log(`  id=${r.id} cpf=${r.cpf} tipo=${r.tipo_usuario} ativo=${r.ativo}`));
    }
    console.log('');

    // Upsert cada usuário
    for (let i = 0; i < USUARIOS.length; i++) {
      const u = USUARIOS[i];
      const hash = hashes[i];

      const result = await client.query(
        `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo)
         VALUES ($1, $2, $3, $4::usuario_tipo_enum, $5, true)
         ON CONFLICT (cpf) DO UPDATE
           SET senha_hash  = EXCLUDED.senha_hash,
               tipo_usuario = EXCLUDED.tipo_usuario,
               nome         = EXCLUDED.nome,
               ativo        = true
         RETURNING id, cpf, tipo_usuario, ativo`,
        [u.cpf, u.nome, u.email, u.tipo_usuario, hash]
      );

      const row = result.rows[0];
      console.log(`[${u.tipo_usuario.padEnd(10)}] ✓ id=${row.id} cpf=${row.cpf} tipo=${row.tipo_usuario} ativo=${row.ativo}`);
    }

    console.log('\n✅ Seed concluído com sucesso no staging.');
    console.log('\nCredenciais:');
    console.log('  suporte    CPF=11111111111  senha=Amanda2026*');
    console.log('  comercial  CPF=22222222222  senha=Talita2026*');
  } catch (err) {
    console.error('\n❌ ERRO durante seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
