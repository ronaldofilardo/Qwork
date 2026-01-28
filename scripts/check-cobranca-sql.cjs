const { Client } = require('pg');
const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  'postgres://postgres:123456@localhost:5432/nr-bps_db';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  const cnpj = '41877277000184';

  const sql = `SELECT
    ct.id as contratante_id,
    ct.cnpj,
    pg.id as pagamento_id,
    pg.valor as pagamento_valor,
    COALESCE(cp.valor_pago, pg.valor, (COALESCE(co.numero_funcionarios, cp.numero_funcionarios_estimado, ct.numero_funcionarios_estimado, 0) * CASE WHEN pl.tipo = 'personalizado' THEN COALESCE(co.valor_personalizado, cp.valor_personalizado_por_funcionario, (cp.valor_pago / NULLIF(cp.numero_funcionarios_estimado,0)), 0) ELSE COALESCE(cp.valor_personalizado_por_funcionario, (cp.valor_pago / NULLIF(cp.numero_funcionarios_estimado,0)), COALESCE(pl.valor_por_funcionario, pl.valor_base, pl.preco, 20.00)) END))::numeric as valor_pago
  FROM contratantes ct
  LEFT JOIN LATERAL (
    SELECT c.id, c.plano_id, c.numero_funcionarios, c.valor_personalizado
    FROM contratos c
    WHERE c.contratante_id = ct.id
    ORDER BY c.criado_em DESC NULLS LAST, c.id DESC
    LIMIT 1
  ) co ON true
  LEFT JOIN LATERAL (
    SELECT cp.id, cp.plano_id, cp.valor_personalizado_por_funcionario, cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual, cp.valor_pago
    FROM contratos_planos cp
    WHERE cp.contratante_id = ct.id
    ORDER BY cp.created_at DESC NULLS LAST, cp.id DESC
    LIMIT 1
  ) cp ON true
  LEFT JOIN planos pl ON COALESCE(co.plano_id, ct.plano_id) = pl.id
  LEFT JOIN LATERAL (
    SELECT p.id, p.valor, p.metodo, p.data_pagamento, p.numero_parcelas, p.plataforma_nome, p.detalhes_parcelas, p.status
    FROM pagamentos p
    WHERE p.contratante_id = ct.id
    ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC
    LIMIT 1
  ) pg ON true
  WHERE regexp_replace(ct.cnpj, '[^0-9]', '', 'g') = $1
  `;

  const res = await client.query(sql, [cnpj]);
  console.log('result:', res.rows);

  await client.end();
}

run().catch(console.error);
