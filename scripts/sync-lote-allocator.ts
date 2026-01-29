#!/usr/bin/env -S node --loader ts-node/esm

/**
 * scripts/sync-lote-allocator.ts
 * - Verifica o estado do lote_id_allocator e (opcionalmente) sincroniza last_id
 * - Uso:
 *    pnpm tsx scripts/sync-lote-allocator.ts         -> mostra status (não modifica)
 *    pnpm tsx scripts/sync-lote-allocator.ts --fix   -> atualiza last_id = MAX(id) de lotes_avaliacao
 *
 * IMPORTANTE: rodar com cuidado em produção. Se houver lotes com id > 0, só sincronizamos para o MAX(id).
 */

import { query } from '@/lib/db';

async function main() {
  const shouldFix = process.argv.includes('--fix');
  const nextArgIndex = process.argv.indexOf('--next');
  const force = process.argv.includes('--force');
  let requestedNext: number | null = null;
  if (nextArgIndex !== -1) {
    const val = process.argv[nextArgIndex + 1];
    if (val && !isNaN(Number(val))) {
      requestedNext = Math.max(1, Math.floor(Number(val)));
    }
  }

  console.log(
    '[sync-lote-allocator] Iniciando verificação do alocador de IDs de lotes...'
  );

  const allocatorRes = await query('SELECT * FROM lote_id_allocator LIMIT 1');
  const allocatorRow = allocatorRes.rows[0] || null;

  const maxLoteRes = await query(
    'SELECT COALESCE(MAX(id), 0) as max_id FROM lotes_avaliacao'
  );
  const maxId = parseInt(maxLoteRes.rows[0].max_id || '0');

  console.log('[sync-lote-allocator] max id atual em lotes_avaliacao:', maxId);

  if (!allocatorRow) {
    console.warn(
      '[sync-lote-allocator] Não existe registro em lote_id_allocator. Pode ser que a migração não tenha sido aplicada.'
    );
    console.log(
      'Sugestão: executar a migração \'085_lote_id_allocator.sql\' ou criar registro inicial com "INSERT INTO lote_id_allocator(last_id) VALUES(<max_id>)".'
    );
    return;
  }

  const lastId = parseInt(String(allocatorRow.last_id || '0'));
  console.log(
    '[sync-lote-allocator] registro atual em lote_id_allocator.last_id =',
    lastId
  );

  // Se foi pedido um next específico, validar
  if (requestedNext !== null) {
    console.log(
      '[sync-lote-allocator] Pedido para ajustar próximo ID para:',
      requestedNext,
      ' (last_id desejado será',
      requestedNext - 1,
      ')'
    );

    if (requestedNext <= maxId) {
      console.warn(
        '[sync-lote-allocator] AVISO: requestedNext <= MAX(id) — isso pode causar colisões se houver lotes existentes com id >= requestedNext.'
      );
      if (!force) {
        console.log('Use --force para aplicar mesmo assim. Aborting.');
        return;
      }
      console.log(
        '[sync-lote-allocator] --force fornecido; procedendo com a atualização mesmo com risco de colisões.'
      );
    }

    // Aplicar alteração
    const desiredLast = Math.max(0, requestedNext - 1);
    try {
      await query('BEGIN');
      await query('UPDATE lote_id_allocator SET last_id = $1', [desiredLast]);
      try {
        await query("SELECT setval('laudos_id_seq', $1, true)", [desiredLast]);
        console.log(
          '[sync-lote-allocator] Sequência laudos_id_seq sincronizada para',
          desiredLast
        );
      } catch (e) {
        console.warn(
          '[sync-lote-allocator] Não foi possível atualizar laudos_id_seq (pode não existir) — continuando'
        );
      }
      await query('COMMIT');
      console.log(
        '[sync-lote-allocator] ✅ last_id atualizado para',
        desiredLast,
        '(próximo ID será',
        desiredLast + 1,
        ')'
      );
    } catch (err) {
      console.error(
        '[sync-lote-allocator] Erro ao aplicar atualização solicitada, fazendo ROLLBACK:',
        err
      );
      try {
        await query('ROLLBACK');
      } catch (rbErr) {
        console.error('[sync-lote-allocator] ROLLBACK falhou:', rbErr);
      }
    }

    return;
  }

  if (lastId === maxId) {
    console.log(
      '[sync-lote-allocator] ✅ Alocador já sincronizado com MAX(id) de lotes_avaliacao — nenhuma ação necessária.'
    );
    return;
  }

  if (lastId < maxId) {
    console.log(
      '[sync-lote-allocator] ⚠️ Alocador behind: last_id < MAX(id). Isso pode causar conflitos ao reservar novos ids.'
    );
  } else {
    console.log(
      '[sync-lote-allocator] ⚠️ Alocador ahead: last_id > MAX(id). Isso significa que próximos IDs alocados serão maiores que o máximo atual (provavelmente causa do salto observado).'
    );
  }

  console.log('\nResumo:');
  console.log('  MAX(id) em lotes_avaliacao :', maxId);
  console.log('  last_id em lote_id_allocator :', lastId);

  if (!shouldFix) {
    console.log(
      '\nExecutar com `--fix` para sincronizar: `UPDATE lote_id_allocator SET last_id = <maxId>` (opera em transação).'
    );
    return;
  }

  console.log(
    '\nAplicando correção: atualizando lote_id_allocator.last_id para',
    maxId
  );

  try {
    await query('BEGIN');
    await query('UPDATE lote_id_allocator SET last_id = $1', [maxId]);
    // Garantir sequences sincronizadas para laudos também (compatibilidade)
    try {
      await query("SELECT setval('laudos_id_seq', $1, true)", [maxId]);
      console.log(
        '[sync-lote-allocator] Sequência laudos_id_seq sincronizada para',
        maxId
      );
    } catch (e) {
      console.warn(
        '[sync-lote-allocator] Não foi possível atualizar laudos_id_seq (pode não existir) — continuando'
      );
    }
    await query('COMMIT');
    console.log('[sync-lote-allocator] ✅ Correção aplicada com sucesso.');
  } catch (err) {
    console.error(
      '[sync-lote-allocator] Erro ao aplicar correção, fazendo ROLLBACK:',
      err
    );
    try {
      await query('ROLLBACK');
    } catch (rbErr) {
      console.error('[sync-lote-allocator] ROLLBACK falhou:', rbErr);
    }
  }
}

main().catch((err) => {
  console.error('[sync-lote-allocator] Erro inesperado:', err);
  process.exit(1);
});
