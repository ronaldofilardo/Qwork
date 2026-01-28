import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificação manual de cada funcionário\n");

    const cpfs = [
      "10203040506",
      "55555555555",
      "45645645645",
      "17171717171",
      "80510620949",
    ];

    for (const cpf of cpfs) {
      console.log(`\n👤 Verificando ${cpf}:`);

      // Verificar dados básicos do funcionário
      const func = await pool.query(
        "SELECT nome, empresa_id, ativo, criado_em FROM funcionarios WHERE cpf = $1",
        [cpf]
      );
      if (func.rows.length === 0) {
        console.log("   ❌ Funcionário não encontrado!");
        continue;
      }

      const f = func.rows[0];
      console.log(
        `   📋 Nome: ${f.nome}, Empresa: ${f.empresa_id}, Ativo: ${f.ativo}`
      );
      console.log(
        `   📅 Criado em: ${f.criado_em?.toISOString().split("T")[0]}`
      );

      // Verificar avaliações
      const aval = await pool.query(
        "SELECT COUNT(*) as total FROM avaliacoes WHERE funcionario_cpf = $1",
        [cpf]
      );
      const avalConc = await pool.query(
        "SELECT COUNT(*) as total FROM avaliacoes WHERE funcionario_cpf = $1 AND status = $2",
        [cpf, "concluida"]
      );

      console.log(`   📊 Total avaliações: ${aval.rows[0].total}`);
      console.log(`   ✅ Concluídas: ${avalConc.rows[0].total}`);

      // Verificar condições
      const temAvaliacoes = aval.rows[0].total > 0;
      const temConcluidas = avalConc.rows[0].total > 0;
      const criadoHaMais6Meses =
        f.criado_em < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

      console.log(`   🎯 Condições:`);
      console.log(`      - Tem avaliações: ${temAvaliacoes}`);
      console.log(`      - Tem concluídas: ${temConcluidas}`);
      console.log(`      - Criado há >6 meses: ${criadoHaMais6Meses}`);

      const condicao1 = !temAvaliacoes && criadoHaMais6Meses;
      const condicao2 = temAvaliacoes && !temConcluidas;

      console.log(
        `      - Condição 1 (nunca teve aval + >6 meses): ${condicao1}`
      );
      console.log(
        `      - Condição 2 (teve aval + nunca concluiu): ${condicao2}`
      );
      console.log(
        `      - Deve aparecer em NUNCA_AVALIADO: ${condicao1 || condicao2}`
      );
    }

    console.log("\n🔍 Testando query simplificada:\n");

    const simples = await pool.query(`
      SELECT f.cpf, f.nome,
             (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) as total_aval,
             (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida') as concluidas
      FROM funcionarios f
      WHERE f.empresa_id = 1 AND f.ativo = true
      ORDER BY f.nome
    `);

    console.log("Todos os funcionários ativos da empresa 1:");
    simples.rows.forEach((row) => {
      const deveIncluir =
        (row.total_aval > 0 && row.concluidas === 0) ||
        (row.total_aval === 0 && true); // simplificado
      console.log(
        `${row.nome} (${row.cpf}): ${row.total_aval} aval, ${row.concluidas} conc - Incluir: ${deveIncluir}`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
