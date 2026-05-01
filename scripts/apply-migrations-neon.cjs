#!/usr/bin/env node
// Script: apply-migrations-neon.cjs
// Aplica migrations pendentes em STAGING e/ou PROD (Neon Cloud)
//
// Uso:
//   node scripts/apply-migrations-neon.cjs --env staging
//   node scripts/apply-migrations-neon.cjs --env prod
//   node scripts/apply-migrations-neon.cjs --env both
//
// Skips automáticos:
//   - Migrations já registradas em schema_migrations
//   - 1215a: DEV only (cria CPF fake 22222222222)
//   - 1216: Template com placeholders {{COMERCIAL_CPF}}
//   - Para PROD: 1230 e 1231 (já aplicadas)
//
// Segurança Neon: strips ALTER VIEW/TABLE OWNER TO postgres/CURRENT_USER

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

const STAGING_URL =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require';
const PROD_URL =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require';

// ─── LISTA ORDENADA DE MIGRATIONS 1210–1234 ─────────────────────────────────
// Cada item: { file, version, label, skipEnvs }
// skipEnvs: array de envs onde a migration deve ser pulada ('staging'|'prod')

const MIGRATIONS = [
  { file: '1210_view_emissao_add_percentual_comercial.sql',             version: '1210', label: '1210 view_emissao_add_percentual_comercial' },
  { file: '1211_view_emissao_valor_total_coalesce.sql',                 version: '1211', label: '1211 view_emissao_valor_total_coalesce' },
  { file: '1212_consolidar_comissoes_remove_sistema_antigo.sql',        version: '1212', label: '1212 consolidar_comissoes_remove_sistema_antigo' },
  { file: '1213_usuarios_asaas_wallet_id.sql',                          version: '1213', label: '1213 usuarios_asaas_wallet_id' },
  { file: '1214_add_gestor_comercial_cpf_representantes.sql',           version: '1214', label: '1214 add_gestor_comercial_cpf_representantes' },
  // 1215a: DEV only - skip em todos ambientes remotos
  { file: '1215a_criar_comercial_unico_cpf_22222222222.sql', version: '1215a', label: '1215a criar_comercial_unico_cpf_22222222222', skipEnvs: ['staging', 'prod'] },
  { file: '1215b_sync_vinculos_comissao_schema.sql',                    version: '1215b', label: '1215b sync_vinculos_comissao_schema' },
  // 1216: Template com placeholders - não pode ser aplicada sem substituição
  { file: '1216_criar_comercial_unico_prod_template.sql', version: '1216', label: '1216 criar_comercial_unico_prod_template (TEMPLATE)', skipEnvs: ['staging', 'prod'] },
  { file: '1217_remove_rpa_legacy.sql',                                 version: '1217', label: '1217 remove_rpa_legacy' },
  { file: '1218_rls_config_tables.sql',                                 version: '1218', label: '1218 rls_config_tables' },
  { file: '1219_fix_rls_policies_rbac.sql',                             version: '1219', label: '1219 fix_rls_policies_rbac' },
  { file: '1220_add_gestor_to_perfil_enum.sql',                         version: '1220', label: '1220 add_gestor_to_perfil_enum' },
  { file: '1221a_add_isento_pagamento.sql',                             version: '1221a', label: '1221a add_isento_pagamento' },
  { file: '1221b_sociedade_financeira_beneficiarios.sql',               version: '1221b', label: '1221b sociedade_financeira_beneficiarios' },
  { file: '1222_sociedade_qwork_wallet_seed.sql',                       version: '1222', label: '1222 sociedade_qwork_wallet_seed' },
  { file: '1223_status_lead_aprovado_rejeitado.sql',                    version: '1223', label: '1223 status_lead_aprovado_rejeitado' },
  { file: '1224_remove_nf_comissoes_laudo.sql',                         version: '1224', label: '1224 remove_nf_comissoes_laudo' },
  { file: '1225_drop_percentual_vendedor_leads_vinculos.sql',           version: '1225', label: '1225 drop_percentual_vendedor_leads_vinculos' },
  { file: '1226_fix_constraint_comercial_pf.sql',                       version: '1226', label: '1226 fix_constraint_comercial_pf' },
  { file: '1227_remove_codigo_representante_vendedor.sql',              version: '1227', label: '1227 remove_codigo_representante_vendedor' },
  { file: '1228_backfill_asaas_net_value.sql',                          version: '1228', label: '1228 backfill_asaas_net_value' },
  { file: '1229_cpf_unico_sistema_trigger.sql',                         version: '1229', label: '1229 cpf_unico_sistema_trigger' },
  // 1230 e 1231 já aplicados em PROD; aplicar no STAGING
  { file: '1230_configuracoes_gateway.sql',                             version: '1230a', label: '1230a configuracoes_gateway' },
  { file: '1230_fix_prevent_modification_allow_finalizacao.sql',        version: '1230b', label: '1230b fix_prevent_modification_allow_finalizacao' },
  { file: '1231_fix_taxa_transacao.sql',                                version: '1231a', label: '1231a fix_taxa_transacao' },
  { file: '1231_fix_prevent_lote_mutation_trigger.sql',                 version: '1231b', label: '1231b fix_prevent_lote_mutation_trigger' },
  { file: '1232_fix_audit_lote_change_user_cpf_fallback.sql',           version: '1232', label: '1232 fix_audit_lote_change_user_cpf_fallback' },
  { file: '1233_remove_comercial_comissoes.sql',                        version: '1233', label: '1233 remove_comercial_comissoes' },
  { file: '1234_nivel_cargo_segregado_por_empresa_view.sql',            version: '1234', label: '1234 nivel_cargo_segregado_por_empresa_view' },
];

// Versões que PROD já tem aplicadas (pulou de 1210 para 1230/1231 sem as intermediárias)
const PROD_ALREADY_APPLIED = new Set(['1230', '1231']);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function sanitizeSqlForNeon(sql) {
  // Remove ALTER VIEW/TABLE OWNER TO (falha em Neon - usuário postgres não existe)
  return sql
    .split('\n')
    .filter(line => {
      const t = line.trim().toUpperCase();
      // Remove linhas: ALTER TABLE|VIEW ... OWNER TO ...
      if (t.match(/^ALTER\s+(TABLE|VIEW|SEQUENCE|FUNCTION|PROCEDURE)\s+.*\s+OWNER\s+TO\s+/)) return false;
      // Remove \echo (psql meta-command - falha em pg client)
      if (t.startsWith('\\ECHO')) return false;
      return true;
    })
    .join('\n');
}

// schema_migrations.version é BIGINT — só aceita números inteiros
// Versões com sufixo letra (1215a, 1230b, etc.) NÃO são registradas, pois são idempotentes
function isNumericVersion(version) {
  return /^\d+$/.test(version);
}

async function getAppliedVersions(client) {
  const r = await client.query('SELECT version::text AS v FROM schema_migrations');
  return new Set(r.rows.map(row => row.v));
}

async function recordMigration(client, version) {
  if (!isNumericVersion(version)) {
    // Sufixo letra: migration idempotente, não registra em schema_migrations bigint
    return;
  }
  await client.query(
    'INSERT INTO schema_migrations (version, dirty) VALUES ($1::bigint, false) ON CONFLICT (version) DO NOTHING',
    [version]
  );
}

// Migration 1217: rename doc_nf_rpa_path → doc_nf_path
// PROD já tem ambos os campos — precisamos detectar e pular o RENAME
async function patchMigration1217(client, sql) {
  // Checa se doc_nf_rpa_path ainda existe e doc_nf_path ainda não existe
  const r = await client.query(`
    SELECT
      SUM(CASE WHEN column_name = 'doc_nf_rpa_path' THEN 1 ELSE 0 END) AS has_old,
      SUM(CASE WHEN column_name = 'doc_nf_path' THEN 1 ELSE 0 END) AS has_new
    FROM information_schema.columns
    WHERE table_name = 'vendedores_perfil'
      AND column_name IN ('doc_nf_rpa_path', 'doc_nf_path')
  `);
  const { has_old, has_new } = r.rows[0];
  if (Number(has_old) > 0 && Number(has_new) > 0) {
    // Ambas existem: o RENAME já foi feito em algum momento mas a antiga não foi dropada.
    // Drop the legacy column instead of rename.
    console.log('       (patch: ambas doc_nf_rpa_path e doc_nf_path existem — dropando legacy)');
    await client.query('ALTER TABLE vendedores_perfil DROP COLUMN IF EXISTS doc_nf_rpa_path');
    return;
  }
  if (Number(has_old) === 0 && Number(has_new) > 0) {
    console.log('       (patch: doc_nf_path já existe, doc_nf_rpa_path já removida — pulando)');
    return;
  }
  // Caso normal: só exists doc_nf_rpa_path → aplica o rename
  await client.query(sql);
}

// ─── APLICADOR ───────────────────────────────────────────────────────────────

async function applyMigrations(envName, url) {
  console.log('\n' + '='.repeat(60));
  console.log('  Ambiente: ' + envName.toUpperCase());
  console.log('='.repeat(60));

  // Usa uma conexão para verificar versões, depois nova conexão por migration
  const checkClient = new Client({ connectionString: url, connectionTimeoutMillis: 30000 });
  await checkClient.connect();
  const applied = await getAppliedVersions(checkClient);
  await checkClient.end();

  console.log('Versões já aplicadas: ' + [...applied].sort().slice(0, 20).join(', ') + (applied.size > 20 ? '...' : ''));

  let ok = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const migration of MIGRATIONS) {
    const { file, version, label } = migration;
    const skipEnvs = migration.skipEnvs || [];

    // 1. Skip se não deve rodar neste ambiente
    if (skipEnvs.includes(envName.toLowerCase())) {
      console.log('[SKIP DEV-ONLY] ' + label);
      skipped++;
      continue;
    }

    // 2. Skip migrations 1210/1211 para STAGING (referenciam r.codigo que não existe em STAGING)
    if (envName.toLowerCase() === 'staging' && (version === '1210' || version === '1211')) {
      console.log('[SKIP NO-COLUMN] ' + label + ' (r.codigo inexiste em STAGING — estrutura já correta via 1233)');
      skipped++;
      continue;
    }

    // 3. Skip se PROD já tinha 1230/1231 aplicados com versão sem sufixo
    if (envName.toLowerCase() === 'prod') {
      const numVersion = version.replace(/[ab]$/, '');
      if (PROD_ALREADY_APPLIED.has(numVersion) && applied.has(numVersion)) {
        console.log('[SKIP ALREADY] ' + label + ' (versão ' + numVersion + ' já registrada em PROD)');
        skipped++;
        continue;
      }
    }

    // 4. Skip se versão exata já registrada
    if (applied.has(version)) {
      console.log('[SKIP APPLIED] ' + label);
      skipped++;
      continue;
    }

    // 5. Verificar se arquivo existe
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log('[SKIP MISSING] ' + label + ' (arquivo não encontrado)');
      skipped++;
      continue;
    }

    // 6. Ler e sanitizar SQL
    let sql = fs.readFileSync(filePath, 'utf8');
    sql = sanitizeSqlForNeon(sql);

    // 7. Usar nova conexão por migration (evita estado abortado contaminar próximas)
    process.stdout.write('[APPLY] ' + label + '... ');
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 60000 });
    try {
      await client.connect();
      await client.query("SET app.current_user_cpf = '00000000000'");

      // Migration 1217 tem RENAME especial — usar handler dedicado
      if (version === '1217') {
        await patchMigration1217(client, sql);
      } else {
        await client.query(sql);
      }

      await recordMigration(client, version);
      console.log('OK');
      ok++;
    } catch (err) {
      // Tentar rollback para não deixar transação abortada
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.log('ERRO!');
      console.error('       → ' + err.message.substring(0, 300));
      failed++;
      failures.push({ label, error: err.message });
    } finally {
      try { await client.end(); } catch (_) {}
    }
  }

  console.log('\n─── Resumo ' + envName.toUpperCase() + ' ───────────────────');
  console.log('✅ Aplicadas : ' + ok);
  console.log('⏭  Puladas   : ' + skipped);
  console.log('❌ Com erro  : ' + failed);

  if (failures.length > 0) {
    console.log('\nFalhas:');
    for (const f of failures) {
      console.log('  • ' + f.label);
      console.log('    ' + f.error.substring(0, 300));
    }
  }

  return failed;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const envArg = (args.find(a => a.startsWith('--env=')) || args.find(a => a === '--env') && args[args.indexOf('--env') + 1] || '--env=both').replace('--env=', '');

  const runStaging = envArg === 'staging' || envArg === 'both';
  const runProd    = envArg === 'prod'    || envArg === 'both';

  if (!runStaging && !runProd) {
    console.error('Uso: node apply-migrations-neon.cjs --env=[staging|prod|both]');
    process.exit(1);
  }

  let totalFailed = 0;

  if (runStaging) {
    totalFailed += await applyMigrations('staging', STAGING_URL);
  }
  if (runProd) {
    totalFailed += await applyMigrations('prod', PROD_URL);
  }

  if (totalFailed > 0) {
    console.log('\n⚠️  ' + totalFailed + ' migração(ões) falharam. Verifique os erros acima.');
    process.exit(1);
  } else {
    console.log('\n✅ Todas as migrations aplicadas com sucesso!');
  }
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
