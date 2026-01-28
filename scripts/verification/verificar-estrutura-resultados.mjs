import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando estrutura da tabela resultados...\n");

    // Estrutura das colunas
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'resultados'
      ORDER BY ordinal_position
    `);

    console.log("📋 Colunas da tabela resultados:");
    console.table(columns.rows);

    // Constraints de verificação
    const checks = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      WHERE conrelid = 'resultados'::regclass
      AND contype = 'c'
    `);

    console.log("\n🔒 Constraints de verificação:");
    checks.rows.forEach((check) => {
      console.log(`   - ${check.conname}: ${check.definition}`);
    });
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
