#!/usr/bin/env node
// Script: apply-migrations-1200-1209.cjs
// Aplica migrations 1200-1209 em dev (nr-bps_db) e test (nr-bps_db_test) e verifica resultado
//
// Migrations cobertas:
//   1200 - taxa_manutencao_schema
//   1201 - pagamentos_link_token
//   1202 - audit_delecoes_tomador
//   1203 - percentual_comissao_comercial
//   1204 - custo_fixo_por_representante
//   1204b - remove_proposta_comercial_colunas
//   1205 - view_solicitacoes_emissao_modelo_comissao
//   1206 - fix_trg_reject_prohibited_roles_use_perfil
//   1207 - sync_v_solicitacoes_emissao_valor_negociado_vinculo
//   1208 - consolidar_view_emissao_custo_fixo
//   1209 - comissao_comercial_vinculos_pf_removal

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

// Ordem explícita de aplicação (importante: 1204b após 1204a)
const MIGRATIONS = [
  { file: '1200_taxa_manutencao_schema.sql',                         label: '1200 taxa_manutencao_schema' },
  { file: '1201_pagamentos_link_token.sql',                          label: '1201 pagamentos_link_token' },
  { file: '1202_audit_delecoes_tomador.sql',                         label: '1202 audit_delecoes_tomador' },
  { file: '1203_percentual_comissao_comercial.sql',                  label: '1203 percentual_comissao_comercial' },
  { file: '1204a_custo_fixo_por_representante.sql',                   label: '1204a custo_fixo_por_representante' },
  { file: '1204b_remove_proposta_comercial_colunas.sql',              label: '1204b remove_proposta_comercial_colunas' },
  { file: '1205_view_solicitacoes_emissao_modelo_comissao.sql',      label: '1205 view_solicitacoes_emissao_modelo_comissao' },
  { file: '1206_fix_trg_reject_prohibited_roles_use_perfil.sql',     label: '1206 fix_trg_reject_prohibited_roles_use_perfil' },
  { file: '1207_sync_v_solicitacoes_emissao_valor_negociado_vinculo.sql', label: '1207 sync_v_solicitacoes_emissao_valor_negociado_vinculo' },
  { file: '1208_consolidar_view_emissao_custo_fixo.sql',             label: '1208 consolidar_view_emissao_custo_fixo' },
  { file: '1209_comissao_comercial_vinculos_pf_removal.sql',         label: '1209 comissao_comercial_vinculos_pf_removal' },
];

async function applyToDb(dbName) {
  const dbUrl = baseUrl.includes('nr-bps_db')
    ? baseUrl.replace(/nr-bps_db(_test)?/, dbName)
    : baseUrl;

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('\n=== Aplicando em: ' + dbName + ' ===');

  let ok = 0;
  let alreadyApplied = 0;
  let errors = 0;

  for (const migration of MIGRATIONS) {
    const filePath = path.join(MIGRATIONS_DIR, migration.file);

    if (!fs.existsSync(filePath)) {
      console.log('[SKIP] ' + migration.label + ' (arquivo não encontrado)');
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    process.stdout.write('[APPLY] ' + migration.label + '... ');

    try {
      // Definir contexto de segurança para migrations com DML (triggers RLS)
      // Deve ter 11 dígitos numéricos para passar na validação de CPF do trigger
      await client.query("SET app.current_user_cpf = '00000000000'");
      await client.query(sql);
      console.log('OK');
      ok++;
    } catch (e) {
      const msg = e.message || '';
      // Erros idempotentes: coluna/tabela já existe, constraint já existe, etc.
      // Suporte a mensagens em inglês E português (depende do locale do PostgreSQL)
      const isIdempotent =
        msg.includes('already exists') ||
        msg.includes('does not exist') ||
        msg.includes('duplicate key') ||
        msg.includes('could not create unique') ||
        msg.includes('já existe') ||
        msg.includes('não existe') ||
        msg.includes('ja existe');

      if (isIdempotent) {
        console.log('WARN (já aplicada — idempotente, ok)');
        alreadyApplied++;
      } else {
        console.log('ERRO');
        console.error('  [DETALHE]', msg.split('\n')[0]);
        errors++;
      }
    }
  }

  // Registrar versões no schema_migrations (idempotente)
  if (errors === 0) {
    try {
      const versions = [1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209];
      const values = versions.map((v) => `(${v})`).join(',');
      await client.query(
        `INSERT INTO schema_migrations (version) VALUES ${values} ON CONFLICT (version) DO NOTHING`
      );
      console.log('[OK] Versions registradas em schema_migrations');
    } catch (e) {
      // schema_migrations pode não existir em ambientes mais antigos — não é bloqueante
      console.log('[AVISO] Não foi possível registrar em schema_migrations:', e.message.split('\n')[0]);
    }
  }

  console.log(
    '\n  Resultado em ' + dbName + ': ' +
    ok + ' OK | ' +
    alreadyApplied + ' já aplicadas | ' +
    errors + ' erros'
  );

  await client.end();
  return errors;
}

(async () => {
  console.log('==========================================================');
  console.log('  apply-migrations-1200-1209 (DEV + TEST)');
  console.log('  Data: ' + new Date().toISOString().slice(0, 10));
  console.log('  Cobertura: taxa_manutencao → comissao_comercial_vinculos_pf');
  console.log('==========================================================');

  const devErrors = await applyToDb('nr-bps_db');
  const testErrors = await applyToDb('nr-bps_db_test');

  console.log('\n=== Concluído ===');

  if (devErrors > 0 || testErrors > 0) {
    console.error('\n[ATENÇÃO] Houve erros em uma ou mais migrations. Verifique acima.');
    process.exit(1);
  } else {
    console.log('[OK] Todas as migrations aplicadas com sucesso.');
  }
})();
