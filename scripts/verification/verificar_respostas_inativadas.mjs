import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function verificarRespostasInativadas() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log("=== VERIFICANDO RESPOSTAS NAS AVALIAÇÕES INATIVADAS ===\n");

    const result = await pool.query(`
      SELECT
        a.id,
        a.funcionario_cpf,
        f.nome,
        a.status,
        a.lote_id,
        la.numero_ordem,
        la.codigo,
        COUNT(r.id) as total_respostas,
        a.inicio,
        a.envio
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      LEFT JOIN respostas r ON a.id = r.avaliacao_id
      WHERE a.status = 'inativada' AND la.empresa_id = 1
      GROUP BY a.id, a.funcionario_cpf, f.nome, a.status, a.lote_id, la.numero_ordem, la.codigo, a.inicio, a.envio
      ORDER BY la.numero_ordem, f.nome
    `);
    console.table(result.rows);

    // Verificar se há padrão temporal
    console.log("\n=== PADRÃO TEMPORAL DE INATIVAÇÃO ===");
    const temporalResult = await pool.query(`
      SELECT
        DATE(a.inicio) as data_inicio,
        COUNT(*) as total_inativadas,
        COUNT(CASE WHEN r.avaliacao_id IS NOT NULL THEN 1 END) as com_respostas,
        COUNT(CASE WHEN r.avaliacao_id IS NULL THEN 1 END) as sem_respostas
      FROM avaliacoes a
      LEFT JOIN respostas r ON a.id = r.avaliacao_id
      WHERE a.status = 'inativada' AND a.lote_id IN (
        SELECT id FROM lotes_avaliacao WHERE empresa_id = 1
      )
      GROUP BY DATE(a.inicio)
      ORDER BY DATE(a.inicio) DESC
    `);
    console.table(temporalResult.rows);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

verificarRespostasInativadas();
