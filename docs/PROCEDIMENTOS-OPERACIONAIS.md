# 📋 PROCEDIMENTOS OPERACIONAIS - Refatoração Incremental

**Referência**: `ESTRATEGIA-REFATORACAO-INCREMENTAL.md`  
**Objetivo**: Guia passo-a-passo para executar cada sprint

---

## 🔧 PRÉ-REQUISITOS

### 1. Ferramentas Necessárias

```bash
# Verificar versões
node --version  # v18+
pnpm --version  # v8+
git --version

# Verificar que ambiente está OK
cd c:\apps\QWork
pnpm install
pnpm build
```

### 2. Documentação Necessária

- ✅ `ESTRATEGIA-REFATORACAO-INCREMENTAL.md` (este documento)
- ✅ `PROCEDIMENTOS-OPERACIONAIS.md` (você está aqui)
- ✅ Scripts em `scripts/refactor/`

---

## 📊 FASE 0: BASELINE & SETUP

### Etapa 0.1: Criar Branch

```bash
cd c:\apps\QWork

# Criar branch de refatoração
git checkout -b refactor/modularizacao-arquivos-grandes

# Verificar que estou no branch correto
git branch
git log --oneline -1
```

### Etapa 0.2: Snapshot Preliminar

```bash
# Salvarpredefinido estado atual
mkdir -p .refactor-logs

# Contar linhas de arquivos-alvo
wc -l lib/db.ts > .refactor-logs/baseline-lines.txt
wc -l components/NovoscadastrosContent.tsx >> .refactor-logs/baseline-lines.txt
wc -l app/rh/empresa/[id]/lote/[loteId]/page.tsx >> .refactor-logs/baseline-lines.txt

echo "Baseline de linhas:"
cat .refactor-logs/baseline-lines.txt
```

### Etapa 0.3: Baseline de Testes (CRÍTICO)

```bash
# RUN FULL TEST SUITE
echo "=== BASELINE TESTS ===" > .refactor-logs/baseline-results.txt
date >> .refactor-logs/baseline-results.txt

# Testes unitários
echo "Unit Tests:" >> .refactor-logs/baseline-results.txt
pnpm test:unit 2>&1 | tail -20 >> .refactor-logs/baseline-results.txt

# Type checking
echo -e "\n\nType Check:" >> .refactor-logs/baseline-results.txt
pnpm type-check 2>&1 >> .refactor-logs/baseline-results.txt

# Build
echo -e "\n\nBuild:" >> .refactor-logs/baseline-results.txt
pnpm build 2>&1 | tail -20 >> .refactor-logs/baseline-results.txt

# Linting
echo -e "\n\nLinting:" >> .refactor-logs/baseline-results.txt
pnpm lint 2>&1 | head -50 >> .refactor-logs/baseline-results.txt

echo "✅ Baseline salvo em .refactor-logs/baseline-results.txt"
cat .refactor-logs/baseline-results.txt
```

### Etapa 0.4: Criar Status Tracker

```bash
# Arquivo para rastrear progresso
cat > .refactor-status << 'EOF'
# REFACTORING STATUS TRACKER
# Criado: $(date)

## FASES
- [ ] FASE 0: Setup (CURRENT)
- [ ] FASE 1: Análise
- [ ] FASE 2: lib/db.ts decomposição
- [ ] FASE 3: Componentes refatoração

## ARQUIVOS PROCESSADOS
(nenhum ainda)

## ULTIMAS MUDANÇAS
(nenhuma ainda)
EOF

git add .refactor-logs .refactor-status
git commit -m "refactor: baseline setup para refatoração incremental"
```

**Verificação**:

- ✅ Branch criado e selecionado
- ✅ Logs de baseline salvos
- ✅ Testes passam no estado original

---

## 📋 FASE 1: ANÁLISE DETALHADA

### Etapa 1.1: Mapear lib/db.ts

**Objetivo**: Documentar todas as funções exportadas e seus usuários

```bash
# 1. Listar todas as funcões de export em lib/db.ts
grep "^export " lib/db.ts | head -50 > .refactor-logs/db-exports.txt
echo "Total de exports:"
grep "^export " lib/db.ts | wc -l

# 2. Encontrar TODOS os usos de cada export
# Executar para cada função exportada (exemplo: query)
echo "=== USOS DE query() ===" > .refactor-logs/db-usages.txt
grep -r "from '@/lib/db'" app lib components --include="*.ts" --include="*.tsx" | wc -l >> .refactor-logs/db-usages.txt
grep -r "from '@/lib/db'" app lib components --include="*.ts" --include="*.tsx" | head -20 >> .refactor-logs/db-usages.txt

# 3. Verificar imports específicos
grep -r "import.*query.*from.*db" app lib components --include="*.ts" --include="*.tsx" | wc -l

# 4. Buscar padrão de uso
# ⚠️ IMPORTANTE: Se muitos arquivos usam lib/db, o INDEX file precisa ser MUITO compatível
echo "Arquivos que importam de lib/db:"
grep -r "from '@/lib/db'" app lib components --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u | wc -l
```

**Documentar em**: `.refactor-logs/db-analysis.md`

```markdown
# Análise lib/db.ts

## Exports Principais

- query<T>: usado em ~120 arquivos
- transaction<T>: usado em ~20 arquivos
- Entidade types: usado em ~80 arquivos
- getEntidadesByTipo: usado em ~15 arquivos
  [... etc]

## Estrutura Proposta

[Diagrama aqui]

## Dependências Internas

[Mapeamento aqui]

## RISCO: ALTO - Muitos arquivos dependem

→ Solução: INDEX file MUITO compatível
```

### Etapa 1.2: Analisar Componentes

```bash
# Para cada componente grande
# components/NovoscadastrosContent.tsx

# 1. Contar linhas por seção
# (abrir manualmente e dividir)

# 2. Buscar useState/useEffect
grep -n "useState\|useEffect\|useCallback\|useMemo" components/NovoscadastrosContent.tsx | wc -l

# 3. Buscar API calls
grep -n "fetch\|axios\|api\." components/NovoscadastrosContent.tsx | wc -l

# 4. Buscar componentes filhos
grep -n "<[A-Z]" components/NovoscadastrosContent.tsx | head -20

# 5. Documentar em arquivo
cat > .refactor-logs/components-analysis.md << 'EOF'
# Análise de Componentes

## NovoscadastrosContent.tsx (44.9KB)
- Linhas: ~1200
- useState: ~8
- useEffect: ~4
- API calls: ~6
- Sub-componentes prováveis: 5

### Proposta de Decomposição
1. Header/Filters (~150 linhas)
2. Table (~300 linhas)
3. Modals (~200 linhas)
4. Hooks (~200 linhas)
5. Main (~150 linhas)

### Risco
- Possível circular dependencies entre hooks e componentes
- Estado global vs local?
- Context usage?
EOF
```

**Resultado esperado**:

- `.refactor-logs/db-analysis.md`
- `.refactor-logs/components-analysis.md`
- `.refactor-logs/dependency-diagram.txt`

**Verificação**:

- ✅ Todos os exports listados
- ✅ Todos os usuários identificados
- ✅ Nenhuma circular dependency óbvia

---

## 🏗️ FASE 2: PREPARAÇÃO DE ESTRUTURA

### Etapa 2.1: Criar Pastas

```bash
# Para lib/db.ts decomposição
mkdir -p lib/infrastructure/database
mkdir -p lib/repositories
mkdir -p lib/repositories/operations

# Para componentes
mkdir -p components/novos-cadastros/modals
mkdir -p components/novos-cadastros/hooks
mkdir -p components/lote-details/modals
mkdir -p components/lote-details/hooks
```

### Etapa 2.2: Criar INDEX Files Stub

**Objetivo**: Criar arquivos vazios que permitam que o projeto compile

```typescript
// lib/db.ts (NOVO - será INDEX)
// @ts-ignore - Durante a migração, algumas importações podem não existir ainda
export { query } from './infrastructure/database/queries';
export type {
  QueryResult,
  TransactionClient,
} from './infrastructure/database/types';
// ... etc (TODO: completar durante migração)
```

```typescript
// lib/infrastructure/database/index.ts
export * from './types';
export * from './connection';
export * from './queries';
export * from './transactions';
```

```typescript
// lib/infrastructure/database/types.ts
// @ts-ignore - Stub durante migração
export type QueryResult = any;
export type TransactionClient = any;
// ... types será completo após migração
```

### Etapa 2.3: Verificar Compilação

```bash
# Neste ponto, pode ou não compilar
# Se não compilar, adicionar mais @ts-ignore
pnpm type-check 2>&1 | head -20
pnpm build 2>&1 | head -50

# Documentar erros
pnpm type-check > .refactor-logs/phase2-check.log 2>&1
echo "Type check log salvo em .refactor-logs/phase2-check.log"
```

**Verificação**:

- ✅ Pastas estrutura criadas
- ✅ INDEX files criados (podem ter @ts-ignore)
- ✅ Tipo-verificação básica passando (com ignores se necessário)

---

## 🔄 FASE 3: MIGRAÇÃO (POR SPRINT)

### Template: Sprint N - [NOME]

#### 📋 PRÉ-SPRINT

```bash
# 1. Criar sub-branch
git checkout -b refactor/sprint-N-[nome]

# 2. Verificar baseline sprint anterior
cat .refactor-logs/baseline-results.txt

# 3. Documentar objetivo
cat > .refactor-logs/sprint-N.md << 'EOF'
# Sprint N: [NOME]
Objetivo: [específico]
Arquivos: [lista]
Tamanho esperado final: [linhas]

## Checklist
- [ ] Análise concluída
- [ ] Código movido
- [ ] Imports atualizados
- [ ] Testes passam
- [ ] Build compila
- [ ] Lint OK
- [ ] Documentação
EOF
```

#### 🔧 DURANTE SPRINT

**Exemplo: Sprint 2 - lib/db.ts TYPES**

```bash
# 1. Localizar types em lib/db.ts
# Abrir arquivo e identificar:
# - export type Perfil (linhas ~20)
# - export type TipoEntidade (linhas ~761)
# - export interface Entidade (linhas ~769)
# - export interface EntidadeFuncionario (linhas ~804)
# - export type QueryResult (linhas ~303)
# etc

# 2. Criar arquivo de tipos
cat > lib/infrastructure/database/types.ts << 'EOF'
import { Session } from '../session';

export type { Session };

// Tipos de perfil
export type Perfil = 'admin' | 'rh' | 'funcionario' | 'emissor' | 'gestor';
export const PERFIS_VALIDOS: readonly Perfil[] = [
  'admin', 'rh', 'funcionario', 'emissor', 'gestor'
];

// Validações
export function isValidPerfil(value: unknown): value is Perfil { /* ... */ }
export function assertValidPerfil(value: unknown): asserts value is Perfil { /* ... */ }

// Tipos de entidade
export type TipoEntidade = 'clinica' | 'entidade';
export type StatusAprovacao = /* ... */;
export interface Entidade { /* ... */ }
export interface EntidadeFuncionario { /* ... */ }

// Query API Types
export type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
  command: string;
};
EOF

# 3. Atualizar lib/db.ts (remover types, apenas re-exportar)
# Editar lib/db.ts:
# - Remover export type Perfil...
# - Remover export interface Entidade...
# - Adicionar no início:
cat >> lib/db.ts << 'EOF'

// ============================================================================
// RE-EXPORTS DE TIPOS (mantém compatibilidade)
// ============================================================================
export type { Perfil, TipoEntidade, StatusAprovacao, Entidade, EntidadeFuncionario } from './infrastructure/database/types';
export { PERFIS_VALIDOS, isValidPerfil, assertValidPerfil } from './infrastructure/database/types';
export type { QueryResult, TransactionClient } from './infrastructure/database/types';
EOF

# 4. Atualizar imports internos em lib/db.ts
# Buscar e substituir:
# - import { Perfil } from ... → remover (já importa de types local)
# Usar editor para fazer isso

# 5. Testar compilação
pnpm type-check

# 6. Testar que imports externos continuam funcionando
# Não deve quebrar! Teste:
grep -r "from '@/lib/db'" __tests__ | head -5
# Todos devem continuar funcionando

# 7. Commit
git add lib/infrastructure/database/types.ts lib/db.ts
git commit -m "refactor(db): extrair types para infrastructure/database/types.ts"
```

#### ✅ PÓS-SPRINT

```bash
# 1. Executar suite completa de testes
echo "=== SPRINT N VALIDATION ===" > .refactor-logs/sprint-N-validation.txt
date >> .refactor-logs/sprint-N-validation.txt

echo "Type Check:" >> .refactor-logs/sprint-N-validation.txt
pnpm type-check 2>&1 >> .refactor-logs/sprint-N-validation.txt

echo -e "\n\nBuild:" >> .refactor-logs/sprint-N-validation.txt
pnpm build 2>&1 | tail -30 >> .refactor-logs/sprint-N-validation.txt

echo -e "\n\nTests:" >> .refactor-logs/sprint-N-validation.txt
pnpm test:unit 2>&1 | tail -30 >> .refactor-logs/sprint-N-validation.txt

echo -e "\n\nLint:" >> .refactor-logs/sprint-N-validation.txt
pnpm lint 2>&1 | head -50 >> .refactor-logs/sprint-N-validation.txt

# 2. Verificar resultado
echo "Resultado Sprint N:"
cat .refactor-logs/sprint-N-validation.txt

# 3. Se houver problemas
if ! pnpm build; then
  echo "❌ BUILD FAILED - Sprint N"
  echo "Logs em .refactor-logs/sprint-N-validation.txt"
  exit 1
fi

# 4. Se tudo OK
echo "✅ All validations passed"

# 5. Merge para branch principal de refatoração
git checkout refactor/modularizacao-arquivos-grandes
git merge refactor/sprint-N-[nome] --no-ff -m "Merge Sprint N"

# 6. Update status
echo "- [x] Sprint N: COMPLETED" >> .refactor-status
git add .refactor-logs .refactor-status
git commit -m "docs: sprint N completed"
```

---

## 🧪 VALIDAÇÃO POR SPRINT

### Checklist Validação

```bash
#!/bin/bash
# validate-refactor.sh

echo "1. Type-Check..."
pnpm type-check || exit 1

echo "2. Build..."
pnpm build || exit 1

echo "3. Tests (unit)..."
pnpm test:unit || exit 1

echo "4. Tests (integration affected)..."
# Testes específicos que usam o arquivo refatorado
pnpm test -- __tests__/lib/db.test.ts || exit 1

echo "5. Linting..."
pnpm lint || exit 1

echo "✅ All validations passed!"
```

### Relatório de Refatoração

```bash
# Após cada sprint
cat > .refactor-logs/sprint-report.md << 'EOF'
# Relatório Sprint N

## Arquivos Modificados
- lib/db.ts (1865 → X linhas)
- lib/infrastructure/database/types.ts (criar novo - Y linhas)

## Resultado
- [x] Type-check: PASSED
- [x] Build: PASSED (tamanho: Z KB)
- [x] Tests: PASSED (N testes)
- [x] Linting: PASSED

## Observações
- Sem breaking changes em imports
- Performance: sem regressão
- LOC reduzido em ~X linhas

## Próximo Sprint
- [próximo arquivo]
EOF
```

---

## 🚨 ROLLBACK PROCEDURE

Se algo der errado durante um sprint:

```bash
# 1. Identificar o problema
pnpm build  # ou outro comando que falhou

# 2. OPÇÃO A: Reverter último commit
git revert HEAD

# OPÇÃO B: Descartar e voltar ao begin do sprint
git checkout refactor/modularizacao-arquivos-grandes
git reset --hard HEAD~1

# 3. Documentar o que falhou
cat >> .refactor-logs/failures.md << 'EOF'
## Falha Sprint N
Data: $(date)
Erro: [descrição]
Solução: [o que foi tentado]
Status: [resolvido/pendente]
EOF

# 4. IMPORTANTE: Não desistir!
# Problemas são esperados. Analisados e continue no próximo ciclo.
```

---

## 📊 MÉTRICAS DE PROGRESSO

### Tracking Automático

```bash
# Criar script de métricas
cat > scripts/refactor/metrics.sh << 'EOF'
#!/bin/bash

echo "=== REFACTORING METRICS ==="
echo "Data: $(date)"
echo ""

# 1. Linhas de código
echo "📊 LINHAS DE CÓDIGO:"
echo "lib/db.ts: $(wc -l < lib/db.ts)"
echo "lib/infrastructure/database/: $(find lib/infrastructure/database -name "*.ts" -exec wc -l {} + | tail -1)"

# 2. Número de exports
echo ""
echo "📤 EXPORTS:"
echo "lib/db.ts: $(grep "^export " lib/db.ts | wc -l)"

# 3. Status de build
echo ""
echo "🏗️ BUILD:"
if pnpm build 2>&1 | grep -q "✓ ready"; then
  echo "✅ Build OK"
else
  echo "❌ Build FAIL"
fi

# 4. Tests
echo ""
echo "🧪 TESTS:"
pnpm test:unit 2>&1 | tail -5
EOF

chmod +x scripts/refactor/metrics.sh
bash scripts/refactor/metrics.sh
```

---

## 📝 TEMPLATE DE COMMIT

```bash
# Convenção de commit para refatoração

git commit -m "refactor(scope): description

Área: lib/db.ts → lib/infrastructure/database/
Tamanho antes: 1865 linhas
Tamanho depois: 1500 linhas (componentes separados)

Extraído:
- types.ts (150 linhas)
- connection.ts (200 linhas)

Mudanças:
- ✅ Sem breaking changes
- ✅ Imports compatíveis
- ✅ Testes passam
- ✅ Build compila

Refs: sprint-N, refactor/incremental
"
```

---

## 🎯 CONCLUSÃO

**Seguir rigorosamente**:

1. ✅ BASELINE antes de começar
2. ✅ 1 FILE POR SPRINT
3. ✅ VALIDAR completamente após cada sprint
4. ✅ COMMIT & MERGE antes de próximo sprint
5. ✅ DOCUMENTAR tudo

**Tempo esperado**:

- lib/db.ts: ~10-12 sprints (5-6 semanas)
- Componentes: ~15-20 sprints (7-10 semanas)
- **Total: ~12-16 semanas de desenvolvimento**

---

**Autor**: GitHub Copilot  
**Versão**: 1.0  
**Status**: 📋 Operacional
