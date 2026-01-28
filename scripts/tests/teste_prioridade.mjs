import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function testarPrioridadeAlta() {
  const { Pool } = pg;

  const databaseUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "❌ ERRO: Nenhuma URL de banco configurada (usar TEST_DATABASE_URL para scripts de teste)"
    );
    process.exit(2);
  }
  try {
    const parsed = new URL(databaseUrl);
    const dbName = parsed.pathname.replace(/^\//, "");
    if (
      (dbName === "nr-bps_db" || dbName === "nr-bps-db") &&
      !process.env.ALLOW_DEV_TEST_SCRIPT
    ) {
      console.error(
        "❌ Segurança: este script detectou que a conexão aponta para o banco de desenvolvimento (nr-bps_db). Abortando"
      );
      console.error(
        "Exportar ALLOW_DEV_TEST_SCRIPT=1 para confirmar execução no banco de desenvolvimento."
      );
      process.exit(2);
    }
  } catch (err) {
    console.error("❌ ERRO ao analisar database URL:", err.message || err);
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Primeiro, vamos ver todos os funcionários e seus índices
    console.log("📊 TODOS OS FUNCIONÁRIOS E SEUS ÍNDICES:");
    const allFuncionarios = await pool.query(`
      SELECT cpf, nome, indice_avaliacao
      FROM funcionarios
      ORDER BY indice_avaliacao DESC
      LIMIT 10
    `);
    console.table(allFuncionarios.rows);

    // Buscar funcionários com avaliações ativas e seus índices
    const funcionariosResult = await pool.query(`
      SELECT
        f.cpf, f.nome, f.indice_avaliacao,
        a.id as avaliacao_id,
        la.numero_ordem as lote_atual,
        (la.numero_ordem - f.indice_avaliacao) as diferenca_lotes,
        CASE
          WHEN (la.numero_ordem - f.indice_avaliacao) > 5 THEN 'ALTA'
          WHEN (la.numero_ordem - f.indice_avaliacao) > 2 THEN 'MÉDIA'
          ELSE 'NORMAL'
        END as prioridade
      FROM funcionarios f
      JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.status = 'iniciada' OR a.status = 'em_andamento'
      ORDER BY (la.numero_ordem - f.indice_avaliacao) DESC
    `);

    console.log("\n🔍 FUNCIONÁRIOS COM AVALIAÇÕES ATIVAS E SUAS PRIORIDADES:");
    console.table(funcionariosResult.rows);

    // Verificar se há algum funcionário com prioridade ALTA
    const prioridadeAlta = funcionariosResult.rows.filter(
      (f) => f.prioridade === "ALTA"
    );
    if (prioridadeAlta.length > 0) {
      console.log("\n🎯 FUNCIONÁRIOS COM PRIORIDADE ALTA ENCONTRADOS:");
      prioridadeAlta.forEach((func) => {
        console.log(
          `   ${func.nome} (${func.cpf}): Diferença de ${func.diferenca_lotes} lotes`
        );
      });
    } else {
      console.log(
        "\n⚠️  Nenhum funcionário com prioridade ALTA encontrado no momento."
      );
      console.log(
        "   Para testar prioridade ALTA, precisamos de um funcionário onde:"
      );
      console.log("   (lote_atual - indice_avaliacao) > 5");
      console.log(
        "   Exemplo: indice_avaliacao = 0 e lote_atual = 7 ou superior"
      );
    }

    // Simular um cenário de prioridade ALTA
    console.log("\n🧪 SIMULAÇÃO DE PRIORIDADE ALTA:");
    const simulacao = {
      cpf: "12345678901",
      nome: "Funcionário Teste",
      indice_avaliacao: 1,
      lote_atual: 8,
      diferenca_lotes: 7,
      prioridade: "ALTA",
    };
    console.log(
      `   ${simulacao.nome}: Índice ${simulacao.indice_avaliacao}, Lote ${simulacao.lote_atual}, Diferença ${simulacao.diferenca_lotes} → ${simulacao.prioridade}`
    );
    console.log("   Deve mostrar aviso: SIM");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

testarPrioridadeAlta();
