/**
 * Test script para validar login de gestor_entidade
 * CPF: 10932052029
 * Senha: 000186 (últimos 6 dígitos do CNPJ 89588920000186)
 */

async function testLogin() {
  const baseUrl = 'http://localhost:3000';

  console.log('\n🔐 Testando login de gestor_entidade...\n');

  const loginData = {
    cpf: '10932052029',
    senha: '000186',
  };

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Login realizado com sucesso!');
      console.log('Perfil:', result.perfil);
      console.log('Nome:', result.nome);
    } else {
      console.log('\n❌ Falha no login');
      console.log('Erro:', result.error || result.message);
    }
  } catch (error) {
    console.error('\n❌ Erro ao executar teste:', error);
  }
}

testLogin();
