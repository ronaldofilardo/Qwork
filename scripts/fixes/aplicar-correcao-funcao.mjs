import { query } from "./lib/db.ts";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.development" });

async function corrigirFuncao() {
  try {
    console.log(
      "🔧 Aplicando correção da função calcular_elegibilidade_lote...\n"
    );

    // Ler o arquivo SQL
    const sqlContent = readFileSync(
      "fix-calcular-elegibilidade-lote.sql",
      "utf8"
    );

    // Executar o SQL
    await query(sqlContent);

    console.log("✅ Função corrigida com sucesso!");
    console.log("🎯 Agora você pode tentar liberar o lote novamente.");
  } catch (error) {
    console.error("❌ Erro ao corrigir função:", error);
    process.exit(1);
  }
}

corrigirFuncao();
