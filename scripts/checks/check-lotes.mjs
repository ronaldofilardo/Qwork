import { query } from "./lib/db.ts";

async function checkLotes() {
  try {
    const result = await query(`
      SELECT
        la.id, la.codigo, la.titulo,
        COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_ativas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas,
        l.id as laudo_id, l.status as status_laudo, l.emissor_cpf,
        l.criado_em, l.emitido_em, l.enviado_em
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.id
      WHERE la.codigo IN ('006', '007')
      GROUP BY la.id, la.codigo, la.titulo, l.id, l.status, l.emissor_cpf, l.criado_em, l.emitido_em, l.enviado_em
      ORDER BY la.id
    `);
    console.log("Resultado da análise dos lotes 006 e 007:");
    console.table(result.rows);
  } catch (error) {
    console.error("Erro:", error);
  }
}

checkLotes();
