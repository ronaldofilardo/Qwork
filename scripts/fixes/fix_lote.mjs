import pg from "pg";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.development" });

async function fixLoteStatus() {
  const { Pool } = pg;
  let pool = null;

  try {
    // Usar DATABASE_URL do ambiente
    const databaseUrl =
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL ou LOCAL_DATABASE_URL não configurada");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log("Atualizando status do lote 004-161225 para 'finalizado'...");

    // Atualizar o status do lote para 'finalizado'
    const updateLoteQuery = `
      UPDATE lotes_avaliacao
      SET status = 'finalizado'
      WHERE codigo = $1
    `;

    const result = await pool.query(updateLoteQuery, ["004-161225"]);
    console.log(`Linhas afetadas: ${result.rowCount}`);

    if (result.rowCount > 0) {
      console.log("✅ Status do lote atualizado para 'finalizado'!");
    } else {
      console.log("Nenhuma linha afetada. Lote não encontrado.");
    }

    // Verificar a atualização
    const verifyQuery = await pool.query(
      `
      SELECT id, codigo, status FROM lotes_avaliacao WHERE codigo = $1
    `,
      ["004-161225"]
    );

    console.log("Status do lote após atualização:", verifyQuery.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao corrigir status do lote:", error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

fixLoteStatus();
