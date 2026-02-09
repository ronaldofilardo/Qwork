# 🎯 Estratégia de Refatoração Incremental - QWork

**Data**: 7 de fevereiro de 2026  
**Objetivo**: Refatorar arquivos gigantes (>30KB) mantendo funcionalidade, compatibilidade e testes passando  
**Status**: 📋 Planejamento

---

## ⚠️ **PROBLEMA CRÍTICO IDENTIFICADO**

Arquivos grandes processados **de uma vez** causam:

- ❌ Travamento de agentes codificadores
- ❌ Perda de contexto
- ❌ Testes falhando
- ❌ Build quebrando
- ❌ Impossibilidade de verificação incremental

**Solução**: Dividir em **sprints micro-refatorações** (cada sprint = 1-3 arquivos pequeninhos)

---

## 📊 ARQUIVOS A REFATORAR

### 🔴 **CRÍTICA ULTRA-ALTA (>1000 linhas)**

| Arquivo     | Linhas      | Tipo    | Complexidade                              |
| ----------- | ----------- | ------- | ----------------------------------------- |
| `lib/db.ts` | **1865** ⚠️ | Backend | CRÍTICA - Gigante com N responsabilidades |

---

### 🔴 **CRÍTICA ALTA (50-100KB)**

| Arquivo                                      | Tamanho | Tipo       | Padrão             |
| -------------------------------------------- | ------- | ---------- | ------------------ |
| `app/rh/empresa/[id]/lote/[loteId]/page.tsx` | 57.2KB  | Componente | Página monolítica  |
| `app/entidade/lote/[id]/page.tsx`            | 46KB    | Componente | Página monolítica  |
| `lib/laudo-auto.ts`                          | 50.1KB  | Backend    | Lógica monolítica  |
| `components/NovoscadastrosContent.tsx`       | 44.9KB  | Componente | Componente gigante |

---

### 🟠 **ALTA (30-45KB)**

| Arquivo                               | Tamanho | Tipo       | Padrão            |
| ------------------------------------- | ------- | ---------- | ----------------- |
| `components/ContaSection.tsx`         | 41.8KB  | Componente | Seção gigante     |
| `app/emissor/laudo/[loteId]/page.tsx` | 40.9KB  | Componente | Página monolítica |
| `app/page.tsx` (home/dashboard)       | 37KB    | Componente | Página gigante    |
| `components/ClinicasContent.tsx`      | 30KB    | Componente | Seção gigante     |

---

## 📋 FASES DE REFATORAÇÃO

### **FASE 1: ANÁLISE E DOCUMENTAÇÃO** ✅ (ATUAL)

**Objetivo**: Mapear estrutura e dependências de cada arquivo  
**Duração**: 1-2 horas  
**Deliverables**:

- [ ] Análise de cada arquivo (seção "4. ANÁLISE DETALHADA")
- [ ] Diagrama de dependências
- [ ] Checklist de refatoração por arquivo

---

### **FASE 2: PREPARAÇÃO DO AMBIENTE**

**Objetivo**: Garantir que testes e build funcionem baseline  
**Duração**: 1-2 horas

#### 2.1 Criar Branch de Refatoração

```bash
git checkout -b refactor/modularizacao-arquivos-grandes
```

#### 2.2 Executar Baseline de Testes

```bash
# Testes unitários
pnpm test:unit 2>&1 | tee logs/baseline-tests.log

# Build
pnpm build 2>&1 | tee logs/baseline-build.log

# Type check
pnpm type-check 2>&1 | tee logs/baseline-types.log

# Linting
pnpm lint 2>&1 | tee logs/baseline-lint.log
```

#### 2.3 Documentar Baseline

```bash
# Criar arquivo para tracking
echo "BASELINE_TESTS_PASSED: $(date)" > .refactor-status
echo "BASELINE_BUILD_PASSED: $(date)" >> .refactor-status
```

**Verificação** ✅: Todos os testes passam e build compila

---

### **FASE 3: REFATORAÇÃO INCREMENTAL** 🔄

**Duração**: 2-4 semanas  
**Estrutura por Sprint**:

#### Sprint Template

```
Sprint N: [NOME]
├── 📌 Objetivo: [específico]
├── 📁 Arquivos: [lista máximo 3]
├── 🎯 Tamanho final esperado: <500 linhas cada
├── ✅ Checklist:
│   ├── [ ] Análise de dependências
│   ├── [ ] Criar estrutura de pastas
│   ├── [ ] Extrair módulos
│   ├── [ ] Atualizar imports
│   ├── [ ] Testes passam
│   ├── [ ] Build compila
│   ├── [ ] Lint sem erros
│   ├── [ ] Documentação atualizada
│   └── [ ] Commit (git)
└── 📖 Documentação: [arquivo-específico.md]
```

---

## 🔬 ANÁLISE DETALHADA POR ARQUIVO

### 1️⃣ **lib/db.ts** (1865 linhas) 🔴 CRÍTICA

**Tipo**: Módulo backend - Gerenciador de banco de dados  
**Responsabilidades Identificadas**:

```
┌─ TYPES & INTERFACES (linhas ~11-810)
│  ├─ Perfis (admin, rh, funcionario, emissor, gestor)
│  ├─ Entidade & EntidadeFuncionario
│  ├─ TipoEntidade
│  ├─ StatusAprovacao
│  └─ QueryResult
│
├─ CONNECTION & POOL (linhas ~50-350)
│  ├─ Detecção de ambiente
│  ├─ Seleção de banco de dados
│  ├─ Pool de conexões
│  └─ RLS queries
│
├─ QUERY API (linhas ~353-750)
│  ├─ query<T>() - Query genérica
│  ├─ transaction<T>() - Transações
│  ├─ queryMultiTenant<T>() - Multi-tenant
│  └─ Helpers de query
│
├─ ENTIDADE CRUD (linhas ~819-1340)
│  ├─ getEntidadesByTipo()
│  ├─ getEntidadeById()
│  ├─ getEntidadesPendentes()
│  ├─ createEntidade()
│  ├─ aprovarEntidade()
│  ├─ rejeitarEntidade()
│  ├─ solicitarReanalise()
│  └─ vincularFuncionarioEntidade()
│
└─ FINANCIAL & NOTIFICATIONS (linhas ~1403-1865)
   ├─ getNotificacoesFinanceiras()
   ├─ marcarNotificacaoComoLida()
   ├─ getContratosPlanos()
   ├─ criarContaResponsavel()
   └─ criarEmissorIndependente()
```

**Estratégia de Decomposição**:

```
lib/db.ts (1865 linhas)
    ↓ DIVIDIR EM ↓
├─ lib/db.ts (INDEX ONLY - <100 linhas)
│  └─ Re-exports tudo mantendo compatibilidade
│
├─ lib/infrastructure/database/
│  ├─ types.ts (tipos & interfaces)
│  ├─ connection.ts (pool & ambiente)
│  ├─ queries.ts (query<T>, queryMultiTenant<T>)
│  ├─ transactions.ts (transaction<T>)
│  └─ index.ts
│
└─ lib/repositories/
   ├─ entidade.repository.ts (CRUD entidades)
   ├─ financial.repository.ts (financeiro)
   ├─ notifications.repository.ts (notificações)
   ├─ funcionario.repository.ts (funcionários)
   └─ index.ts (re-exports)
```

**Dependências**:

- [ ] Identificar todos os imports de `lib/db.ts`
- [ ] Criar lista de usuários (grep para "from '@/lib/db'")
- [ ] Verificar circular dependencies

**Import Refatorado**:

```typescript
// ANTES
import { query, createEntidade, getNotificacoesFinanceiras } from '@/lib/db';

// DEPOIS (compatível)
import { query, createEntidade, getNotificacoesFinanceiras } from '@/lib/db';
// Internamente resolvendo para:
// - @/lib/infrastructure/database/queries | connection
// - @/lib/repositories/entidade
// - @/lib/repositories/financial
```

**Tamanho Final Esperado**:

- ✅ `lib/db.ts`: ~80 linhas (somente re-exports)
- ✅ `lib/infrastructure/database/types.ts`: ~150 linhas
- ✅ `lib/infrastructure/database/connection.ts`: ~200 linhas
- ✅ `lib/infrastructure/database/queries.ts`: ~250 linhas
- ✅ `lib/infrastructure/database/transactions.ts`: ~150 linhas
- ✅ `lib/repositories/entidade.repository.ts`: ~250 linhas
- ✅ `lib/repositories/financial.repository.ts`: ~150 linhas
- ✅ `lib/repositories/notifications.repository.ts`: ~100 linhas
- ✅ `lib/repositories/funcionario.repository.ts`: ~100 linhas

---

### 2️⃣ **components/NovoscadastrosContent.tsx** (44.9KB) 🔴 ALTA

**Tipo**: Componente React - Seção de novos cadastros  
**Responsabilidades** (presumidas com base em nome):

```
┌─ Renderização principal
├─ Filtros/search
├─ Table/grid de cadastros
├─ Modais de ação (aprovar, rejeitar, reanalisar)
├─ Requisições HTTP
├─ Estado local
└─ Notificações/alertas
```

**Estratégia de Decomposição**:

```
components/NovoscadastrosContent.tsx (44.9KB)
    ↓ DIVIDIR EM ↓
├─ components/novos-cadastros/
│  ├─ NovoscadastrosContent.tsx (<300 linhas - ORQUESTRADOR)
│  ├─ NovoscadastrosTable.tsx (<200 linhas - TABLE)
│  ├─ NovoscadastrosFilters.tsx (<150 linhas - FILTERS/SEARCH)
│  ├─ NovoscadastrosActions.tsx (<100 linhas - BOTÕES AÇÃO)
│  ├─ modals/
│  │  ├─ AprovacaoModal.tsx (<150 linhas)
│  │  ├─ RejeitarModal.tsx (<100 linhas)
│  │  ├─ ReanaliseModal.tsx (<100 linhas)
│  │  └─ index.ts
│  ├─ hooks/
│  │  ├─ useNovoscadastros.ts (fetch + estado)
│  │  ├─ useFiltros.ts (filtros)
│  │  ├─ useAcoes.ts (approve/reject/reanalyse)
│  │  └─ index.ts
│  └─ index.ts
```

**Testes Necessários**:

- [ ] `components/novos-cadastros/__tests__/`
  - `NovoscadastrosContent.test.tsx`
  - `NovoscadastrosTable.test.tsx`
  - `hooks/useNovoscadastros.test.ts`
  - `hooks/useAcoes.test.ts`

---

### 3️⃣ **app/rh/empresa/[id]/lote/[loteId]/page.tsx** (57.2KB) 🔴 CRÍTICA

**Tipo**: Página Next.js - Detalhes de lote em RH  
**Responsabilidades** (presumidas):

```
├─ Cabeçalho/navegação
├─ Abas/seções
├─ Detalhes do lote
├─ Funcionários/dados
├─ Ações (imprimir, enviar, etc.)
├─ Modal/diálogos
└─ Requisições de dados
```

**Estratégia**:

```
app/rh/empresa/[id]/lote/[loteId]/page.tsx (57.2KB)
    ↓ DIVIDIR EM ↓
├─ app/rh/empresa/[id]/lote/[loteId]/page.tsx (<200 linhas - ORQUESTRADOR)
├─ components/lote-details/
│  ├─ LoteDetailsPage.tsx (<300 linhas - COMPONENTE PRINCIPAL)
│  ├─ LoteHeader.tsx (<150 linhas)
│  ├─ LoteTabs.tsx (<150 linhas)
│  ├─ LoteFuncionarios.tsx (<200 linhas)
│  ├─ LoteAcoes.tsx (<100 linhas)
│  ├─ modals/
│  ├─ hooks/
│  └─ index.ts
└─ lib/hooks/
   ├─ useLoteDetails.ts
   ├─ useLoteFuncionarios.ts
   ├─ useLoteActions.ts
   └─ index.ts
```

---

### 4️⃣ **lib/laudo-auto.ts** (50.1KB) 🔴 ALTA

**Tipo**: Módulo backend - Emissão automática de laudos  
**Responsabilidades** (com base na leitura):

```
├─ Emissão de laudos (PDF)
├─ Geração de HTML
├─ Cálculos (scores, interpretação)
├─ Hash SHA-256
├─ Persistência
└─ Storage (arquivo físico)
```

**Estratégia**:

```
lib/laudo-auto.ts (50.1KB)
    ↓ DIVIDIR EM ↓
├─ lib/domain/laudo/
│  ├─ laudo.entities.ts (tipos de laudo)
│  ├─ laudo.use-cases.ts (lógica de negócio pura)
│  └─ index.ts
│
├─ lib/services/
│  ├─ laudo-generation.service.ts (orquestração)
│  ├─ laudo-hash.service.ts (cálculo de hash)
│  ├─ laudo-storage.service.ts (persistência)
│  └─ index.ts
│
└─ lib/laudo-auto.ts (INDEX - <50 linhas)
   └─ Re-exports tudo
```

---

### 5️⃣ **components/ContaSection.tsx** (41.8KB) 🟠 ALTA

**Estratégia**: Dividir em sub-componentes de contabilidade/conta

```
components/conta/
├─ ContaSection.tsx (<200 linhas)
├─ ContaHeader.tsx
├─ ContaTable.tsx
├─ ContaFilters.tsx
├─ modals/
├─ hooks/
└─ index.ts
```

---

### 6️⃣ **app/page.tsx** (37KB) 🟠 ALTA

**Estratégia**: Dividir em dashboard + widgets

```
app/page.tsx (<150 linhas)
    ↓ DIVIDIR EM ↓
components/dashboard/
├─ DashboardHome.tsx
├─ DashboardWidgets.tsx
├─ DashboardCharts.tsx
├─ DashboardAlerts.tsx
└─ hooks/
   └─ useDashboardData.ts
```

---

## 🎯 PADRÕES DE REFATORAÇÃO

### Pattern 1: Arquivo INDEX (Compatibilidade)

**Objetivo**: Migrrar logicamente mas manter imports iguais

```typescript
// ANTES: lib/db.ts (1865 linhas)
export async function query<T>() {
  /* 100 linhas */
}
export async function transaction<T>() {
  /* 50 linhas */
}
export async function getEntidadesByTipo() {
  /* 20 linhas */
}
// ... mais 1800 linhas

// DEPOIS
// lib/db.ts (INDEX - <50 linhas)
export {
  query,
  getDatabaseInfo,
  closePool,
} from './infrastructure/database/queries';
export type {
  QueryResult,
  TransactionClient,
} from './infrastructure/database/types';
export { transaction } from './infrastructure/database/transactions';
export {
  getEntidadesByTipo,
  createEntidade,
  aprovarEntidade,
} from './repositories/entidade.repository';
export {} from /* ... mais */ './repositories/financial.repository';

// USO PERMANECE IGUAL
import { query, getEntidadesByTipo } from '@/lib/db';
```

---

### Pattern 2: Custom Hooks (Componentes)

**Objetivo**: Extrair lógica de dados para hooks reutilizáveis

```typescript
// ANTES: components/NovoscadastrosContent.tsx (200+ linhas de lógica)
export function NovoscadastrosContent() {
  const [cadastros, setCadastros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await api.get('/novos-cadastros', { params: filtros });
      setCadastros(data);
      setLoading(false);
    };
    fetch();
  }, [filtros]);

  return <div>/* JSX */</div>;
}

// DEPOIS: lib/hooks/useNovoscadastros.ts
export function useNovoscadastros() {
  const [cadastros, setCadastros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await api.get('/novos-cadastros', { params: filtros });
      setCadastros(data);
      setLoading(false);
    };
    fetch();
  }, [filtros]);

  return { cadastros, loading, filtros, setFiltros };
}

// components/novos-cadastros/NovoscadastrosContent.tsx (<150 linhas)
export function NovoscadastrosContent() {
  const { cadastros, loading, filtros, setFiltros } = useNovoscadastros();
  return <div>/* JSX */</div>;
}
```

---

### Pattern 3: Composição de Componentes

**Objetivo**: Quebrar UI gigante em sub-componentes lógicos

```typescript
// ANTES: components/LoteDetails.tsx (600+ linhas)
export function LoteDetails({ loteId }) {
  return (
    <div>
      {/* 200 linhas: HEADER */}
      {/* 150 linhas: FILTROS */}
      {/* 200 linhas: TABLE */}
      {/* 50 linhas: MODAIS */}
    </div>
  );
}

// DEPOIS: components/lote-details/
// - LoteDetailsPage.tsx (150 linhas - orquestra)
// - LoteHeader.tsx (60 linhas - header)
// - LoteFilters.tsx (80 linhas - filtros)
// - LoteTable.tsx (150 linhas - table)
// - LoteModals.tsx (100 linhas - modals)

export function LoteDetailsPage({ loteId }) {
  return (
    <div>
      <LoteHeader loteId={loteId} />
      <LoteFilters />
      <LoteTable loteId={loteId} />
      <LoteModals />
    </div>
  );
}
```

---

## 🔄 PROCESSO DE REFATORAÇÃO (POR SPRINT)

### Checklist Universal por Sprint

```
□ ANÁLISE
  □ Listar todas as exportações
  □ Mapear todos os imports (quem usa?)
  □ Criar diagrama de dependências
  □ Identificar "seams" (pontos de quebra)

□ PREPARAÇÃO
  □ Criar estrutura de pastas
  □ Criar arquivos de índice (INDEX)
  □ Escrever stubs (functions com comentários)
  □ Type-check (deve passar)

□ MIGRAÇÃO
  □ Mover lógica de A para B
  □ Atualizar imports internal
  □ Manter INDEX files compatíveis
  □ Build (deve compilar)

□ VERIFICAÇÃO
  □ Testes unitários passam
  □ Testes de integração passam
  □ Type-check sem erros
  □ Lint sem warnings
  □ Build otimizado funciona

□ DOCUMENTAÇÃO & COMMIT
  □ Atualizar comentários no código
  □ Atualizar docs
  □ Commit com mensagem clara
  □ Tag no .refactor-status
```

---

## ✅ CRITÉRIO DE SUCESSO

### Por Arquivo

- ✅ **Tamanho**: < 500 linhas (máximo ideal)
- ✅ **Testes**: 100% passando (deltas)
- ✅ **Build**: Sem erros
- ✅ **Lint**: Zero warnings
- ✅ **Tipos**: Strict mode sem erros
- ✅ **Imports**: Compatibilidade 100% (antigos imports continuam)
- ✅ **Documentação**: Com comentários explicativos

### Global

- ✅ **Nenhum teste quebrado**
- ✅ **Build continua otimizado**
- ✅ **Performance não regride** (bundle size, load time)
- ✅ **Funcionalidade idêntica**
- ✅ **Documentação atualizada**

---

## 📦 ESTRUTURA DE SPRINTS PROPOSTA

### Sprint 1: Preparação (1-2 horas)

- ✅ Este documento
- [ ] Setup de ambiente (logs, branch)
- [ ] Baseline de testes
- [ ] Diagrama de dependências

### Sprint 2: lib/db.ts - TYPES (4-6 horas)

- [ ] Extrair `lib/infrastructure/database/types.ts`
- [ ] Criar `lib/infrastructure/database/index.ts`
- [ ] Atualizar `lib/db.ts` (re-exports)
- [ ] Testes passam
- [ ] Build compila

### Sprint 3: lib/db.ts - CONNECTION (4-6 horas)

- [ ] Extrair `lib/infrastructure/database/connection.ts`
- [ ] Remover de `lib/db.ts`
- [ ] Testes passam
- [ ] Build compila

### Sprint 4: lib/db.ts - QUERIES (4-6 horas)

- [ ] Extrair `lib/infrastructure/database/queries.ts`
- [ ] Remover de `lib/db.ts`
- [ ] Testes passam
- [ ] Build compila

### Sprint 5: lib/db.ts - TRANSACTIONS (3-4 horas)

- [ ] Extrair `lib/infrastructure/database/transactions.ts`
- [ ] Testes passam
- [ ] Build compila

### Sprint 6: lib/db.ts - REPOSITORIES (8-10 horas)

- [ ] Criar `lib/repositories/entidade.repository.ts`
- [ ] Criar `lib/repositories/financial.repository.ts`
- [ ] Criar `lib/repositories/notifications.repository.ts`
- [ ] Testes passam
- [ ] Build compila

**[Continuar com componentes...]**

---

## 🛠️ FERRAMENTAS & SCRIPTS

### Script 1: Encontrar Imports

```bash
#!/bin/bash
# find-imports.sh - Encontrar todos os imports de um arquivo

grep -r "from '@/lib/db'" --include="*.ts" --include="*.tsx" | wc -l
grep -r "from '@/lib/db'" --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u > imports.log
```

### Script 2: Verificar Build Status

```bash
#!/bin/bash
# check-status.sh

echo "🧪 Type Check..."
pnpm type-check 2>&1 | tail -5

echo "📦 Build..."
pnpm build 2>&1 | tail -5

echo "✨ Lint..."
pnpm lint 2>&1 | tail -5
```

### Script 3: Refactor Status Tracker

```bash
# .refactor-status

PHASE=1
COMPLETED_SPRINTS=0
CURRENT_SPRINT=0

# Após cada sprint
echo "[$(date)] Sprint N: COMPLETED" >> .refactor-status
```

---

## 📚 REFERÊNCIAS

### Padrões já existentes no projeto

- ✅ `lib/config/branding.ts` (modularizado em sub-pastas)
- ✅ `lib/infrastructure/database/` (exemplo de decomposição)
- ✅ `__tests__/` (estrutura de testes já modularizada)

### Documentação interna

- 📖 `docs/architecture/refactor-plan.md`
- 📖 `docs/architecture/RELATORIO-FINAL-COMPLETO.md`
- 📖 `docs/DESENVOLVIMENTO-GUIDE.md`

---

## 🚀 PRÓXIMOS PASSOS

1. **Confirmar esta estratégia** com o time
2. **Criar baseline** (executar FASE 2)
3. **Iniciar Sprint 1** (preparação)
4. **Processar 1 arquivo por Sprint** (máximo 3 horas/sprint)
5. **Verificar a cada passo** (testes, build, lint)
6. **Documentar aprendizados**

---

**Autor**: GitHub Copilot  
**Versão**: 1.0  
**Status**: 📋 Aguardando aprovação
