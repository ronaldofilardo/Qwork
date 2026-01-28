import { query } from '../lib/db.js';

(async () => {
  const cnpj = '02494916000170';
  try {
    const sql = `SELECT
      ct.id as contratante_id,
      ct.cnpj,
      ct.numero_funcionarios_estimado,
      co.id as contrato_id,
      co.numero_funcionarios as contrato_numero_funcionarios,
      co.valor_personalizado as contrato_valor_personalizado,
      pl.tipo as plano_tipo,
      pl.nome as plano_nome,
      pl.valor_por_funcionario,
      pg.id as pagamento_id,
      pg.valor as pagamento_valor
    FROM contratantes ct
    LEFT JOIN LATERAL (
      SELECT c.id, c.plano_id, c.numero_funcionarios, c.valor_personalizado
      FROM contratos c
      WHERE c.contratante_id = ct.id
      ORDER BY c.criado_em DESC NULLS LAST, c.id DESC
      LIMIT 1
    ) co ON true
    LEFT JOIN planos pl ON COALESCE(co.plano_id, ct.plano_id) = pl.id
    LEFT JOIN LATERAL (
      SELECT p.id, p.valor
      FROM pagamentos p
      WHERE p.contratante_id = ct.id
      ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC
      LIMIT 1
    ) pg ON true
    WHERE regexp_replace(ct.cnpj, '[^0-9]', '', 'g') = $1
    LIMIT 10`;

    const res = await query(sql, [cnpj]);
    console.log('rows:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
