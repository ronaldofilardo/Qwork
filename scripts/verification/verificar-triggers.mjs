import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando triggers na tabela resultados...\n");

    // Listar todos os triggers
    const triggers = await pool.query(`
      SELECT
        t.tgname as trigger_name,
        t.tgenabled as enabled,
        c.relname as table_name,
        p.proname as function_name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname = 'resultados'
      ORDER BY t.tgname
    `);

    console.log("Triggers encontrados na tabela resultados:");
    triggers.rows.forEach((trigger) => {
      console.log(
        `  - ${trigger.trigger_name}: ${trigger.enabled} (função: ${trigger.function_name})`
      );
    });

    // Verificar se há algum trigger relacionado a imutabilidade
    const imutabilidadeTriggers = triggers.rows.filter(
      (t) =>
        t.trigger_name.toLowerCase().includes("immut") ||
        t.trigger_name.toLowerCase().includes("check") ||
        t.function_name.toLowerCase().includes("immut")
    );

    if (imutabilidadeTriggers.length > 0) {
      console.log("\nPossíveis triggers de imutabilidade:");
      imutabilidadeTriggers.forEach((trigger) => {
        console.log(`  - ${trigger.trigger_name}`);
      });
    } else {
      console.log("\nNenhum trigger de imutabilidade encontrado.");
      console.log("Talvez não haja trigger ativo ou tenha outro nome.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
