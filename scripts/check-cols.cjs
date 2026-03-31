const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const tables = [
    'lotes_avaliacao',
    'auditoria_laudos',
    'v_fila_emissao',
    'laudos',
  ];
  for (const t of tables) {
    const r = await p.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\n=== ${t} ===`);
    r.rows.forEach((x) => console.log(x.column_name));
  }

  const sample = await p.query(`
    SELECT la.id, la.liberado_em, la.emitido_em, la.enviado_em, la.pago_em, la.status_pagamento,
           la.laudo_enviado_em, la.solicitacao_emissao_em, la.finalizado_em,
           ld.criado_em AS laudo_criado_em, ld.emitido_em AS laudo_emitido_em, ld.enviado_em AS laudo_enviado_em,
           ld.arquivo_remoto_uploaded_at,
           fe.solicitado_em AS fila_solicitado_em
    FROM lotes_avaliacao la
    LEFT JOIN laudos ld ON ld.lote_id = la.id
    LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
    WHERE la.id = 27
    LIMIT 1
  `);
  console.log('\n=== Sample lote 27 ===');
  console.log(sample.rows[0]);

  // Also check empresas_clientes for lote with clinica
  const emp = await p.query(`
    SELECT la.id, la.empresa_id, la.clinica_id, ec.nome AS empresa_nome, c.nome AS clinica_nome
    FROM lotes_avaliacao la
    LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
    LEFT JOIN clinicas c ON c.id = la.clinica_id
    WHERE la.empresa_id IS NOT NULL
    LIMIT 3
  `);
  console.log('\n=== Lotes with empresa ===');
  emp.rows.forEach((x) => console.log(x));

  await p.end();
}
main().catch((e) => {
  console.error(e.message);
  p.end();
});
