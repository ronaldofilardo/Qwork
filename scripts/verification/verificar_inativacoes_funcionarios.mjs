#!/usr/bin/env node

/**
 * Verificar Inativações de Funcionários
 *
 * Verifica quando e por que funcionários foram inativados
 * para entender se há inativações automáticas
 */

import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function verificarInativacoesFuncionarios() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  console.log("=== VERIFICANDO INATIVAÇÕES DE FUNCIONÁRIOS ===\n");

  try {
    // 1. Funcionários inativos na clínica 1
    console.log("1. FUNCIONÁRIOS INATIVOS:");
    const inativosResult = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.ativo,
        f.inativado_em,
        f.inativado_por,
        f.clinica_id,
        c.nome as clinica_nome
      FROM funcionarios f
      JOIN clinicas c ON f.clinica_id = c.id
      WHERE f.ativo = false
        AND c.id = 1
      ORDER BY f.inativado_em DESC
    `);

    console.table(inativosResult.rows);

    // 2. Análise temporal das inativações
    console.log("\n2. ANÁLISE TEMPORAL DAS INATIVAÇÕES:");
    const temporalResult = await pool.query(`
      SELECT
        DATE(inativado_em) as data_inativacao,
        COUNT(*) as total_inativados,
        STRING_AGG(f.nome || ' (' || f.cpf || ')', ', ') as funcionarios
      FROM funcionarios f
      JOIN clinicas c ON f.clinica_id = c.id
      WHERE f.ativo = false
        AND c.id = 1
        AND f.inativado_em IS NOT NULL
      GROUP BY DATE(inativado_em)
      ORDER BY DATE(inativado_em) DESC
    `);

    console.table(temporalResult.rows);

    // 3. Quem inativou (usuários que mais inativaram)
    console.log("\n3. USUÁRIOS QUE MAIS INATIVARAM FUNCIONÁRIOS:");
    const usuariosResult = await pool.query(`
      SELECT
        f.inativado_por,
        u.nome as nome_usuario,
        u.perfil,
        COUNT(*) as total_inativados,
        STRING_AGG(f.nome || ' (' || f.cpf || ')', ', ') as funcionarios_inativados
      FROM funcionarios f
      JOIN clinicas c ON f.clinica_id = c.id
      LEFT JOIN funcionarios u ON f.inativado_por = u.cpf
      WHERE f.ativo = false
        AND c.id = 1
        AND f.inativado_em IS NOT NULL
      GROUP BY f.inativado_por, u.nome, u.perfil
      ORDER BY total_inativados DESC
    `);

    console.table(usuariosResult.rows);

    // 4. Verificar se há padrões de inativação automática
    console.log("\n4. VERIFICANDO PADRÕES DE INATIVAÇÃO:");
    const padroesResult = await pool.query(`
      SELECT
        CASE
          WHEN inativado_por IS NULL THEN 'AUTOMÁTICO/SISTEMA'
          WHEN inativado_por = '11111111111' THEN 'ADMIN SISTEMA'
          ELSE 'USUÁRIO MANUAL'
        END as tipo_inativacao,
        COUNT(*) as quantidade,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
      FROM funcionarios f
      JOIN clinicas c ON f.clinica_id = c.id
      WHERE f.ativo = false
        AND c.id = 1
      GROUP BY
        CASE
          WHEN inativado_por IS NULL THEN 'AUTOMÁTICO/SISTEMA'
          WHEN inativado_por = '11111111111' THEN 'ADMIN SISTEMA'
          ELSE 'USUÁRIO MANUAL'
        END
    `);

    console.table(padroesResult.rows);
  } catch (error) {
    console.error("Erro ao verificar inativações:", error);
  } finally {
    await pool.end();
  }
}

verificarInativacoesFuncionarios();
