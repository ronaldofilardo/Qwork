import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Testando função detectar_anomalias_indice diretamente\n");

    const result = await pool.query(`
      SELECT * FROM detectar_anomalias_indice(1)
      ORDER BY severidade, funcionario_nome
    `);

    console.log(`📊 Total de anomalias detectadas: ${result.rows.length}\n`);

    result.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.funcionario_nome} (${row.funcionario_cpf})`
      );
      console.log(`   📋 Tipo: ${row.tipo_anomalia}`);
      console.log(`   🎯 Severidade: ${row.severidade}`);
      console.log(`   💬 Detalhes: ${row.detalhes}`);
      console.log("");
    });

    // Contar por severidade
    const severidades = {};
    result.rows.forEach((row) => {
      severidades[row.severidade] = (severidades[row.severidade] || 0) + 1;
    });

    console.log("📊 RESUMO POR SEVERIDADE:");
    Object.entries(severidades).forEach(([sev, count]) => {
      console.log(`   ${sev}: ${count}`);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
