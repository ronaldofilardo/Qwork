/**
 * Seed: Novos Perfis de Teste
 *
 * Insere usuários de teste para os perfis suporte, comercial, representante e vendedor.
 * Roda em DEV (nr-bps_db) e TEST (nr-bps_db_test).
 *
 * Usuários criados:
 *   1. suporte    — CPF 11111111111 / senha 1111
 *   2. comercial  — CPF 22222222222 / senha 2222
 *   3. representante — CPF 33333333333 / senha 3333 (tabela representantes)
 *   4. vendedor   — CPF 44444444444 / senha 4444
 *
 * Nota: vendedor é cadastrado na tabela `usuarios` (sem FK para representantes,
 * pois a constraint da migration 1022 não prevê esse vínculo).
 * A associação "para o representante 33333333333" é apenas contexto de teste.
 */

'use strict';

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASES = [
  {
    name: 'DEV',
    connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  },
  {
    name: 'TEST',
    connectionString:
      (process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db_test'),
  },
];

const SALT_ROUNDS = 10;

async function seedDatabase(db) {
  console.log(`\n=== Seeding ${db.name} (${db.connectionString}) ===`);

  const client = new Client({ connectionString: db.connectionString });
  await client.connect();

  try {
    // Gerar hashes bcrypt
    console.log('Gerando hashes bcrypt...');
    const [hash1111, hash2222, hash3333, hash4444] = await Promise.all([
      bcrypt.hash('1111', SALT_ROUNDS),
      bcrypt.hash('2222', SALT_ROUNDS),
      bcrypt.hash('3333', SALT_ROUNDS),
      bcrypt.hash('4444', SALT_ROUNDS),
    ]);
    console.log('Hashes gerados.');

    // --- 1. suporte (tabela usuarios) ---
    const suporteRes = await client.query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo)
       VALUES ($1, $2, $3, 'suporte', $4, true)
       ON CONFLICT (cpf) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             tipo_usuario = EXCLUDED.tipo_usuario,
             nome = EXCLUDED.nome,
             ativo = true
       RETURNING id, cpf, tipo_usuario`,
      ['11111111111', 'Suporte Teste', 'suporte.teste@qwork.local', hash1111]
    );
    console.log(`[suporte]    ✓ id=${suporteRes.rows[0].id} cpf=11111111111`);

    // --- 2. comercial (tabela usuarios) ---
    const comercialRes = await client.query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo)
       VALUES ($1, $2, $3, 'comercial', $4, true)
       ON CONFLICT (cpf) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             tipo_usuario = EXCLUDED.tipo_usuario,
             nome = EXCLUDED.nome,
             ativo = true
       RETURNING id, cpf, tipo_usuario`,
      [
        '22222222222',
        'Comercial Teste',
        'comercial.teste@qwork.local',
        hash2222,
      ]
    );
    console.log(`[comercial]  ✓ id=${comercialRes.rows[0].id} cpf=22222222222`);

    // --- 3. representante (tabela representantes) ---
    // Login via /api/auth/login com CPF + senha (handleRepresentanteLogin usa senha_hash)
    // codigo é obrigatório NOT NULL — usamos '000000000000' como placeholder de teste
    // Não incluímos aceite_politica_privacidade / dados_bancarios_status pois podem
    // não existir em bancos TEST com migrations mais antigas (usam DEFAULT do schema).
    const repRes = await client.query(
      `INSERT INTO representantes (
         cpf, nome, email, telefone, tipo_pessoa,
         codigo, status, senha_hash,
         aceite_termos, aceite_disclaimer_nv
       )
       VALUES ($1, $2, $3, $4, 'pf', $5, 'ativo', $6, false, false)
       ON CONFLICT (cpf) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             nome = EXCLUDED.nome,
             status = 'ativo'
       RETURNING id, cpf, status`,
      [
        '33333333333',
        'Representante Teste',
        'representante.teste@qwork.local',
        '11999993333',
        '000000000000',
        hash3333,
      ]
    );
    console.log(`[representante] ✓ id=${repRes.rows[0].id} cpf=33333333333`);

    // --- 4. vendedor (tabela usuarios) ---
    const vendedorRes = await client.query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo)
       VALUES ($1, $2, $3, 'vendedor', $4, true)
       ON CONFLICT (cpf) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             tipo_usuario = EXCLUDED.tipo_usuario,
             nome = EXCLUDED.nome,
             ativo = true
       RETURNING id, cpf, tipo_usuario`,
      ['44444444444', 'Vendedor Teste', 'vendedor.teste@qwork.local', hash4444]
    );
    console.log(`[vendedor]   ✓ id=${vendedorRes.rows[0].id} cpf=44444444444`);

    console.log(`\n✅ ${db.name}: seed concluído com sucesso.`);
  } catch (err) {
    console.error(`\n❌ ${db.name}: ERRO durante seed:`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log(
    '=== Seed: Novos Perfis (suporte, comercial, representante, vendedor) ==='
  );

  for (const db of DATABASES) {
    await seedDatabase(db);
  }

  console.log('\n=== Seed finalizado em todos os bancos. ===');
  console.log('\nCredenciais criadas:');
  console.log('  suporte     CPF=11111111111  senha=1111');
  console.log('  comercial   CPF=22222222222  senha=2222');
  console.log(
    '  representante CPF=33333333333 senha=3333  (login via /api/auth/login)'
  );
  console.log('  vendedor    CPF=44444444444  senha=4444');
}

main().catch((err) => {
  console.error('Seed falhou:', err);
  process.exit(1);
});
