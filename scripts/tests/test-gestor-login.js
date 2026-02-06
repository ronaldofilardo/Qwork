/**
 * Script de teste para validar o login de gestor
 * Testa o caso do CPF 87545772920 (RONALDO FILARDO)
 *
 * Executar: node scripts/tests/test-gestor-login.js
 */

const CPF_TESTE = '87545772920';
const SENHA_TESTE = '000170'; // Ajustar conforme senha real

async function testarLogin() {
  console.log('='.repeat(60));
  console.log('TESTE DE LOGIN - GESTOR ENTIDADE');
  console.log('='.repeat(60));
  console.log(`CPF: ${CPF_TESTE}`);
  console.log(`Senha: ${'*'.repeat(SENHA_TESTE.length)}`);
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf: CPF_TESTE,
        senha: SENHA_TESTE,
      }),
    });

    const data = await response.json();

    console.log('STATUS:', response.status);
    console.log('RESPOSTA:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ LOGIN BEM-SUCEDIDO');
      console.log('');
      console.log('VALIDAÇÃO:');

      if (data.perfil === 'gestor') {
        console.log('  ✅ Perfil correto: gestor');
      } else {
        console.log(`  ❌ Perfil incorreto: ${data.perfil} (esperado: gestor)`);
      }

      if (data.redirectTo === '/entidade') {
        console.log('  ✅ Redirecionamento correto: /entidade');
      } else {
        console.log(
          `  ❌ Redirecionamento incorreto: ${data.redirectTo} (esperado: /entidade)`
        );
      }

      console.log('');

      if (data.perfil === 'gestor' && data.redirectTo === '/entidade') {
        console.log('🎉 TESTE PASSOU! Correção funcionando corretamente.');
      } else {
        console.log('⚠️  TESTE FALHOU! Verificar implementação.');
      }
    } else {
      console.log('❌ ERRO NO LOGIN');
      console.log('Mensagem:', data.error || 'Erro desconhecido');

      if (data.codigo === 'PAGAMENTO_PENDENTE') {
        console.log('⚠️  Pagamento pendente para o contratante.');
      }
    }
  } catch (error) {
    console.log('❌ ERRO NA REQUISIÇÃO');
    console.error(error.message);
    console.log('');
    console.log(
      'DICA: Certifique-se de que o servidor está rodando (pnpm dev)'
    );
  }

  console.log('='.repeat(60));
}

// Executar teste
testarLogin();
