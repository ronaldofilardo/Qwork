import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log(
      "🧪 Testando função corrigida calcular_elegibilidade_lote...\n"
    );

    const result = await pool.query(
      "SELECT COUNT(*) as total FROM calcular_elegibilidade_lote(1, 5)"
    );
    console.log(
      "✅ Função funcionando! Total de funcionários elegíveis:",
      result.rows[0].total
    );

    // Mostrar alguns exemplos
    const examples = await pool.query(
      "SELECT * FROM calcular_elegibilidade_lote(1, 5) LIMIT 3"
    );
    console.log("📋 Exemplos de funcionários elegíveis:");
    examples.rows.forEach((row, i) => {
      console.log(
        `${i + 1}. ${row.funcionario_nome} - ${
          row.motivo_inclusao
        } (Prioridade: ${row.prioridade})`
      );
    });
  } catch (error) {
    console.error("❌ Erro ao testar função:", error);
  } finally {
    await pool.end();
  }
})();
