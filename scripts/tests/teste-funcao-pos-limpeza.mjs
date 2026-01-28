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
      "🧪 Testando função detectar_anomalias_indice após limpeza parcial...\n"
    );

    // Testar a função detectar_anomalias_indice
    const resultado = await pool.query(`
      SELECT * FROM detectar_anomalias_indice(1)
    `);

    console.log("📊 Resultado da função detectar_anomalias_indice:");
    console.log(`Total de funcionários analisados: ${resultado.rows.length}`);

    // Agrupar por categoria
    const categorias = {
      nunca_avaliou: [],
      avaliou_normal: [],
      anomalia: [],
    };

    resultado.rows.forEach((row) => {
      if (row.categoria === "nunca_avaliou") {
        categorias.nunca_avaliou.push(row);
      } else if (row.categoria === "avaliou_normal") {
        categorias.avaliou_normal.push(row);
      } else if (row.categoria === "anomalia") {
        categorias.anomalia.push(row);
      }
    });

    console.log(`\n📈 Nunca avaliou: ${categorias.nunca_avaliou.length}`);
    categorias.nunca_avaliou.forEach((row) => {
      console.log(`  - ${row.nome} (${row.cpf})`);
    });

    console.log(`\n✅ Avaliou normal: ${categorias.avaliou_normal.length}`);
    categorias.avaliou_normal.forEach((row) => {
      console.log(`  - ${row.nome} (${row.cpf})`);
    });

    console.log(`\n⚠️  Anomalias: ${categorias.anomalia.length}`);
    categorias.anomalia.forEach((row) => {
      console.log(`  - ${row.nome} (${row.cpf}): ${row.motivo}`);
    });

    // Verificar se João da Lagos está sendo detectado corretamente
    const joao = resultado.rows.find((row) => row.cpf === "80510620949");
    if (joao) {
      console.log(
        `\n🔍 João da Lagos (80510620949): categoria = ${
          joao.categoria
        }, motivo = ${joao.motivo || "N/A"}`
      );
    } else {
      console.log("\n❌ João da Lagos não encontrado na análise!");
    }

    // Verificar dados brutos para João
    console.log("\n🔍 Dados brutos para João da Lagos:");
    const dadosJoao = await pool.query(`
      SELECT a.id, a.status, a.lote_id, a.criado_em, a.atualizado_em
      FROM avaliacoes a
      WHERE a.funcionario_cpf = '80510620949'
      ORDER BY a.criado_em DESC
    `);

    dadosJoao.rows.forEach((row) => {
      console.log(
        `  Avaliação ${row.id}: status=${row.status}, lote=${row.lote_id}, criado=${row.criado_em}, atualizado=${row.atualizado_em}`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
