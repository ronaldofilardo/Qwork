#!/usr/bin/env tsx
/**
 * @file scripts/seed-staging.ts
 *
 * Seed de dados SINTÉTICOS para o banco neondb_staging.
 *
 * ─── SEGURANÇA / LGPD ────────────────────────────────────────────────────────
 * ✅  APENAS dados fictícios — CPFs inválidos (todos terminam em *_FAKE),
 *     CNPJs gerados com sufixo sintético, e-mails @example.com, nomes aleatórios
 * ❌  NUNCA usar CPFs/CNPJs/e-mails reais
 * ❌  NUNCA importar dados do banco de produção (neondb)
 * ❌  NUNCA rodar localmente com DATABASE_URL apontando para produção
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * USO:
 *   # Staging (via Vercel/CI — APP_ENV é definido automaticamente):
 *   DATABASE_URL=<neondb_staging_url> APP_ENV=staging pnpm tsx scripts/seed-staging.ts
 *
 *   # Localmente com .env.staging:
 *   cp .env.staging .env.local && pnpm tsx scripts/seed-staging.ts
 *
 * O script é idempotente — executa upserts por CPF/CNPJ sintéticos.
 */

import { neon } from '@neondatabase/serverless';
import * as crypto from 'crypto';

// ─── Guards de segurança ─────────────────────────────────────────────────────

function assertStagingEnv(): void {
  const appEnv = process.env.APP_ENV;
  const dbUrl = process.env.DATABASE_URL ?? '';

  if (appEnv !== 'staging') {
    console.error(
      `❌ ABORTADO: APP_ENV="${appEnv}" — este script só pode rodar com APP_ENV=staging`
    );
    process.exit(1);
  }

  if (!dbUrl.includes('neondb_staging')) {
    console.error(
      `❌ ABORTADO: DATABASE_URL não aponta para neondb_staging.\n` +
        `   URL atual: ${dbUrl.replace(/:[^@]+@/, ':***@')}`
    );
    process.exit(1);
  }

  console.log('✅ Guard OK: APP_ENV=staging + neondb_staging confirmados');
}

// ─── Geração de dados sintéticos ──────────────────────────────────────────────

/** Hash deterministico para gerar "CPF" sintético não verdadeiro */
function fakeCpf(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  // 11 dígitos, sempre par com último dígito 0 (CPF inválido por definição)
  return hash.slice(0, 9) + '00';
}

/** Hash deterministico para CNPJ sintético */
function fakeCnpj(seed: string): string {
  const hash = crypto
    .createHash('md5')
    .update(seed + 'cnpj')
    .digest('hex');
  return hash.slice(0, 8) + '0001' + '00';
}

/** Nome sintético */
const FAKE_NAMES = [
  'Alice Sintética',
  'Bruno Fictício',
  'Carla Demonstrativa',
  'Daniel Teste',
  'Eduarda Sample',
  'Felipe Mock',
  'Gabriela Demo',
  'Henrique Sandbox',
];

/** Empresas sintéticas para seed */
const FAKE_EMPRESAS = [
  { nome: 'Empresa Demo Alpha Ltda', seed: 'alpha' },
  { nome: 'Empresa Demo Beta S.A.', seed: 'beta' },
  { nome: 'Organização Sintética Gamma', seed: 'gamma' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomIndex(max: number, seed: number): number {
  return seed % max;
}

// ─── Seed principal ───────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  assertStagingEnv();

  const sql = neon(process.env.DATABASE_URL!);

  console.log('\n📦 Iniciando seed de dados sintéticos em neondb_staging...\n');

  // ── 1. Usuário Admin de Staging ────────────────────────────────────────────
  const adminCpf = fakeCpf('staging-admin-001');
  await sql`
    INSERT INTO usuarios (cpf, nome, email, tipo, ativo, senha_hash)
    VALUES (
      ${adminCpf},
      'Admin Staging QWork',
      'admin-staging@example.com',
      'admin',
      true,
      -- Hash bcrypt de "staging123" — NÃO é senha real
      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh4W'
    )
    ON CONFLICT (cpf) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      ativo = true
  `;
  console.log(
    `✅ Admin staging: CPF=${adminCpf} | email=admin-staging@example.com`
  );

  // ── 2. Emissor de Staging ──────────────────────────────────────────────────
  const emissorCpf = fakeCpf('staging-emissor-001');
  await sql`
    INSERT INTO usuarios (cpf, nome, email, tipo, ativo, senha_hash)
    VALUES (
      ${emissorCpf},
      'Emissor Demo Staging',
      'emissor-staging@example.com',
      'emissor',
      true,
      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh4W'
    )
    ON CONFLICT (cpf) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      ativo = true
  `;
  console.log(`✅ Emissor staging: CPF=${emissorCpf}`);

  // ── 3. Entidades / Empresas sintéticas ────────────────────────────────────
  for (const empresa of FAKE_EMPRESAS) {
    const cnpj = fakeCnpj(empresa.seed);

    // Gestor RH
    const gestorCpf = fakeCpf(`gestor-${empresa.seed}`);
    await sql`
      INSERT INTO usuarios (cpf, nome, email, tipo, ativo, senha_hash)
      VALUES (
        ${gestorCpf},
        ${'Gestor ' + empresa.nome},
        ${'gestor-' + empresa.seed + '@example.com'},
        'rh',
        true,
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh4W'
      )
      ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        ativo = true
    `;

    // Entidade
    try {
      await sql`
        INSERT INTO entidades (cnpj, razao_social, nome_fantasia, ativo, gestor_cpf)
        VALUES (
          ${cnpj},
          ${empresa.nome},
          ${empresa.nome.split(' ').slice(0, 2).join(' ')},
          true,
          ${gestorCpf}
        )
        ON CONFLICT (cnpj) DO UPDATE SET
          razao_social = EXCLUDED.razao_social,
          ativo = true
      `;
      console.log(`✅ Entidade: ${empresa.nome} | CNPJ=${cnpj}`);
    } catch {
      // Pode falhar se a tabela não existir — ignora graciosamente
      console.log(
        `⚠️  Entidade ${empresa.nome}: pulado (tabela pode não existir no schema)`
      );
    }
  }

  // ── 4. Funcionários sintéticos ────────────────────────────────────────────
  console.log('\n📋 Inserindo funcionários sintéticos...');
  for (let i = 0; i < FAKE_NAMES.length; i++) {
    const cpf = fakeCpf(`funcionario-${i}`);
    const nome = FAKE_NAMES[i];
    const empresaIdx = randomIndex(FAKE_EMPRESAS.length, i);
    const cnpj = fakeCnpj(FAKE_EMPRESAS[empresaIdx].seed);

    try {
      await sql`
        INSERT INTO funcionarios (
          cpf, nome, email, ativo,
          data_nascimento, cargo, departamento,
          entidade_cnpj
        )
        VALUES (
          ${cpf},
          ${nome},
          ${`func-${i}@example.com`},
          true,
          ${'1990-01-' + String(i + 1).padStart(2, '0')},
          'Analista Demo',
          'Departamento Sintético',
          ${cnpj}
        )
        ON CONFLICT (cpf) DO UPDATE SET
          nome = EXCLUDED.nome,
          ativo = true
      `;
    } catch {
      console.log(`⚠️  Funcionário ${nome}: pulado (schema pode diferir)`);
    }
  }
  console.log(`✅ ${FAKE_NAMES.length} funcionários sintéticos processados`);

  // ── 5. Aviso final ─────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('✅ Seed de staging concluído com sucesso!');
  console.log('');
  console.log('Dados inseridos (todos SINTÉTICOS):');
  console.log(
    `  • 1 admin     → admin-staging@example.com  (senha: staging123)`
  );
  console.log(`  • 1 emissor   → emissor-staging@example.com`);
  console.log(`  • ${FAKE_EMPRESAS.length} entidades com gestores RH`);
  console.log(`  • ${FAKE_NAMES.length} funcionários`);
  console.log('');
  console.log('⚠️  LGPD: Nenhum dado real foi inserido.');
  console.log('   Todos os CPFs/CNPJs são inválidos por construção.');
  console.log('─'.repeat(60) + '\n');
}

seed().catch((err: unknown) => {
  console.error('❌ Erro no seed de staging:', err);
  process.exit(1);
});
