import pg from "pg";
import fs from "fs";
import { config } from "dotenv";

config({ path: ".env.development" });

async function applyMigration001() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log("Aplicando migração 001_security_rls_rbac.sql...");

    const migrationSQL = fs.readFileSync(
      "database/migrations/001_security_rls_rbac.sql",
      "utf8"
    );

    await pool.query(migrationSQL);

    console.log("✅ Migração 001 aplicada com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  } finally {
    await pool.end();
  }
}

applyMigration001();
