import pg from "pg";
import fs from "fs";
import { config } from "dotenv";

config({ path: ".env.development" });

async function runMigration() {
  const { Pool } = pg;
  let pool = null;

  try {
    const isTest =
      process.env.NODE_ENV === "test" || !!process.env.TEST_DATABASE_URL;
    if (process.env.NODE_ENV === "test" && !process.env.TEST_DATABASE_URL) {
      console.error(
        "❌ ERRO: NODE_ENV=test mas TEST_DATABASE_URL não está definido. Abortando para evitar alterações no banco de desenvolvimento."
      );
      process.exit(2);
    }

    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.LOCAL_DATABASE_URL ||
      process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL, LOCAL_DATABASE_URL ou TEST_DATABASE_URL não configurada"
      );
    }

    try {
      const parsed = new URL(databaseUrl);
      const dbName = parsed.pathname.replace(/^\//, "");
      if (
        (dbName === "nr-bps_db" || dbName === "nr-bps-db") &&
        !process.env.ALLOW_DEV_MIGRATION
      ) {
        console.error(
          "❌ Segurança: o script detectou que a migração vai rodar no banco de desenvolvimento (nr-bps_db). Exportar ALLOW_DEV_MIGRATION=1 para confirmar."
        );
        process.exit(2);
      }
    } catch (err) {}

    pool = new Pool({ connectionString: databaseUrl, max: 5 });

    const sql = fs.readFileSync(
      "./database/migrations/015_extend_notificacoes.sql",
      "utf8"
    );
    console.log("Executando migration 015_extend_notificacoes.sql...");

    await pool.query(sql);
    console.log("✅ Migration 015 executada com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migration 015:", error);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

runMigration();
