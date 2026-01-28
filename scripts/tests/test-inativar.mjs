import fetch from "node-fetch";

async function testInativar() {
  try {
    // Primeiro, fazer login para obter o cookie
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cpf: "11111111111",
        senha: "123",
      }),
    });

    const loginData = await loginResponse.json();
    console.log("Login response:", loginData);

    if (!loginData.sessionCookie) {
      console.error("Falha no login");
      return;
    }

    // Agora tentar inativar
    const inativarResponse = await fetch(
      "http://localhost:3000/api/avaliacoes/inativar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${loginData.sessionCookie}`,
        },
        body: JSON.stringify({
          avaliacao_id: 392,
          funcionario_cpf: "45645645645",
          motivo: "Teste de correção",
          forcar: false,
        }),
      }
    );

    const inativarData = await inativarResponse.json();
    console.log("Inativar response:", inativarData);
  } catch (error) {
    console.error("Erro:", error);
  }
}

testInativar();
