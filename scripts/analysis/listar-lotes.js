import { query } from "./lib/db.ts";

async function listarLotes() {
  try {
    const result = await query(`
      SELECT
        id,
        codigo,
        titulo,
        status,
        liberado_em,
        criado_em,
        liberado_por
      FROM lotes_avaliacao
      ORDER BY id DESC
      LIMIT 20
    `);

    console.log("=== LOTES NO BANCO DE DADOS ===");
    console.log("Total de lotes:", result.rows.length);
    console.log("");

    result.rows.forEach((lote, index) => {
      console.log(`${index + 1}. Lote ${lote.codigo}`);
      console.log(`   ID: ${lote.id}`);
      console.log(`   Título: ${lote.titulo}`);
      console.log(`   Status: ${lote.status}`);
      console.log(`   Liberado em: ${lote.liberado_em}`);
      console.log(`   Criado em: ${lote.criado_em}`);
      console.log(`   Liberado por: ${lote.liberado_por}`);
      console.log("");
    });
  } catch (error) {
    console.error("Erro ao consultar lotes:", error);
  }
}

listarLotes();
