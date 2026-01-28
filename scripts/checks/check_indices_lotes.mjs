import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function checkIndicesLotes() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log(
      "=== VERIFICANDO ÍNDICES DOS LOTES (EMPRESA 1, CLÍNICA 1) ===\n"
    );

    // Primeiro, listar todos os lotes
    const lotesResult = await pool.query(`
      SELECT
        id,
        codigo,
        titulo,
        numero_ordem,
        status,
        criado_em
      FROM lotes_avaliacao
      WHERE clinica_id = 1 AND empresa_id = 1
      ORDER BY numero_ordem
    `);

    console.log("LOTES ENCONTRADOS:");
    console.table(lotesResult.rows);

    // Para cada lote, mostrar estatísticas dos índices
    for (const lote of lotesResult.rows) {
      console.log(
        `\n=== LOTE ${lote.numero_ordem} (${lote.codigo}) - ${lote.titulo} ===`
      );

      const indicesResult = await pool.query(
        `
        SELECT
          COUNT(*) as total_funcionarios_ativos,
          COUNT(CASE WHEN indice_avaliacao = 0 THEN 1 END) as novos_sem_avaliacao,
          COUNT(CASE WHEN indice_avaliacao < $1 - 1 THEN 1 END) as atrasados,
          COUNT(CASE WHEN indice_avaliacao = $1 - 1 THEN 1 END) as no_ultimo_lote,
          COUNT(CASE WHEN indice_avaliacao >= $1 THEN 1 END) as adiantados_ou_atual,
          ROUND(AVG(indice_avaliacao), 2) as media_indice,
          MIN(indice_avaliacao) as menor_indice,
          MAX(indice_avaliacao) as maior_indice
        FROM funcionarios
        WHERE empresa_id = 1 AND ativo = true
      `,
        [lote.numero_ordem]
      );

      console.table(indicesResult.rows);

      // Mostrar distribuição detalhada dos índices
      const distribuicaoResult = await pool.query(`
        SELECT
          indice_avaliacao,
          COUNT(*) as quantidade
        FROM funcionarios
        WHERE empresa_id = 1 AND ativo = true
        GROUP BY indice_avaliacao
        ORDER BY indice_avaliacao
      `);

      console.log("DISTRIBUIÇÃO DOS ÍNDICES:");
      console.table(distribuicaoResult.rows);
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

checkIndicesLotes();
