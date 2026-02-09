/**
 * Script de teste para verificar login de gestor
 * Execução: node scripts/tests/test-gestor-entidade-login.js
 */

const BASE_URL = 'http://localhost:3000';
const TEST_CPF = '87545772920';
const TEST_PASSWORD = '123456'; // Ajuste conforme a senha do usuário

async function testGestorEntidadeLogin() {
  console.log('🧪 Testando login de gestor...\n');

  try {
    // 1. Fazer login
    console.log('📝 Fazendo login com CPF:', TEST_CPF);
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: TEST_CPF, senha: TEST_PASSWORD }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login falhou: ${error.error}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido:', {
      nome: loginData.nome,
      perfil: loginData.perfil,
      redirectTo: loginData.redirectTo,
    });

    // Extrair cookie de sessão
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('Cookie de sessão não retornado');
    }

    // 2. Verificar sessão
    console.log('\n🔍 Verificando sessão...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: cookies },
    });

    if (!sessionResponse.ok) {
      throw new Error('Erro ao buscar sessão');
    }

    const sessionData = await sessionResponse.json();
    console.log('✅ Sessão válida:', {
      nome: sessionData.nome,
      perfil: sessionData.perfil,
      tomador_id: sessionData.tomador_id,
    });

    // 3. Validações
    console.log('\n✔️ Validações:');

    if (sessionData.perfil !== 'gestor') {
      console.error(
        '❌ ERRO: Perfil deveria ser "gestor", mas é:',
        sessionData.perfil
      );
      return false;
    }
    console.log('  ✓ Perfil correto: gestor');

    if (!sessionData.tomador_id) {
      console.error('❌ ERRO: tomador_id não está presente na sessão');
      return false;
    }
    console.log('  ✓ tomador_id presente:', sessionData.tomador_id);

    if (loginData.redirectTo !== '/entidade') {
      console.error(
        '❌ ERRO: redirectTo deveria ser "/entidade", mas é:',
        loginData.redirectTo
      );
      return false;
    }
    console.log('  ✓ redirectTo correto: /entidade');

    console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
    return true;
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    return false;
  }
}

// Executar teste
testGestorEntidadeLogin()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
