import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Analisando funcionários mencionados no problema...\n");

    // Verificar dados dos funcionários específicos
    const funcionarios = ["22222222222", "87545772920"];

    for (const cpf of funcionarios) {
      console.log(`=== FUNCIONÁRIO: ${cpf} ===`);

      const funcData = await pool.query(
        "SELECT nome, indice_avaliacao, data_ultimo_lote, ativo FROM funcionarios WHERE cpf = $1",
        [cpf]
      );
      if (funcData.rows.length > 0) {
        const f = funcData.rows[0];
        console.log(`Nome: ${f.nome}`);
        console.log(`Índice atual: ${f.indice_avaliacao}`);
        console.log(`Último lote: ${f.data_ultimo_lote}`);
        console.log(`Ativo: ${f.ativo}`);

        // Verificar avaliações recentes
        const avaliacoes = await pool.query(
          "SELECT lote_id, inicio, envio, status FROM avaliacoes WHERE funcionario_cpf = $1 ORDER BY inicio DESC LIMIT 5",
          [cpf]
        );
        console.log("Últimas 5 avaliações:");
        avaliacoes.rows.forEach((av, i) => {
          console.log(
            `  ${i + 1}. Lote ${av.lote_id}: ${av.status} (${
              av.inicio?.toISOString().split("T")[0]
            })`
          );
        });

        // Verificar lotes recentes
        const lotesRecentes = await pool.query(
          "SELECT id, numero_ordem, liberado_em FROM lotes_avaliacao WHERE empresa_id = 1 ORDER BY liberado_em DESC LIMIT 3"
        );
        console.log("Lotes recentes da empresa:");
        lotesRecentes.rows.forEach((lote, i) => {
          console.log(
            `  ${i + 1}. Lote ${lote.numero_ordem} (${lote.id}): ${
              lote.liberado_em?.toISOString().split("T")[0]
            }`
          );
        });
      } else {
        console.log("Funcionário não encontrado");
      }
      console.log("");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
