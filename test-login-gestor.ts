import 'dotenv/config';

async function testGestorLogin() {
  console.log('🔐 Testando login do gestor...\n');

  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: '12345678901',
      senha: '000190',
    }),
  });

  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);

  const data = await response.json();
  console.log('\nResposta:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('\n✅ Login realizado com sucesso!');
  } else {
    console.log('\n❌ Erro no login');
  }
}

testGestorLogin().catch(console.error);
