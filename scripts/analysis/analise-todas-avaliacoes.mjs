import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Análise TODAS as avaliações (não só dos lotes atuais)\n");

    // Primeiro, ver todos os funcionários ativos
    const funcionariosAtivos = await pool.query(`
      SELECT cpf, nome, indice_avaliacao, criado_em
      FROM funcionarios
      WHERE empresa_id = 1 AND ativo = true
      ORDER BY nome
    `);

    console.log(
      `👥 Total de funcionários ativos: ${funcionariosAtivos.rows.length}\n`
    );

    // Para cada funcionário, analisar TODAS as suas avaliações
    for (const func of funcionariosAtivos.rows) {
      const avaliacoes = await pool.query(
        `
        SELECT
          a.id,
          a.status,
          la.numero_ordem,
          la.codigo,
          la.liberado_em
        FROM avaliacoes a
        JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE a.funcionario_cpf = $1
        ORDER BY la.numero_ordem
      `,
        [func.cpf]
      );

      const totalLiberadas = avaliacoes.rows.length;
      const concluidas = avaliacoes.rows.filter(
        (a) => a.status === "concluida"
      ).length;
      const inativadas = avaliacoes.rows.filter(
        (a) => a.status === "inativada"
      ).length;
      const pendentes = avaliacoes.rows.filter(
        (a) => a.status === "pendente"
      ).length;

      console.log(`👤 ${func.nome} (${func.cpf})`);
      console.log(`   📊 Índice atual: ${func.indice_avaliacao}`);
      console.log(
        `   📅 Criado em: ${func.criado_em?.toISOString().split("T")[0]}`
      );
      console.log(
        `   📋 TODAS avaliações: ${totalLiberadas} liberadas, ${concluidas} concluídas, ${inativadas} inativadas, ${pendentes} pendentes`
      );

      if (totalLiberadas > 0) {
        console.log(`   📝 Detalhes de TODAS as avaliações:`);
        avaliacoes.rows.forEach((av) => {
          const statusEmoji =
            av.status === "concluida"
              ? "✅"
              : av.status === "inativada"
              ? "❌"
              : "⏳";
          console.log(
            `      ${statusEmoji} Lote ${av.numero_ordem} (${av.codigo}): ${av.status}`
          );
        });
      }

      // Determinar condição
      const nuncaAvaliou = concluidas === 0;
      const teveAvaliacoesLiberadas = totalLiberadas > 0;

      if (nuncaAvaliou && teveAvaliacoesLiberadas) {
        console.log(
          `   🎯 STATUS: NUNCA AVALIOU (teve ${totalLiberadas} avaliações liberadas mas todas inativadas)`
        );
      } else if (nuncaAvaliou && !teveAvaliacoesLiberadas) {
        console.log(
          `   🎯 STATUS: NUNCA AVALIOU (nunca teve avaliações liberadas)`
        );
      } else {
        console.log(
          `   🎯 STATUS: JÁ AVALIOU (${concluidas} avaliações concluídas)`
        );
      }

      console.log("");
    }

    // Verificar se há lotes além dos 3 atuais
    const lotes = await pool.query(`
      SELECT numero_ordem, codigo, liberado_em
      FROM lotes_avaliacao
      WHERE empresa_id = 1
      ORDER BY numero_ordem DESC
      LIMIT 10
    `);

    console.log("📋 Lotes existentes:");
    lotes.rows.forEach((lote) => {
      console.log(
        `   Lote ${lote.numero_ordem} (${lote.codigo}) - Liberado em: ${
          lote.liberado_em?.toISOString().split("T")[0]
        }`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
