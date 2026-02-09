import { query } from '../lib/db.js';

(async () => {
  try {
    console.log('[REPORT] Gerando relatório de gaps para Valor Pago...');

    // Detectar colunas disponíveis em `planos` para construir expressão segura de unit price
    const colRes = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'planos'"
    );
    const cols = colRes.rows.map((r) => r.column_name);

    let unitExpr = null;
    if (cols.includes('valor_por_funcionario')) {
      unitExpr = `CASE WHEN cp.valor_personalizado_por_funcionario IS NOT NULL THEN cp.valor_personalizado_por_funcionario WHEN pl.valor_por_funcionario IS NOT NULL THEN pl.valor_por_funcionario ELSE 20.00 END`;
    } else if (cols.includes('preco') || cols.includes('valor_base')) {
      const pcol = cols.includes('valor_base')
        ? 'pl.valor_base'
        : cols.includes('preco')
          ? 'pl.preco'
          : null;
      unitExpr = `CASE WHEN cp.valor_personalizado_por_funcionario IS NOT NULL THEN cp.valor_personalizado_por_funcionario WHEN ${pcol} IS NOT NULL THEN ${pcol} ELSE 20.00 END`;
    } else if (cols.includes('valor_fixo_anual')) {
      unitExpr = `CASE WHEN cp.valor_personalizado_por_funcionario IS NOT NULL THEN cp.valor_personalizado_por_funcionario WHEN pl.valor_fixo_anual IS NOT NULL AND pl.limite_funcionarios IS NOT NULL THEN (pl.valor_fixo_anual / GREATEST(pl.limite_funcionarios,1)) ELSE 20.00 END`;
    } else {
      unitExpr = `CASE WHEN cp.valor_personalizado_por_funcionario IS NOT NULL THEN cp.valor_personalizado_por_funcionario ELSE 20.00 END`;
    }

    const sql = `SELECT
      ct.id as tomador_id,
      ct.cnpj,
      ct.numero_funcionarios_estimado,
      cp.id as contrato_plano_id,
      cp.numero_funcionarios_estimado as cp_numero_estimado,
      cp.numero_funcionarios_atual as cp_numero_atual,
      cp.valor_personalizado_por_funcionario,
      cp.valor_pago as cp_valor_pago,
      pl.tipo as plano_tipo,
      pg.id as pagamento_id,
      pg.valor as pagamento_valor,
      (COALESCE(cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual, ct.numero_funcionarios_estimado, 0) * (${unitExpr})) as suggested_valor_pago
    FROM tomadors ct
    LEFT JOIN LATERAL (
      SELECT cp.* FROM contratos_planos cp WHERE cp.tomador_id = ct.id ORDER BY cp.created_at DESC NULLS LAST, cp.id DESC LIMIT 1
    ) cp ON true
    LEFT JOIN planos pl ON COALESCE(cp.plano_id, ct.plano_id) = pl.id
    LEFT JOIN LATERAL (
      SELECT p.id, p.valor FROM pagamentos p WHERE p.tomador_id = ct.id ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC LIMIT 1
    ) pg ON true
    WHERE (cp.id IS NULL OR cp.valor_pago IS NULL)
    ORDER BY ct.id`;

    const res = await query(sql);
    console.log(
      `[REPORT] Encontrados ${res.rows.length} tomadors com gap (sem contrato_plano ou sem cp.valor_pago)`
    );

    // print sample
    if (res.rows.length > 0) {
      console.table(
        res.rows.map((r) => ({
          tomador_id: r.tomador_id,
          cnpj: r.cnpj,
          plano_tipo: r.plano_tipo,
          numero_estimado_tomador: r.numero_funcionarios_estimado,
          cp_id: r.contrato_plano_id,
          cp_numero_estimado: r.cp_numero_estimado,
          cp_numero_atual: r.cp_numero_atual,
          cp_valor_personalizado: r.valor_personalizado_por_funcionario,
          cp_valor_pago: r.cp_valor_pago,
          pagamento_id: r.pagamento_id,
          pagamento_valor: r.pagamento_valor,
          suggested_valor_pago: Number(r.suggested_valor_pago || 0).toFixed(2),
        }))
      );
    }

    process.exit(0);
  } catch (err) {
    console.error('[REPORT] Erro:', err);
    process.exit(1);
  }
})();
