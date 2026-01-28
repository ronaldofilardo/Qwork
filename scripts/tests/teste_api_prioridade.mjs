import fetch from "node-fetch";

async function testarAPIInativacaoPrioridadeAlta() {
  const baseURL = "http://localhost:3000";
  const avaliacaoId = 395; // ID da avaliação com prioridade ALTA

  console.log("🧪 Testando API de inativação com avaliação de prioridade ALTA");
  console.log(`   Avaliação ID: ${avaliacaoId}`);

  try {
    // Primeiro, fazer login para obter sessão
    console.log("\n🔐 Fazendo login...");
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cpf: "11111111111", // RH user
        senha: "123456",
      }),
    });

    if (!loginResponse.ok) {
      console.log("❌ Falha no login");
      return;
    }

    const loginData = await loginResponse.json();
    console.log("✅ Login realizado com sucesso");

    // Obter cookies da resposta
    const cookies = loginResponse.headers.get("set-cookie");
    if (!cookies) {
      console.log("❌ Nenhum cookie de sessão encontrado");
      return;
    }

    // Extrair session cookie
    const sessionCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("session="));

    // Testar a API de validação de inativação
    console.log("\n🔍 Testando validação de inativação...");
    const validacaoResponse = await fetch(
      `${baseURL}/api/avaliacoes/inativar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          avaliacaoId: avaliacaoId,
          apenasValidar: true, // Modo de validação
        }),
      }
    );

    const validacaoData = await validacaoResponse.json();

    console.log("📊 Resposta da validação:");
    console.log(`   Status: ${validacaoResponse.status}`);
    console.log(`   Sucesso: ${validacaoData.success}`);
    console.log(`   Mensagem: ${validacaoData.message || "N/A"}`);
    console.log(
      `   Aviso prioridade: ${
        validacaoData.aviso_prioridade ? "SIM ✅" : "NÃO ❌"
      }`
    );

    if (validacaoData.aviso_prioridade) {
      console.log(
        "\n🎯 SUCESSO! A API detectou prioridade ALTA e retornou aviso!"
      );
      console.log("   O modal deve mostrar o aviso e exigir confirmação.");
    } else {
      console.log("\n❌ FALHA! A API não detectou prioridade ALTA.");
    }

    // Testar inativação real (comentada para não executar)
    console.log(
      "\n⚠️  Para testar a inativação real, descomente o código abaixo:"
    );
    console.log(
      "   // const inativacaoResponse = await fetch(`${baseURL}/api/avaliacoes/inativar`, {"
    );
    console.log("   //   method: 'POST',");
    console.log(
      "   //   headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },"
    );
    console.log(
      "   //   body: JSON.stringify({ avaliacaoId: avaliacaoId, confirmacaoPrioridadeAlta: true })"
    );
    console.log("   // });");
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

testarAPIInativacaoPrioridadeAlta();
