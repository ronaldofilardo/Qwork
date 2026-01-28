import pg from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/test-database-constraints in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:123456@localhost:5432/nr-bps_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function testDatabaseConstraints() {
  try {
    await client.connect();
    console.log("🔍 Testando constraints e índices do banco...\n");

    // Verificar índices
    const indices = await client.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'funcionarios' AND indexname LIKE 'idx_funcionarios%'"
    );
    console.log(
      "📊 Índices criados:",
      indices.rows.map((r) => r.indexname)
    );

    // Verificar triggers
    const triggers = await client.query(
      "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'funcionarios'"
    );
    console.log(
      "⚡ Triggers criados:",
      triggers.rows.map((r) => r.trigger_name)
    );

    // Verificar constraint única
    const constraints = await client.query(
      "SELECT conname FROM pg_constraint WHERE conrelid = 'funcionarios'::regclass AND contype = 'u'"
    );
    console.log(
      "🔒 Constraints únicas:",
      constraints.rows.map((r) => r.conname)
    );

    // Verificar view
    const views = await client.query(
      "SELECT viewname FROM pg_views WHERE viewname = 'vw_lotes_info'"
    );
    console.log(
      "👁️ Views criadas:",
      views.rows.map((r) => r.viewname)
    );

    // Testar constraint única - tentar inserir RH duplicado na mesma clínica
    console.log("\n🧪 Testando constraint única...");
    try {
      await client.query("BEGIN");
      await client.query(`
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo)
        VALUES ('12345678901', 'RH Duplicado', 'dup@test.com', '$2a$10$dummy', 'rh', 1, true)
      `);
      await client.query("ROLLBACK");
      console.log(
        "❌ ERRO: Constraint não funcionou - inserção duplicada permitida!"
      );
    } catch (error) {
      if (error.message.includes("idx_funcionarios_clinica_rh_ativo")) {
        console.log("✅ Constraint funcionando: inserção duplicada bloqueada");
      } else {
        console.log("❌ Erro inesperado:", error.message);
      }
      await client.query("ROLLBACK");
    }

    // Testar trigger - tentar desativar único RH
    console.log("\n🧪 Testando trigger de validação...");
    try {
      await client.query("BEGIN");
      await client.query(`
        UPDATE funcionarios SET ativo = false WHERE cpf = '11111111111' AND perfil = 'rh'
      `);
      await client.query("ROLLBACK");
      console.log("❌ ERRO: Trigger não funcionou - desativação permitida!");
    } catch (error) {
      if (error.message.includes("Não é possível desativar")) {
        console.log("✅ Trigger funcionando: desativação bloqueada");
      } else {
        console.log("❌ Erro inesperado:", error.message);
      }
      await client.query("ROLLBACK");
    }

    // Verificar estado atual dos RHs
    console.log("\n📋 Estado atual dos gestores RH:");
    const rhs = await client.query(`
      SELECT f.cpf, f.nome, f.ativo, f.clinica_id, c.nome as clinica_nome
      FROM funcionarios f
      JOIN clinicas c ON c.id = f.clinica_id
      WHERE f.perfil = 'rh'
      ORDER BY f.clinica_id, f.ativo DESC
    `);

    rhs.rows.forEach((rh) => {
      console.log(
        `  ${rh.clinica_id} - ${rh.clinica_nome}: ${rh.cpf} (${rh.nome}) - Ativo: ${rh.ativo}`
      );
    });

    console.log("\n✅ Testes do banco concluídos!");
  } catch (error) {
    console.error("❌ Erro nos testes:", error);
  } finally {
    await client.end();
  }
}

testDatabaseConstraints();
