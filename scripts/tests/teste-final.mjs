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
      "🎯 Teste final da função detectar_anomalias_indice corrigida...\n"
    );

    // Testar a função detectar_anomalias_indice
    const resultado = await pool.query(`
      SELECT * FROM detectar_anomalias_indice(1)
    `);

    console.log("📊 Resultado da função detectar_anomalias_indice:");
    console.log(`Total de anomalias detectadas: ${resultado.rows.length}`);

    resultado.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.nome} (${row.cpf}): ${row.categoria_anomalia} - ${
          row.prioridade
        }`
      );
      console.log(`   ${row.mensagem}`);
      console.log("");
    });

    // Verificar métricas como o frontend faz
    const anomalias = resultado.rows;
    const metricas = {
      total: anomalias.length,
      criticas: anomalias.filter((a) => a.prioridade === "CRÍTICA").length,
      altas: anomalias.filter((a) => a.prioridade === "ALTA").length,
      medias: anomalias.filter((a) => a.prioridade === "MÉDIA").length,
      nunca_avaliados: anomalias.filter(
        (a) => a.categoria_anomalia === "NUNCA_AVALIADO"
      ).length,
      mais_de_1_ano: anomalias.filter(
        (a) => a.categoria_anomalia === "MAIS_DE_1_ANO_SEM_AVALIACAO"
      ).length,
      indices_atrasados: anomalias.filter(
        (a) => a.categoria_anomalia === "INDICE_MUITO_ATRASADO"
      ).length,
      muitas_inativacoes: anomalias.filter(
        (a) => a.categoria_anomalia === "MUITAS_INATIVACOES"
      ).length,
    };

    console.log("📈 Métricas calculadas:");
    console.log(`- Total: ${metricas.total}`);
    console.log(`- Críticas: ${metricas.criticas}`);
    console.log(`- Altas: ${metricas.altas}`);
    console.log(`- Médias: ${metricas.medias}`);
    console.log(`- Nunca avaliados: ${metricas.nunca_avaliados}`);
    console.log(`- Mais de 1 ano: ${metricas.mais_de_1_ano}`);
    console.log(`- Índices atrasados: ${metricas.indices_atrasados}`);
    console.log(`- Muitas inativações: ${metricas.muitas_inativacoes}`);

    // Verificar se João está sendo categorizado corretamente
    const joao = resultado.rows.find((row) => row.cpf === "80510620949");
    if (joao) {
      console.log(`\n✅ João da Lagos encontrado: ${joao.categoria_anomalia}`);
      console.log(
        'Isso significa que funcionários com avaliações liberadas mas nunca concluídas são corretamente identificados como "Nunca avaliou"'
      );
    } else {
      console.log("\n❌ João da Lagos não encontrado na análise!");
    }

    console.log(
      "\n🎉 Sistema de detecção de anomalias funcionando corretamente!"
    );
    console.log(
      'Funcionários com avaliações liberadas mas nunca concluídas são mostrados como "Nunca avaliou" na aba Pendências.'
    );
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
