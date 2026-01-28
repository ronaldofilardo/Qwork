#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script para corrigir campos emitido_em e enviado_em em lotes_avaliacao
 * que têm laudos emitidos mas não têm os campos preenchidos
 */
import { query } from '@/lib/db';

async function main() {
  console.log(
    '[FIX] Iniciando correção de campos emitido_em/enviado_em em lotes_avaliacao...'
  );

  try {
    // Buscar lotes que têm laudos emitidos mas campos null
    const lotesParaCorrigir = await query(`
      SELECT DISTINCT
        l.id as lote_id,
        la.id as laudo_id,
        la.emitido_em,
        la.enviado_em
      FROM lotes_avaliacao l
      JOIN laudos la ON la.lote_id = l.id
      WHERE la.emitido_em IS NOT NULL
        AND l.emitido_em IS NULL
      ORDER BY l.id
    `);

    console.log(
      `[FIX] Encontrados ${lotesParaCorrigir.rows.length} lotes para corrigir`
    );

    for (const row of lotesParaCorrigir.rows) {
      console.log(
        `[FIX] Corrigindo lote ${row.lote_id} (laudo ${row.laudo_id})`
      );

      await query(
        `
        UPDATE lotes_avaliacao
        SET emitido_em = $2, enviado_em = $3, processamento_em = NULL
        WHERE id = $1
      `,
        [row.lote_id, row.emitido_em, row.enviado_em]
      );

      console.log(`[FIX] ✓ Lote ${row.lote_id} corrigido`);
    }

    console.log('[FIX] Correção concluída com sucesso!');
  } catch (error) {
    console.error('[FIX] Erro durante correção:', error);
    process.exit(1);
  }
}

main().catch(console.error);
