/**
 * Script de teste para login do gestor de entidade
 * Empresa Teste Ltda - CNPJ: 12.345.678/0001-99
 * Gestor: CPF 87545772920 - Senha: 000199
 */

const bcrypt = require('bcryptjs');

async function testarLogin() {
  console.log('='.repeat(60));
  console.log('TESTE DE LOGIN DO GESTOR DE ENTIDADE');
  console.log('='.repeat(60));
  
  // Dados da contratante
  const cnpj = '12.345.678/0001-99';
  const cnpjLimpo = cnpj.replace(/[./-]/g, '');
  const senhaEsperada = cnpjLimpo.slice(-6);
  
  console.log('\n📋 Dados da Contratante:');
  console.log(`   CNPJ: ${cnpj}`);
  console.log(`   CNPJ Limpo: ${cnpjLimpo}`);
  console.log(`   Últimos 6 dígitos: ${senhaEsperada}`);
  
  // Dados do gestor
  const cpf = '87545772920';
  const senha = '000199';
  
  console.log('\n👤 Dados do Gestor:');
  console.log(`   CPF: ${cpf}`);
  console.log(`   Senha: ${senha}`);
  
  // Hash da senha (gerado anteriormente)
  const hashArmazenado = '$2a$10$tz83ww2Zs6zAXYR4qiG2TuBmyUd3wMCLmF4kMi1ylKerNk/1ZrAT6';
  
  console.log('\n🔐 Verificação de Senha:');
  console.log(`   Hash armazenado: ${hashArmazenado}`);
  
  // Testar comparação bcrypt
  const senhaValida = await bcrypt.compare(senha, hashArmazenado);
  
  console.log(`\n✅ Resultado: ${senhaValida ? 'SENHA VÁLIDA ✓' : 'SENHA INVÁLIDA ✗'}`);
  
  if (senhaValida) {
    console.log('\n🎉 O gestor pode fazer login com:');
    console.log(`   CPF: ${cpf}`);
    console.log(`   Senha: ${senha}`);
  } else {
    console.log('\n❌ Erro: A senha não corresponde ao hash');
  }
  
  // Testar variações comuns de erro
  console.log('\n🔍 Testando possíveis erros comuns:');
  
  // Teste 1: Senha com formatação
  const senhaFormatada = await bcrypt.compare('000-199', hashArmazenado);
  console.log(`   Senha "000-199": ${senhaFormatada ? 'válida' : 'inválida'}`);
  
  // Teste 2: Senha com espaços
  const senhaComEspaco = await bcrypt.compare(' 000199', hashArmazenado);
  console.log(`   Senha " 000199": ${senhaComEspaco ? 'válida' : 'inválida'}`);
  
  // Teste 3: Senha com trim
  const senhaTrim = await bcrypt.compare('000199 ', hashArmazenado);
  console.log(`   Senha "000199 ": ${senhaTrim ? 'válida' : 'inválida'}`);
  
  console.log('\n' + '='.repeat(60));
}

testarLogin().catch(console.error);
