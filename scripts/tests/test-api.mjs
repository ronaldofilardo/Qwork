import fetch from "node-fetch";

async function testAPI() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/avaliacoes/inativar?avaliacao_id=394"
    );
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

testAPI();
