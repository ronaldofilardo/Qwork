import { query } from '../lib/db.js';

(async () => {
  try {
    console.log(
      '[BACKFILL-VALOR-PAGO-INSERT] Iniciando backfill/insert de contratos_planos para persistir valor_pago...'
    );

    // Detectar colunas para unit price
    const colRes = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'planos'"
    );
    const cols = colRes.rows.map((r) => r.column_name);

    // montar lista de colunas para selecionar de `planos` com base no que existe
    const planCols = ['pl.id as plano_id', 'pl.tipo as plano_tipo'];
    if (cols.includes('valor_por_funcionario'))
      planCols.push('pl.valor_por_funcionario');
    if (cols.includes('preco')) planCols.push('pl.preco');
    if (cols.includes('valor_base')) planCols.push('pl.valor_base');
    if (cols.includes('valor_fixo_anual')) planCols.push('pl.valor_fixo_anual');
    if (cols.includes('limite_funcionarios'))
      planCols.push('pl.limite_funcionarios');

    const planColsSql = planCols.join(', ');

    // Primeiro, tratar planos personalizados com pagamento registrado (usar pagamento como fonte de verdade)
    const personalCandidates = await query(
      `SELECT ct.id as contratante_id, ct.cnpj, ct.numero_funcionarios_estimado, ct.criado_em,
              cp.id as contrato_plano_id, cp.numero_funcionarios_estimado as cp_numero_estimado, cp.numero_funcionarios_atual as cp_numero_atual, cp.valor_personalizado_por_funcionario, cp.valor_pago as cp_valor_pago,
              ${planColsSql},
              pg.id as pagamento_id, pg.valor as pagamento_valor
       FROM contratantes ct
       LEFT JOIN LATERAL (SELECT cp.* FROM contratos_planos cp WHERE cp.contratante_id = ct.id ORDER BY cp.created_at DESC NULLS LAST, cp.id DESC LIMIT 1) cp ON true
       LEFT JOIN planos pl ON COALESCE(cp.plano_id, ct.plano_id) = pl.id
       LEFT JOIN LATERAL (SELECT p.id, p.valor FROM pagamentos p WHERE p.contratante_id = ct.id ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC LIMIT 1) pg ON true
       WHERE pl.tipo = 'personalizado' AND pg.valor IS NOT NULL
       ORDER BY ct.id`
    );

    // Atualizar/Inserir a partir de pagamentos para personalizados
    for (const r of personalCandidates.rows) {
      const ctId = r.contratante_id;
      const pagamentoVal = r.pagamento_valor ? Number(r.pagamento_valor) : null;
      const numeroEstimado =
        r.cp_numero_estimado ??
        r.numero_funcionarios_estimado ??
        r.cp_numero_atual ??
        0;

      if (!pagamentoVal || numeroEstimado <= 0) {
        continue; // nada a fazer sem número estimado
      }

      const unit = Number((pagamentoVal / Number(numeroEstimado)).toFixed(2));

      if (r.contrato_plano_id) {
        await query(
          'UPDATE contratos_planos SET valor_pago = $1, valor_personalizado_por_funcionario = $2 WHERE id = $3',
          [pagamentoVal, unit, r.contrato_plano_id]
        );
        console.log(
          `[BACKFILL-VALOR-PAGO-INSERT] Atualizado cp ${r.contrato_plano_id} usando pagamento ${pagamentoVal} (unit=${unit})`
        );
        updated++;
      } else {
        // inserir snapshot com valores do pagamento
        const dataContratacao = r.criado_em
          ? new Date(r.criado_em)
          : new Date();
        const dataFim = new Date(dataContratacao);
        dataFim.setDate(dataFim.getDate() + 364);

        const insertSql = `INSERT INTO contratos_planos (
          plano_id, contratante_id, tipo_contratante, valor_personalizado_por_funcionario,
          data_contratacao, data_fim_vigencia, numero_funcionarios_estimado, numero_funcionarios_atual,
          forma_pagamento, numero_parcelas, status, bloqueado, created_at, updated_at, valor_pago
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`;

        const insertedRes = await query(insertSql, [
          r.plano_id || null,
          ctId,
          'entidade',
          unit,
          dataContratacao,
          dataFim,
          numeroEstimado,
          0,
          'anual',
          1,
          'ativo',
          false,
          dataContratacao,
          dataContratacao,
          pagamentoVal,
        ]);

        inserted++;
        console.log(
          `[BACKFILL-VALOR-PAGO-INSERT] Inserido cp id=${insertedRes.rows[0].id} para contratante ${ctId} com valor_pago=${pagamentoVal} (unit=${unit})`
        );
      }
    }

    // Em seguida, tratar os demais (não personalizados) que ainda não têm cp ou cp.valor_pago
    const candidates = await query(
      `SELECT ct.id as contratante_id, ct.cnpj, ct.numero_funcionarios_estimado, ct.criado_em,
              cp.id as contrato_plano_id, cp.numero_funcionarios_estimado as cp_numero_estimado, cp.numero_funcionarios_atual as cp_numero_atual, cp.valor_personalizado_por_funcionario, cp.valor_pago as cp_valor_pago,
              ${planColsSql},
              pg.id as pagamento_id, pg.valor as pagamento_valor
       FROM contratantes ct
       LEFT JOIN LATERAL (SELECT cp.* FROM contratos_planos cp WHERE cp.contratante_id = ct.id ORDER BY cp.created_at DESC NULLS LAST, cp.id DESC LIMIT 1) cp ON true
       LEFT JOIN planos pl ON COALESCE(cp.plano_id, ct.plano_id) = pl.id
       LEFT JOIN LATERAL (SELECT p.id, p.valor FROM pagamentos p WHERE p.contratante_id = ct.id ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC LIMIT 1) pg ON true
       WHERE (cp.id IS NULL OR cp.valor_pago IS NULL) AND (pl.tipo IS NULL OR pl.tipo != 'personalizado')
       ORDER BY ct.id`
    );

    console.log(
      `[BACKFILL-VALOR-PAGO-INSERT] ${candidates.rows.length} candidatos encontrados`
    );

    let inserted = 0;
    let updated = 0;
    const skipped = [];

    for (const r of candidates.rows) {
      const ctId = r.contratante_id;
      const numeroEstimado =
        r.cp_numero_estimado ?? r.numero_funcionarios_estimado ?? 0;
      if (!numeroEstimado || Number(numeroEstimado) <= 0) {
        skipped.push({ id: ctId, reason: 'sem numero estimado' });
        continue;
      }

      // determinar unit price
      let unit = null;
      if (r.valor_personalizado_por_funcionario != null) {
        unit = Number(r.valor_personalizado_por_funcionario);
      } else if (cols.includes('valor_por_funcionario')) {
        // buscar valor_por_funcionario do plano se existir
        const pv = await query(
          'SELECT valor_por_funcionario FROM planos WHERE id = $1',
          [r.plano_id]
        );
        if (pv.rows[0] && pv.rows[0].valor_por_funcionario != null) {
          unit = Number(pv.rows[0].valor_por_funcionario);
        }
      }

      if (unit == null) {
        if (r.valor_fixo_anual != null && r.limite_funcionarios) {
          unit =
            Number(r.valor_fixo_anual) / Number(r.limite_funcionarios || 1);
        } else {
          unit = 20.0;
        }
      }

      const suggested = Number((unit * Number(numeroEstimado)).toFixed(2));

      // preferir suggested se > 0, senão usar pagamento_valor
      const chosenValor =
        suggested > 0
          ? suggested
          : r.pagamento_valor
            ? Number(r.pagamento_valor)
            : null;

      if (!chosenValor) {
        skipped.push({
          id: ctId,
          reason: 'nenhum valor calculado/pg/estimado',
        });
        continue;
      }

      if (r.contrato_plano_id) {
        // update existing
        await query(
          'UPDATE contratos_planos SET valor_pago = $1 WHERE id = $2',
          [chosenValor, r.contrato_plano_id]
        );
        updated++;
        console.log(
          `[BACKFILL-VALOR-PAGO-INSERT] Updated cp ${r.contrato_plano_id} -> valor_pago=${chosenValor}`
        );
      } else {
        // insert minimal contratos_planos snapshot
        // data_fim_vigencia: criado_em + 364 dias
        const dataContratacao = r.criado_em
          ? new Date(r.criado_em)
          : new Date();
        const dataFim = new Date(dataContratacao);
        dataFim.setDate(dataFim.getDate() + 364);

        const insertSql = `INSERT INTO contratos_planos (
          plano_id, contratante_id, tipo_contratante, valor_personalizado_por_funcionario,
          data_contratacao, data_fim_vigencia, numero_funcionarios_estimado, numero_funcionarios_atual,
          forma_pagamento, numero_parcelas, status, bloqueado, created_at, updated_at, valor_pago
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`;

        const insertedRes = await query(insertSql, [
          r.plano_id || null,
          ctId,
          'entidade',
          r.valor_personalizado_por_funcionario || null,
          dataContratacao,
          dataFim,
          numeroEstimado,
          0,
          'anual',
          1,
          'ativo',
          false,
          dataContratacao,
          dataContratacao,
          chosenValor,
        ]);

        inserted++;
        console.log(
          `[BACKFILL-VALOR-PAGO-INSERT] Inserido cp id=${insertedRes.rows[0].id} para contratante ${ctId} com valor_pago=${chosenValor}`
        );
      }
    }

    console.log(
      `[BACKFILL-VALOR-PAGO-INSERT] Concluído. Inseridos: ${inserted}. Atualizados: ${updated}. Pulados: ${skipped.length}`
    );
    if (skipped.length > 0) console.log('Pulados (ex):', skipped.slice(0, 10));

    process.exit(0);
  } catch (err) {
    console.error('[BACKFILL-VALOR-PAGO-INSERT] Erro:', err);
    process.exit(1);
  }
})();
