const { Client } = require("pg");

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/test-classification in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const client = new Client({
  connectionString: "postgresql://postgres:123456@localhost:5432/nr-bps_db",
});

async function testClassification() {
  try {
    await client.connect();

    const loteId = 2;

    // Testar classificação com a lógica atual
    const allRespostasQuery = `
      SELECT r.valor
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1 AND a.status = 'concluida'
      ORDER BY r.valor
    `;

    const allRespostas = await client.query(allRespostasQuery, [loteId]);
    const valores = allRespostas.rows.map((r) => r.valor);

    console.log("\n=== VALORES DE TODAS AS RESPOSTAS ===");
    console.log("Total de respostas:", valores.length);
    console.log(
      "Valores ordenados:",
      valores.sort((a, b) => a - b)
    );

    // Calcular percentis manualmente
    const sortedValues = [...valores].sort((a, b) => a - b);
    const p33Index = Math.floor(0.33 * (sortedValues.length - 1));
    const p66Index = Math.floor(0.66 * (sortedValues.length - 1));

    console.log("\n=== CÁLCULO MANUAL DE PERCENTIS ===");
    console.log("Índice P33:", p33Index, "→ Valor:", sortedValues[p33Index]);
    console.log("Índice P66:", p66Index, "→ Valor:", sortedValues[p66Index]);

    // Testar classificação do Grupo 6
    console.log("\n=== TESTE GRUPO 6 (Traços de Personalidade - POSITIVA) ===");
    console.log("Média: 93.8");
    console.log("Tipo: positiva (quanto maior, melhor)");
    console.log("P33 global: 25.0, P66 global: 75.0");
    console.log(
      "93.8 > 75.0 (P66)? ",
      93.8 > 75.0,
      "→ Resultado esperado: BAIXO RISCO (VERDE)"
    );

    // Testar classificação do Grupo 10
    console.log("\n=== TESTE GRUPO 10 (Endividamento - NEGATIVA) ===");
    console.log("Média: 18.8");
    console.log("Tipo: negativa (quanto menor, melhor)");
    console.log("P33 global: 25.0, P66 global: 75.0");
    console.log(
      "18.8 < 25.0 (P33)? ",
      18.8 < 25.0,
      "→ Resultado esperado: BAIXO RISCO (VERDE)"
    );

    // Buscar percentis POR GRUPO (para comparação)
    const perGrupoQuery = `
      SELECT
        r.grupo,
        PERCENTILE_CONT(0.33) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as p33_grupo,
        PERCENTILE_CONT(0.66) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as p66_grupo
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1 AND a.status = 'concluida'
      GROUP BY r.grupo
      ORDER BY r.grupo
    `;

    const perGrupoResult = await client.query(perGrupoQuery, [loteId]);
    console.log("\n=== PERCENTIS POR GRUPO (para referência) ===");
    console.log(JSON.stringify(perGrupoResult.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error("Erro:", err);
    process.exit(1);
  }
}

testClassification();
