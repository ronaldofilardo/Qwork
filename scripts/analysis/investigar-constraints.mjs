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
      "🔍 Investigando por que os resultados órfãos não podem ser deletados...\n"
    );

    // Verificar constraints na tabela resultados
    const constraints = await pool.query(`
      SELECT
        conname as constraint_name,
        contype as constraint_type,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table
      FROM pg_constraint
      WHERE conrelid = 'resultados'::regclass
      ORDER BY conname
    `);

    console.log("Constraints na tabela resultados:");
    constraints.rows.forEach((con) => {
      console.log(
        `  - ${con.constraint_name}: ${con.constraint_type} (${
          con.table_name
        } -> ${con.referenced_table || "N/A"})`
      );
    });

    // Verificar se há alguma tabela que referencia resultados
    const referencias = await pool.query(`
      SELECT
        tc.table_name,
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
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'resultados'
    `);

    console.log("\nTabelas que referenciam resultados:");
    if (referencias.rows.length === 0) {
      console.log("  Nenhuma tabela referencia resultados");
    } else {
      referencias.rows.forEach((ref) => {
        console.log(
          `  - ${ref.table_name}.${ref.column_name} -> ${ref.foreign_table_name}.${ref.foreign_column_name}`
        );
      });
    }

    // Tentar TRUNCATE se não houver dependências
    if (referencias.rows.length === 0) {
      console.log("\n🧹 Tentando TRUNCATE TABLE resultados...");
      try {
        await pool.query("TRUNCATE TABLE resultados CASCADE");
        console.log("✅ TRUNCATE executado com sucesso");
      } catch (truncateError) {
        console.log("❌ TRUNCATE falhou:", truncateError.message);
      }
    }

    // Verificação final
    const finalCount = await pool.query(
      "SELECT COUNT(*) as total FROM resultados"
    );
    console.log(`\nResultados restantes: ${finalCount.rows[0].total}`);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
