// Script: _drop-obsolete-structures.cjs
// Remove funções/tabelas/views obsoletas de STAGING e PROD para alinhar com DEV
//
// Uso:
//   node scripts/_drop-obsolete-structures.cjs --env=staging
//   node scripts/_drop-obsolete-structures.cjs --env=prod
//   node scripts/_drop-obsolete-structures.cjs --env=both

const { Client } = require('pg');

const STAGING_URL = 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require';
const PROD_URL = 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require';

// Funções obsoletas que existem em STAGING/PROD mas não em DEV
const OBSOLETE_FUNCTIONS = [
  'calcular_elegibilidade_lote_contratante',
  'criar_conta_responsavel_personalizado',
  'executar_corte_nf_manual',
  'fn_audit_entidades_senhas',
  'fn_limpar_tokens_expirados',
  'fn_marcar_token_usado',
  'fn_validar_status_avaliacao',
  'fn_verificar_senha_gestor',
  'fn_verificar_senha_rh',
  'fn_verificar_senha_usuario',
  'limpar_indice_ao_deletar_avaliacao',
  'notificar_pre_cadastro_criado',
  'notificar_valor_definido',
  'sync_contratacao_status_to_contratante',
  'tomadores_sync_status_ativa',
  'trg_recalc_lote_on_avaliacao_change',
  'validar_transicao_status_contratante',
];

// Funções adicionais que só existem em PROD (além das 17 de STAGING)
const PROD_ONLY_OBSOLETE_FUNCTIONS = [
  'detectar_anomalia_score',
  'detectar_anomalias_indice',
  'gerar_codigo_representante',
  'trg_gerar_codigo_representante',
];

// Estruturas obsoletas só em PROD
const PROD_ONLY_CLEANUP = [
  { type: 'TABLE',   name: 'ciclos_comissao',    safeCheck: "SELECT COUNT(*) FROM ciclos_comissao" },
  { type: 'VIEW',    name: 'v_auditoria_emissoes' },
  { type: 'TABLE',   name: '_prisma_migrations' },   // _prisma_migrations existe em STAGING e PROD
];

// Indexes obsoletos em PROD (vêm juntos com as colunas dropadas, mas verificar por segurança)
const PROD_ONLY_OBSOLETE_INDEXES = [
  'idx_hierarquia_comercial_vendedor_ativo_unico',
  'idx_representantes_codigo',
  'representantes_codigo_key',
  'idx_vendedores_perfil_codigo',
  'vendedores_perfil_codigo_key',
  'idx_comissoes_laudo_lote_parcela_beneficiario',
];

// Indexes que DEV tem mas PROD não (criar em PROD)
const MISSING_INDEXES = [
  { name: 'idx_comissoes_laudo_asaas_payment',       sql: "CREATE INDEX IF NOT EXISTS idx_comissoes_laudo_asaas_payment ON comissoes_laudo(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL" },
  { name: 'idx_hierarquia_comercial_comercial_id',   sql: "CREATE INDEX IF NOT EXISTS idx_hierarquia_comercial_comercial_id ON hierarquia_comercial(comercial_id)" },
  { name: 'idx_laudos_zapsign_doc_token',            sql: "CREATE INDEX IF NOT EXISTS idx_laudos_zapsign_doc_token ON laudos(zapsign_doc_token) WHERE zapsign_doc_token IS NOT NULL" },
  { name: 'idx_rate_limit_expires_at',               sql: "CREATE INDEX IF NOT EXISTS idx_rate_limit_expires_at ON rate_limit_store(expires_at)" },
  { name: 'idx_representantes_ativo',                sql: "CREATE INDEX IF NOT EXISTS idx_representantes_ativo ON representantes(ativo)" },
  { name: 'idx_representantes_gestor_comercial_cpf', sql: "CREATE INDEX IF NOT EXISTS idx_representantes_gestor_comercial_cpf ON representantes(gestor_comercial_cpf) WHERE gestor_comercial_cpf IS NOT NULL" },
  { name: 'idx_representantes_status_ativo',         sql: "CREATE INDEX IF NOT EXISTS idx_representantes_status_ativo ON representantes(status, ativo)" },
];

async function cleanupEnv(envName, url) {
  console.log('\n' + '='.repeat(60));
  console.log('  Limpeza: ' + envName.toUpperCase());
  console.log('='.repeat(60));

  const c = new Client({ connectionString: url, connectionTimeoutMillis: 30000 });
  await c.connect();

  let ok = 0, skipped = 0, failed = 0;

  // 1. Drop funções obsoletas comuns
  const allObsoleteFunctions = [...OBSOLETE_FUNCTIONS];
  if (envName.toLowerCase() === 'prod') {
    allObsoleteFunctions.push(...PROD_ONLY_OBSOLETE_FUNCTIONS);
  }

  console.log('\n--- Removendo funções obsoletas ---');
  for (const fnName of allObsoleteFunctions) {
    try {
      await c.query('DROP FUNCTION IF EXISTS public.' + fnName + ' CASCADE');
      console.log('✅ DROP FUNCTION ' + fnName);
      ok++;
    } catch (err) {
      console.log('❌ DROP FUNCTION ' + fnName + ': ' + err.message.substring(0, 100));
      failed++;
    }
  }

  // 2. Para PROD: drop estruturas extras
  if (envName.toLowerCase() === 'prod' || envName.toLowerCase() === 'staging') {
    console.log('\n--- Removendo estruturas obsoletas ---');

    // Ciclos_comissao: só PROD (verificar que está vazio)
    if (envName.toLowerCase() === 'prod') {
      try {
        const r = await c.query('SELECT COUNT(*) FROM ciclos_comissao');
        if (parseInt(r.rows[0].count) === 0) {
          await c.query('DROP TABLE IF EXISTS ciclos_comissao CASCADE');
          console.log('✅ DROP TABLE ciclos_comissao (estava vazia)');
          ok++;
        } else {
          console.log('⚠️  SKIP DROP TABLE ciclos_comissao (' + r.rows[0].count + ' linhas — revisar manualmente)');
          skipped++;
        }
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log('⏭  ciclos_comissao: já não existe');
          skipped++;
        } else {
          console.log('❌ DROP TABLE ciclos_comissao: ' + err.message.substring(0, 100));
          failed++;
        }
      }

      // v_auditoria_emissoes view
      try {
        await c.query('DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE');
        console.log('✅ DROP VIEW v_auditoria_emissoes');
        ok++;
      } catch (err) {
        console.log('❌ DROP VIEW v_auditoria_emissoes: ' + err.message.substring(0, 100));
        failed++;
      }

      // Trigger obsoleto
      try {
        await c.query('DROP TRIGGER IF EXISTS trg_representante_codigo ON representantes');
        console.log('✅ DROP TRIGGER trg_representante_codigo');
        ok++;
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log('⏭  trg_representante_codigo: já não existe');
          skipped++;
        } else {
          console.log('❌ DROP TRIGGER trg_representante_codigo: ' + err.message.substring(0, 100));
          failed++;
        }
      }

      // Indexes obsoletos em PROD
      console.log('\n--- Removendo indexes obsoletos ---');
      for (const idx of PROD_ONLY_OBSOLETE_INDEXES) {
        try {
          await c.query('DROP INDEX IF EXISTS public.' + idx + ' CASCADE');
          console.log('✅ DROP INDEX ' + idx);
          ok++;
        } catch (err) {
          console.log('❌ DROP INDEX ' + idx + ': ' + err.message.substring(0, 100));
          failed++;
        }
      }
    }

    // _prisma_migrations: existe em STAGING
    if (envName.toLowerCase() === 'staging') {
      try {
        await c.query('DROP TABLE IF EXISTS _prisma_migrations CASCADE');
        console.log('✅ DROP TABLE _prisma_migrations');
        ok++;
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log('⏭  _prisma_migrations: já não existe');
          skipped++;
        } else {
          console.log('❌ DROP TABLE _prisma_migrations: ' + err.message.substring(0, 100));
          failed++;
        }
      }
    }
  }

  // 3. Criar indexes faltando (em PROD e STAGING para ficar igual ao DEV)
  console.log('\n--- Criando indexes faltando ---');
  for (const idx of MISSING_INDEXES) {
    try {
      await c.query(idx.sql);
      console.log('✅ CREATE INDEX ' + idx.name);
      ok++;
    } catch (err) {
      console.log('❌ CREATE INDEX ' + idx.name + ': ' + err.message.substring(0, 150));
      failed++;
    }
  }

  await c.end();

  console.log('\n─── Resumo Limpeza ' + envName.toUpperCase() + ' ────────────');
  console.log('✅ OK     : ' + ok);
  console.log('⏭  Puladas: ' + skipped);
  console.log('❌ Falhas : ' + failed);

  return failed;
}

async function main() {
  const args = process.argv.slice(2);
  const envArg = (args.find(a => a.startsWith('--env=')) || '--env=both').replace('--env=', '');

  const runStaging = envArg === 'staging' || envArg === 'both';
  const runProd    = envArg === 'prod'    || envArg === 'both';

  let totalFailed = 0;
  if (runStaging) totalFailed += await cleanupEnv('staging', STAGING_URL);
  if (runProd)    totalFailed += await cleanupEnv('prod', PROD_URL);

  if (totalFailed > 0) {
    console.log('\n⚠️  ' + totalFailed + ' operação(ões) falharam.');
    process.exit(1);
  } else {
    console.log('\n✅ Limpeza concluída com sucesso!');
  }
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
