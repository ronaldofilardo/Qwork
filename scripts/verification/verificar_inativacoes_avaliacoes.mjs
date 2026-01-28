#!/usr/bin/env node

/**
 * Verificar Inativações de Avaliações por Lote
 *
 * Verifica quem inativou avaliações e quando,
 * para confirmar se são ações manuais do gestor
 */

import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function verificarInativacoesAvaliacoes() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  console.log("=== VERIFICANDO INATIVAÇÕES DE AVALIAÇÕES POR LOTE ===\n");

  try {
    // 1. Avaliações inativadas por lote (empresa 1, clínica 1)
    console.log("1. AVALIAÇÕES INATIVADAS POR LOTE:");
    const inativadasResult = await pool.query(`
      SELECT
        la.numero_ordem as lote_ordem,
        la.codigo as lote_codigo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        ROUND(
          COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)::decimal /
          COUNT(a.id)::decimal * 100, 2
        ) as percentual_inativadas
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.empresa_id = 1 AND la.clinica_id = 1
      GROUP BY la.numero_ordem, la.codigo
      ORDER BY la.numero_ordem
    `);

    console.table(inativadasResult.rows);

    // 2. Detalhes das avaliações inativadas (últimos lotes)
    console.log("\n2. DETALHES DAS AVALIAÇÕES INATIVADAS (LOTES 2 E 3):");
    const detalhesResult = await pool.query(`
      SELECT
        a.id as avaliacao_id,
        f.nome as funcionario_nome,
        f.cpf as funcionario_cpf,
        la.numero_ordem as lote_ordem,
        la.codigo as lote_codigo,
        a.status,
        a.inicio,
        a.envio
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.status = 'inativada'
        AND la.empresa_id = 1
        AND la.clinica_id = 1
        AND la.numero_ordem IN (2, 3)
      ORDER BY la.numero_ordem, f.nome
    `);

    console.table(detalhesResult.rows);

    // 3. Verificar se funcionários inativos têm avaliações
    console.log("\n3. VERIFICANDO SE FUNCIONÁRIOS INATIVOS TÊM AVALIAÇÕES:");
    const funcionariosInativosResult = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.ativo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.ativo = false
        AND f.clinica_id = 1
      GROUP BY f.cpf, f.nome, f.ativo
      HAVING COUNT(a.id) > 0
      ORDER BY total_avaliacoes DESC
    `);

    console.table(funcionariosInativosResult.rows);

    // 4. Verificar usuários que inativaram avaliações
    console.log("\n4. USUÁRIOS QUE INATIVARAM AVALIAÇÕES:");
    const usuariosInativacaoResult = await pool.query(`
      SELECT
        aud.usuario_cpf,
        f.nome as nome_usuario,
        f.perfil,
        COUNT(*) as total_inativacoes,
        STRING_AGG(
          'Avaliação ' || aud.record_id || ' (Funcionário: ' ||
          (SELECT nome FROM funcionarios WHERE cpf = a.funcionario_cpf) || ')',
          '; '
        ) as detalhes_inativacoes
      FROM auditorias aud
      JOIN funcionarios f ON aud.usuario_cpf = f.cpf
      JOIN avaliacoes a ON aud.record_id::integer = a.id
      WHERE aud.acao = 'INATIVACAO_NORMAL'
        AND aud.tabela = 'avaliacoes'
        AND a.lote_id IN (
          SELECT id FROM lotes_avaliacao
          WHERE empresa_id = 1 AND clinica_id = 1 AND numero_ordem IN (2, 3)
        )
      GROUP BY aud.usuario_cpf, f.nome, f.perfil
      ORDER BY total_inativacoes DESC
    `);

    console.table(usuariosInativacaoResult.rows);
  } catch (error) {
    console.error("Erro ao verificar inativações:", error);
  } finally {
    await pool.end();
  }
}

verificarInativacoesAvaliacoes();
