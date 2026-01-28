import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function verificarPerfisInativados() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log(
      "=== VERIFICANDO PERFIS DOS FUNCIONÁRIOS COM AVALIAÇÕES INATIVADAS ===\n"
    );

    const result = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.perfil,
        f.nivel_cargo,
        f.ativo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        ROUND(
          (COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)::decimal /
           NULLIF(COUNT(a.id), 0)) * 100, 2
        ) as percentual_inativado
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.cpf IN ('80510620949', '10203040506', '17171717171', '45645645645', '55555555555')
      GROUP BY f.cpf, f.nome, f.perfil, f.nivel_cargo, f.ativo
      ORDER BY f.nome
    `);
    console.table(result.rows);

    // Verificar se há diferença entre funcionários operacionais e de gestão
    console.log("\n=== COMPARAÇÃO ENTRE PERFIS ===");
    const perfisResult = await pool.query(`
      SELECT
        f.perfil,
        f.nivel_cargo,
        COUNT(DISTINCT f.cpf) as total_funcionarios,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        ROUND(
          (COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)::decimal /
           NULLIF(COUNT(a.id), 0)) * 100, 2
        ) as taxa_inativacao
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.empresa_id = 1 AND f.ativo = true
      GROUP BY f.perfil, f.nivel_cargo
      ORDER BY f.perfil, f.nivel_cargo
    `);
    console.table(perfisResult.rows);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

verificarPerfisInativados();
