import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Debug da lógica NUNCA_AVALIADO\n");

    // Testar a condição específica da categoria NUNCA_AVALIADO
    const nuncaAvaliados = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.criado_em,
        f.data_ultimo_lote,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN 'TEVE_AVALIACOES_LIBERADAS'
          ELSE 'NUNCA_TEVE_AVALIACOES_LIBERADAS'
        END as teve_avaliacoes,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') THEN 'TEVE_CONCLUIDAS'
          ELSE 'NUNCA_CONCLUIU'
        END as concluiu_alguma,
        (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) as total_avaliacoes,
        (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') as concluidas,
        (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'inativada') as inativadas
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND (
          -- Nunca teve avaliações liberadas E foi criado há mais de 6 meses
          (f.criado_em < NOW() - INTERVAL '6 months' AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf))
          OR
          -- Teve avaliações liberadas mas nunca concluiu nenhuma
          (EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida'))
        )
      ORDER BY f.nome
    `);

    console.log(
      `📊 Funcionários que deveriam aparecer em NUNCA_AVALIADO: ${nuncaAvaliados.rows.length}\n`
    );

    nuncaAvaliados.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nome} (${row.cpf})`);
      console.log(
        `   📅 Criado em: ${row.criado_em?.toISOString().split("T")[0]}`
      );
      console.log(`   📊 Índice: ${row.indice_avaliacao}`);
      console.log(
        `   📋 Avaliações: ${row.total_avaliacoes} liberadas, ${row.concluidas} concluídas, ${row.inativadas} inativadas`
      );
      console.log(
        `   🎯 Status: ${row.teve_avaliacoes} + ${row.concluiu_alguma}`
      );
      console.log("");
    });

    // Verificar se algum funcionário está sendo excluído por ter sido criado recentemente
    console.log(
      "🔍 Verificando funcionários criados recentemente (menos de 6 meses):\n"
    );

    const recentes = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.criado_em,
        EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER as dias_desde_criacao,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN 'TEVE_AVALIACOES'
          ELSE 'SEM_AVALIACOES'
        END as teve_avaliacoes,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') THEN 'TEVE_CONCLUIDAS'
          ELSE 'SEM_CONCLUIDAS'
        END as concluiu_alguma
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND f.criado_em >= NOW() - INTERVAL '6 months'
      ORDER BY f.criado_em DESC
    `);

    recentes.rows.forEach((row) => {
      console.log(
        `${row.nome} (${row.cpf}) - ${row.dias_desde_criacao} dias - ${row.teve_avaliacoes} + ${row.concluiu_alguma}`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
