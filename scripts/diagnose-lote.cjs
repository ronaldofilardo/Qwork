#!/usr/bin/env node

// script de diagnóstico para investigar por que um lote concluído não teve o laudo emitido
// Uso: node scripts/diagnose-lote.cjs <codigoOuId>

const { query } = require('../lib/db');

async function run(arg) {
  const whereById = Number.isFinite(Number(arg));
  try {
    let lote;
    if (whereById) {
      lote = await query(
        'SELECT id, codigo, status, emitido_em, laudo_enviado_em, processamento_em, auto_emitir_em FROM lotes_avaliacao WHERE id = $1',
        [Number(arg)]
      );
    } else {
      lote = await query(
        'SELECT id, codigo, status, emitido_em, laudo_enviado_em, processamento_em, auto_emitir_em FROM lotes_avaliacao WHERE codigo = $1',
        [arg]
      );
    }

    if (!lote.rows || lote.rows.length === 0) {
      console.log('Lote não encontrado:', arg);
      return process.exit(2);
    }

    const l = lote.rows[0];
    console.log('Lote:', l);

    const laudos = await query(
      'SELECT id, status, hash_pdf, emitido_em, enviado_em FROM laudos WHERE lote_id = $1',
      [l.id]
    );
    console.log('Laudos:', laudos.rows);

    const fila = await query('SELECT * FROM fila_emissao WHERE lote_id = $1', [
      l.id,
    ]);
    console.log('Fila emissão:', fila.rows);

    const notifs = await query(
      'SELECT id, tipo, mensagem, criado_em FROM notificacoes_admin WHERE lote_id = $1 ORDER BY criado_em DESC LIMIT 10',
      [l.id]
    );
    console.log('Notificações admin recentes:', notifs.rows);

    const auditorias = await query(
      'SELECT * FROM auditoria_laudos WHERE lote_id = $1 ORDER BY criado_em DESC LIMIT 10',
      [l.id]
    );
    console.log('Auditorias laudos:', auditorias.rows);

    const emissores = await query(
      "SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' ORDER BY criado_em DESC"
    );
    console.log('Emissores ativos (todos encontrados):', emissores.rows);

    // Mostrar se há notificacoes do tipo falha_emissao_imediata/erro_critico_emissao/sem_emissor
    const falhas = await query(
      "SELECT id, tipo, mensagem, criado_em FROM notificacoes_admin WHERE lote_id = $1 AND tipo IN ('falha_emissao_imediata','erro_critico_emissao','sem_emissor') ORDER BY criado_em DESC",
      [l.id]
    );
    console.log('Notificações de falha de emissão:', falhas.rows);

    process.exit(0);
  } catch (err) {
    console.error('Erro ao diagnosticar:', err);
    process.exit(1);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.log('Usage: node scripts/diagnose-lote.cjs <loteId|codigo>');
  process.exit(2);
}

run(arg);
