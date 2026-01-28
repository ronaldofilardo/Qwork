/**
 * Testar login do gestor CPF 87545772920 com senha 000170
 */

async function testarLogin() {
  console.log('🔐 TESTE DE LOGIN DO GESTOR\n');
  console.log('📋 Credenciais:');
  console.log('   CPF: 87545772920');
  console.log('   Senha: 000170');
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf: '87545772920',
        senha: '000170',
      }),
    });

    const data = await response.json();

    console.log('📡 Resposta da API:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Body:`, JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.success) {
      console.log('✅ LOGIN BEM SUCEDIDO!');
      console.log(`   Nome: ${data.nome}`);
      console.log(`   Perfil: ${data.perfil}`);
      console.log(`   Redirect: ${data.redirectTo}`);
    } else {
      console.log('❌ LOGIN FALHOU!');
      console.log(`   Erro: ${data.error || 'Desconhecido'}`);
    }
  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
    console.log(
      '\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:3000'
    );
    console.log('   Execute: pnpm dev');
  }
}

testarLogin();
