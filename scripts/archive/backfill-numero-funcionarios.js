import { query } from '../lib/db.js';

(async () => {
  try {
    console.log(
      '[BACKFILL] Iniciando backfill de numero_funcionarios_estimado...'
    );

    const candidatesRes = await query(
      'SELECT id FROM tomadors WHERE numero_funcionarios_estimado IS NULL'
    );

    const ids = candidatesRes.rows.map((r) => r.id);
    console.log(`[BACKFILL] Encontrados ${ids.length} tomadors candidatos`);

    let updated = 0;
    const skipped = [];

    for (const id of ids) {
      // Buscar numero_funcionarios do contrato mais recente
      const contratoRes = await query(
        `SELECT numero_funcionarios FROM contratos WHERE tomador_id = $1 ORDER BY criado_em DESC NULLS LAST, id DESC LIMIT 1`,
        [id]
      );

      const cpRes = await query(
        `SELECT numero_funcionarios_estimado FROM contratos_planos WHERE tomador_id = $1 ORDER BY created_at DESC NULLS LAST, id DESC LIMIT 1`,
        [id]
      );

      let valor = null;
      if (contratoRes.rows[0] && contratoRes.rows[0].numero_funcionarios) {
        const n = parseInt(String(contratoRes.rows[0].numero_funcionarios), 10);
        if (!isNaN(n) && n > 0) valor = n;
      }

      if (
        valor == null &&
        cpRes.rows[0] &&
        cpRes.rows[0].numero_funcionarios_estimado
      ) {
        const n = parseInt(
          String(cpRes.rows[0].numero_funcionarios_estimado),
          10
        );
        if (!isNaN(n) && n > 0) valor = n;
      }

      if (valor != null) {
        await query(
          `UPDATE tomadors SET numero_funcionarios_estimado = $1 WHERE id = $2`,
          [valor, id]
        );
        updated++;
        console.log(`[BACKFILL] Updated tomador ${id} => ${valor}`);
      } else {
        skipped.push(id);
      }
    }

    console.log(
      `[BACKFILL] Concluído. Atualizados: ${updated}. Pulados (sem fonte): ${skipped.length}`
    );
    if (skipped.length > 0)
      console.log('[BACKFILL] IDs pulados:', skipped.join(', '));

    process.exit(0);
  } catch (err) {
    console.error('[BACKFILL] Erro durante backfill:', err);
    process.exit(1);
  }
})();
