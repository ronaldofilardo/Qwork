import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Testando função completa sem anomalia 2...\n");

    const resultado = await pool.query(`
      SELECT
        anomalias.cpf,
        anomalias.nome,
        anomalias.setor,
        anomalias.indice_avaliacao,
        anomalias.data_ultimo_lote,
        anomalias.dias_desde_ultima_avaliacao,
        anomalias.prioridade,
        anomalias.categoria_anomalia,
        anomalias.mensagem
      FROM (
        -- Anomalia 1: Nunca avaliado (>6 meses) OU teve avaliações liberadas mas nunca concluiu nenhuma
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

          UNION ALL

          -- Anomalia 3: Mais de 2 anos sem avaliação
          SELECT
            f.cpf,
            f.nome,
            f.setor,
            f.indice_avaliacao,
            f.data_ultimo_lote,
            EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
            'CRÍTICA'::VARCHAR(20) AS prioridade,
            'MAIS_DE_2_ANOS_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
            'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida. Violação crítica!' AS mensagem
          FROM funcionarios f
          WHERE
            f.empresa_id = 1
            AND f.ativo = true
            AND f.data_ultimo_lote IS NOT NULL
            AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'

          UNION ALL

          -- Anomalia 4: Índice muito atrasado (>5 lotes)
          SELECT
            f.cpf,
            f.nome,
            f.setor,
            f.indice_avaliacao,
            f.data_ultimo_lote,
            CASE
              WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
              ELSE NULL
            END AS dias_desde_ultima_avaliacao,
            CASE
              WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - f.indice_avaliacao) > 10 THEN 'CRÍTICA'::VARCHAR(20)
              WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - f.indice_avaliacao) > 5 THEN 'ALTA'::VARCHAR(20)
              ELSE 'MÉDIA'::VARCHAR(20)
            END AS prioridade,
            'INDICE_MUITO_ATRASADO'::VARCHAR(50) AS categoria_anomalia,
            'Índice atual: ' || f.indice_avaliacao || ', Lote atual: ' || (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) ||
            ' (Diferença: ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - f.indice_avaliacao) || ' lotes)' AS mensagem
          FROM funcionarios f
          WHERE
            f.empresa_id = 1
            AND f.ativo = true
            AND f.indice_avaliacao > 0
            AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - 5

          UNION ALL

          -- Anomalia 5: Muitas inativações (>3 nos últimos lotes)
          SELECT
            f.cpf,
            f.nome,
            f.setor,
            f.indice_avaliacao,
            f.data_ultimo_lote,
            CASE
              WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
              ELSE NULL
            END AS dias_desde_ultima_avaliacao,
            'CRÍTICA'::VARCHAR(20) AS prioridade,
            'MUITAS_INATIVACOES'::VARCHAR(50) AS categoria_anomalia,
            'Funcionário tem ' || COUNT(a.id) || ' inativações nos últimos lotes. Possível padrão suspeito.' AS mensagem
          FROM funcionarios f
          JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
          JOIN lotes_avaliacao la ON a.lote_id = la.id
          WHERE
            f.empresa_id = 1
            AND a.status = 'inativada'
            AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = 1) - 3
          GROUP BY f.cpf, f.nome, f.setor, f.indice_avaliacao, f.data_ultimo_lote
          HAVING COUNT(a.id) >= 3
      ) anomalias
      ORDER BY
        CASE anomalias.prioridade
          WHEN 'CRÍTICA' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MÉDIA' THEN 3
          ELSE 4
        END,
        anomalias.dias_desde_ultima_avaliacao DESC NULLS FIRST,
        anomalias.nome ASC
    `);

    console.log(`Resultado sem anomalia 2: ${resultado.rows.length} registros`);
    resultado.rows.forEach((row) => {
      console.log(`  - ${row.nome} (${row.cpf}): ${row.categoria_anomalia}`);
    });

    // Verificar se João está no resultado
    const joao = resultado.rows.find((row) => row.cpf === "80510620949");
    if (joao) {
      console.log("\n✅ João da Lagos encontrado!");
    } else {
      console.log("\n❌ João da Lagos NÃO encontrado!");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
