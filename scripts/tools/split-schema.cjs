#!/usr/bin/env node
/**
 * Script para dividir schema_nr-bps_db_test.sql em arquivos modulares por domínio.
 * Execução única: node scripts/split-schema.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(
  __dirname,
  '..',
  'database',
  'schemas',
  'schema_nr-bps_db_test.sql'
);
const DEST = path.join(__dirname, '..', 'database', 'schemas', 'modular');

// Domain assignments – object name → domain file
const DOMAIN = {
  // ── 01-foundation ─────────────────────────────
  '01': {
    file: '01-foundation.sql',
    tables: new Set([
      '_migration_issues',
      'fk_migration_audit',
      'migration_guidelines',
      'policy_expression_backups',
      'audit_logs',
      'audit_access_denied',
      'auditoria',
      'auditoria_geral',
    ]),
    functions: new Set([
      'current_user_cpf',
      'current_user_perfil',
      'current_user_clinica_id',
      'current_user_clinica_id_optional',
      'current_user_entidade_id',
      'current_user_entidade_id_optional',
      'current_user_is_gestor',
      'current_representante_id',
      'is_admin_or_master',
      'is_valid_perfil',
      'user_has_permission',
      'validar_sessao_rls',
      'validate_rh_clinica',
      'gerar_hash_auditoria',
      'safe_drop_policy',
      'validate_policy_table_match',
      'log_access_denied',
      'execute_maintenance',
      'gerar_senha_padrao_cnpj',
      'atualizar_data_modificacao',
      'set_updated_at_column',
      'audit_bypassrls_session',
      'audit_trigger_func',
      'audit_trigger_function',
      'audit_log_with_context',
      'fn_cpf_em_uso',
      'obter_traducao',
      'get_next_contratante_id',
    ]),
    views: new Set(['audit_stats_by_user']),
    sequences: new Set([
      '_migration_issues_id_seq',
      'fk_migration_audit_id_seq',
      'migration_guidelines_id_seq',
      'audit_logs_id_seq',
      'audit_access_denied_id_seq',
      'auditoria_id_seq',
      'auditoria_geral_id_seq',
      'seq_contratantes_id',
    ]),
  },

  // ── 02-identidade ─────────────────────────────
  '02': {
    file: '02-identidade.sql',
    tables: new Set([
      'clinicas',
      'clinicas_empresas',
      'clinicas_senhas',
      'clinica_configuracoes',
      'funcionarios',
      'funcionarios_clinicas',
      'usuarios',
      'mfa_codes',
      'session_logs',
      'permissions',
      'roles',
      'role_permissions',
      'contratantes_senhas',
    ]),
    functions: new Set([
      'validate_funcionario_clinica_empresa',
      'validate_funcionario_clinica_tipo',
      'fn_bloquear_campos_sensiveis_emissor',
      'prevent_gestor_being_emissor',
      'trg_reject_prohibited_roles_func',
      'fn_audit_clinicas_senhas',
      'update_clinicas_senhas_updated_at',
      'update_funcionarios_clinicas_timestamp',
      'update_usuarios_updated_at',
      'registrar_inativacao_funcionario',
      'fn_limpar_senhas_teste',
      'fn_delete_senha_autorizado',
      'atualizar_notificacao_admin_timestamp',
    ]),
    views: new Set(['gestores', 'vw_auditoria_acessos_rh']),
    sequences: new Set([
      'clinicas_id_seq',
      'clinicas_empresas_id_seq',
      'clinicas_senhas_id_seq',
      'clinica_configuracoes_id_seq',
      'funcionarios_id_seq',
      'funcionarios_clinicas_id_seq',
      'usuarios_id_seq',
      'mfa_codes_id_seq',
      'session_logs_id_seq',
      'permissions_id_seq',
      'roles_id_seq',
      'role_permissions_id_seq',
      'contratantes_senhas_id_seq',
    ]),
  },

  // ── 03-entidades-comercial ─────────────────────
  '03': {
    file: '03-entidades-comercial.sql',
    tables: new Set([
      'entidades',
      'entidades_senhas',
      'empresas_clientes',
      'contratantes',
      'planos',
      'contratos',
      'contratos_planos',
      'contratacao_personalizada',
      'representantes',
      'hierarquia_comercial',
      'vinculos_comissao',
      'comissoes_laudo',
      'comissionamento_auditoria',
      'leads_representante',
      'funcionarios_entidades',
      'templates_contrato',
    ]),
    functions: new Set([
      'gerar_codigo_representante',
      'trg_gerar_codigo_representante',
      'sync_entidade_contratante_id',
      'sync_personalizado_status',
      'set_atualizado_em_comissionamento',
      'set_hierarquia_comercial_updated_at',
      'trg_auditar_comissao_status',
      'trg_auditar_representante_status',
      'trg_auditar_vinculo_status',
      'registrar_auditoria_comissionamento',
      'liberar_comissoes_retidas',
      'job_auto_cancelar_comissoes_congeladas',
      'job_encerrar_vinculos_expirados',
      'job_marcar_vinculos_inativos',
      'gerar_token_lead',
      'job_expirar_leads_vencidos',
      'verificar_lead_ativo_por_cnpj',
      'calcular_elegibilidade_lote',
      'calcular_elegibilidade_lote_tomador',
      'obter_config_clinica',
      'calcular_vigencia_fim',
      'validar_parcelas_json',
      'garantir_template_padrao_unico',
      'atualizar_contratacao_personalizada_atualizado_em',
      'criar_usuario_responsavel_apos_aprovacao',
      'gerar_dados_relatorio',
      'get_resultados_por_empresa',
      'update_funcionarios_entidades_timestamp',
      'atualizar_timestamp_configuracoes',
      'executar_corte_nf_manual',
      'validate_funcionario_entidade_tipo',
    ]),
    views: new Set(['tomadores']),
    sequences: new Set([
      'entidades_id_seq',
      'entidades_senhas_id_seq',
      'empresas_clientes_id_seq',
      'contratantes_id_seq',
      'planos_id_seq',
      'contratos_id_seq',
      'contratos_planos_id_seq',
      'contratacao_personalizada_id_seq',
      'representantes_id_seq',
      'hierarquia_comercial_id_seq',
      'vinculos_comissao_id_seq',
      'comissoes_laudo_id_seq',
      'comissionamento_auditoria_id_seq',
      'leads_representante_id_seq',
      'funcionarios_entidades_id_seq',
      'templates_contrato_id_seq',
    ]),
  },

  // ── 04-avaliacoes-laudos ──────────────────────
  '04': {
    file: '04-avaliacoes-laudos.sql',
    tables: new Set([
      'analise_estatistica',
      'avaliacao_resets',
      'avaliacoes',
      'respostas',
      'resultados',
      'questao_condicoes',
      'relatorio_templates',
      'lotes_avaliacao',
      'lote_id_allocator',
      'laudos',
      'auditoria_laudos',
      'laudo_arquivos_remotos',
      'laudo_downloads',
      'laudo_generation_jobs',
      'pdf_jobs',
      'fila_emissao',
      'emissao_queue',
    ]),
    functions: new Set([
      'fn_recalcular_status_lote_on_avaliacao_update',
      'atualizar_ultima_avaliacao_funcionario',
      'audit_laudo_creation',
      'audit_lote_change',
      'audit_lote_status_change',
      'check_laudo_immutability',
      'check_resposta_immutability',
      'check_resultado_immutability',
      'prevent_laudo_lote_id_change',
      'prevent_lote_mutation_during_emission',
      'prevent_lote_status_change_after_emission',
      'prevent_modification_after_emission',
      'prevent_modification_avaliacao_when_lote_emitted',
      'prevent_modification_lote_when_laudo_emitted',
      'prevent_mutation_during_emission',
      'prevent_update_finalized_lote',
      'prevent_update_laudo_enviado',
      'fn_reservar_id_laudo_on_lote_insert',
      'trg_enforce_laudo_id_equals_lote',
      'fn_validar_laudo_emitido',
      'fn_validar_transicao_status_lote',
      'validar_status_avaliacao',
      'fn_registrar_solicitacao_emissao',
      'fn_obter_solicitacao_emissao',
      'fn_relatorio_emissoes_periodo',
      'validar_lote_para_laudo',
      'validar_lote_pre_laudo',
      'upsert_laudo',
      'lote_pode_ser_processado',
      'calcular_valor_total_lote',
      'calcular_hash_pdf',
      'diagnosticar_lote_emissao',
      'detectar_anomalia_score',
      'detectar_anomalias_indice',
      'verificar_inativacao_consecutiva',
      'obter_proximo_numero_ordem',
      'fn_next_lote_id',
      'update_pdf_jobs_timestamp',
      'trigger_criar_pdf_job',
      'set_questao_from_item',
      'fn_buscar_solicitante_laudo',
      'limpar_auditoria_laudos_antiga',
      'refresh_vw_recibos_completos_mat',
    ]),
    views: new Set([
      'v_auditoria_emissoes',
      'v_fila_emissao',
      'v_relatorio_emissoes',
      'vw_auditoria_avaliacoes',
      'vw_empresas_stats',
      'vw_funcionarios_por_lote',
    ]),
    sequences: new Set([
      'analise_estatistica_id_seq',
      'avaliacao_resets_id_seq',
      'avaliacoes_id_seq',
      'respostas_id_seq',
      'resultados_id_seq',
      'questao_condicoes_id_seq',
      'relatorio_templates_id_seq',
      'lotes_avaliacao_id_seq',
      'lote_id_allocator_last_id_seq',
      'laudos_id_seq',
      'auditoria_laudos_id_seq',
      'laudo_arquivos_remotos_id_seq',
      'laudo_downloads_id_seq',
      'laudo_generation_jobs_id_seq',
      'pdf_jobs_id_seq',
      'fila_emissao_id_seq',
      'fila_emissao_id_seq1',
      'emissao_queue_id_seq',
      'lotes_avaliacao_funcionarios_id_seq',
    ]),
  },

  // ── 05-financeiro-notificacoes ─────────────────
  '05': {
    file: '05-financeiro-notificacoes.sql',
    tables: new Set([
      'pagamentos',
      'payment_links',
      'recibos',
      'auditoria_recibos',
      'tokens_retomada_pagamento',
      'notificacoes',
      'notificacoes_admin',
      'notificacoes_traducoes',
      'webhook_logs',
      'logs_admin',
    ]),
    functions: new Set([
      'criar_notificacao_recibo',
      'arquivar_notificacoes_antigas',
      'limpar_notificacoes_resolvidas_antigas',
      'marcar_notificacoes_lidas',
      'notificar_sla_excedido',
      'resolver_notificacao',
      'resolver_notificacoes_por_contexto',
      'gerar_numero_recibo',
      'trigger_gerar_numero_recibo',
      'verificar_integridade_recibo',
      'gerar_token_retomada_pagamento',
      'validar_token_pagamento',
      'audit_status_pagamento_change',
    ]),
    views: new Set([
      'vw_notificacoes_nao_lidas',
      'v_solicitacoes_emissao',
      'vw_recibos_completos_mat',
    ]),
    sequences: new Set([
      'pagamentos_id_seq',
      'payment_links_id_seq',
      'recibos_id_seq',
      'auditoria_recibos_id_seq',
      'tokens_retomada_pagamento_id_seq',
      'notificacoes_id_seq',
      'notificacoes_admin_id_seq',
      'notificacoes_traducoes_id_seq',
      'webhook_logs_id_seq',
      'logs_admin_id_seq',
    ]),
  },
};

// Tables whose RLS/policies/triggers go to each domain
const TABLE_TO_DOMAIN = {};
for (const [domKey, domConf] of Object.entries(DOMAIN)) {
  for (const t of domConf.tables) {
    TABLE_TO_DOMAIN[t] = domKey;
  }
}

// ── Parse pg_dump blocks ────────────────────────
function parseBlocks(sql) {
  // pg_dump outputs blocks separated by:
  // --
  // -- Name: <name>; Type: <TYPE>; Schema: <schema>; Owner: <owner>
  // --
  const blockRe =
    /^--\n-- Name: (.+?); Type: (.+?); Schema: (.+?); Owner: (.+?)\n--\n/gm;
  const blocks = [];
  let lastEnd = 0;
  let match;

  // Collect all block starts
  const starts = [];
  while ((match = blockRe.exec(sql)) !== null) {
    starts.push({
      name: match[1],
      type: match[2],
      schema: match[3],
      owner: match[4],
      start: match.index,
      headerLen: match[0].length,
    });
  }

  // Everything before the first block = preamble (SETs, etc.)
  if (starts.length > 0) {
    blocks.push({
      name: '__preamble__',
      type: 'PREAMBLE',
      text: sql.substring(0, starts[0].start),
    });
  }

  // Build blocks
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].start : sql.length;
    blocks.push({
      name: s.name,
      type: s.type,
      schema: s.schema,
      owner: s.owner,
      text: sql.substring(s.start, end),
    });
  }

  return blocks;
}

// ── Classify a block into a domain ──────────────
function classify(block) {
  const { name, type } = block;
  const typeLower = type.toLowerCase();

  // ACL blocks (GRANT, DEFAULT PRIVILEGES, etc.)
  if (typeLower.includes('acl') || typeLower.includes('default privileges')) {
    return 'acl';
  }

  // Preamble (SET, SCHEMA, EXTENSION)
  if (
    type === 'PREAMBLE' ||
    typeLower === 'schema' ||
    typeLower === 'extension'
  ) {
    return '01';
  }

  // TYPE / ENUM → foundation
  if (typeLower === 'type') {
    return '01';
  }

  // FUNCTION
  if (typeLower === 'function') {
    // Extract function base name (before opening parenthesis)
    const baseName = name.replace(/\(.*$/, '').trim();
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (domConf.functions.has(baseName)) return domKey;
    }
    // fallback: unclassified → 01
    console.warn(`  ⚠ Function not classified: ${baseName} → defaulting to 01`);
    return '01';
  }

  // COMMENT (on FUNCTION, TABLE, etc.) → follow the object it comments
  if (typeLower === 'comment') {
    // pattern: FUNCTION <funcname>(...)
    const funcMatch = name.match(/^FUNCTION\s+(\S+?)(?:\(|$)/i);
    if (funcMatch) {
      const baseName = funcMatch[1].replace(/^public\./, '');
      for (const [domKey, domConf] of Object.entries(DOMAIN)) {
        if (domConf.functions.has(baseName)) return domKey;
      }
      return '01';
    }
    // pattern: TABLE <tablename>
    const tableMatch = name.match(/^TABLE\s+(\S+)/i);
    if (tableMatch) {
      const tbl = tableMatch[1].replace(/^public\./, '');
      return TABLE_TO_DOMAIN[tbl] || '01';
    }
    // pattern: VIEW <viewname>
    const viewMatch = name.match(/^VIEW\s+(\S+)/i);
    if (viewMatch) {
      const vw = viewMatch[1].replace(/^public\./, '');
      for (const [domKey, domConf] of Object.entries(DOMAIN)) {
        if (domConf.views && domConf.views.has(vw)) return domKey;
      }
      return '01';
    }
    // generic: table comments
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (
        domConf.tables.has(name) ||
        (domConf.views && domConf.views.has(name))
      )
        return domKey;
    }
    return '01';
  }

  // TABLE → lookup
  if (typeLower === 'table') {
    const tbl = name.replace(/^public\./, '');
    return TABLE_TO_DOMAIN[tbl] || guessTableDomain(tbl);
  }

  // VIEW / MATERIALIZED VIEW
  if (typeLower === 'view' || typeLower === 'materialized view') {
    const vw = name.replace(/^public\./, '');
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (domConf.views && domConf.views.has(vw)) return domKey;
    }
    console.warn(`  ⚠ View not classified: ${vw} → defaulting to 04`);
    return '04';
  }

  // SEQUENCE → match to table or explicit
  if (typeLower === 'sequence') {
    const seqName = name.replace(/^public\./, '');
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (domConf.sequences && domConf.sequences.has(seqName)) return domKey;
    }
    // Try to match by removing _id_seq / _seq suffix
    const baseTbl = seqName.replace(/_id_seq$|_seq$/, '');
    if (TABLE_TO_DOMAIN[baseTbl]) return TABLE_TO_DOMAIN[baseTbl];
    console.warn(`  ⚠ Sequence not classified: ${seqName} → defaulting to 01`);
    return '01';
  }

  // SEQUENCE OWNED BY → follow table
  if (typeLower === 'sequence owned by') {
    // Name format: <seq_name>  or content references table.column
    const seqName = name.replace(/^public\./, '');
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (domConf.sequences && domConf.sequences.has(seqName)) return domKey;
    }
    const baseTbl = seqName.replace(/_id_seq$|_seq$/, '');
    if (TABLE_TO_DOMAIN[baseTbl]) return TABLE_TO_DOMAIN[baseTbl];
    return '01';
  }

  // DEFAULT (ALTER TABLE ... ALTER COLUMN ... SET DEFAULT)
  if (typeLower === 'default') {
    // name = <table_name> <column>
    const tbl = name.split(/\s+/)[0];
    return TABLE_TO_DOMAIN[tbl] || '01';
  }

  // CONSTRAINT / FK CONSTRAINT
  if (typeLower === 'constraint' || typeLower === 'fk constraint') {
    // name = <constraint_name>; but block text references the table
    const tbl = extractTableFromBlock(block.text);
    return TABLE_TO_DOMAIN[tbl] || '01';
  }

  // INDEX
  if (typeLower === 'index') {
    const tbl = extractTableFromIndex(block.text);
    return TABLE_TO_DOMAIN[tbl] || '01';
  }

  // TRIGGER
  if (typeLower === 'trigger') {
    // block text: CREATE TRIGGER ... ON <table>
    const tbl = extractTableFromTrigger(block.text);
    return TABLE_TO_DOMAIN[tbl] || '01';
  }

  // ROW SECURITY / POLICY
  if (typeLower === 'row security' || typeLower === 'policy') {
    const tbl = extractTableFromPolicy(block.text);
    return TABLE_TO_DOMAIN[tbl] || '01';
  }

  // TABLE DATA → skip (schema only)
  if (typeLower === 'table data') {
    return null; // skip
  }

  // RULE → follow the view/table name
  if (typeLower === 'rule') {
    // Name format: <view_name> _RETURN or similar
    const viewName = name.replace(/\s+_RETURN$/, '').trim();
    for (const [domKey, domConf] of Object.entries(DOMAIN)) {
      if (domConf.views && domConf.views.has(viewName)) return domKey;
    }
    return '01';
  }

  console.warn(
    `  ⚠ Unhandled type: "${type}" name: "${name}" → defaulting to 01`
  );
  return '01';
}

// ── Helper: extract table name from ALTER TABLE in block text
function extractTableFromBlock(text) {
  const m = text.match(/ALTER\s+(?:TABLE\s+)?(?:ONLY\s+)?public\.(\w+)/i);
  return m ? m[1] : null;
}

function extractTableFromIndex(text) {
  const m = text.match(
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+\S+\s+ON\s+public\.(\w+)/i
  );
  return m ? m[1] : null;
}

function extractTableFromTrigger(text) {
  const m = text.match(
    /CREATE\s+TRIGGER\s+\S+\s+(?:BEFORE|AFTER|INSTEAD\s+OF)\s+\S+.*?\s+ON\s+public\.(\w+)/is
  );
  return m ? m[1] : null;
}

function extractTableFromPolicy(text) {
  // ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  let m = text.match(/ALTER\s+TABLE\s+public\.(\w+)\s+ENABLE/i);
  if (m) return m[1];
  // CREATE POLICY ... ON public.<table>
  m = text.match(/CREATE\s+POLICY\s+\S+\s+ON\s+public\.(\w+)/i);
  if (m) return m[1];
  return null;
}

function guessTableDomain(tbl) {
  console.warn(`  ⚠ Table not classified: ${tbl} → defaulting to 01`);
  return '01';
}

// ── Main ────────────────────────────────────────
function main() {
  console.log('Reading source file...');
  const sql = fs.readFileSync(SRC, 'utf-8');
  console.log(`  ${sql.length} bytes, ~${sql.split('\n').length} lines`);

  console.log('Parsing pg_dump blocks...');
  const blocks = parseBlocks(sql);
  console.log(`  ${blocks.length} blocks found`);

  // Buckets: domain key → array of text
  const buckets = { '01': [], '02': [], '03': [], '04': [], '05': [], acl: [] };
  let skipped = 0;

  for (const block of blocks) {
    const dom = classify(block);
    if (dom === null) {
      skipped++;
      continue;
    }
    if (!buckets[dom]) {
      console.warn(
        `  ⚠ Unknown domain "${dom}" for block "${block.name}" — putting in 01`
      );
      buckets['01'].push(block.text);
    } else {
      buckets[dom].push(block.text);
    }
  }

  console.log(
    `Classified: ${Object.entries(buckets)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(', ')}, skipped=${skipped}`
  );

  // Create output directory
  if (!fs.existsSync(DEST)) {
    fs.mkdirSync(DEST, { recursive: true });
    console.log(`Created directory: ${DEST}`);
  }

  // Write files
  const filenames = {
    '01': '01-foundation.sql',
    '02': '02-identidade.sql',
    '03': '03-entidades-comercial.sql',
    '04': '04-avaliacoes-laudos.sql',
    '05': '05-financeiro-notificacoes.sql',
    acl: 'acl.sql',
  };

  const headers = {
    '01': '-- ============================================================================\n-- 01-foundation.sql\n-- Tipos (ENUMs), funções compartilhadas (RLS/session), tabelas de infra/auditoria\n-- ============================================================================\n\n',
    '02': '-- ============================================================================\n-- 02-identidade.sql\n-- Clínicas, funcionários, usuários, autenticação, sessões, RBAC\n-- Depends on: 01-foundation.sql\n-- ============================================================================\n\n',
    '03': '-- ============================================================================\n-- 03-entidades-comercial.sql\n-- Entidades, empresas, contratos, planos, representantes, comissionamento\n-- Depends on: 01-foundation.sql, 02-identidade.sql\n-- ============================================================================\n\n',
    '04': '-- ============================================================================\n-- 04-avaliacoes-laudos.sql\n-- Avaliações, respostas, lotes, laudos, emissão, fila de emissão\n-- Depends on: 01-foundation.sql, 02-identidade.sql, 03-entidades-comercial.sql\n-- ============================================================================\n\n',
    '05': '-- ============================================================================\n-- 05-financeiro-notificacoes.sql\n-- Pagamentos, recibos, notificações, webhooks, logs admin\n-- Depends on: 01 a 04\n-- ============================================================================\n\n',
    acl: '-- ============================================================================\n-- acl.sql\n-- Permissões de acesso (GRANT/REVOKE) para roles do banco de dados\n-- Depends on: todos os arquivos DDL (01-05)\n-- ============================================================================\n\n',
  };

  for (const [domKey, chunks] of Object.entries(buckets)) {
    const fname = filenames[domKey];
    const content = headers[domKey] + chunks.join('\n');
    const dest = path.join(DEST, fname);
    fs.writeFileSync(dest, content, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`  ✅ ${fname}: ${lines} lines, ${content.length} bytes`);
  }

  console.log('\n✅ Schema modularizado com sucesso!');
}

main();
