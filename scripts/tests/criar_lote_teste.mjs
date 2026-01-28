import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function criarLotePrioridadeAlta() {
  const { Pool } = pg;

  // Uso seguro: preferir TEST_DATABASE_URL quando presente
  const databaseUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL;

  // Proteção: evitar executar este script contra o banco de desenvolvimento sem confirmação
  if (!databaseUrl) {
    console.error(
      "❌ ERRO: Nenhuma URL de banco configurada (esperado TEST_DATABASE_URL para scripts de teste)."
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
        "❌ Segurança: este script de teste detectou que a conexão aponta para o banco de desenvolvimento (nr-bps_db)."
      );
      console.error(
        "Se realmente deseja executar no banco de desenvolvimento, exporte ALLOW_DEV_TEST_SCRIPT=1 e execute novamente."
      );
      process.exit(2);
    }
  } catch (err) {
    console.error("❌ ERRO ao analisar database URL:", err.message || err);
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Criar um lote com numero_ordem alto para testar prioridade ALTA
    console.log("🏗️  Criando lote de teste com numero_ordem = 8...");

    const insertLote = await pool.query(`
      INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, descricao, tipo, numero_ordem,
        status, liberado_por, liberado_em, criado_em, atualizado_em, auto_emitir_agendado
      ) VALUES (
        'TEST-091225', 1, 1, 'Lote Teste Prioridade Alta', 'Lote criado para testar prioridade ALTA',
        'completo', 8, 'ativo', '11111111111', NOW(), NOW(), NOW(), false
      )
      RETURNING id, numero_ordem
    `);

    const loteId = insertLote.rows[0].id;
    console.log(
      `✅ Lote criado: ID ${loteId}, numero_ordem ${insertLote.rows[0].numero_ordem}`
    );

    // Criar uma avaliação para um funcionário com indice_avaliacao = 0
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
      `👤 Usando funcionário: ${func.nome} (${func.cpf}), indice: ${func.indice_avaliacao}`
    );

    // Criar avaliação no lote alto
    const insertAvaliacao = await pool.query(
      `
      INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em)
      VALUES ($1, $2, 'iniciada', NOW())
      RETURNING id
    `,
      [func.cpf, loteId]
    );

    const avaliacaoId = insertAvaliacao.rows[0].id;
    console.log(`✅ Avaliação criada: ID ${avaliacaoId}`);

    // Verificar a prioridade calculada
    const prioridadeResult = await pool.query(
      `
      SELECT
        a.id,
        f.nome,
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
      [avaliacaoId]
    );

    const aval = prioridadeResult.rows[0];
    console.log("\n🎯 PRIORIDADE CALCULADA:");
    console.log(`   Avaliação ID: ${aval.id}`);
    console.log(`   Funcionário: ${aval.nome}`);
    console.log(`   Índice: ${aval.indice_avaliacao}`);
    console.log(`   Lote: ${aval.lote_atual}`);
    console.log(`   Diferença: ${aval.diferenca_lotes} lotes`);
    console.log(`   Prioridade: ${aval.prioridade}`);
    console.log(
      `   Deve mostrar aviso: ${
        aval.prioridade === "ALTA" ? "SIM ✅" : "NÃO ❌"
      }`
    );

    if (aval.prioridade === "ALTA") {
      console.log("\n🚀 Cenário de prioridade ALTA criado com sucesso!");
      console.log(
        "   Agora você pode testar a API de inativação com esta avaliação."
      );
      console.log(`   Use o ID da avaliação: ${avaliacaoId}`);
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

criarLotePrioridadeAlta();
