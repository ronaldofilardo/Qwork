import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log(
      "🔍 Verificando constraints de foreign key na tabela resultados\n"
    );

    const constraints = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'resultados'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    console.log("📋 Foreign key constraints da tabela resultados:");
    constraints.rows.forEach((row) => {
      console.log(
        `   ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
      );
    });

    // Verificar triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'resultados'
    `);

    console.log("\n📋 Triggers na tabela resultados:");
    triggers.rows.forEach((row) => {
      console.log(`   ${row.trigger_name}: ${row.event_manipulation}`);
      console.log(`      Action: ${row.action_statement}`);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
