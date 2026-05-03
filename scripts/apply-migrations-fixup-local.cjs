#!/usr/bin/env node
// Script: apply-migrations-fixup-local.cjs
// Aplica correções pontuais para migrações que falharam no script principal:
//   1. 1211 (view v_solicitacoes_emissao) — sem r.codigo que já não existe
//   2. 1230b (fix_prevent_modification_allow_finalizacao) — sem \echo que quebra pg client
//   3. Registra versões faltantes no schema_migrations

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

// ── 1211: VIEW v_solicitacoes_emissao sem r.codigo ───────────────────────────
// (r.codigo foi removido por migração anterior ao 1210/1211 ter sido aplicado em DEV)
const VIEW_1211_SQL = `
DROP VIEW IF EXISTS public.v_solicitacoes_emissao;
CREATE VIEW public.v_solicitacoes_emissao AS
 SELECT la.id AS lote_id,
    la.status_pagamento,
    la.solicitacao_emissao_em,
    la.valor_por_funcionario,
    la.link_pagamento_token,
    la.link_pagamento_enviado_em,
    la.pagamento_metodo,
    la.pagamento_parcelas,
    la.pago_em,
    e.nome AS empresa_nome,
    COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    count(a.id) AS num_avaliacoes_concluidas,
    COALESCE(la.valor_por_funcionario, lr.valor_negociado, vc.valor_negociado) * count(a.id)::numeric AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status,
    l.id AS laudo_id,
    l.status AS laudo_status,
    l.hash_pdf IS NOT NULL AS laudo_tem_hash,
    l.emitido_em AS laudo_emitido_em,
    l.enviado_em AS laudo_enviado_em,
    CASE
        WHEN l.id IS NOT NULL AND (l.status::text = 'emitido'::text OR l.status::text = 'enviado'::text) THEN true
        ELSE false
    END AS laudo_ja_emitido,
    CASE
        WHEN c.id IS NOT NULL THEN 'rh'::text
        WHEN la.entidade_id IS NOT NULL THEN 'gestor'::text
        ELSE 'desconhecido'::text
    END AS tipo_solicitante,
    c.id AS clinica_id,
    c.nome AS clinica_nome,
    COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
    e.id AS empresa_id,
    vc.id AS vinculo_id,
    r.id AS representante_id,
    r.nome AS representante_nome,
    NULL::text AS representante_codigo,
    r.tipo_pessoa AS representante_tipo_pessoa,
    r.percentual_comissao AS representante_percentual_comissao,
    r.percentual_comissao_comercial AS representante_percentual_comissao_comercial,
    r.modelo_comissionamento,
    (EXISTS ( SELECT 1
           FROM comissoes_laudo cl
          WHERE cl.lote_pagamento_id = la.id)) AS comissao_gerada,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE cl.lote_pagamento_id = la.id))::integer AS comissoes_geradas_count,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE cl.lote_pagamento_id = la.id AND cl.parcela_confirmada_em IS NOT NULL))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado,
    lr.valor_custo_fixo_snapshot,
    vc.valor_negociado AS valor_negociado_vinculo
   FROM lotes_avaliacao la
     LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
     LEFT JOIN clinicas c ON c.id = la.clinica_id
     LEFT JOIN entidades ent ON ent.id = la.entidade_id
     LEFT JOIN usuarios u ON u.cpf::bpchar = la.liberado_por
     LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status::text = 'concluida'::text
     LEFT JOIN laudos l ON l.lote_id = la.id
     LEFT JOIN vinculos_comissao vc ON (vc.status = ANY (ARRAY['ativo'::status_vinculo, 'inativo'::status_vinculo])) AND vc.data_expiracao > CURRENT_DATE AND (COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id) OR COALESCE(la.entidade_id, c.entidade_id) IS NULL AND la.clinica_id IS NOT NULL AND vc.clinica_id = la.clinica_id)
     LEFT JOIN representantes r ON r.id = vc.representante_id
     LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
  WHERE la.status_pagamento IS NOT NULL
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id, r.id, r.nome, r.tipo_pessoa, r.percentual_comissao, r.percentual_comissao_comercial, r.modelo_comissionamento, lr.valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW public.v_solicitacoes_emissao IS 'View para admin gerenciar solicitações de emissão. valor_total_calculado usa COALESCE(valor_por_funcionario, lead_valor_negociado, valor_negociado_vinculo). representante_codigo sempre NULL (campo removido em 1227).';
`;

// ── 1230b: função sem \echo ────────────────────────────────────────────────
const SQL_1230B_FILE = path.join(
  __dirname,
  '../database/migrations/1230_fix_prevent_modification_allow_finalizacao.sql'
);
const SQL_1230B_RAW = fs.existsSync(SQL_1230B_FILE)
  ? fs.readFileSync(SQL_1230B_FILE, 'utf8')
  : '';
// Remover linhas \echo (psql meta-command, falha no pg client)
const SQL_1230B = SQL_1230B_RAW.split('\n')
  .filter((line) => !line.trim().startsWith('\\echo'))
  .join('\n');

// ── Versões para registrar ─────────────────────────────────────────────────
const VERSIONS_TO_REGISTER = [1210, 1211, 1217, 1227];

async function applyOne(dbUrl, label, sql, versionsToRegister) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("SET app.current_user_cpf = '00000000000'");
    await client.query(sql);
    if (versionsToRegister.length > 0) {
      const values = versionsToRegister.map((v) => `(${v})`).join(',');
      await client.query(
        `INSERT INTO schema_migrations (version, dirty) VALUES ${versionsToRegister.map((_, i) => `($${i + 1}::bigint, false)`).join(',')} ON CONFLICT (version) DO NOTHING`,
        versionsToRegister
      );
    }
    console.log(`[OK] ${label}`);
    return true;
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error(`[ERRO] ${label}: ${e.message.split('\n')[0]}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function runForDb(dbName) {
  const dbUrl = baseUrl.replace(/nr-bps_db(_test)?$/, dbName);
  console.log(`\n=== Fixup em: ${dbName} ===`);
  let errors = 0;

  // 1. View 1211 corrigida
  const ok1 = await applyOne(
    dbUrl,
    '1211 view v_solicitacoes_emissao (sem r.codigo)',
    VIEW_1211_SQL,
    [1210, 1211]
  );
  if (!ok1) errors++;

  // 2. 1230b sem \echo
  if (SQL_1230B) {
    const ok2 = await applyOne(
      dbUrl,
      '1230b fix_prevent_modification_allow_finalizacao (sem \\echo)',
      SQL_1230B,
      []
    );
    if (!ok2) errors++;
  }

  // 3. Registrar versões 1217, 1227 (migrações idempotentes - colunas já removidas)
  const regClient = new Client({ connectionString: dbUrl });
  try {
    await regClient.connect();
    await regClient.query(
      'INSERT INTO schema_migrations (version, dirty) VALUES ($1::bigint, false), ($2::bigint, false) ON CONFLICT (version) DO NOTHING',
      [1217, 1227]
    );
    console.log(
      '[OK] Versões 1217, 1227 registradas (colunas já removidas anteriormente)'
    );
  } catch (e) {
    console.error(
      '[AVISO] schema_migrations register:',
      e.message.split('\n')[0]
    );
  } finally {
    try {
      await regClient.end();
    } catch {}
  }

  if (errors === 0) {
    console.log(`[SUCESSO] ${dbName} atualizado.`);
  } else {
    console.error(`[FALHA] ${errors} erro(s) em ${dbName}`);
  }
  return errors;
}

(async () => {
  let total = 0;
  for (const db of ['nr-bps_db', 'nr-bps_db_test']) {
    total += await runForDb(db);
  }
  if (total > 0) {
    console.error(`\n[FATAL] ${total} erro(s) total.`);
    process.exit(1);
  } else {
    console.log('\n[OK] Fixup concluído com sucesso.');
  }
})();
