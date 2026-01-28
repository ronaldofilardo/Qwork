import pg from "pg";
import fs from "fs";

async function updateAllFunctions() {
  const { Client } = pg;
  const client = new Client({
    host: "localhost",
    port: 5432,
    database: "nr-bps_db",
    user: "postgres",
    password: "123456",
  });

  try {
    await client.connect();
    console.log("Conectado ao banco...");

    // Drop all functions first
    await client.query(
      "DROP FUNCTION IF EXISTS calcular_elegibilidade_lote(INTEGER, INTEGER);"
    );
    await client.query(
      "DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva(CHAR(11), INTEGER);"
    );
    await client.query(
      "DROP FUNCTION IF EXISTS detectar_anomalias_indice(INTEGER);"
    );
    await client.query(
      "DROP FUNCTION IF EXISTS validar_lote_pre_laudo(INTEGER);"
    );
    await client.query(
      "DROP FUNCTION IF EXISTS obter_proximo_numero_ordem(INTEGER);"
    );
    console.log("Funções dropadas...");

    // Now execute the functions SQL
    const functionsSQL = fs.readFileSync(
      "database/functions-016-indice-avaliacao.sql",
      "utf8"
    );
    await client.query(functionsSQL);
    console.log("Funções criadas com sucesso!");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

updateAllFunctions();
