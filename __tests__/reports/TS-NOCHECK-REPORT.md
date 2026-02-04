# Relatório de Análise: 8 Arquivos com @ts-nocheck

> Data: 31 de janeiro de 2026  
> Score Médio: 45/100  
> Total de Linhas: 2.168

---

## 📊 Sumário Executivo

### Problema Identificado

8 arquivos utilizam `@ts-nocheck` para suprimir erros de tipo TypeScript, indicando problemas estruturais profundos que impedem a validação de tipos adequada. Isso representa **1.6%** dos testes do projeto.

### Impacto no Score

- **Penalidade**: -10 pontos por arquivo
- **Score Atual**: 45/100
- **Score Potencial** (após refatoração): 55-85/100

---

## 📁 Arquivos Analisados

### 1. ****tests**/rh/funcionarios-bulk.test.tsx** ⚠️ CRÍTICO

**Linhas**: 714 (maior arquivo)  
**Complexidade**: ALTA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` na linha 1
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock global.fetch sem tipos
- ❌ Mock global.alert sem tipos
- ❌ Helpers criam objetos dinâmicos sem tipos (`createMockFuncionarios`)
- ❌ Componentes mockados sem tipos adequados

#### Código Problemático:

```tsx
// @ts-nocheck
global.fetch = jest.fn();
global.alert = jest.fn();

const createMockFuncionarios = (count: number) => {
  // Retorna array dinâmico sem tipo de retorno
  return Array.from({ length: count }).map((_, i) => ({
    cpf: String(10000000000 + i),
    // ... mais campos sem tipo
  }));
};
```

#### Complexidade:

- 20+ casos de teste
- Mock de 4 módulos Next.js
- Simulação de operações bulk (seleção/ação em massa)
- Integração com múltiplos componentes

#### Solução Proposta:

1. Criar `types/test-fixtures.ts` com tipos para mocks
2. Tipar `createMockFuncionarios` adequadamente
3. Usar `jest.MockedFunction` para global.fetch
4. Adicionar JSDoc completo
5. Implementar beforeEach tipado

**Estimativa**: 4-6 horas de refatoração

---

### 2. ****tests**/rh/empresa-dashboard-tabs.test.tsx** ⚠️ CRÍTICO

**Linhas**: 514  
**Complexidade**: ALTA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` na linha 6
- ❌ Sem JSDoc completo
- ❌ Sem type imports
- ❌ Mock global.fetch, global.alert, global.confirm sem tipos
- ❌ Mock de Chart.js sem tipos apropriados
- ❌ Array de 20 funcionários mockados sem tipo

#### Código Problemático:

```tsx
// @ts-nocheck
global.fetch = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn();

const mockFuncionarios = Array(20)
  .fill(null)
  .map((_, i) => ({
    // Objeto dinâmico sem tipo
    cpf: String(10000000000 + i),
    // ...
  }));
```

#### Complexidade:

- Sistema de abas complexo
- Integração com Chart.js
- Cards de lotes dinâmicos
- Múltiplos estados de UI

#### Solução Proposta:

1. Criar `types/chart-mocks.ts` para mocks do Chart.js
2. Tipar array `mockFuncionarios` com interface
3. Criar helper tipado para geração de fixtures
4. Adicionar JSDoc com @test tags
5. Substituir globals por mocks tipados

**Estimativa**: 4-6 horas de refatoração

---

### 3. ****tests**/api/admin/emissores.test.ts** ⚠️ ALTA PRIORIDADE

**Linhas**: 323  
**Complexidade**: MÉDIA-ALTA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` com justificativa genérica (ISSUE #TESTING-001)
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock de QueryResult sem tipo adequado
- ❌ Session mockada com `as Session` (type assertion perigosa)

#### Código Problemático:

```typescript
// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis
const adminSession: Session = {
  cpf: 'admin123',
  nome: 'Admin',
  perfil: 'admin',
} as Session; // ❌ Type assertion

mockQuery.mockResolvedValue({
  rows: [...], // ❌ Sem tipo
  rowCount: 1,
});
```

#### Justificativa Atual (Inválida):

> "Mocks de teste requerem tipos flexíveis para simular comportamentos diversos"

**Esta justificativa é falsa**. Mocks podem e devem ser tipados adequadamente usando `jest.MockedFunction` e `Partial<T>`.

#### Solução Proposta:

1. Remover `@ts-nocheck`
2. Criar `types/api-mocks.ts` com tipos de QueryResult
3. Usar `Partial<Session>` quando necessário
4. Adicionar type imports explícitos
5. Adicionar JSDoc completo
6. Usar `jest.MockedFunction` para todos os mocks

**Estimativa**: 2-3 horas de refatoração

---

### 4. ****tests**/sucesso-cadastro.test.tsx**

**Linhas**: 261  
**Complexidade**: MÉDIA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` na linha 1
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock de useRouter e useSearchParams sem tipos
- ❌ Mock global.fetch sem tipos

#### Código Problemático:

```tsx
// @ts-nocheck
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;
```

#### Complexidade:

- Múltiplos cenários de fluxo (sucesso, pagamento, sessão)
- Integração com next/navigation
- Testes de renderização condicional

#### Solução Proposta:

1. Tipar mocks do Next.js adequadamente
2. Criar `types/next-mocks.ts` para reutilização
3. Adicionar JSDoc e @test tags
4. Usar `jest.MockedFunction` para fetch
5. Adicionar type imports

**Estimativa**: 2-3 horas de refatoração

---

### 5. ****tests**/rh/lote-grupos-classificacao.test.tsx**

**Linhas**: 210  
**Complexidade**: MÉDIA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` na linha 1
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mocks inline sem tipos (mockLote, mockEstatisticas, mockFuncionarios)
- ❌ global.fetch sem tipo

#### Código Problemático:

```tsx
// @ts-nocheck
global.fetch = jest.fn();

const mockLote = {
  id: 1,
  // ... sem tipo
};

const mockFuncionarios = [
  {
    cpf: '12345678901',
    // ... sem tipo
  },
];
```

#### Complexidade:

- Testes de grupos e classificação
- Renderização de lote com estatísticas
- Estados de avaliação complexos

#### Solução Proposta:

1. Criar interfaces para Lote, Estatisticas, Funcionario
2. Tipar todos os mocks
3. Adicionar JSDoc
4. Remover @ts-nocheck
5. Adicionar type imports

**Estimativa**: 2-3 horas de refatoração

---

### 6. ****tests**/entidade/lote-reset-button.test.tsx**

**Linhas**: 55  
**Complexidade**: BAIXA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` na linha 1
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock do fetch inline sem tipos
- ❌ Implementação mockFetch com `url: any`

#### Código Problemático:

```tsx
// @ts-nocheck
mockFetch.mockImplementation((url: any) => {
  // ❌ any
  if (url === '/api/entidade/lote/1') {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        // Objeto sem tipo
      }),
    });
  }
});
```

#### Complexidade: BAIXA (arquivo pequeno, 2 testes simples)

#### Solução Proposta:

1. Remover `@ts-nocheck`
2. Tipar fetch mock adequadamente
3. Adicionar interfaces para resposta da API
4. Adicionar JSDoc
5. Usar `jest.MockedFunction<typeof fetch>`

**Estimativa**: 1-2 horas de refatoração (mais simples)

---

### 7. ****tests**/api/admin/planos.test.ts**

**Linhas**: 52  
**Complexidade**: BAIXA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` com justificativa genérica (ISSUE #TESTING-001)
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock com `as any` no QueryResult
- ❌ Session mockada com `as any`

#### Código Problemático:

```typescript
// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis
const adminSession = {
  cpf: 'admin123',
  nome: 'Admin',
  perfil: 'admin',
} as any; // ❌

mockQuery.mockResolvedValue({
  rows: [...],
  rowCount: 1,
} as any); // ❌
```

#### Complexidade: BAIXA (apenas 1 teste)

#### Solução Proposta:

1. Remover `@ts-nocheck` e justificativa inválida
2. Tipar Session corretamente
3. Tipar QueryResult adequadamente
4. Adicionar JSDoc
5. Adicionar type imports

**Estimativa**: 1-2 horas de refatoração

---

### 8. ****tests**/api/planos.test.ts**

**Linhas**: 39  
**Complexidade**: BAIXA  
**Score**: 45/100

#### Problemas Identificados:

- ❌ `@ts-nocheck` com justificativa genérica (ISSUE #TESTING-001)
- ❌ Sem JSDoc
- ❌ Sem type imports
- ❌ Mock com `as any` no QueryResult

#### Código Problemático:

```typescript
// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis
mockQuery.mockResolvedValue({
  rows: [...],
  rowCount: 1,
} as any); // ❌
```

#### Complexidade: BAIXA (apenas 1 teste, API pública)

#### Solução Proposta:

1. Remover `@ts-nocheck` e justificativa inválida
2. Tipar QueryResult adequadamente
3. Adicionar JSDoc
4. Adicionar type imports

**Estimativa**: 1 hora de refatoração (mais simples de todos)

---

## 🎯 Plano de Ação Recomendado

### Prioridade 1: Arquivos Simples (Quick Wins)

**Estimativa Total**: 3-5 horas

1. ✅ `api/planos.test.ts` (39 linhas) - 1h
2. ✅ `api/admin/planos.test.ts` (52 linhas) - 1-2h
3. ✅ `entidade/lote-reset-button.test.tsx` (55 linhas) - 1-2h

**Ganho**: 3 arquivos → Score +30 pontos

---

### Prioridade 2: Arquivos Médios

**Estimativa Total**: 6-9 horas

4. ✅ `sucesso-cadastro.test.tsx` (261 linhas) - 2-3h
5. ✅ `rh/lote-grupos-classificacao.test.tsx` (210 linhas) - 2-3h
6. ✅ `api/admin/emissores.test.ts` (323 linhas) - 2-3h

**Ganho**: 3 arquivos → Score +30 pontos

---

### Prioridade 3: Arquivos Críticos (Maior Impacto)

**Estimativa Total**: 8-12 horas

7. ✅ `rh/funcionarios-bulk.test.tsx` (714 linhas) - 4-6h
8. ✅ `rh/empresa-dashboard-tabs.test.tsx` (514 linhas) - 4-6h

**Ganho**: 2 arquivos → Score +20 pontos

---

## 📈 Impacto Esperado

### Antes da Refatoração

```
Com @ts-nocheck:     8 (1.6%)
Score médio:         45/100
```

### Após Refatoração Completa

```
Com @ts-nocheck:     0 (0.0%) ✨
Score médio:         55-85/100 🎯
```

### Benefícios Adicionais

- ✅ **Type Safety**: Erros detectados em tempo de compilação
- ✅ **IntelliSense**: Autocompletar aprimorado no VSCode
- ✅ **Manutenibilidade**: Código mais fácil de entender e modificar
- ✅ **Documentação**: JSDoc fornece contexto e exemplos
- ✅ **Refatoração Segura**: Mudanças de tipo detectadas automaticamente
- ✅ **Onboarding**: Novos desenvolvedores entendem tipos esperados

---

## 🔧 Recursos a Criar

### Arquivos de Tipos Compartilhados

Para evitar duplicação e facilitar refatoração:

```typescript
// types/test-fixtures.ts
export interface MockFuncionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  email?: string;
  matricula?: string;
  nivel_cargo: 'operacional' | 'gestao' | 'lideranca';
  turno?: string;
  escala?: string;
}

// types/api-mocks.ts
export type MockQueryResult<T> = {
  rows: T[];
  rowCount: number;
};

// types/next-mocks.ts
export interface MockRouter {
  push: jest.MockedFunction<(path: string) => void>;
  replace?: jest.MockedFunction<(path: string) => void>;
}

// types/chart-mocks.ts
export interface MockChartConfig {
  register: jest.MockedFunction<(...args: any[]) => void>;
}
```

---

## 📊 Estatísticas

| Métrica                    | Valor            |
| -------------------------- | ---------------- |
| **Total de Arquivos**      | 8                |
| **Total de Linhas**        | 2.168            |
| **Score Atual**            | 45/100           |
| **Score Potencial**        | 55-85/100        |
| **Ganho de Score**         | +10 a +40 pontos |
| **Tempo Estimado (Total)** | 17-26 horas      |
| **Tempo Médio/Arquivo**    | 2-3 horas        |

---

## ⚠️ Notas Importantes

### Justificativas Inválidas Encontradas

3 arquivos usam a justificativa:

> `@ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis para simular comportamentos diversos (ISSUE #TESTING-001)`

**Esta justificativa é tecnicamente incorreta**. TypeScript e Jest fornecem ferramentas adequadas para tipar mocks:

- `jest.MockedFunction<T>`
- `Partial<T>`
- `Pick<T, K>`
- Type assertions específicas quando absolutamente necessário

**Não há razão válida para desabilitar verificação de tipos em testes modernos**.

---

## 🚀 Próximos Passos

1. **Fase 1** (1 semana): Refatorar arquivos de Prioridade 1 (quick wins)
2. **Fase 2** (1 semana): Refatorar arquivos de Prioridade 2 (médios)
3. **Fase 3** (1-2 semanas): Refatorar arquivos de Prioridade 3 (críticos)
4. **Validação**: Executar `node scripts/analyze-test-quality.cjs` após cada fase
5. **Meta Final**: 0 arquivos com @ts-nocheck, score médio 70+/100

---

**Relatório gerado automaticamente**  
**Ferramenta**: `analyze-test-quality.cjs`  
**Data**: 31/01/2026
