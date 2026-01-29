#!/usr/bin/env node

// Diagnóstico alternativo que não depende da coluna `laudo_enviado_em`.
// Uso: node scripts/diagnose-lote-alt.cjs <codigoOuId>

const { query } = require('../lib/db');

async function run(arg) {
  const whereById = Number.isFinite(Number(arg));
  try {
    let lote;
    if (whereById) {
      lote = await query(
        'SELECT id, codigo, status, emitido_em, processamento_em, auto_emitir_em, modo_emergencia FROM lotes_avaliacao WHERE id = $1',
        [Number(arg)]
      );
    } else {
      lote = await query(
        'SELECT id, codigo, status, emitido_em, processamento_em, auto_emitir_em, modo_emergencia FROM lotes_avaliacao WHERE codigo = $1',
        [arg]
      );
    }

    if (!lote.rows || lote.rows.length === 0) {
      console.log('Lote não encontrado:', arg);
      return process.exit(2);
    }

    const l = lote.rows[0];
    console.log('\nLote:', l);

    const laudos = await query(
      'SELECT id, status, hash_pdf, emitido_em, enviado_em FROM laudos WHERE lote_id = $1 ORDER BY id DESC',
      [l.id]
    );
    console.log('\nLaudos (últimos):', laudos.rows.slice(0, 5));

    const fila = await query(
      'SELECT id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro FROM fila_emissao WHERE lote_id = $1',
      [l.id]
    );
    console.log('\nFila emissão:', fila.rows);

    const notifs = await query(
      'SELECT id, tipo, mensagem, criado_em FROM notificacoes_admin WHERE lote_id = $1 ORDER BY criado_em DESC LIMIT 10',
      [l.id]
    );
    console.log('\nNotificações admin recentes:', notifs.rows);

    const auditorias = await query(
      `SELECT id, acao, entidade, entidade_id, dados, user_role, criado_em
       FROM audit_logs WHERE (entidade = 'laudos' OR entidade = 'fila_emissao' OR entidade = 'lotes_avaliacao') AND entidade_id = $1 ORDER BY criado_em DESC LIMIT 20`,
      [l.id]
    );
    console.log('\nAudit logs recentes relevantes:', auditorias.rows);

    const emissores = await query(
      "SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' AND ativo = true ORDER BY criado_em DESC"
    );
    console.log('\nEmissores ativos (ex.):', emissores.rows.slice(0, 5));

    const funcs = await query(
      'SELECT count(*) FROM avaliacoes WHERE lote_id = $1',
      [l.id]
    );
    console.log('\nAvaliações no lote (total):', funcs.rows[0].count);

    // Verificar função de reconclusão que criamos
    const fncheck = await query(
      "SELECT proname, pg_get_function_identity_arguments(oid) as args FROM pg_proc WHERE proname = 'fn_reconcluir_lote_for_emergencia'"
    );
    console.log(
      '\nFunção fn_reconcluir_lote_for_emergencia presente:',
      fncheck.rows
    );

    process.exit(0);
  } catch (err) {
    console.error('Erro ao diagnosticar:', err);
    process.exit(1);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.log('Usage: node scripts/diagnose-lote-alt.cjs <loteId|codigo>');
  process.exit(2);
}

run(arg);
