import { query } from '../lib/db';

async function main() {
  try {
    console.log('[INFO] Running quick check: lotes for contratante_id = 5');
    const res = await query(
      `
      SELECT DISTINCT
        la.id,
        la.tipo,
        la.status,
        la.criado_em,
        la.liberado_em,
        COUNT(DISTINCT a.id) as total_avaliacoes
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      WHERE la.contratante_id = $1
      GROUP BY la.id, la.tipo, la.status, la.criado_em, la.liberado_em
      ORDER BY la.criado_em DESC
    `,
      [5]
    );

    console.log('[RESULT] rows=', res.rowCount);
    console.log(JSON.stringify(res.rows, null, 2));

    const ids = res.rows.map((r: any) => r.id);
    const expected = [7, 8, 9];
    const missing = expected.filter((e) => !ids.includes(e));
    if (missing.length === 0) {
      console.log('[OK] All expected lotes present:', expected);
      process.exit(0);
    } else {
      console.warn('[WARN] Some expected lotes missing:', missing);
      process.exit(2);
    }
  } catch (err) {
    console.error(
      '[ERROR] script failed:',
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

main();
