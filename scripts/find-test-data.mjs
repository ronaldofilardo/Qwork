import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function find() {
  const { Pool } = pg;
  const databaseUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "❌ ERRO: Nenhuma URL de banco configurada. Configure TEST_DATABASE_URL para apontar para o banco de testes."
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
        "❌ Segurança: este script detectou que a conexão aponta para o banco de desenvolvimento (nr-bps_db). Abortando."
      );
      console.error(
        "Exportar ALLOW_DEV_TEST_SCRIPT=1 para permitir execução no banco de desenvolvimento."
      );
      process.exit(2);
    }
  } catch (err) {
    console.error("❌ ERRO ao analisar database URL:", err.message || err);
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const res = await pool.query(
      "SELECT id, codigo, titulo, numero_ordem, criado_em FROM lotes_avaliacao WHERE codigo LIKE 'TEST-%' ORDER BY criado_em DESC"
    );
    if (res.rows.length === 0) {
      console.log("✅ Nenhum lote de teste encontrado.");
    } else {
      console.table(res.rows);
    }
  } catch (err) {
    console.error("❌ Erro ao buscar lotes de teste:", err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

find().catch((e) => {
  console.error("❌ Erro inesperado:", e);
  process.exit(1);
});
