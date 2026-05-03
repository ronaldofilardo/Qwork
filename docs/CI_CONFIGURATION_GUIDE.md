# CI/CD Configuration Guide - Breaking the Loop

## 🎯 Objetivo

Configurar pipeline CI/CD que **separa concerns** (build, lint, type-check) e **previne o loop** de warnings/erros, permitindo deploys contínuos enquanto se melhora a qualidade gradualmente.

---

## 📋 Princípios Fundamentais

1. **Build de produção nunca é bloqueado por warnings de lint**
2. **PRs têm checks de qualidade mais rigorosos que deploys**
3. **Métricas de qualidade são rastreadas, não bloqueantes (inicialmente)**
4. **Regressions são detectadas e reportadas**

---

## 🔧 Configuração Recomendada

### CI workflows (`workflows/`)

#### 1. Workflow Principal: `ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ============================================
  # JOB 1: Build de Produção (MUST PASS)
  # ============================================
  build:
    name: Production Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build for Production
        run: pnpm run build:prod
        # ✅ Este job DEVE passar sempre - bloqueia deploy se falhar

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next/
          retention-days: 1

  # ============================================
  # JOB 2: Quality Checks (Informativo para PRs)
  # ============================================
  quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    # Não bloqueia merge, mas reporta status
    continue-on-error: true

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type Check
        run: pnpm run type-check
        continue-on-error: true

      - name: Lint with baseline tolerance
        run: pnpm run lint:ci
        # Permite até 2000 warnings (baseline)

      - name: Generate Quality Report
        run: pnpm run quality:report

      - name: Check for regressions
        run: |
          # Script customizado que falha se houver +10% de aumento em warnings
          node scripts/check-quality-regressions.js
        continue-on-error: true

  # ============================================
  # JOB 3: Tests (MUST PASS)
  # ============================================
  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm run test
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

#### 2. Workflow de Deploy: `deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
        # ✅ Vercel executa `pnpm build` internamente
        # Warnings de lint NÃO bloqueiam o deploy
```

#### 3. Workflow Semanal: `quality-report.yml`

```yaml
name: Weekly Quality Report

on:
  schedule:
    # Toda segunda-feira às 9h
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  report:
    name: Generate Quality Metrics
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Report
        run: pnpm run quality:report > report.txt

      - name: Post to Slack (opcional)
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Weekly Quality Report disponível",
              "attachments": [
                {
                  "text": "${{ steps.report.outputs.summary }}"
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🛡️ Branch Protection Rules

### Para `main` branch:

```yaml
# Settings > Branches > Branch protection rules

✅ Require status checks to pass before merging:
  - build (production build)
  - test (unit tests)

⚠️  quality (opcional - informativo apenas):
  - Continue mesmo se falhar
  - Mostra status no PR mas não bloqueia

✅ Require branches to be up to date before merging

✅ Require pull request reviews: 1 aprovação

❌ NÃO exigir "lint" ou "type-check" como bloqueantes
   (estratégia baseline permite warnings)
```

---

## 🚀 Configuração Vercel

### Build Settings no Dashboard:

```bash
# Build Command (Vercel)
pnpm run build

# Install Command
pnpm install --frozen-lockfile

# Environment Variables
NODE_ENV=production
DATABASE_URL=<neon-connection-string>
SESSION_SECRET=<secret>
```

### Comportamento esperado:

- ✅ Warnings de ESLint **não bloqueiam** o build da Vercel
- ✅ Build só falha se `next build` retornar exit code ≠ 0
- ✅ Deploys automáticos em cada push para `main`
- ⚠️ Preview deploys em PRs (sem bloqueio por warnings)

---

## 📊 Scripts de Qualidade (package.json)

Configurações já aplicadas:

```json
{
  "scripts": {
    "build": "next build",
    "build:prod": "next build",
    "type-check": "tsc --noEmit",
    "lint": "eslint \"app/**\" \"lib/**\" \"components/**\"",
    "lint:fix": "eslint ... --fix",
    "lint:ci": "next lint --max-warnings 2000",
    "quality:check": "pnpm type-check && pnpm lint",
    "quality:report": "node scripts/quality-baseline-report.js"
  }
}
```

---

## 🔍 Script de Detecção de Regressões

Criar `scripts/check-quality-regressions.js`:

```javascript
#!/usr/bin/env node

/**
 * Detecta se houve aumento significativo de warnings
 * Exit code 1 se regression > 10%
 */

const fs = require('fs');
const path = require('path');

const BASELINE_TOTAL = 1687; // Atualizar conforme cleanup avança
const TOLERANCE = 0.1; // 10% de tolerância

// Lê o último relatório gerado
const reportsDir = path.join(__dirname, '..', 'logs');
const files = fs
  .readdirSync(reportsDir)
  .filter((f) => f.startsWith('quality-report-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('⚠️  Nenhum relatório encontrado - executando quality:report...');
  process.exit(0);
}

const latestReport = JSON.parse(
  fs.readFileSync(path.join(reportsDir, files[0]), 'utf8')
);

const currentTotal = latestReport.current.total;
const increase = currentTotal - BASELINE_TOTAL;
const increasePercent = (increase / BASELINE_TOTAL) * 100;

console.log(`📊 Baseline: ${BASELINE_TOTAL}`);
console.log(`📊 Atual: ${currentTotal}`);
console.log(
  `📊 Mudança: ${increase >= 0 ? '+' : ''}${increase} (${increasePercent.toFixed(1)}%)`
);

if (increase > BASELINE_TOTAL * TOLERANCE) {
  console.error(
    `❌ REGRESSÃO DETECTADA: Aumento de ${increasePercent.toFixed(1)}% excede tolerância de ${TOLERANCE * 100}%`
  );
  console.error('   Por favor, revise as mudanças antes do merge.');
  process.exit(1);
}

console.log('✅ Sem regressões significativas detectadas');
process.exit(0);
```

---

## 📋 Checklist de Implementação

### Fase 1: Setup Inicial (Hoje)

- [x] Atualizar `package.json` com scripts separados
- [x] Configurar `.eslintrc.cjs` com baseline e overrides
- [x] Criar documentação (`QUALITY_BASELINE_PLAN.md`)
- [x] Criar script de relatório (`quality-baseline-report.js`)
- [ ] Criar script de detecção de regressões
- [ ] Testar localmente: `pnpm build`, `pnpm quality:report`

### Fase 2: CI/CD (Próxima Semana)

- [ ] Criar workflows de CI (`workflows/`)
- [ ] Configurar branch protection rules
- [ ] Testar pipeline com PR de teste
- [ ] Validar que build não quebra com warnings

### Fase 3: Vercel (Próxima Semana)

- [ ] Validar configuração de build no dashboard
- [ ] Fazer deploy de teste
- [ ] Confirmar que warnings não bloqueiam
- [ ] Configurar preview deploys

### Fase 4: Monitoramento (Contínuo)

- [ ] Configurar workflow semanal de relatório
- [ ] Criar dashboard de métricas (opcional: badges)
- [ ] Comunicar plano ao time
- [ ] Iniciar Sprint 1 de cleanup

---

## 🎯 Resultado Esperado

✅ **Loop quebrado:** Correções de lint não afetam builds  
✅ **Deploys contínuos:** Warnings não bloqueiam produção  
✅ **Qualidade rastreada:** Métricas visíveis e mensuráveis  
✅ **Melhoria gradual:** Sprints de cleanup controlados

---

**Próximos Passos Imediatos:**

1. Executar `pnpm quality:report` para validar script
2. Testar `pnpm build` e verificar que passa com warnings
3. Criar workflows de CI
4. Comunicar plano ao time

---

**Mantido por:** Time de Engenharia  
**Última atualização:** 16 de dezembro de 2025
