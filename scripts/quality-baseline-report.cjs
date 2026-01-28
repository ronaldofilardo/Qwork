#!/usr/bin/env node

/**
 * Quality Baseline Report Generator
 * 
 * Gera relatório atualizado de warnings ESLint e compara com baseline documentado.
 * Usado para tracking de progresso na migração de qualidade.
 * 
 * Usage: node scripts/quality-baseline-report.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Baseline documentado (16/12/2025)
const BASELINE = {
  date: '2025-12-16',
  total: 1687,
  rules: {
    '@typescript-eslint/no-unsafe-member-access': 741,
    '@typescript-eslint/no-unsafe-assignment': 471,
    '@typescript-eslint/no-unsafe-argument': 160,
    '@typescript-eslint/no-explicit-any': 84,
    '@typescript-eslint/no-unsafe-call': 61,
    '@typescript-eslint/no-misused-promises': 53,
    '@typescript-eslint/no-floating-promises': 33,
    '@typescript-eslint/no-unused-vars': 32,
    '@typescript-eslint/no-use-before-define': 28,
    '@typescript-eslint/no-unsafe-return': 12,
    '@typescript-eslint/require-await': 10,
    '@typescript-eslint/await-thenable': 4,
    '@typescript-eslint/restrict-plus-operands': 4,
  },
};

// Metas por Sprint
const SPRINT_TARGETS = [
  { 
    name: 'Sprint 1', 
    weeks: '1-2',
    focus: 'Floating Promises & Misused Promises',
    target: 86,
    rules: ['@typescript-eslint/no-floating-promises', '@typescript-eslint/no-misused-promises']
  },
  { 
    name: 'Sprint 2', 
    weeks: '3-4',
    focus: 'Unsafe Calls & Returns',
    target: 73,
    rules: ['@typescript-eslint/no-unsafe-call', '@typescript-eslint/no-unsafe-return']
  },
  { 
    name: 'Sprint 3', 
    weeks: '5-6',
    focus: 'Unsafe Arguments & Assignments (Phase 1)',
    target: 280,
    rules: ['@typescript-eslint/no-unsafe-argument']
  },
];

function getCurrentWarnings() {
  try {
    console.log('🔍 Executando lint para coletar warnings atuais...\n');
    
    // Executa lint (não build) para capturar warnings ESLint
    const output = execSync('pnpm run lint:full 2>&1', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Extrai regras do output
    const rulePattern = /@([\w\-\/]+)/g;
    const matches = output.match(rulePattern) || [];
    
    // Conta ocorrências
    const counts = {};
    matches.forEach(match => {
      // Remove o @ do início
      const rule = match.startsWith('@') ? match : `@${match}`;
      counts[rule] = (counts[rule] || 0) + 1;
    });

    // Remove artifacts
    delete counts['@1'];

    return counts;
  } catch (error) {
    // Lint pode falhar com warnings, mas queremos o output mesmo assim
    if (error.stdout || error.stderr) {
      const output = (error.stdout || '') + (error.stderr || '');
      const rulePattern = /@([\w\-\/]+)/g;
      const matches = output.match(rulePattern) || [];
      
      const counts = {};
      matches.forEach(match => {
        const rule = match.startsWith('@') ? match : `@${match}`;
        counts[rule] = (counts[rule] || 0) + 1;
      });
      
      delete counts['@1'];
      return counts;
    }
    
    console.error('❌ Erro ao executar lint:', error.message);
    return {};
  }
}

function calculateTotal(counts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function formatChange(current, baseline) {
  const diff = current - baseline;
  const percentage = baseline > 0 ? ((diff / baseline) * 100).toFixed(1) : 0;
  
  if (diff < 0) {
    return `${diff} (${percentage}%) ✅`;
  } else if (diff > 0) {
    return `+${diff} (+${percentage}%) ⚠️`;
  }
  return 'sem mudança ✓';
}

function formatRuleChange(ruleName, current, baseline) {
  const diff = current - baseline;
  
  if (diff < 0) {
    return `${current} (↓${Math.abs(diff)}) ✅`;
  } else if (diff > 0) {
    return `${current} (↑${diff}) ⚠️`;
  }
  return `${current} (=)`;
}

function calculateSprintProgress(currentCounts, sprint) {
  const currentTotal = sprint.rules.reduce((sum, rule) => {
    return sum + (currentCounts[rule] || 0);
  }, 0);
  
  const baselineTotal = sprint.rules.reduce((sum, rule) => {
    return sum + (BASELINE.rules[rule] || 0);
  }, 0);
  
  const fixed = Math.max(0, baselineTotal - currentTotal);
  const progress = baselineTotal > 0 ? (fixed / baselineTotal * 100).toFixed(1) : 0;
  
  return { currentTotal, baselineTotal, fixed, progress };
}

function generateReport() {
  console.log('\n========================================');
  console.log('📊 Quality Baseline Report');
  console.log('========================================\n');
  
  const currentCounts = getCurrentWarnings();
  const currentTotal = calculateTotal(currentCounts);
  
  console.log(`📅 Data do baseline: ${BASELINE.date}`);
  console.log(`📅 Data atual: ${new Date().toISOString().split('T')[0]}\n`);
  
  console.log('📈 Resumo Geral:');
  console.log(`   Total de warnings: ${currentTotal}`);
  console.log(`   Baseline: ${BASELINE.total}`);
  console.log(`   Mudança: ${formatChange(currentTotal, BASELINE.total)}\n`);
  
  console.log('🔝 Top 10 Regras (ordenado por ocorrências):');
  
  // Ordena por contagem atual
  const sortedRules = Object.entries(currentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  sortedRules.forEach(([rule, count]) => {
    const baseline = BASELINE.rules[rule] || 0;
    console.log(`   ${rule}: ${formatRuleChange(rule, count, baseline)}`);
  });
  
  console.log('\n🎯 Progresso dos Sprints:\n');
  
  SPRINT_TARGETS.forEach((sprint, index) => {
    const progress = calculateSprintProgress(currentCounts, sprint);
    const status = progress.progress >= 100 ? '✅ Completo' : 
                   progress.progress >= 50 ? '🟡 Em progresso' : 
                   '🔴 Não iniciado';
    
    console.log(`   ${sprint.name} (Semanas ${sprint.weeks}): ${status}`);
    console.log(`   Foco: ${sprint.focus}`);
    console.log(`   Progresso: ${progress.fixed}/${progress.baselineTotal} corrigidos (${progress.progress}%)`);
    console.log(`   Restante: ${progress.currentTotal} warnings\n`);
  });
  
  // Identificar regressões
  const regressions = [];
  Object.entries(BASELINE.rules).forEach(([rule, baselineCount]) => {
    const currentCount = currentCounts[rule] || 0;
    if (currentCount > baselineCount) {
      regressions.push({ rule, baseline: baselineCount, current: currentCount });
    }
  });
  
  if (regressions.length > 0) {
    console.log('⚠️  REGRESSÕES DETECTADAS:\n');
    regressions.forEach(({ rule, baseline, current }) => {
      console.log(`   ${rule}: ${baseline} → ${current} (+${current - baseline})`);
    });
    console.log('\n   Por favor, revise estas mudanças antes do merge.\n');
  }
  
  // Identificar novas regras
  const newRules = Object.keys(currentCounts).filter(rule => !BASELINE.rules[rule]);
  if (newRules.length > 0) {
    console.log('🆕 Novas regras detectadas:\n');
    newRules.forEach(rule => {
      console.log(`   ${rule}: ${currentCounts[rule]}`);
    });
    console.log('\n');
  }
  
  console.log('========================================');
  console.log('💡 Próximos Passos:');
  console.log('========================================\n');
  console.log('1. Revisar o plano em docs/QUALITY_BASELINE_PLAN.md');
  console.log('2. Escolher arquivos do sprint atual para limpar');
  console.log('3. Aplicar correções e mover para strict mode');
  console.log('4. Executar: pnpm quality:check');
  console.log('5. Commit e abrir PR com prefixo [Quality]\n');
  
  // Salvar relatório em arquivo
  const reportPath = path.join(__dirname, '..', 'logs', `quality-report-${new Date().toISOString().split('T')[0]}.json`);
  const reportData = {
    date: new Date().toISOString(),
    baseline: BASELINE,
    current: {
      total: currentTotal,
      rules: currentCounts,
    },
    regressions,
    newRules: newRules.map(rule => ({ rule, count: currentCounts[rule] })),
    sprints: SPRINT_TARGETS.map(sprint => ({
      ...sprint,
      progress: calculateSprintProgress(currentCounts, sprint),
    })),
  };
  
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📝 Relatório salvo em: ${reportPath}\n`);
  } catch (error) {
    console.warn(`⚠️  Não foi possível salvar relatório: ${error.message}\n`);
  }
}

// Executar
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };
