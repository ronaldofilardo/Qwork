import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Debug detalhado da Anomalia 1\n");

    // Query exata da primeira anomalia
    const anomalia1 = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        CASE
          WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER
        END AS dias_desde_ultima_avaliacao,
        'ALTA'::VARCHAR(20) AS prioridade,
        'NUNCA_AVALIADO'::VARCHAR(50) AS categoria_anomalia,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN
            'Funcionário teve ' || (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) || ' avaliações liberadas mas nunca concluiu nenhuma. Todas foram inativadas.'
          ELSE
            'Funcionário ativo há ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliação.'
        END AS mensagem
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
      `📊 Anomalia 1 - NUNCA_AVALIADO: ${anomalia1.rows.length} resultados\n`
    );

    anomalia1.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nome} (${row.cpf})`);
      console.log(`   🎯 Prioridade: ${row.prioridade}`);
      console.log(`   📋 Categoria: ${row.categoria_anomalia}`);
      console.log(`   💬 Mensagem: ${row.mensagem}`);
      console.log("");
    });

    // Verificar se há funcionários que atendem apenas a segunda condição
    console.log(
      "🔍 Verificando apenas a condição: teve avaliações mas nunca concluiu\n"
    );

    const condicao2 = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) as total_avaliacoes,
        (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') as concluidas
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf)
        AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida')
      ORDER BY f.nome
    `);

    console.log(
      `📊 Funcionários que tiveram avaliações mas nunca concluíram: ${condicao2.rows.length}\n`
    );

    condicao2.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.nome} (${row.cpf}) - ${
          row.total_avaliacoes
        } avaliações, ${row.concluidas} concluídas`
      );
    });

    // Verificar se há funcionários que atendem apenas a primeira condição
    console.log(
      "\n🔍 Verificando apenas a condição: nunca teve avaliações E criado há >6 meses\n"
    );

    const condicao1 = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.criado_em,
        EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER as dias_desde_criacao
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND f.criado_em < NOW() - INTERVAL '6 months'
        AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf)
      ORDER BY f.nome
    `);

    console.log(
      `📊 Funcionários que nunca tiveram avaliações E foram criados há >6 meses: ${condicao1.rows.length}\n`
    );

    condicao1.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.nome} (${row.cpf}) - Criado há ${
          row.dias_desde_criacao
        } dias`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
