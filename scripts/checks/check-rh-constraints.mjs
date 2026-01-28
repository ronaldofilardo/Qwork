import { query } from "./lib/db.ts";

async function checkRHConstraints() {
  try {
    console.log("Verificando triggers relacionados a RH...");

    // Verificar triggers
    const triggers = await query(`
      SELECT tgname, tgrelid::regclass as table_name
      FROM pg_trigger
      WHERE tgname LIKE '%rh%' OR tgname LIKE '%gestor%'
    `);

    console.log("Triggers encontrados:");
    triggers.rows.forEach((t) =>
      console.log(`  ${t.tgname} on ${t.table_name}`)
    );

    // Verificar índices únicos
    const indexes = await query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE (indexname LIKE '%rh%' OR indexname LIKE '%gestor%' OR indexname LIKE '%unique%')
      AND tablename = 'funcionarios'
    `);

    console.log("\nÍndices únicos na tabela funcionarios:");
    indexes.rows.forEach((i) =>
      console.log(`  ${i.indexname} on ${i.tablename}`)
    );

    // Verificar constraints
    const constraints = await query(`
      SELECT conname, contype, conrelid::regclass as table_name
      FROM pg_constraint
      WHERE conname LIKE '%rh%' OR conname LIKE '%gestor%' OR conname LIKE '%unique%'
    `);

    console.log("\nConstraints encontrados:");
    constraints.rows.forEach((c) =>
      console.log(`  ${c.conname} (${c.contype}) on ${c.table_name}`)
    );

    // Testar inserção duplicada
    console.log("\nTestando constraint de RH único por clínica...");

    try {
      // Verificar RHs ativos existentes
      const existingRH = await query(
        "SELECT clinica_id, COUNT(*) as count FROM funcionarios WHERE perfil = $1 AND ativo = $2 GROUP BY clinica_id",
        ["rh", true]
      );

      console.log("RHs ativos por clínica:");
      existingRH.rows.forEach((r) =>
        console.log(`  Clínica ${r.clinica_id}: ${r.count} RH(s)`)
      );
    } catch (error) {
      console.error("Erro ao verificar RHs existentes:", error);
    }
  } catch (error) {
    console.error("Erro geral:", error);
  }
}

checkRHConstraints();
