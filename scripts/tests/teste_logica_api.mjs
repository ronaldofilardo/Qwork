import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function testarLogicaAPIInativacao() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    const avaliacaoId = 395; // Avaliação com prioridade ALTA

    console.log("🧪 Testando lógica da API de inativação diretamente");
    console.log(`   Avaliação ID: ${avaliacaoId}`);

    // Simular a query da API de inativação
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
      WHERE a.id = $1 AND a.status != 'inativada'
    `,
      [avaliacaoId]
    );

    if (queryResult.rows.length === 0) {
      console.log("❌ Avaliação não encontrada ou já inativada");
      return;
    }

    const aval = queryResult.rows[0];
    console.log("\n📊 Dados da avaliação:");
    console.log(`   ID: ${aval.id}`);
    console.log(`   Funcionário: ${aval.funcionario_nome}`);
    console.log(`   Índice: ${aval.indice_avaliacao}`);
    console.log(`   Lote atual: ${aval.lote_atual}`);
    console.log(`   Diferença: ${aval.diferenca_lotes} lotes`);
    console.log(`   Prioridade: ${aval.prioridade}`);

    // Simular a lógica da API
    const prioridade = aval.prioridade;
    const aviso_prioridade = prioridade === "ALTA";

    console.log("\n🎯 Lógica da API simulada:");
    console.log(`   Prioridade === 'ALTA': ${prioridade === "ALTA"}`);
    console.log(
      `   Deve mostrar aviso: ${aviso_prioridade ? "SIM ✅" : "NÃO ❌"}`
    );

    if (aviso_prioridade) {
      console.log(
        "\n🚀 SUCESSO! A lógica detecta prioridade ALTA corretamente!"
      );
      console.log(
        "   A API retornaria: { success: true, aviso_prioridade: true }"
      );
      console.log(
        "   O modal deve mostrar aviso vermelho e exigir confirmação."
      );
    } else {
      console.log("\n❌ A lógica NÃO detecta prioridade ALTA.");
    }

    // Testar a inativação simulada
    console.log("\n⚠️  Simulando inativação (sem executar realmente):");
    console.log("   UPDATE avaliacoes SET status = 'inativada' WHERE id = $1");
    console.log(`   Parâmetro: ${avaliacaoId}`);
    console.log("   Status: Simulado (não executado)");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

testarLogicaAPIInativacao();
