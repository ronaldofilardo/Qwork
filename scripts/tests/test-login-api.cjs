/**
 * Teste de autenticação via API para gestor de entidade
 * Empresa Teste Ltda - CPF: 87545772920 - Senha: 000199
 */

async function testarLoginAPI() {
  console.log('='.repeat(70));
  console.log('TESTE DE AUTENTICAÇÃO VIA API - GESTOR DE ENTIDADE');
  console.log('='.repeat(70));

  const cpf = '87545772920';
  const senha = '000199';

  console.log('\n📋 Dados do Login:');
  console.log(`   CPF: ${cpf}`);
  console.log(`   Senha: ${senha}`);
  console.log(`   Endpoint: http://localhost:3000/api/auth/login`);

  try {
    console.log('\n🔄 Enviando requisição POST...\n');

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf, senha }),
    });

    const data = await response.json();

    console.log('📊 Resposta da API:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.success) {
      console.log('\n✅ SUCESSO! Login realizado com sucesso!');
      console.log(`   Nome: ${data.nome}`);
      console.log(`   Perfil: ${data.perfil}`);
      console.log(`   Redirect: ${data.redirectTo}`);
      console.log('\n🎉 O gestor pode acessar a plataforma!');
    } else {
      console.log('\n❌ FALHA! Login não autorizado.');
      console.log(`   Erro: ${data.error || 'Erro desconhecido'}`);
      if (data.detalhes) {
        console.log(`   Detalhes: ${data.detalhes}`);
      }
    }
  } catch (error) {
    console.error('\n❌ ERRO ao fazer requisição:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(70));
}

// Aguardar 2 segundos para o servidor iniciar
setTimeout(() => {
  testarLoginAPI().catch(console.error);
}, 2000);
