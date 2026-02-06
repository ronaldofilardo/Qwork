import { criarContaResponsavel } from './lib/db';

// Testar criação de conta gestor
(async () => {
  try {
    console.log('🧪 Testando criação de conta gestor...');

    // Criar conta para entidade ID 34
    await criarContaResponsavel(34);

    console.log('✅ Conta gestor criada com sucesso!');
    console.log('📋 Detalhes:');
    console.log('   CPF: 12345678901');
    console.log('   Senha: 000190 (6 últimos dígitos do CNPJ)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar conta:', error);
    process.exit(1);
  }
})();
