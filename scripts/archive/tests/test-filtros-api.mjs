import fetch from "node-fetch";

async function testFiltrosAPI() {
  try {
    console.log("🔐 Fazendo login com RH...");

    // Primeiro, fazer login
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perfil: "rh",
        cpf: "11111111111", // Gestor RH
        senha: "123",
      }),
    });

    if (!loginResponse.ok) {
      console.log("❌ Erro no login:", loginResponse.status);
      return;
    }

    console.log("✅ Login realizado!");

    // Pegar os cookies da resposta
    const cookies = loginResponse.headers.get("set-cookie");

    // Testar a API de pendências
    console.log("📋 Testando API de pendências...");
    const pendenciasResponse = await fetch(
      "http://localhost:3000/api/rh/pendencias?empresa_id=1",
      {
        headers: {
          Cookie: cookies || "",
        },
      }
    );

    if (!pendenciasResponse.ok) {
      console.log("❌ Erro na API:", pendenciasResponse.status);
      return;
    }

    const data = await pendenciasResponse.json();
    console.log("✅ API funcionando!");
    console.log("📊 Total de anomalias:", data.anomalias?.length || 0);

    // Analisar as anomalias
    const anomalias = data.anomalias || [];
    console.log("\n📋 Distribuição por categoria:");
    const categorias = {};
    anomalias.forEach((a) => {
      categorias[a.categoria_anomalia] =
        (categorias[a.categoria_anomalia] || 0) + 1;
    });
    Object.entries(categorias).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count}`);
    });

    // Verificar se há "NUNCA_AVALIADO"
    const nuncaAvaliados = anomalias.filter(
      (a) => a.categoria_anomalia === "NUNCA_AVALIADO"
    );
    console.log(
      `\n🎯 Funcionários "Nunca Avaliados": ${nuncaAvaliados.length}`
    );
    nuncaAvaliados.forEach((a, i) => {
      console.log(`${i + 1}. ${a.nome} (${a.cpf}) - ${a.mensagem}`);
    });

    // Simular filtro do frontend: prioridade = todas, categoria = nunca avaliado
    console.log(
      '\n🎯 Simulando filtro: prioridade = "todas", categoria = "nunca avaliado"'
    );
    const filtroResultado = anomalias.filter(
      (a) =>
        true && // prioridade = todas sempre passa
        a.categoria_anomalia === "NUNCA_AVALIADO"
    );
    console.log(`Encontrados: ${filtroResultado.length}`);
    filtroResultado.forEach((a, i) => {
      console.log(
        `${i + 1}. ${a.nome} (${a.cpf}) - Prioridade: ${a.prioridade}`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testFiltrosAPI();
