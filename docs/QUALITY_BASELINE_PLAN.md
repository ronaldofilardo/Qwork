# Quality Baseline Plan - Breaking the Warning/Error Loop

## 🎯 Objetivo

Eliminar o ciclo vicioso de "corrigir warnings → gerar erros de lint → corrigir lint → gerar novos warnings" através de uma estratégia de baseline documentada, migração incremental e separação de concerns.

## 📊 Situação Atual (Baseline - 16/12/2025)

### Warnings por Categoria

| Regra                                        | Ocorrências | Severidade Atual | Impacto                  |
| -------------------------------------------- | ----------- | ---------------- | ------------------------ |
| `@typescript-eslint/no-unsafe-member-access` | 741         | warn             | 🔴 Alto - Runtime risk   |
| `@typescript-eslint/no-unsafe-assignment`    | 471         | warn             | 🔴 Alto - Type safety    |
| `@typescript-eslint/no-unsafe-argument`      | 160         | warn             | 🟠 Médio - Type safety   |
| `@typescript-eslint/no-explicit-any`         | 84          | warn             | 🟡 Baixo - Code quality  |
| `@typescript-eslint/no-unsafe-call`          | 61          | warn             | 🔴 Alto - Runtime risk   |
| `@typescript-eslint/no-misused-promises`     | 53          | warn             | 🔴 Alto - Async bugs     |
| `@typescript-eslint/no-floating-promises`    | 33          | warn             | 🔴 Alto - Error handling |
| `@typescript-eslint/no-unused-vars`          | 32          | warn             | 🟡 Baixo - Code cleanup  |
| `@typescript-eslint/no-use-before-define`    | 28          | warn             | 🟡 Baixo - Code quality  |
| Outros                                       | 24          | warn             | 🟡 Baixo                 |

**Total:** ~1,687 warnings

---

## 🛠️ Estratégia de Solução - 3 Pilares

### 1️⃣ Separação de Concerns

**Build vs Lint vs Type-Check são processos independentes:**

```bash
# Build de produção - SEMPRE deve passar (deploy não bloqueia)
pnpm build:prod

# Type-check standalone - detecta erros de tipo sem build
pnpm type-check

# Lint - qualidade de código (pode ter warnings)
pnpm lint

# Quality check combinado - para PRs
pnpm quality:check
```

**Impacto:** Nenhuma correção de lint quebrará o build de produção.

---

### 2️⃣ Baseline Congelada + Overrides Progressivos

**Configuração atual do ESLint (`.eslintrc.cjs`):**

- **Legacy code:** Todas as regras problemáticas são `warn` (não quebram CI)
- **New/cleaned code:** Seção de overrides para aplicar `error` em arquivos limpos
- **Test files:** Regras relaxadas para testes

**Como funciona:**

```javascript
// Código legado = warnings apenas
overrides: [
  {
    files: ['app/**', 'components/**', 'lib/**'],
    rules: { '@typescript-eslint/no-unsafe-*': 'warn' },
  },
];

// À medida que limpamos, movemos para strict mode
overrides: [
  {
    files: ['lib/utils/cleaned-module.ts'], // Arquivos limpos
    rules: { '@typescript-eslint/no-unsafe-*': 'error' },
  },
];
```

**Impacto:** Regressions não acontecem; código novo/limpo tem padrão alto.

---

### 3️⃣ Migração Incremental (Sprint-Based)

**Meta de redução:** ~100-150 warnings por sprint (2 semanas)

#### Sprint 1 (Semanas 1-2): Críticos - Promessas e Error Handling

- **Foco:** `no-floating-promises` (33), `no-misused-promises` (53)
- **Arquivos prioritários:** `app/api/**`, handlers de eventos
- **Meta:** Reduzir 86 → 0 warnings
- **Impacto:** Evita bugs de async/await, melhora error handling

#### Sprint 2 (Semanas 3-4): Type Safety - Unsafe Calls

- **Foco:** `no-unsafe-call` (61), `no-unsafe-return` (12)
- **Arquivos prioritários:** `lib/db.ts`, `lib/queries.ts`, APIs críticas
- **Meta:** Reduzir 73 → 0 warnings
- **Impacto:** Previne runtime crashes

#### Sprint 3 (Semanas 5-6): Arguments e Assignments

- **Foco:** `no-unsafe-argument` (160), redução inicial de `no-unsafe-assignment` (471 → 350)
- **Arquivos prioritários:** Componentes principais, API routes
- **Meta:** Reduzir 280 warnings
- **Impacto:** Type safety em interfaces públicas

#### Sprint 4 (Semanas 7-8): Member Access - Fase 1

- **Foco:** `no-unsafe-member-access` (741 → 550)
- **Arquivos prioritários:** Pages, componentes de UI
- **Meta:** Reduzir 191 warnings
- **Impacto:** Evita acessos a propriedades undefined

#### Sprint 5+ (Semanas 9+): Cleanup Final

- **Foco:** Remaining `no-unsafe-*`, `no-explicit-any`, code quality
- **Meta:** Redução gradual até baseline zero
- **Impacto:** Código production-ready com strict mode

---

## 📈 Métricas e Tracking

### Comando de Relatório

```bash
# Gera relatório atualizado de baseline
pnpm quality:report
```

**Output esperado:**

```
========================================
Quality Baseline Report - 2025-12-16
========================================

Total Warnings: 1,687
Change from baseline: -86 (-5.1%) ✅

Top Rules:
  @typescript-eslint/no-unsafe-member-access: 741 (↓12)
  @typescript-eslint/no-unsafe-assignment: 471 (↓8)
  ...

Sprint Progress: Sprint 1 - 86/86 completed (100%) 🎉
Next Sprint Target: 73 warnings (no-unsafe-call, no-unsafe-return)
```

### Tracking no repositório

Criar issues/milestones no repositório remoto (ou no sistema de issues utilizado):

- Issue #X: [Quality] Sprint 1 - Fix Floating Promises (33 warnings)
- Issue #Y: [Quality] Sprint 2 - Fix Unsafe Calls (61 warnings)

---

## 🚨 Regras de Governança

### Para Novos PRs

1. **Build deve passar:** `pnpm build` exit code 0
2. **Lint não pode aumentar baseline:** Máximo de 2000 warnings (`--max-warnings 2000`)
3. **Type-check informativo:** `pnpm type-check` roda mas não bloqueia (por enquanto)
4. **Code review:** Revisor verifica se PR reduz warnings (quando possível)

### Para Deploys

1. **Produção:** Apenas `pnpm build:prod` deve passar
2. **Warnings não bloqueiam deploy** (estratégia baseline)
3. **Erros críticos (exit code ≠ 0) bloqueiam deploy**

### Para Código Novo

1. Adicionar arquivos novos ao override "strict" no `.eslintrc.cjs`
2. PRs com código novo devem ter zero `any` e zero unsafe operations
3. Testes obrigatórios para lógica crítica (promises, DB queries)

---

## 🔄 Processo de Migração (Passo a Passo)

### Passo 1: Escolher arquivo/módulo para limpar

```bash
# Ver warnings de um arquivo específico
pnpm lint app/api/rh/lotes/route.ts
```

### Passo 2: Aplicar correções

- Adicionar tipos explícitos (remover `any`)
- Usar `await` em promises
- Validar tipos de retorno de queries
- Adicionar error handling

### Passo 3: Mover para strict mode

```javascript
// Em .eslintrc.cjs
overrides: [
  {
    files: ['app/api/rh/lotes/route.ts'], // ✅ Arquivo limpo
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-*': 'error',
    },
  },
];
```

### Passo 4: Validar

```bash
# Lint específico deve passar sem warnings
pnpm lint app/api/rh/lotes/route.ts

# Build deve continuar passando
pnpm build
```

### Passo 5: Commit e PR

```bash
git add app/api/rh/lotes/route.ts .eslintrc.cjs
git commit -m "refactor(api): clean lotes route - remove unsafe types (Sprint 1)"
```

---

## 📚 Recursos e Referências

### Ferramentas

- **Quality Report:** `pnpm quality:report` - baseline tracking
- **Type Check:** `pnpm type-check` - standalone type validation
- **Lint Fix:** `pnpm lint:fix` - auto-fix safe issues

### Documentação

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [@typescript-eslint Rules](https://typescript-eslint.io/rules/)
- [Next.js ESLint](https://nextjs.org/docs/basic-features/eslint)

### Comunicação

- **Slack/Teams:** Canal #code-quality para discussões
- **Weekly updates:** Status report toda sexta-feira
- **Sprint review:** Demo de progresso ao final de cada sprint

---

## ✅ Checklist de Sucesso

- [ ] Sprint 1: Zero floating promises (33 → 0) - **Prazo: 2 semanas**
- [ ] Sprint 2: Zero unsafe calls (61 → 0) - **Prazo: 4 semanas**
- [ ] Sprint 3: Unsafe arguments reduzidos 50% (160 → 80) - **Prazo: 6 semanas**
- [ ] Sprint 4: Unsafe member access reduzidos 30% (741 → 520) - **Prazo: 8 semanas**
- [ ] Sprint 5+: Baseline total < 500 warnings - **Prazo: 12 semanas**
- [ ] Final: Strict mode ativado globalmente - **Prazo: 16 semanas (~4 meses)**

---

## 🎯 Meta Final

**Configuração ESLint no futuro (após migração):**

```javascript
rules: {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-*": "error",
  "@typescript-eslint/no-floating-promises": "error",
  // Todos em error - código production-ready
}
```

**Zero warnings, zero errors, zero loop.** 🚀

---

**Última atualização:** 16 de dezembro de 2025  
**Owner:** Time de Engenharia  
**Status:** 🟢 Ativo - Sprint 0 (Setup concluído)
