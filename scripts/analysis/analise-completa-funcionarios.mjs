import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Análise completa: Funcionários ativos e suas avaliações\n");

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

    // Para cada funcionário, analisar suas avaliações
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
        `   📋 Avaliações: ${totalLiberadas} liberadas, ${concluidas} concluídas, ${inativadas} inativadas, ${pendentes} pendentes`
      );

      if (totalLiberadas > 0) {
        console.log(`   📝 Detalhes das avaliações:`);
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

    // Resumo final
    console.log("📊 RESUMO GERAL:");
    const resumo = await pool.query(`
      SELECT
        COUNT(*) as total_ativos,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN 1 END) as tiveram_avaliacoes_liberadas,
        COUNT(CASE WHEN NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') THEN 1 END) as nunca_concluiram,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') THEN 1 END) as tiveram_liberadas_mas_nunca_concluiram
      FROM funcionarios f
      WHERE f.empresa_id = 1 AND f.ativo = true
    `);

    const r = resumo.rows[0];
    console.log(`👥 Total ativos: ${r.total_ativos}`);
    console.log(
      `📋 Tiveram avaliações liberadas: ${r.tiveram_avaliacoes_liberadas}`
    );
    console.log(`❌ Nunca concluíram nenhuma avaliação: ${r.nunca_concluiram}`);
    console.log(
      `🎯 Tiveram avaliações liberadas mas nunca concluíram: ${r.tiveram_liberadas_mas_nunca_concluiram}`
    );
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
