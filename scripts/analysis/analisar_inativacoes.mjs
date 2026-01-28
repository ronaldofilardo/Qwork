import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function analisarInativacoes() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log(
      "=== ANÁLISE DE INATIVAÇÕES E ELEGIBILIDADE PARA PRÓXIMO LOTE ===\n"
    );

    // 1. Verificar inativações por lote
    console.log("1. AVALIAÇÕES INATIVADAS POR LOTE:");
    const inativacoesResult = await pool.query(`
      SELECT
        la.numero_ordem,
        la.codigo,
        la.titulo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        ROUND(
          (COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)::decimal /
           NULLIF(COUNT(a.id), 0)) * 100, 2
        ) as percentual_inativado
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.clinica_id = 1 AND la.empresa_id = 1
      GROUP BY la.id, la.numero_ordem, la.codigo, la.titulo
      ORDER BY la.numero_ordem
    `);
    console.table(inativacoesResult.rows);

    // 2. Status atual dos funcionários
    console.log("\n2. STATUS ATUAL DOS FUNCIONÁRIOS:");
    const funcionariosResult = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        f.ativo,
        CASE
          WHEN f.indice_avaliacao = 0 THEN 'Nunca avaliado'
          WHEN f.indice_avaliacao < 3 THEN 'Índice atrasado'
          WHEN f.indice_avaliacao = 3 THEN 'No último lote'
          WHEN f.indice_avaliacao > 3 THEN 'Adiantado'
          ELSE 'Status normal'
        END as status_indice,
        CASE
          WHEN f.data_ultimo_lote IS NULL THEN 'Nunca'
          WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano'
          WHEN f.data_ultimo_lote < NOW() - INTERVAL '6 months' THEN 'Mais de 6 meses'
          ELSE 'Recente'
        END as tempo_sem_avaliacao
      FROM funcionarios f
      WHERE f.empresa_id = 1
      ORDER BY f.indice_avaliacao, f.nome
    `);
    console.table(funcionariosResult.rows);

    // 3. Calcular elegibilidade para o próximo lote (número 4)
    console.log(
      "\n3. PREVISÃO DE ELEGIBILIDADE PARA O PRÓXIMO LOTE (NÚMERO 4):"
    );
    const elegibilidadeResult = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        CASE
          WHEN f.indice_avaliacao = 0 THEN 'Funcionário novo (nunca avaliado)'
          WHEN f.indice_avaliacao < 4 - 1 THEN 'Índice atrasado (faltou ' || (4 - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
          WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliação'
          ELSE 'Renovação regular'
        END AS motivo_inclusao,
        CASE
          WHEN f.indice_avaliacao = 0 THEN 'ALTA'
          WHEN f.indice_avaliacao < 4 - 2 THEN 'CRÍTICA'
          WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
          WHEN f.indice_avaliacao < 4 - 1 THEN 'MÉDIA'
          ELSE 'NORMAL'
        END AS prioridade
      FROM funcionarios f
      WHERE f.empresa_id = 1 AND f.ativo = true
      ORDER BY
        CASE
          WHEN f.indice_avaliacao = 0 THEN 0
          WHEN f.indice_avaliacao < 4 - 1 THEN 0
          WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 0
          ELSE 1
        END,
        CASE
          WHEN f.indice_avaliacao = 0 THEN 1
          WHEN f.indice_avaliacao < 4 - 2 THEN 1
          WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 2
          WHEN f.indice_avaliacao < 4 - 1 THEN 3
          ELSE 4
        END,
        f.indice_avaliacao ASC,
        f.nome ASC
    `);

    // Separar elegíveis e não elegíveis
    const todosFuncionarios = elegibilidadeResult.rows;
    const elegiveis = [];
    const naoElegiveis = [];

    todosFuncionarios.forEach((f) => {
      const isElegivel =
        f.indice_avaliacao === 0 ||
        f.indice_avaliacao < 3 ||
        f.data_ultimo_lote === null ||
        new Date(f.data_ultimo_lote) <
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      if (isElegivel) {
        elegiveis.push(f);
      } else {
        naoElegiveis.push(f);
      }
    });

    console.log(`\nFUNCIONÁRIOS ELEGÍVEIS (${elegiveis.length}):`);
    console.table(elegiveis);

    console.log(`\nFUNCIONÁRIOS NÃO ELEGÍVEIS (${naoElegiveis.length}):`);
    console.table(naoElegiveis);

    // 4. Resumo estatístico
    console.log("\n4. RESUMO ESTATÍSTICO:");
    const resumoResult = await pool.query(`
      SELECT
        COUNT(*) as total_funcionarios_ativos,
        COUNT(CASE WHEN elegivel THEN 1 END) as total_elegiveis,
        COUNT(CASE WHEN elegivel AND prioridade = 'CRÍTICA' THEN 1 END) as prioridade_critica,
        COUNT(CASE WHEN elegivel AND prioridade = 'ALTA' THEN 1 END) as prioridade_alta,
        COUNT(CASE WHEN elegivel AND prioridade = 'MÉDIA' THEN 1 END) as prioridade_media,
        COUNT(CASE WHEN elegivel AND prioridade = 'NORMAL' THEN 1 END) as prioridade_normal
      FROM (
        SELECT
          f.cpf,
          CASE
            WHEN f.indice_avaliacao = 0 THEN true
            WHEN f.indice_avaliacao < 4 - 1 THEN true
            WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN true
            ELSE false
          END AS elegivel,
          CASE
            WHEN f.indice_avaliacao = 0 THEN 'ALTA'
            WHEN f.indice_avaliacao < 4 - 2 THEN 'CRÍTICA'
            WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
            WHEN f.indice_avaliacao < 4 - 1 THEN 'MÉDIA'
            ELSE 'NORMAL'
          END AS prioridade
        FROM funcionarios f
        WHERE f.empresa_id = 1 AND f.ativo = true
      ) t
    `);
    console.table(resumoResult.rows);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

analisarInativacoes();
