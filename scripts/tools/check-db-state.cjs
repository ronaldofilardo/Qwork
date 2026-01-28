const { query } = require("./lib/db.ts");

async function checkMigrations() {
  try {
    // Verificar se as migrações foram aplicadas
    const result = await query(
      "SELECT * FROM information_schema.columns WHERE table_name = 'avaliacoes' AND column_name = 'funcionario_id';"
    );
    console.log("Coluna funcionario_id existe:", result.rows.length > 0);

    const enumResult = await query(
      "SELECT * FROM pg_type WHERE typname = 'perfil_funcionario';"
    );
    console.log("ENUM perfil_funcionario existe:", enumResult.rows.length > 0);

    const enumResult2 = await query(
      "SELECT * FROM pg_type WHERE typname = 'status_avaliacao';"
    );
    console.log("ENUM status_avaliacao existe:", enumResult2.rows.length > 0);

    // Verificar usuários de teste
    const users = await query(
      "SELECT cpf, nome, perfil FROM funcionarios WHERE cpf IN ('00000000000', '11111111111', '33333333333', '10203040506');"
    );
    console.log("Usuários encontrados:", users.rows.length);
    users.rows.forEach((u) => console.log("  ", u.cpf, u.nome, u.perfil));
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

checkMigrations();
