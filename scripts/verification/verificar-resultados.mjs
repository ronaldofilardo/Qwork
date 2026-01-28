import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando estrutura da tabela resultados\n");

    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'resultados'
      ORDER BY ordinal_position
    `);

    console.log("📋 Colunas da tabela resultados:");
    columns.rows.forEach((col) => {
      console.log(
        `   ${col.column_name} (${col.data_type}) ${
          col.is_nullable === "YES" ? "NULL" : "NOT NULL"
        }`
      );
    });

    // Verificar se há dados na tabela
    const count = await pool.query("SELECT COUNT(*) as total FROM resultados");
    console.log(
      `\n📊 Total de registros em resultados: ${count.rows[0].total}`
    );

    // Ver uma amostra dos dados
    if (parseInt(count.rows[0].total) > 0) {
      const sample = await pool.query("SELECT * FROM resultados LIMIT 3");
      console.log("\n📝 Amostra de dados:");
      sample.rows.forEach((row, index) => {
        console.log(
          `   Registro ${index + 1}:`,
          Object.keys(row)
            .map((key) => `${key}=${row[key]}`)
            .join(", ")
        );
      });
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
