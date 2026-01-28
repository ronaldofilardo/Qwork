#!/usr/bin/env node
/**
 * Script de execução de testes para as implementações de cobrança e pagamento
 * Uso: node scripts/tests/run-cobranca-tests.js [opcoes]
 */

const { execSync } = require('child_process');
const path = require('path');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  try {
    log(`\n▶ ${description}`, 'blue');
    log(`  Comando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✓ ${description} - SUCESSO`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - FALHOU`, 'red');
    return false;
  }
}

// Parse argumentos
const args = process.argv.slice(2);
const option = args[0] || 'all';

header('Testes de Cobrança e Pagamento - Sistema QWork');

let success = true;

switch (option) {
  case 'all':
  case 'todos':
    log('Executando TODOS os testes de cobrança e pagamento...', 'bright');
    success =
      runCommand(
        'pnpm test __tests__/api/contrato-id-validation.test.ts --forceExit',
        'Validação de ID do Contrato'
      ) &&
      runCommand(
        'pnpm test __tests__/api/verificar-pagamento.test.ts --forceExit',
        'Verificação de Pagamento'
      ) &&
      runCommand(
        'pnpm test __tests__/api/gerar-link-plano-fixo.test.ts --forceExit',
        'Geração de Link Plano Fixo'
      ) &&
      runCommand(
        'pnpm test __tests__/api/cobranca-dashboard.test.ts --forceExit',
        'Dashboard de Cobrança'
      ) &&
      runCommand(
        'pnpm test __tests__/api/cobranca-parcelas.test.ts --forceExit',
        'Gestão de Parcelas'
      ) &&
      runCommand(
        'pnpm test __tests__/integration/payment-retry-e2e.test.ts --forceExit',
        'Teste E2E - Fluxo de Retry'
      );
    break;

  case 'id':
  case 'validation':
    success = runCommand(
      'pnpm test __tests__/api/contrato-id-validation.test.ts --forceExit',
      'Validação de ID do Contrato'
    );
    break;

  case 'verify':
  case 'verificar':
    success = runCommand(
      'pnpm test __tests__/api/verificar-pagamento.test.ts --forceExit',
      'Verificação de Pagamento'
    );
    break;

  case 'link':
  case 'gerar':
    success = runCommand(
      'pnpm test __tests__/api/gerar-link-plano-fixo.test.ts --forceExit',
      'Geração de Link Plano Fixo'
    );
    break;

  case 'dashboard':
    success = runCommand(
      'pnpm test __tests__/api/cobranca-dashboard.test.ts --forceExit',
      'Dashboard de Cobrança'
    );
    break;

  case 'parcelas':
    success = runCommand(
      'pnpm test __tests__/api/cobranca-parcelas.test.ts --forceExit',
      'Gestão de Parcelas'
    );
    break;

  case 'e2e':
  case 'integration':
    success = runCommand(
      'pnpm test __tests__/integration/payment-retry-e2e.test.ts --forceExit',
      'Teste E2E - Fluxo de Retry'
    );
    break;

  case 'coverage':
  case 'cobertura':
    log('Executando testes com cobertura...', 'bright');
    success = runCommand(
      'pnpm test __tests__/api/contrato-id-validation.test.ts __tests__/api/verificar-pagamento.test.ts __tests__/api/gerar-link-plano-fixo.test.ts __tests__/api/cobranca-dashboard.test.ts __tests__/api/cobranca-parcelas.test.ts __tests__/integration/payment-retry-e2e.test.ts --coverage',
      'Testes com Cobertura'
    );
    break;

  case 'watch':
    log('Executando testes em modo watch...', 'bright');
    runCommand(
      'pnpm test __tests__/api/contrato-id-validation.test.ts __tests__/api/verificar-pagamento.test.ts __tests__/api/gerar-link-plano-fixo.test.ts __tests__/api/cobranca-dashboard.test.ts __tests__/api/cobranca-parcelas.test.ts __tests__/integration/payment-retry-e2e.test.ts --watch',
      'Testes em Modo Watch'
    );
    break;

  case 'help':
  case 'ajuda':
  case '-h':
  case '--help':
    log('Opções disponíveis:', 'bright');
    console.log('');
    console.log('  all, todos       - Executar todos os testes (padrão)');
    console.log('  id, validation   - Testes de validação de ID');
    console.log('  verify, verificar- Testes de verificação de pagamento');
    console.log('  link, gerar      - Testes de geração de link');
    console.log('  dashboard        - Testes do dashboard de cobrança');
    console.log('  parcelas         - Testes de gestão de parcelas');
    console.log('  e2e, integration - Teste E2E completo');
    console.log('  coverage         - Executar com cobertura');
    console.log('  watch            - Executar em modo watch');
    console.log('  help, ajuda      - Mostrar esta ajuda');
    console.log('');
    log('Exemplos:', 'yellow');
    console.log('  node scripts/tests/run-cobranca-tests.js');
    console.log('  node scripts/tests/run-cobranca-tests.js e2e');
    console.log('  node scripts/tests/run-cobranca-tests.js coverage');
    console.log('');
    break;

  default:
    log(`Opção desconhecida: ${option}`, 'red');
    log('Use "help" para ver as opções disponíveis', 'yellow');
    success = false;
}

// Resumo final
if (option !== 'help' && option !== 'ajuda' && option !== 'watch') {
  header('Resumo da Execução');
  if (success) {
    log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!', 'green');
    log(
      '\nSistema de cobrança e pagamento validado e funcionando corretamente.',
      'bright'
    );
  } else {
    log('❌ ALGUNS TESTES FALHARAM', 'red');
    log(
      '\nVerifique os erros acima e consulte a documentação em docs/testes/',
      'yellow'
    );
  }
  console.log('');
}

process.exit(success ? 0 : 1);
