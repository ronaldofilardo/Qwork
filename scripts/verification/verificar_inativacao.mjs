import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function verificarInativacao() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log("=== VERIFICANDO CAUSAS DE INATIVAÇÃO DE AVALIAÇÕES ===\n");

    // 1. Verificar triggers
    console.log("1. TRIGGERS NA TABELA AVALIACOES:");
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'avaliacoes'
    `);
    console.table(triggers.rows);

    // 2. Verificar funções relacionadas a inativação
    console.log("\n2. FUNÇÕES RELACIONADAS A INATIVAÇÃO:");
    const functions = await pool.query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_definition ILIKE '%inativada%' OR routine_definition ILIKE '%inativ%'
    `);
    console.table(functions.rows);

    // 3. Verificar se há algum padrão nas inativações
    console.log("\n3. ANÁLISE DOS FUNCIONÁRIOS COM AVALIAÇÕES INATIVADAS:");
    const inativadasResult = await pool.query(`
      SELECT
        a.funcionario_cpf,
        f.nome,
        COUNT(*) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        STRING_AGG(DISTINCT la.numero_ordem::text, ', ') as lotes_participados
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.status = 'inativada'
      GROUP BY a.funcionario_cpf, f.nome
      ORDER BY avaliacoes_inativadas DESC
    `);
    console.table(inativadasResult.rows);

    // 4. Verificar se há algum padrão temporal
    console.log("\n4. PADRÃO TEMPORAL DAS INATIVAÇÕES:");
    const temporalResult = await pool.query(`
      SELECT
        DATE(a.inicio) as data_inicio,
        COUNT(*) as total_inativadas
      FROM avaliacoes a
      WHERE a.status = 'inativada'
      GROUP BY DATE(a.inicio)
      ORDER BY DATE(a.inicio) DESC
      LIMIT 10
    `);
    console.table(temporalResult.rows);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

verificarInativacao();
