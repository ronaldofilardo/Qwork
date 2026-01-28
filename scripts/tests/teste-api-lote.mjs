import fetch from "node-fetch";
import { config } from "dotenv";
config({ path: ".env.development" });

async function testCreateLote() {
  try {
    console.log("🧪 Testando criação de lote através da API...\n");

    // Primeiro, fazer login para obter cookie de sessão
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: "11111111111", senha: "admin123" }),
    });

    if (!loginResponse.ok) {
      console.log("❌ Falha no login - servidor pode não estar rodando");
      return;
    }

    const cookies = loginResponse.headers.get("set-cookie");
    console.log("✅ Login realizado com sucesso");

    // Agora tentar criar um lote
    const createResponse = await fetch(
      "http://localhost:3000/api/rh/liberar-lote",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify({
          clinica_id: 1,
          tamanho_lote: 5,
          nome_lote: "Teste Correção Função",
        }),
      }
    );

    const result = await createResponse.json();

    if (createResponse.ok) {
      console.log("✅ Lote criado com sucesso!");
      console.log("📋 Detalhes:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Erro ao criar lote:", result.error);
    }
  } catch (error) {
    console.log("❌ Erro na requisição:", error.message);
  }
}

testCreateLote();
