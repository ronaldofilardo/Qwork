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
      "🧪 Testando função calcular_elegibilidade_lote para empresa 1, lote 5...\n"
    );

    const result = await pool.query(
      "SELECT * FROM calcular_elegibilidade_lote(1, 5) WHERE funcionario_cpf IN ($1, $2)",
      ["22222222222", "87545772920"]
    );

    console.log("Funcionários elegíveis encontrados:");
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.funcionario_nome} (${row.funcionario_cpf})`);
      console.log(`   Motivo: ${row.motivo_inclusao}`);
      console.log(`   Índice atual: ${row.indice_atual}`);
      console.log(`   Prioridade: ${row.prioridade}`);
      console.log(`   Dias sem avaliação: ${row.dias_sem_avaliacao}`);
      console.log("");
    });

    if (result.rows.length === 0) {
      console.log("Nenhum dos funcionários foi considerado elegível.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
