import { readFileSync } from "fs";
import { query } from "./lib/db.ts";

async function executeSQLFile(filePath) {
  try {
    const sql = readFileSync(filePath, "utf8");

    console.log(`Executando ${filePath}...`);

    // Dividir em statements individuais (básico)
    const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executando: ${statement.trim().substring(0, 50)}...`);
        await query(statement.trim());
      }
    }

    console.log("SQL executado com sucesso!");
  } catch (error) {
    console.error("Erro ao executar SQL:", error);
  }
}

// Executar os scripts de RH
await executeSQLFile("./database/etapa-gestores-rh-unico.sql");
await executeSQLFile("./database/etapa-gestores-rh-unico-parte2.sql");
