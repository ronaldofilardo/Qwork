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
      "🔍 Verificando avaliações órfãs (lote_id IS NULL) que podem ser de testes anteriores...\n"
    );

    // Verificar avaliações órfãs
    const avaliacoesOrfas = await pool.query(`
      SELECT
        a.id,
        a.funcionario_cpf,
        f.nome,
        a.status,
        a.criado_em,
        a.atualizado_em
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id IS NULL
      ORDER BY a.criado_em ASC
    `);

    console.log(
      `📊 Avaliações órfãs encontradas: ${avaliacoesOrfas.rows.length}`
    );

    if (avaliacoesOrfas.rows.length > 0) {
      console.log("\n📋 Detalhes das avaliações órfãs:");
      avaliacoesOrfas.rows.forEach((avaliacao, index) => {
        console.log(`${index + 1}. ID: ${avaliacao.id}`);
        console.log(
          `   Funcionário: ${avaliacao.nome} (${avaliacao.funcionario_cpf})`
        );
        console.log(`   Status: ${avaliacao.status}`);
        console.log(`   Criado em: ${avaliacao.criado_em}`);
        console.log(`   Atualizado em: ${avaliacao.atualizado_em}`);
        console.log("");
      });

      // Contar resultados associados
      const idsAvaliacoesOrfas = avaliacoesOrfas.rows.map((a) => a.id);
      const resultadosOrfos = await pool.query(
        `
        SELECT COUNT(*) as total_resultados
        FROM resultados
        WHERE avaliacao_id = ANY($1)
      `,
        [idsAvaliacoesOrfas]
      );

      console.log(`📊 Dados associados às avaliações órfãs:`);
      console.log(`  - ${avaliacoesOrfas.rows.length} avaliações órfãs`);
      console.log(
        `  - ${resultadosOrfos.rows[0].total_resultados} resultados associados`
      );

      // Separar por status
      const concluidas = avaliacoesOrfas.rows.filter(
        (a) => a.status === "concluida"
      ).length;
      const naoConcluidas = avaliacoesOrfas.rows.filter(
        (a) => a.status !== "concluida"
      ).length;

      console.log(`\n📈 Status das avaliações órfãs:`);
      console.log(`  - Concluídas: ${concluidas}`);
      console.log(`  - Não concluídas: ${naoConcluidas}`);

      if (concluidas > 0) {
        console.log(
          "\n⚠️  ATENÇÃO: Há avaliações concluídas que não podem ser deletadas devido ao trigger de imutabilidade."
        );
        console.log(
          "Para deletá-las, seria necessário desabilitar temporariamente o trigger."
        );
      }

      console.log("\n🧹 Plano de limpeza:");
      console.log(
        "1. Deletar avaliações órfãs NÃO CONCLUÍDAS (não afetadas por imutabilidade)"
      );
      console.log(
        "2. Para as CONCLUÍDAS, seria necessário desabilitar trigger temporariamente"
      );

      // Perguntar se quer prosseguir
      console.log(
        "\n❓ Deseja prosseguir com a limpeza das avaliações órfãs não concluídas?"
      );
      console.log(
        "Como estamos em fase de testes, vou prosseguir automaticamente...\n"
      );
    } else {
      console.log("✅ Nenhuma avaliação órfã encontrada.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
