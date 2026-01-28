#!/usr/bin/env node

/**
 * Listar Funcionários Elegíveis para o Próximo Lote
 *
 * Identifica funcionários elegíveis para o próximo lote de avaliação
 * e explica os critérios de elegibilidade
 */

import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function listarElegiveisProximoLote() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  console.log("=== FUNCIONÁRIOS ELEGÍVEIS PARA O PRÓXIMO LOTE ===\n");

  try {
    // 1. Identificar o próximo lote
    console.log("1. IDENTIFICANDO O PRÓXIMO LOTE:");
    const proximoLoteResult = await pool.query(`
      SELECT
        COALESCE(MAX(numero_ordem), 0) + 1 as proximo_numero_ordem,
        '00' || (COALESCE(MAX(numero_ordem), 0) + 1) || '-171225' as proximo_codigo
      FROM lotes_avaliacao
      WHERE empresa_id = 1 AND clinica_id = 1
    `);

    const proximoLote = proximoLoteResult.rows[0];
    console.log(
      `Próximo lote: ${proximoLote.proximo_numero_ordem} (${proximoLote.proximo_codigo})`
    );

    // 2. Funcionários elegíveis (excluindo usuários administrativos)
    console.log(
      "\n2. FUNCIONÁRIOS ELEGÍVEIS (EXCLUINDO USUÁRIOS ADMINISTRATIVOS):"
    );
    const elegiveisResult = await pool.query(
      `
      SELECT
        f.cpf,
        f.nome,
        f.ativo,
        f.nivel_cargo,
        f.setor,
        f.funcao,
        COALESCE(f.indice_avaliacao, 0) as indice_atual,
        CASE
          WHEN f.indice_avaliacao IS NULL THEN 'Nunca participou'
          WHEN f.indice_avaliacao = 0 THEN 'Nunca participou'
          ELSE 'Participou de ' || f.indice_avaliacao || ' lote(s)'
        END as historico_participacao,
        CASE
          WHEN f.ativo = false THEN 'INATIVO - Não elegível'
          WHEN f.indice_avaliacao IS NULL OR f.indice_avaliacao = 0 THEN 'Nenhum lote anterior - Elegível'
          WHEN f.indice_avaliacao < $1 THEN 'Índice atual: ' || f.indice_avaliacao || ' - Elegível para próximo'
          ELSE 'Índice máximo atingido - Não elegível'
        END as criterio_elegibilidade
      FROM funcionarios f
      WHERE f.clinica_id = 1
        AND f.ativo = true
        AND f.cpf NOT IN ('00000000000', '11111111111') -- Excluir usuários administrativos
      ORDER BY
        CASE
          WHEN f.indice_avaliacao IS NULL OR f.indice_avaliacao = 0 THEN 1
          ELSE 2
        END,
        f.indice_avaliacao ASC,
        f.nome
    `,
      [proximoLote.proximo_numero_ordem - 1]
    );

    console.table(elegiveisResult.rows);

    // 3. Estatísticas de elegibilidade (excluindo usuários administrativos)
    console.log(
      "\n3. ESTATÍSTICAS DE ELEGIBILIDADE (EXCLUINDO USUÁRIOS ADMINISTRATIVOS):"
    );
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_funcionarios_ativos,
        COUNT(CASE WHEN indice_avaliacao IS NULL OR indice_avaliacao = 0 THEN 1 END) as nunca_participaram,
        COUNT(CASE WHEN indice_avaliacao < $1 AND indice_avaliacao > 0 THEN 1 END) as participaram_anteriores,
        COUNT(CASE WHEN indice_avaliacao >= $1 THEN 1 END) as participaram_todos_anteriores,
        COUNT(CASE WHEN indice_avaliacao IS NULL OR indice_avaliacao < $1 THEN 1 END) as total_elegiveis
      FROM funcionarios
      WHERE clinica_id = 1 AND ativo = true
        AND cpf NOT IN ('00000000000', '11111111111') -- Excluir usuários administrativos
    `,
      [proximoLote.proximo_numero_ordem]
    );

    const stats = statsResult.rows[0];
    console.log(
      `Total de funcionários ativos: ${stats.total_funcionarios_ativos}`
    );
    console.log(`Nunca participaram: ${stats.nunca_participaram}`);
    console.log(
      `Participaram de lotes anteriores: ${stats.participaram_anteriores}`
    );
    console.log(
      `Participaram de todos os lotes anteriores: ${stats.participaram_todos_anteriores}`
    );
    console.log(
      `Total elegíveis para o lote ${proximoLote.proximo_numero_ordem}: ${stats.total_elegiveis}`
    );

    // 4. Distribuição por nível de cargo
    console.log("\n4. DISTRIBUIÇÃO POR NÍVEL DE CARGO:");
    const distribuicaoResult = await pool.query(
      `
      SELECT
        f.nivel_cargo,
        COUNT(*) as total,
        COUNT(CASE WHEN indice_avaliacao IS NULL OR indice_avaliacao < $1 THEN 1 END) as elegiveis,
        ROUND(
          COUNT(CASE WHEN indice_avaliacao IS NULL OR indice_avaliacao < $1 THEN 1 END)::decimal /
          COUNT(*)::decimal * 100, 2
        ) as percentual_elegiveis
      FROM funcionarios f
      WHERE f.clinica_id = 1 AND f.ativo = true
      GROUP BY f.nivel_cargo
      ORDER BY f.nivel_cargo
    `,
      [proximoLote.proximo_numero_ordem]
    );

    console.table(distribuicaoResult.rows);

    // 5. Critérios de elegibilidade explicados
    console.log("\n5. CRITÉRIOS DE ELEGIBILIDADE EXPLICADOS:");
    console.log(`
🎯 CRITÉRIOS PARA O LOTE ${proximoLote.proximo_numero_ordem} (${
      proximoLote.proximo_codigo
    }):

✅ FUNCIONÁRIO ATIVO
   - Deve estar com status 'ativo = true'
   - Funcionários inativos não participam de novos lotes

✅ ÍNDICE DE AVALIAÇÃO COMPATÍVEL
   - indice_avaliacao < ${
     proximoLote.proximo_numero_ordem - 1
   } (lotes anteriores)
   - Ou indice_avaliacao IS NULL (nunca participou)

✅ RENOVAÇÃO ANUAL
   - Sistema permite participação em todos os lotes
   - Índice é incrementado após cada conclusão
   - Não há limite de participação

📊 DISTRIBUIÇÃO ESPERADA:
   - Novos funcionários: índice = 1
   - Veteranos: índice = número de participações anteriores + 1
    `);
  } catch (error) {
    console.error("Erro ao listar elegíveis:", error);
  } finally {
    await pool.end();
  }
}

listarElegiveisProximoLote();
