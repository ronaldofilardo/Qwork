import fetch from "node-fetch";

async function testAPI() {
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
      const errorText = await loginResponse.text();
      console.log("Detalhes:", errorText);
      return;
    }

    console.log("✅ Login realizado!");

    // Pegar os cookies da resposta
    const cookies = loginResponse.headers.get("set-cookie");
    console.log("Cookies recebidos:", cookies ? "Sim" : "Não");

    // Agora testar a API de pendências
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
      const errorText = await pendenciasResponse.text();
      console.log("Detalhes:", errorText);
      return;
    }

    const data = await pendenciasResponse.json();
    console.log("✅ API funcionando!");
    console.log("📊 Total de anomalias:", data.anomalias?.length || 0);

    if (data.anomalias?.length > 0) {
      console.log("📋 Primeira anomalia:");
      console.log(JSON.stringify(data.anomalias[0], null, 2));
    } else {
      console.log("ℹ️ Nenhuma anomalia encontrada");
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testAPI();
