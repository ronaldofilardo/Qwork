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
      "🔍 Executando detectar_anomalias_indice(1) com captura de erro detalhada...\n"
    );

    const result = await pool.query(
      "SELECT * FROM detectar_anomalias_indice(1)"
    );

    console.log(
      `✅ Função executada com sucesso. Retornou ${result.rows.length} registros:`
    );
    result.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.nome} (${row.cpf}): ${row.categoria_anomalia} - ${
          row.prioridade
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erro ao executar função:", error);
    console.error("Stack trace:", error.stack);

    // Tentar executar cada parte separadamente para identificar onde está o erro
    console.log("\n🔍 Testando cada anomalia separadamente...\n");

    try {
      console.log("Testando anomalia 1...");
      await pool.query(`
        SELECT COUNT(*) FROM (
          SELECT f.cpf FROM funcionarios f
          WHERE f.empresa_id = 1 AND f.ativo = true
          AND (
            (f.criado_em < NOW() - INTERVAL '6 months' AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf))
            OR
            (EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida'))
          )
        ) a1
      `);
      console.log("✅ Anomalia 1 OK");
    } catch (e) {
      console.log("❌ Anomalia 1 falhou:", e.message);
    }

    try {
      console.log("Testando anomalia 2...");
      await pool.query(`
        SELECT COUNT(*) FROM (
          SELECT f.cpf FROM funcionarios f
          WHERE f.empresa_id = 1 AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '1 year'
          AND f.data_ultimo_lote >= NOW() - INTERVAL '2 years'
        ) a2
      `);
      console.log("✅ Anomalia 2 OK");
    } catch (e) {
      console.log("❌ Anomalia 2 falhou:", e.message);
    }

    try {
      console.log("Testando anomalia 3...");
      await pool.query(`
        SELECT COUNT(*) FROM (
          SELECT f.cpf FROM funcionarios f
          WHERE f.empresa_id = 1 AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'
        ) a3
      `);
      console.log("✅ Anomalia 3 OK");
    } catch (e) {
      console.log("❌ Anomalia 3 falhou:", e.message);
    }

    try {
      console.log("Testando anomalia 4...");
      await pool.query(`
        SELECT COUNT(*) FROM (
          SELECT f.cpf FROM funcionarios f
          WHERE f.empresa_id = 1 AND f.ativo = true
          AND f.indice_avaliacao > 0
          AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - 5
        ) a4
      `);
      console.log("✅ Anomalia 4 OK");
    } catch (e) {
      console.log("❌ Anomalia 4 falhou:", e.message);
    }

    try {
      console.log("Testando anomalia 5...");
      await pool.query(`
        SELECT COUNT(*) FROM (
          SELECT f.cpf FROM funcionarios f
          JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
          JOIN lotes_avaliacao la ON a.lote_id = la.id
          WHERE f.empresa_id = 1 AND a.status = 'inativada'
          AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - 3
          GROUP BY f.cpf HAVING COUNT(a.id) >= 3
        ) a5
      `);
      console.log("✅ Anomalia 5 OK");
    } catch (e) {
      console.log("❌ Anomalia 5 falhou:", e.message);
    }
  } finally {
    await pool.end();
  }
})();
