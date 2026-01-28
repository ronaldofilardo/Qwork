const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres:123456@localhost:5432/nr-bps_db",
});

// Simular a lógica de cálculo
function calcularPercentil(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function determinarCategoriaRisco(media, tipo, percentil33, percentil66) {
  if (tipo === "positiva") {
    // Para escalas positivas: quanto maior, melhor
    if (media > percentil66) return "baixo";
    if (media >= percentil33) return "medio";
    return "alto";
  } else {
    // Para escalas negativas: quanto menor, melhor
    if (media < percentil33) return "baixo";
    if (media <= percentil66) return "medio";
    return "alto";
  }
}

function determinarClassificacaoSemaforo(categoriaRisco) {
  switch (categoriaRisco) {
    case "baixo":
      return "verde";
    case "medio":
      return "amarelo";
    case "alto":
      return "vermelho";
  }
}

async function testCalculation() {
  try {
    await client.connect();

    const loteId = 2;

    // Buscar todas as respostas
    const respostasResult = await client.query(
      `
      SELECT r.grupo, r.valor
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1 AND a.status = 'concluida'
      ORDER BY r.grupo, r.valor
    `,
      [loteId]
    );

    // Calcular percentis globais
    const todasRespostas = respostasResult.rows.map((r) => r.valor);
    const percentil33 = calcularPercentil(todasRespostas, 33);
    const percentil66 = calcularPercentil(todasRespostas, 66);

    console.log("\n=== PERCENTIS GLOBAIS CALCULADOS ===");
    console.log("P33:", percentil33);
    console.log("P66:", percentil66);

    // Grupo 6 - Traços de Personalidade (positiva)
    const grupo6 = {
      grupo: 6,
      dominio: "Traços de Personalidade",
      tipo: "positiva",
      media: 93.8,
    };

    const categoria6 = determinarCategoriaRisco(
      grupo6.media,
      grupo6.tipo,
      percentil33,
      percentil66
    );
    const semaforo6 = determinarClassificacaoSemaforo(categoria6);

    console.log("\n=== GRUPO 6 - TRAÇOS DE PERSONALIDADE ===");
    console.log("Tipo:", grupo6.tipo);
    console.log("Média:", grupo6.media);
    console.log("Categoria de Risco:", categoria6);
    console.log("Classificação Semáforo:", semaforo6);
    console.log("Esperado: baixo / verde");
    console.log(
      "CORRETO?",
      categoria6 === "baixo" && semaforo6 === "verde" ? "✅ SIM" : "❌ NÃO"
    );

    // Grupo 10 - Endividamento Financeiro (negativa)
    const grupo10 = {
      grupo: 10,
      dominio: "Endividamento Financeiro",
      tipo: "negativa",
      media: 18.8,
    };

    const categoria10 = determinarCategoriaRisco(
      grupo10.media,
      grupo10.tipo,
      percentil33,
      percentil66
    );
    const semaforo10 = determinarClassificacaoSemaforo(categoria10);

    console.log("\n=== GRUPO 10 - ENDIVIDAMENTO FINANCEIRO ===");
    console.log("Tipo:", grupo10.tipo);
    console.log("Média:", grupo10.media);
    console.log("Categoria de Risco:", categoria10);
    console.log("Classificação Semáforo:", semaforo10);
    console.log("Esperado: baixo / verde");
    console.log(
      "CORRETO?",
      categoria10 === "baixo" && semaforo10 === "verde" ? "✅ SIM" : "❌ NÃO"
    );

    await client.end();
  } catch (err) {
    console.error("Erro:", err);
    process.exit(1);
  }
}

testCalculation();
