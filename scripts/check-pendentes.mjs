import { Client } from 'pg';

const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:123456@localhost:5432/nr-bps_db';

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(
      'Conectado a:',
      connectionString.replace(/(password=)[^&\s]+/i, '$1***')
    );

    const sql = `
      SELECT cp.id,
             cp.contratante_id,
             c.nome AS contratante_nome,
             c.cnpj,
             cp.numero_funcionarios_estimado,
             cp.valor_por_funcionario,
             cp.valor_total_estimado,
             cp.payment_link_token,
             cp.payment_link_expiracao,
             cp.status,
             cp.criado_em
      FROM contratacao_personalizada cp
      LEFT JOIN contratantes c ON c.id = cp.contratante_id
      WHERE cp.status IN (
        'aguardando_valor_admin', 'aguardando_aceite_contrato', 'pendente',
        'aguardando_valor', 'valor_definido', 'aguardando_pagamento'
      )
      ORDER BY cp.criado_em DESC;
    `;

    const res = await client.query(sql);
    console.log('Total pendentes:', res.rowCount);
    if (res.rowCount === 0) {
      console.log('Nenhum pré-contrato pendente encontrado.');
    } else {
      console.table(res.rows);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar consulta:', err.message || err);
    try {
      await client.end();
    } catch {}
    process.exit(1);
  }
}

main();
