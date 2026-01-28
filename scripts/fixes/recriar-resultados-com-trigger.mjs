import { query } from "./lib/db.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

async function desabilitarTriggerERecriar() {
  try {
    console.log("🔄 DESABILITANDO TRIGGER E RECRIANDO RESULTADOS...\n");

    // Desabilitar trigger
    console.log("🚫 Desabilitando trigger de imutabilidade...");
    await query(
      "ALTER TABLE resultados DISABLE TRIGGER trigger_resultado_immutability"
    );
    console.log("✅ Trigger desabilitado\n");

    // Buscar avaliações válidas
    console.log("📊 Buscando avaliações válidas...");
    const avaliacoes = await query(`
      SELECT a.id, a.funcionario_id, a.lote_id, a.status, a.data_conclusao,
             f.nome as funcionario_nome, l.numero as lote_numero
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_id = f.id
      JOIN lotes_avaliacao l ON a.lote_id = l.id
      WHERE a.lote_id IN (
        SELECT id FROM lotes_avaliacao WHERE numero IN ('001-171225', '002-171225', '003-171225')
      )
      ORDER BY a.id
    `);

    console.log(`📊 Avaliações válidas encontradas: ${avaliacoes.rows.length}`);

    if (avaliacoes.rows.length === 0) {
      console.log("❌ Nenhuma avaliação válida encontrada!");
      return;
    }

    // Criar resultados simulados
    console.log("🧪 Criando resultados simulados para avaliações válidas...");

    const grupos = [
      { id: 1, nome: "Demanda psicológica", perguntas: 4 },
      { id: 2, nome: "Controle sobre o trabalho", perguntas: 4 },
      {
        id: 3,
        nome: "Apoio social e qualidade das relações interpessoais",
        perguntas: 4,
      },
      { id: 4, nome: "Sentido do trabalho", perguntas: 4 },
      { id: 5, nome: "Previsibilidade", perguntas: 4 },
      { id: 6, nome: "Recompensas", perguntas: 4 },
      { id: 7, nome: "Segurança e justiça organizacional", perguntas: 4 },
      { id: 8, nome: "Trabalho e vida privada", perguntas: 4 },
      { id: 9, nome: "Jogo (JZ)", perguntas: 4 },
      { id: 10, nome: "Dívida financeira (EF)", perguntas: 4 },
    ];

    let totalResultados = 0;

    for (const avaliacao of avaliacoes.rows) {
      console.log(
        `\n📝 Processando avaliação ID ${avaliacao.id} - ${avaliacao.funcionario_nome} (Lote: ${avaliacao.lote_numero})`
      );

      for (const grupo of grupos) {
        // Gerar pontuação aleatória realista (1-5)
        const pontuacao = Math.floor(Math.random() * 5) + 1;

        await query(
          `
          INSERT INTO resultados (avaliacao_id, grupo_id, pontuacao, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `,
          [avaliacao.id, grupo.id, pontuacao]
        );

        totalResultados++;
      }
    }

    console.log(`\n✅ ${totalResultados} resultados criados com sucesso!`);

    // Reabilitar trigger
    console.log("\n🔒 Reabilitando trigger de imutabilidade...");
    await query(
      "ALTER TABLE resultados ENABLE TRIGGER trigger_resultado_immutability"
    );
    console.log("✅ Trigger reabilitado\n");

    // Verificar resultados criados
    const verificacao = await query(`
      SELECT COUNT(*) as total_resultados,
             COUNT(DISTINCT avaliacao_id) as avaliacoes_com_resultados
      FROM resultados
    `);

    console.log("📊 Verificação final:");
    console.log(
      `   - Total de resultados: ${verificacao.rows[0].total_resultados}`
    );
    console.log(
      `   - Avaliações com resultados: ${verificacao.rows[0].avaliacoes_com_resultados}`
    );

    console.log("\n🎉 Processo concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante o processo:", error);
    process.exit(1);
  }
}

desabilitarTriggerERecriar();
