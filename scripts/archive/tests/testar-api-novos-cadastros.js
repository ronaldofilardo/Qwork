// Script de teste manual da API de novos cadastros
// Execute: node scripts/tests/testar-api-novos-cadastros.js

const fetch = require('node-fetch');

async function testar() {
  console.log('\n🔍 TESTANDO API /api/admin/novos-cadastros\n');

  try {
    const url = 'http://localhost:3000/api/admin/novos-cadastros';
    console.log(`📡 Fazendo requisição para: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        Cookie: 'session=teste', // Você precisará pegar um cookie de sessão válido
      },
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}\n`);

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Sucesso! Total de tomadors: ${data.tomadors.length}\n`);
    } else {
      console.log('❌ Erro na resposta:', data);
    }
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

testar();
