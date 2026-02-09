import { query } from '../lib/db';

async function debug() {
  try {
    const contrat = await query(
      "SELECT id FROM tomadors WHERE cnpj='55566677000188'"
    );
    console.log('contrat:', contrat.rows);

    const contratId = contrat.rows[0]?.id;
    if (!contratId) return;

    const pagamentos = await query(
      'SELECT id, status, numero_parcelas, criado_em, data_pagamento FROM pagamentos WHERE tomador_id = $1 ORDER BY criado_em DESC',
      [contratId]
    );
    console.log('pagamentos:', pagamentos.rows);

    const pagamentoId = pagamentos.rows[0]?.id;
    if (!pagamentoId) return;

    const recibos = await query(
      'SELECT * FROM recibos WHERE pagamento_id = $1',
      [pagamentoId]
    );
    console.log('recibos:', recibos.rows);
  } catch (err) {
    console.error('debug error', err);
  }
}

debug();
