import { query } from '../lib/db.js';

(async () => {
  try {
    console.log(
      '[BACKFILL-VALOR-PAGO] Iniciando backfill de contratos_planos.valor_pago...'
    );

    const res = await query(
      `SELECT cp.id, cp.contratante_id, cp.plano_id, cp.valor_personalizado_por_funcionario, cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual
       FROM contratos_planos cp
       WHERE cp.valor_pago IS NULL`
    );

    const rows = res.rows;
    console.log(
      `[BACKFILL-VALOR-PAGO] Encontrados ${rows.length} contratos_planos sem valor_pago`
    );

    let updated = 0;
    const skipped = [];

    for (const r of rows) {
      const cpId = r.id;
      const contratanteId = r.contratante_id;

      // Obter contratante para fallback de numero_funcionarios_estimado
      const ct = await query(
        'SELECT numero_funcionarios_estimado FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      const ctNum = ct.rows[0]?.numero_funcionarios_estimado ?? null;

      const num =
        r.numero_funcionarios_estimado ??
        r.numero_funcionarios_atual ??
        ctNum ??
        0;

      // Buscar dados do plano
      const planoRes = await query(
        'SELECT tipo, valor_por_funcionario, valor_fixo_anual FROM planos WHERE id = $1',
        [r.plano_id]
      );
      const plano = planoRes.rows[0] || {};

      let unit = null;

      if (r.valor_personalizado_por_funcionario != null) {
        unit = parseFloat(String(r.valor_personalizado_por_funcionario));
      } else if (plano.valor_por_funcionario != null) {
        unit = parseFloat(String(plano.valor_por_funcionario));
      } else {
        // fallback seguro: usar R$20 por funcionário
        unit = 20.0;
      }

      const numeroFuncionarios = Number(num) || 0;

      if (numeroFuncionarios <= 0) {
        skipped.push({ id: cpId, reason: 'numero_funcionarios 0 or null' });
        continue;
      }

      const valor = Number((unit * numeroFuncionarios).toFixed(2));

      await query('UPDATE contratos_planos SET valor_pago = $1 WHERE id = $2', [
        valor,
        cpId,
      ]);
      updated++;
      console.log(
        `[BACKFILL-VALOR-PAGO] contrato_plano ${cpId} => numero=${numeroFuncionarios}, unit=${unit} => valor_pago=${valor}`
      );
    }

    console.log(
      `[BACKFILL-VALOR-PAGO] Concluído. Atualizados: ${updated}. Pulados: ${skipped.length}`
    );
    if (skipped.length > 0)
      console.log('[BACKFILL-VALOR-PAGO] Pulados:', skipped.slice(0, 20));

    process.exit(0);
  } catch (err) {
    console.error('[BACKFILL-VALOR-PAGO] Erro:', err);
    process.exit(1);
  }
})();
