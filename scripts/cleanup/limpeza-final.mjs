import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando e limpando resultados órfãos restantes...\n");

    // Verificar resultados órfãos
    const resultadosOrfaos = await pool.query(`
      SELECT COUNT(*) as total FROM resultados r
      WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
    `);

    console.log(
      `📊 Resultados órfãos encontrados: ${resultadosOrfaos.rows[0].total}`
    );

    if (parseInt(resultadosOrfaos.rows[0].total) > 0) {
      console.log("🧹 Deletando resultados órfãos...");
      const deleteOrfaos = await pool.query(`
        DELETE FROM resultados r
        WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
      `);
      console.log(`✅ Deletados ${deleteOrfaos.rowCount} resultados órfãos`);
    }

    // Verificação final completa
    console.log("\n🔍 Verificação final completa:");
    const verificacaoFinal = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id IS NULL) as avaliacoes_orfas,
        (SELECT COUNT(*) FROM resultados r WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)) as resultados_orfaos,
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id IS NOT NULL) as avaliacoes_validas,
        (SELECT COUNT(*) FROM resultados) as resultados_validos
    `);

    const stats = verificacaoFinal.rows[0];
    console.log(`   - Avaliações órfãs: ${stats.avaliacoes_orfas}`);
    console.log(`   - Resultados órfãos: ${stats.resultados_orfaos}`);
    console.log(`   - Avaliações válidas: ${stats.avaliacoes_validas}`);
    console.log(`   - Resultados válidos: ${stats.resultados_validos}`);

    if (
      parseInt(stats.avaliacoes_orfas) === 0 &&
      parseInt(stats.resultados_orfaos) === 0
    ) {
      console.log("\n🎉 LIMPEZA COMPLETA REALIZADA COM SUCESSO!");
      console.log(
        "Banco de dados totalmente limpo de dados de testes anteriores."
      );
    } else {
      console.log("\n⚠️  Ainda há dados órfãos. Verificar integridade.");
    }

    // Estatísticas atualizadas
    const statsFuncionarios = await pool.query(`
      SELECT
        COUNT(DISTINCT f.cpf) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN f.indice_avaliacao > 0 THEN f.cpf END) as com_avaliacoes,
        COUNT(DISTINCT CASE WHEN f.indice_avaliacao = 0 THEN f.cpf END) as sem_avaliacoes
      FROM funcionarios f
      WHERE f.empresa_id = 1 AND f.ativo = true
    `);

    console.log("\n📊 Estatísticas atualizadas dos funcionários:");
    console.log(
      `   - Funcionários ativos: ${statsFuncionarios.rows[0].total_funcionarios}`
    );
    console.log(
      `   - Com avaliações válidas: ${statsFuncionarios.rows[0].com_avaliacoes}`
    );
    console.log(
      `   - Sem avaliações: ${statsFuncionarios.rows[0].sem_avaliacoes}`
    );

    // Testar função de anomalias
    console.log(
      "\n🧪 Testando função detectar_anomalias_indice após limpeza..."
    );
    const anomalias = await pool.query(
      "SELECT * FROM detectar_anomalias_indice(1)"
    );

    console.log(`   - Anomalias detectadas: ${anomalias.rows.length}`);
    if (anomalias.rows.length > 0) {
      anomalias.rows.forEach((row, index) => {
        console.log(
          `     ${index + 1}. ${row.nome}: ${row.categoria_anomalia}`
        );
      });
    } else {
      console.log("   - Nenhuma anomalia detectada (base limpa)");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
