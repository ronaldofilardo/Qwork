import pg from "pg";

// Teste da correção da inativação
async function testInativacaoCorrecao() {
  const client = new pg.Client({
    host: "localhost",
    port: 5432,
    database: "nr-bps_db",
    user: "postgres",
    password: "123456",
  });

  try {
    await client.connect();
    console.log("🔍 Testando correção da inativação...");

    // 1. Usar um funcionário existente e criar uma avaliação de teste
    const funcionarioCpf = "04703084945"; // Usando funcionário existente
    const loteId = 31; // Usando lote existente
    const createAvaliacao = await client.query(
      `
      INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em, atualizado_em)
      VALUES ($1, $2, 'iniciada', NOW(), NOW())
      RETURNING id
    `,
      [funcionarioCpf, loteId]
    );

    const avaliacaoId = createAvaliacao.rows[0].id;
    console.log(`✅ Avaliação de teste criada com ID: ${avaliacaoId}`);

    // 2. Simular a inativação (como faria a API)
    const motivo =
      "Teste de correção: avaliação inativada por motivo excepcional";
    await client.query(
      `
      UPDATE avaliacoes
      SET status = 'inativada',
          motivo_inativacao = $2,
          inativada_em = NOW(),
          atualizado_em = NOW()
      WHERE id = $1
    `,
      [avaliacaoId, motivo]
    );

    console.log("✅ Inativação executada");

    // 3. Verificar se os campos foram atualizados
    const verificar = await client.query(
      `
      SELECT status, motivo_inativacao, inativada_em, atualizado_em
      FROM avaliacoes
      WHERE id = $1
    `,
      [avaliacaoId]
    );

    const resultado = verificar.rows[0];
    console.log("📊 Resultado da verificação:");
    console.log(`   Status: ${resultado.status}`);
    console.log(`   Motivo: ${resultado.motivo_inativacao}`);
    console.log(`   Inativada em: ${resultado.inativada_em}`);
    console.log(`   Atualizado em: ${resultado.atualizado_em}`);

    // 4. Validar se está correto
    if (
      resultado.status === "inativada" &&
      resultado.motivo_inativacao === motivo &&
      resultado.inativada_em !== null &&
      resultado.atualizado_em !== null
    ) {
      console.log(
        "🎉 SUCESSO: Todos os campos foram atualizados corretamente!"
      );
    } else {
      console.log("❌ FALHA: Alguns campos não foram atualizados corretamente");
      console.log("Campos esperados:");
      console.log("  - status: inativada");
      console.log(`  - motivo_inativacao: "${motivo}"`);
      console.log("  - inativada_em: não nulo");
      console.log("  - atualizado_em: não nulo");
    }

    // 5. Limpar dados de teste (apenas a avaliação)
    await client.query("DELETE FROM avaliacoes WHERE id = $1", [avaliacaoId]);
    console.log("🧹 Dados de teste removidos");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  } finally {
    await client.end();
  }
}

testInativacaoCorrecao();
