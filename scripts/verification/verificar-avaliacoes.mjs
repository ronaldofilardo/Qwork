import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando estrutura da tabela avaliações...\n");

    const columns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'avaliacoes'
      ORDER BY ordinal_position
    `);

    console.log("📋 Colunas da tabela avaliações:");
    console.table(columns.rows);

    // Verificar valores possíveis do status
    const statusCheck = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as quantidade
      FROM avaliacoes
      GROUP BY status
      ORDER BY status
    `);

    console.log("\n📊 Status possíveis na tabela avaliações:");
    console.table(statusCheck.rows);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
