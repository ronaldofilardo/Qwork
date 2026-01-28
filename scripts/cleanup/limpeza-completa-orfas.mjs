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
      "🧹 INICIANDO LIMPEZA COMPLETA DE AVALIAÇÕES ÓRFÃS (FASE DE TESTES)\n"
    );

    console.log("⚠️  ATENÇÃO: Esta operação irá:");
    console.log("   1. Desabilitar temporariamente o trigger de imutabilidade");
    console.log("   2. Deletar todas as avaliações órfãs (lote_id IS NULL)");
    console.log("   3. Deletar todos os resultados associados");
    console.log("   4. Reabilitar o trigger de imutabilidade");
    console.log(
      "   5. Resetar índices de avaliação dos funcionários afetados\n"
    );

    // Passo 1: Desabilitar trigger temporariamente
    console.log("1️⃣ Desabilitando trigger de imutabilidade...");
    await pool.query(
      "ALTER TABLE resultados DISABLE TRIGGER trigger_resultado_immutability"
    );
    console.log("✅ Trigger desabilitado\n");

    // Passo 2: Deletar resultados das avaliações órfãs
    console.log("2️⃣ Deletando resultados das avaliações órfãs...");
    const deleteResultados = await pool.query(`
      DELETE FROM resultados
      WHERE avaliacao_id IN (
        SELECT id FROM avaliacoes WHERE lote_id IS NULL
      )
    `);
    console.log(`✅ Deletados ${deleteResultados.rowCount} resultados\n`);

    // Passo 3: Deletar avaliações órfãs
    console.log("3️⃣ Deletando avaliações órfãs...");
    const deleteAvaliacoes = await pool.query(`
      DELETE FROM avaliacoes WHERE lote_id IS NULL
    `);
    console.log(`✅ Deletadas ${deleteAvaliacoes.rowCount} avaliações órfãs\n`);

    // Passo 4: Reabilitar trigger
    console.log("4️⃣ Reabilitando trigger de imutabilidade...");
    await pool.query(
      "ALTER TABLE resultados ENABLE TRIGGER trigger_resultado_immutability"
    );
    console.log("✅ Trigger reabilitado\n");

    // Passo 5: Resetar índices de funcionários que só tinham avaliações órfãs
    console.log(
      "5️⃣ Resetando índices de avaliação dos funcionários afetados..."
    );
    const resetIndices = await pool.query(`
      UPDATE funcionarios f
      SET indice_avaliacao = (
        SELECT COALESCE(MAX(la.numero_ordem), 0)
        FROM avaliacoes a
        JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE a.funcionario_cpf = f.cpf AND a.status = 'concluida'
      ),
      data_ultimo_lote = (
        SELECT MAX(a.envio)
        FROM avaliacoes a
        JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE a.funcionario_cpf = f.cpf AND a.status = 'concluida'
      )
      WHERE f.empresa_id = 1
    `);
    console.log(
      `✅ Índices resetados para ${resetIndices.rowCount} funcionários\n`
    );

    // Verificação final
    console.log("🔍 Verificação final:");
    const verificacao = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id IS NULL) as avaliacoes_orfas,
        (SELECT COUNT(*) FROM resultados r WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)) as resultados_orfaos
    `);

    console.log(
      `   - Avaliações órfãs restantes: ${verificacao.rows[0].avaliacoes_orfas}`
    );
    console.log(
      `   - Resultados órfãos restantes: ${verificacao.rows[0].resultados_orfaos}`
    );

    if (
      parseInt(verificacao.rows[0].avaliacoes_orfas) === 0 &&
      parseInt(verificacao.rows[0].resultados_orfaos) === 0
    ) {
      console.log("\n🎉 LIMPEZA COMPLETA REALIZADA COM SUCESSO!");
      console.log("Banco de dados limpo para nova fase de testes.");
    } else {
      console.log("\n⚠️  Ainda há dados órfãos. Verificar integridade.");
    }

    // Estatísticas finais
    const stats = await pool.query(`
      SELECT
        COUNT(DISTINCT f.cpf) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN f.indice_avaliacao > 0 THEN f.cpf END) as com_avaliacoes,
        COUNT(DISTINCT CASE WHEN f.indice_avaliacao = 0 THEN f.cpf END) as sem_avaliacoes,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT r.id) as total_resultados
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf AND a.lote_id IS NOT NULL
      LEFT JOIN resultados r ON a.id = r.avaliacao_id
      WHERE f.empresa_id = 1 AND f.ativo = true
    `);

    console.log("\n📊 Estatísticas finais:");
    console.log(
      `   - Funcionários ativos: ${stats.rows[0].total_funcionarios}`
    );
    console.log(`   - Com avaliações válidas: ${stats.rows[0].com_avaliacoes}`);
    console.log(`   - Sem avaliações: ${stats.rows[0].sem_avaliacoes}`);
    console.log(`   - Avaliações válidas: ${stats.rows[0].total_avaliacoes}`);
    console.log(`   - Resultados válidos: ${stats.rows[0].total_resultados}`);
  } catch (error) {
    console.error("❌ Erro durante limpeza:", error);

    // Tentar reabilitar trigger em caso de erro
    try {
      console.log("Tentando reabilitar trigger...");
      await pool.query(
        "ALTER TABLE resultados ENABLE TRIGGER trigger_resultado_immutability"
      );
      console.log("Trigger reabilitado após erro.");
    } catch (triggerError) {
      console.error("❌ Falha ao reabilitar trigger:", triggerError);
    }
  } finally {
    await pool.end();
  }
})();
