import pg from "pg";

const { Client } = pg;

// Conectar ao banco (local ou produção baseado no env)
const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:123456@localhost:5432/nr-bps_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function checkGestores() {
  try {
    await client.connect();
    console.log("Conectado ao banco");

    const result = await client.query(`
      SELECT cpf, nome, perfil, clinica_id, ativo, criado_em, atualizado_em
      FROM funcionarios
      WHERE perfil = 'rh'
      ORDER BY clinica_id, cpf
    `);

    console.log("\nGestores RH:");
    result.rows.forEach((user) => {
      console.log(
        `${user.cpf} - ${user.nome} - Clinica: ${user.clinica_id} - Ativo: ${user.ativo} - Criado: ${user.criado_em} - Atualizado: ${user.atualizado_em}`
      );
    });

    // Verificar clínicas
    const clinicas = await client.query(
      "SELECT id, nome FROM clinicas ORDER BY id"
    );
    console.log("\nClínicas:");
    clinicas.rows.forEach((c) => console.log(`${c.id} - ${c.nome}`));

    // Verificar se há tabela de auditoria
    const auditExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
      )
    `);
    if (auditExists.rows[0].exists) {
      console.log("\nAuditoria para 44444444444:");
      const audit = await client.query(`
        SELECT action, user_cpf, user_perfil, old_data, new_data, created_at 
        FROM audit_logs 
        WHERE resource_id = '44444444444' 
        ORDER BY created_at DESC LIMIT 5
      `);
      audit.rows.forEach((a) => console.log(a));
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

checkGestores();
