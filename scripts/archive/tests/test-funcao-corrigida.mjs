import pg from "pg";
import fs from "fs";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    const sql = fs.readFileSync(
      "./database/fix-detectar-anomalias-indice.sql",
      "utf8"
    );
    console.log(
      "Executando correção atualizada da função detectar_anomalias_indice..."
    );
    await pool.query(sql);
    console.log("✅ Função atualizada com sucesso!");

    // Testar a função
    const result = await pool.query(
      "SELECT * FROM detectar_anomalias_indice(1)"
    );
    console.log("📊 Total de anomalias encontradas:", result.rows.length);

    const nuncaAvaliados = result.rows.filter(
      (a) => a.categoria_anomalia === "NUNCA_AVALIADO"
    );
    console.log("🎯 Funcionários nunca avaliados:", nuncaAvaliados.length);

    nuncaAvaliados.forEach((a, i) => {
      console.log(`${i + 1}. ${a.nome} (${a.cpf}) - ${a.mensagem}`);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
