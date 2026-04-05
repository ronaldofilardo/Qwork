import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function testarAPIInativacao() {
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
    // Simular um cenário onde um funcionário tem prioridade ALTA
    // Vamos pegar um funcionário existente e simular um lote alto
    const funcionario = await pool.query(`
      SELECT cpf, nome, indice_avaliacao
      FROM funcionarios
      WHERE indice_avaliacao = 0
      LIMIT 1
    `);

    if (funcionario.rows.length === 0) {
      console.log("❌ Nenhum funcionário encontrado com indice_avaliacao = 0");
      return;
    }

    const func = funcionario.rows[0];
    console.log(
      `🧪 Testando API de inativação para: ${func.nome} (${func.cpf})`
    );
    console.log(`   Índice atual: ${func.indice_avaliacao}`);

    // Simular lote alto para forçar prioridade ALTA
    const loteSimulado = 8; // lote_atual = 8
    const diferenca = loteSimulado - func.indice_avaliacao;
    const prioridade =
      diferenca > 5 ? "ALTA" : diferenca > 2 ? "MÉDIA" : "NORMAL";

    console.log(`   Lote simulado: ${loteSimulado}`);
    console.log(`   Diferença calculada: ${diferenca}`);
    console.log(`   Prioridade esperada: ${prioridade}`);

    // Agora vamos testar a lógica da API diretamente
    // Simular a query que seria executada na API
    const queryResult = await pool.query(
      `
      SELECT
        a.id,
        f.nome as funcionario_nome,
        f.indice_avaliacao,
        la.numero_ordem as lote_atual,
        (la.numero_ordem - f.indice_avaliacao) as diferenca_lotes,
        CASE
          WHEN (la.numero_ordem - f.indice_avaliacao) > 5 THEN 'ALTA'
          WHEN (la.numero_ordem - f.indice_avaliacao) > 2 THEN 'MÉDIA'
          ELSE 'NORMAL'
        END as prioridade
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.id = $1
    `,
      [392]
    ); // Usando uma avaliação existente

    if (queryResult.rows.length > 0) {
      const aval = queryResult.rows[0];
      console.log("\n📊 Resultado da query da API:");
      console.log(`   Avaliação ID: ${aval.id}`);
      console.log(`   Funcionário: ${aval.funcionario_nome}`);
      console.log(`   Prioridade real: ${aval.prioridade}`);
      console.log(
        `   Deve mostrar aviso: ${aval.prioridade === "ALTA" ? "SIM" : "NÃO"}`
      );
    }

    // Testar a lógica de prioridade ALTA simulada
    console.log("\n🎯 TESTE DE LÓGICA DE PRIORIDADE ALTA:");
    console.log(
      `   Cenário: Funcionário ${func.nome} tentando inativar avaliação`
    );
    console.log(`   Condição: prioridade === 'ALTA'`);
    console.log(`   Resultado esperado: Deve retornar aviso_prioridade = true`);
    console.log(
      `   Comportamento esperado: Modal deve mostrar aviso e exigir confirmação`
    );
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

testarAPIInativacao();
