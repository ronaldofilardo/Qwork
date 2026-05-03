#!/usr/bin/env node
// Script: apply-migrations-1210-1234-local.cjs
// Aplica migrations 1210-1234 em dev (nr-bps_db) e test (nr-bps_db_test)
//
// Uso: node scripts/apply-migrations-1210-1234-local.cjs

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const baseUrl =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';
if (!baseUrl) {
  console.error(
    'LOCAL_DATABASE_URL / DATABASE_URL não encontrada no .env.local'
  );
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

// Ordem explícita de aplicação
const MIGRATIONS = [
  {
    file: '1210_view_emissao_add_percentual_comercial.sql',
    version: 1210,
    label: '1210 view_emissao_add_percentual_comercial',
  },
  {
    file: '1211_view_emissao_valor_total_coalesce.sql',
    version: 1211,
    label: '1211 view_emissao_valor_total_coalesce',
  },
  {
    file: '1212_consolidar_comissoes_remove_sistema_antigo.sql',
    version: 1212,
    label: '1212 consolidar_comissoes_remove_sistema_antigo',
  },
  {
    file: '1213_usuarios_asaas_wallet_id.sql',
    version: 1213,
    label: '1213 usuarios_asaas_wallet_id',
  },
  {
    file: '1214_add_gestor_comercial_cpf_representantes.sql',
    version: 1214,
    label: '1214 add_gestor_comercial_cpf_representantes',
  },
  // 1215a: DEV only — cria CPF fake 22222222222 para testes locais
  {
    file: '1215a_criar_comercial_unico_cpf_22222222222.sql',
    version: null,
    label:
      '1215a criar_comercial_unico_cpf_22222222222 (DEV only, sem registro)',
  },
  {
    file: '1215b_sync_vinculos_comissao_schema.sql',
    version: null,
    label: '1215b sync_vinculos_comissao_schema (sem registro bigint)',
  },
  // 1216: Template com placeholders — pulada em todos ambientes
  {
    file: '1217_remove_rpa_legacy.sql',
    version: 1217,
    label: '1217 remove_rpa_legacy',
  },
  {
    file: '1218_rls_config_tables.sql',
    version: 1218,
    label: '1218 rls_config_tables',
  },
  {
    file: '1219_fix_rls_policies_rbac.sql',
    version: 1219,
    label: '1219 fix_rls_policies_rbac',
  },
  {
    file: '1220_add_gestor_to_perfil_enum.sql',
    version: 1220,
    label: '1220 add_gestor_to_perfil_enum',
  },
  {
    file: '1221a_add_isento_pagamento.sql',
    version: null,
    label: '1221a add_isento_pagamento (sem registro bigint)',
  },
  {
    file: '1221b_sociedade_financeira_beneficiarios.sql',
    version: null,
    label: '1221b sociedade_financeira_beneficiarios (sem registro bigint)',
  },
  {
    file: '1222_sociedade_qwork_wallet_seed.sql',
    version: 1222,
    label: '1222 sociedade_qwork_wallet_seed',
  },
  {
    file: '1223_status_lead_aprovado_rejeitado.sql',
    version: 1223,
    label: '1223 status_lead_aprovado_rejeitado',
  },
  {
    file: '1224_remove_nf_comissoes_laudo.sql',
    version: 1224,
    label: '1224 remove_nf_comissoes_laudo',
  },
  {
    file: '1225_drop_percentual_vendedor_leads_vinculos.sql',
    version: 1225,
    label: '1225 drop_percentual_vendedor_leads_vinculos',
  },
  {
    file: '1226_fix_constraint_comercial_pf.sql',
    version: 1226,
    label: '1226 fix_constraint_comercial_pf',
  },
  {
    file: '1227_remove_codigo_representante_vendedor.sql',
    version: 1227,
    label: '1227 remove_codigo_representante_vendedor',
  },
  {
    file: '1228_backfill_asaas_net_value.sql',
    version: 1228,
    label: '1228 backfill_asaas_net_value',
  },
  {
    file: '1229_cpf_unico_sistema_trigger.sql',
    version: 1229,
    label: '1229 cpf_unico_sistema_trigger',
  },
  {
    file: '1230_configuracoes_gateway.sql',
    version: null,
    label: '1230a configuracoes_gateway (sem registro bigint)',
  },
  {
    file: '1230_fix_prevent_modification_allow_finalizacao.sql',
    version: null,
    label:
      '1230b fix_prevent_modification_allow_finalizacao (sem registro bigint)',
  },
  {
    file: '1231_fix_taxa_transacao.sql',
    version: null,
    label: '1231a fix_taxa_transacao (sem registro bigint)',
  },
  {
    file: '1231_fix_prevent_lote_mutation_trigger.sql',
    version: null,
    label: '1231b fix_prevent_lote_mutation_trigger (sem registro bigint)',
  },
  {
    file: '1232_fix_audit_lote_change_user_cpf_fallback.sql',
    version: 1232,
    label: '1232 fix_audit_lote_change_user_cpf_fallback',
  },
  {
    file: '1233_remove_comercial_comissoes.sql',
    version: 1233,
    label: '1233 remove_comercial_comissoes',
  },
  {
    file: '1234_nivel_cargo_segregado_por_empresa_view.sql',
    version: 1234,
    label: '1234 nivel_cargo_segregado_por_empresa_view',
  },
];

async function getAppliedVersions(client) {
  try {
    const r = await client.query(
      'SELECT version::text AS v FROM schema_migrations'
    );
    return new Set(r.rows.map((row) => row.v));
  } catch {
    return new Set();
  }
}

async function applyMigration(dbUrl, sql, version) {
  // Nova conexão por migration para evitar contaminação de estado transacional
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("SET app.current_user_cpf = '00000000000'");
    await client.query(sql);
    if (version) {
      await client.query(
        'INSERT INTO schema_migrations (version, dirty) VALUES ($1::bigint, false) ON CONFLICT (version) DO NOTHING',
        [version]
      );
    }
    return { ok: true };
  } catch (e) {
    // Tentar ROLLBACK para limpar estado antes de fechar
    try {
      await client.query('ROLLBACK');
    } catch {}
    return { ok: false, message: e.message || String(e) };
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function applyToDb(dbName) {
  const dbUrl = baseUrl.replace(/nr-bps_db(_test)?$/, dbName);

  // Conexão dedicada apenas para ler schema_migrations
  const infoClient = new Client({ connectionString: dbUrl });
  await infoClient.connect();
  const applied = await getAppliedVersions(infoClient);
  await infoClient.end();

  console.log('\n=== Aplicando em: ' + dbName + ' ===');
  console.log(
    '[INFO] Versões já registradas no schema_migrations:',
    [...applied].sort((a, b) => Number(a) - Number(b)).join(', ') || '(nenhuma)'
  );

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const migration of MIGRATIONS) {
    const { file, version, label } = migration;

    // Pular se já registrada
    if (version && applied.has(String(version))) {
      console.log('[SKIP] ' + label + ' (já registrada em schema_migrations)');
      skipped++;
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log('[SKIP] ' + label + ' (arquivo não encontrado)');
      skipped++;
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    process.stdout.write('[APPLY] ' + label + '... ');

    const result = await applyMigration(dbUrl, sql, version);

    if (result.ok) {
      console.log('OK');
      ok++;
    } else {
      const msg = result.message || '';
      const isIdempotent =
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('já existe') ||
        msg.includes('ja existe') ||
        (msg.includes('column') && msg.includes('of relation'));

      if (isIdempotent) {
        // Para versões numéricas: registrar mesmo se "já existe"
        if (version) {
          const regClient = new Client({ connectionString: dbUrl });
          try {
            await regClient.connect();
            await regClient.query(
              'INSERT INTO schema_migrations (version, dirty) VALUES ($1::bigint, false) ON CONFLICT (version) DO NOTHING',
              [version]
            );
          } catch {
          } finally {
            try {
              await regClient.end();
            } catch {}
          }
        }
        console.log('WARN (idempotente — estrutura já existe)');
        skipped++;
      } else {
        console.log('ERRO');
        console.error('  [DETALHE]', msg.split('\n')[0]);
        errors++;
      }
    }
  }

  console.log(
    `\n[RESULTADO ${dbName}] OK: ${ok} | SKIPPED: ${skipped} | ERROS: ${errors}`
  );
  if (errors > 0) {
    console.error('[FALHA] ' + errors + ' migration(s) com erro em ' + dbName);
  } else {
    console.log('[SUCESSO] Todas as migrations aplicadas em ' + dbName);
  }
  return errors;
}

(async () => {
  let totalErrors = 0;
  for (const db of ['nr-bps_db', 'nr-bps_db_test']) {
    const errs = await applyToDb(db);
    totalErrors += errs;
  }
  if (totalErrors > 0) {
    console.error(
      '\n[FATAL] ' + totalErrors + ' erro(s) total. Verifique acima.'
    );
    process.exit(1);
  } else {
    console.log(
      '\n[OK] Migrations 1210-1234 aplicadas com sucesso em DEV e TEST.'
    );
  }
})();
