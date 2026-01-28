import { config } from "dotenv";
config({ path: ".env.development" });

async function testPendencias() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/rh/pendencias?empresa_id=1"
    );
    const data = await response.json();

    console.log("Total de anomalias:", data.anomalias.length);
    console.log("Primeiras anomalias:");
    data.anomalias.slice(0, 3).forEach((a) => {
      console.log(`- ${a.nome}: ${a.categoria_anomalia} (${a.prioridade})`);
    });

    console.log("\nTestando filtro categoria = NUNCA_AVALIADO:");
    const nuncaAvaliados = data.anomalias.filter(
      (a) => a.categoria_anomalia === "NUNCA_AVALIADO"
    );
    console.log("Encontrados:", nuncaAvaliados.length);
    nuncaAvaliados.forEach((a) => console.log(`- ${a.nome}`));

    console.log(
      "\nTestando filtro prioridade = todas e categoria = nunca avaliado:"
    );
    const filtroTodasNuncaAvaliado = data.anomalias.filter(
      (a) =>
        (a.prioridade === "todas" || true) && // prioridade = todas sempre passa
        a.categoria_anomalia === "NUNCA_AVALIADO"
    );
    console.log("Encontrados:", filtroTodasNuncaAvaliado.length);
    filtroTodasNuncaAvaliado.forEach((a) => console.log(`- ${a.nome}`));
  } catch (error) {
    console.error("Erro:", error);
  }
}

testPendencias();
