#!/usr/bin/env node

/**
 * Quality Regression Detector
 * 
 * Detecta se houve aumento significativo de warnings em relação ao baseline.
 * Usado em CI para alertar sobre regressões de qualidade.
 * 
 * Exit codes:
 * - 0: Sem regressões ou dentro da tolerância
 * - 1: Regressão detectada acima da tolerância
 * 
 * Usage: node scripts/check-quality-regressions.js
 */

const fs = require('fs');
const path = require('path');

// Configuração
const BASELINE_TOTAL = 1687; // Atualizar conforme cleanup avança
const TOLERANCE = 0.10; // 10% de tolerância para variações
const CRITICAL_RULES_TOLERANCE = 0.05; // 5% para regras críticas

// Regras críticas que não devem regredir
const CRITICAL_RULES = [
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-misused-promises',
  '@typescript-eslint/no-unsafe-call',
];

const BASELINE_RULES = {
  '@typescript-eslint/no-unsafe-member-access': 741,
  '@typescript-eslint/no-unsafe-assignment': 471,
  '@typescript-eslint/no-unsafe-argument': 160,
  '@typescript-eslint/no-explicit-any': 84,
  '@typescript-eslint/no-unsafe-call': 61,
  '@typescript-eslint/no-misused-promises': 53,
  '@typescript-eslint/no-floating-promises': 33,
  '@typescript-eslint/no-unused-vars': 32,
  '@typescript-eslint/no-use-before-define': 28,
};

function findLatestReport() {
  const reportsDir = path.join(__dirname, '..', 'logs');
  
  // Cria diretório se não existir
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    return null;
  }
  
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('quality-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  const reportPath = path.join(reportsDir, files[0]);
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function checkRegressions() {
  console.log('\n🔍 Verificando regressões de qualidade...\n');
  
  const report = findLatestReport();
  
  if (!report) {
    console.log('⚠️  Nenhum relatório encontrado.');
    console.log('   Execute: pnpm quality:report\n');
    process.exit(0);
  }

  const currentTotal = report.current.total;
  const currentRules = report.current.rules;
  
  let hasRegressions = false;
  const issues = [];

  // Check 1: Total warnings increase
  const totalIncrease = currentTotal - BASELINE_TOTAL;
  const totalIncreasePercent = (totalIncrease / BASELINE_TOTAL) * 100;
  
  console.log('📊 Análise de Warnings Totais:');
  console.log(`   Baseline: ${BASELINE_TOTAL}`);
  console.log(`   Atual: ${currentTotal}`);
  console.log(`   Mudança: ${totalIncrease >= 0 ? '+' : ''}${totalIncrease} (${totalIncreasePercent.toFixed(1)}%)`);
  
  if (totalIncrease > BASELINE_TOTAL * TOLERANCE) {
    hasRegressions = true;
    issues.push({
      type: 'TOTAL_REGRESSION',
      message: `Aumento total de ${totalIncreasePercent.toFixed(1)}% excede tolerância de ${TOLERANCE * 100}%`,
      severity: 'high'
    });
  } else if (totalIncrease > 0) {
    console.log('   ⚠️  Leve aumento detectado (dentro da tolerância)\n');
  } else {
    console.log('   ✅ Total de warnings reduzido ou estável\n');
  }

  // Check 2: Critical rules regressions
  console.log('🚨 Análise de Regras Críticas:');
  
  CRITICAL_RULES.forEach(rule => {
    const baseline = BASELINE_RULES[rule] || 0;
    const current = currentRules[rule] || 0;
    const increase = current - baseline;
    const increasePercent = baseline > 0 ? (increase / baseline) * 100 : 0;
    
    console.log(`   ${rule}:`);
    console.log(`      Baseline: ${baseline} | Atual: ${current} | Mudança: ${increase >= 0 ? '+' : ''}${increase}`);
    
    if (increase > baseline * CRITICAL_RULES_TOLERANCE) {
      hasRegressions = true;
      issues.push({
        type: 'CRITICAL_RULE_REGRESSION',
        rule,
        message: `Regra crítica "${rule}" aumentou ${increasePercent.toFixed(1)}%`,
        severity: 'critical',
        baseline,
        current
      });
      console.log(`      ❌ REGRESSÃO CRÍTICA detectada!\n`);
    } else if (increase < 0) {
      console.log(`      ✅ Melhoria detectada\n`);
    } else {
      console.log(`      ✓ Estável\n`);
    }
  });

  // Check 3: New rules introduced
  const newRules = Object.keys(currentRules).filter(rule => !BASELINE_RULES[rule]);
  
  if (newRules.length > 0) {
    console.log('🆕 Novas Regras Detectadas:');
    newRules.forEach(rule => {
      console.log(`   ${rule}: ${currentRules[rule]} ocorrências`);
    });
    console.log('   ⚠️  Revisar se estas regras são esperadas\n');
  }

  // Check 4: Per-rule significant increases
  console.log('📈 Análise de Regressões por Regra:');
  
  Object.entries(BASELINE_RULES).forEach(([rule, baseline]) => {
    const current = currentRules[rule] || 0;
    const increase = current - baseline;
    const increasePercent = baseline > 0 ? (increase / baseline) * 100 : 0;
    
    // Apenas reportar aumentos > 20%
    if (increasePercent > 20) {
      console.log(`   ⚠️  ${rule}: +${increasePercent.toFixed(1)}% (${baseline} → ${current})`);
      
      if (!CRITICAL_RULES.includes(rule)) {
        issues.push({
          type: 'RULE_REGRESSION',
          rule,
          message: `Regra "${rule}" aumentou ${increasePercent.toFixed(1)}%`,
          severity: 'medium',
          baseline,
          current
        });
      }
    }
  });
  
  if (issues.filter(i => i.type === 'RULE_REGRESSION').length === 0) {
    console.log('   ✅ Nenhuma regressão significativa por regra\n');
  } else {
    console.log('');
  }

  // Summary and decision
  console.log('========================================');
  console.log('📋 Sumário:');
  console.log('========================================\n');
  
  if (hasRegressions) {
    console.log('❌ REGRESSÕES DETECTADAS:\n');
    
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      if (issue.rule) {
        console.log(`   Regra: ${issue.rule}`);
        console.log(`   Baseline: ${issue.baseline} | Atual: ${issue.current}`);
      }
      console.log('');
    });
    
    console.log('🔧 Ações Recomendadas:');
    console.log('   1. Revise as mudanças recentes no código');
    console.log('   2. Execute: pnpm lint:fix (para correções automáticas)');
    console.log('   3. Verifique se há novos `any` ou promessas não aguardadas');
    console.log('   4. Considere reverter mudanças que introduziram regressões\n');
    
    console.log('⚠️  Este PR pode ser bloqueado até que as regressões sejam resolvidas.\n');
    
    process.exit(1);
  } else {
    console.log('✅ Nenhuma regressão significativa detectada');
    
    if (totalIncrease < 0) {
      const improvement = Math.abs(totalIncrease);
      const improvementPercent = Math.abs(totalIncreasePercent);
      console.log(`🎉 Melhoria de ${improvement} warnings (${improvementPercent.toFixed(1)}%) - Excelente trabalho!\n`);
    } else if (totalIncrease === 0) {
      console.log('✓ Qualidade de código mantida estável\n');
    } else {
      console.log('✓ Aumento leve dentro da tolerância aceitável\n');
    }
    
    process.exit(0);
  }
}

// Executar
if (require.main === module) {
  try {
    checkRegressions();
  } catch (error) {
    console.error('❌ Erro ao verificar regressões:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { checkRegressions };
