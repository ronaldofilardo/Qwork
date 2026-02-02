# 🏆 Características dos Top 10 Testes - Guia de Aplicação

> Análise das características que tornam os melhores testes exemplares

## 📊 Visão Geral

Os **10 melhores testes** (scores 85-100) compartilham características específicas que os tornam exemplares. Este guia detalha cada característica e como aplicá-las nos testes que precisam de melhoria.

---

## ✨ Características Principais

### 1. 📝 JSDoc Completo e Descritivo

#### ✅ O Que os Top 10 Fazem

```typescript
/**
 * Testes de Row Level Security (RLS) e RBAC
 * Validam isolamento de dados por perfil e permissões granulares
 */

/**
 * Testes para recálculo de status de lote e emissão imediata
 * Cobre especialmente o caso em que avaliações inativadas são contadas
 * como parte do total, e a emissão deve ocorrer quando (concluídas + inativadas) = total
 */

/**
 * Testes robustos para Sistema de Proteção Crítica de Senhas
 *
 * Cobertura:
 * - Trigger de bloqueio de DELETE
 * - Auditoria automática
 * - Função segura de deleção
 * - View de auditoria
 * - Função de limpeza para testes
 */
```

#### ❌ O Que os Piores Fazem

```typescript
// __tests__/hooks/useCadastroContratante.test.ts
// NENHUM JSDoc

// __tests__/api/admin-cobranca-get.test.ts
// NENHUM comentário de cabeçalho
```

#### 🎯 Como Aplicar

**Template para Adicionar:**

```typescript
/**
 * Testes de [Nome do Módulo/Funcionalidade]
 *
 * @description
 * [Breve descrição do que é testado e por quê]
 *
 * Cobertura:
 * - [Funcionalidade 1]
 * - [Funcionalidade 2]
 * - [Caso de borda X]
 *
 * @see {@link /caminho/arquivo.ts} - Arquivo testado
 */
```

**Exemplo de Aplicação no admin-cobranca-get.test.ts:**

```typescript
/**
 * Testes da API GET /api/admin/cobranca
 *
 * @description
 * Valida o fallback para pagamento.valor quando cobranca_pagamento.valor_pago é nulo
 *
 * Cobertura:
 * - Fallback para valor do pagamento registrado
 * - Cálculo correto de parcelas pagas/pendentes
 * - Retorno de dados de cobrança por CNPJ
 *
 * @see {@link /app/api/admin/cobranca/route.ts} - API Route
 */
```

---

### 2. 🎯 Type Imports Explícitos

#### ✅ O Que os Top 10 Fazem

```typescript
import { Session, NivelCargoType } from '@/lib/session';
import type { QueryResult } from 'pg';

// Separação clara entre tipos e valores
import { query } from '@/lib/db';
import type { QueryResult } from 'pg';
```

#### ❌ O Que os Piores Fazem

```typescript
// Nenhum import type
import { query } from '@/lib/db';
import { createTestContratante } from '../helpers/test-data-factory';
```

#### 🎯 Como Aplicar

**Antes:**

```typescript
import { query } from '@/lib/db';
import { createTestContratante } from '../helpers/test-data-factory';
```

**Depois:**

```typescript
import type { QueryResult } from 'pg';
import { query } from '@/lib/db';
import { createTestContratante } from '../helpers/test-data-factory';
```

**Regra Simples:**

- Use `import type` para tipos, interfaces, e types
- Use `import` normal para funções, classes e valores

---

### 3. 🧹 beforeEach com jest.clearAllMocks()

#### ✅ O Que os Top 10 Fazem

```typescript
describe('Row Level Security (RLS) Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Setup adicional se necessário
  });

  // Testes...
});
```

```typescript
describe('🔒 Sistema de Proteção Crítica de Senhas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes...
});
```

#### ❌ O Que os Piores Fazem

```typescript
describe('GET /api/admin/cobranca - fallback to pagamento.valor', () => {
  // NENHUM beforeEach

  beforeAll(async () => {
    // Setup de dados
  });

  // Testes sem cleanup de mocks
});
```

#### 🎯 Como Aplicar

**Template:**

```typescript
describe('Módulo de Teste', () => {
  // Setup que roda antes de CADA teste
  beforeEach(() => {
    // 1. SEMPRE limpar mocks
    jest.clearAllMocks();

    // 2. Resetar estados se necessário
    // someStore.reset();

    // 3. Setup adicional específico
  });

  // beforeAll para dados que não mudam
  beforeAll(async () => {
    // Criar dados de teste que serão usados por todos os testes
  });

  // afterAll para cleanup
  afterAll(async () => {
    // Limpar dados de teste
  });
});
```

**Exemplo de Aplicação:**

```typescript
describe('GET /api/admin/cobranca - fallback to pagamento.valor', () => {
  let contratanteId: number;
  let pagamentoId: number;
  const cnpj = '99999999000101';

  // ✅ ADICIONAR: Limpeza de mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    // Dados de teste...
  });

  afterAll(async () => {
    // Cleanup...
  });
});
```

---

### 4. 📝 Comentários Descritivos em Testes

#### ✅ O Que os Top 10 Fazem

```typescript
it('deve marcar lote como concluído e chamar emitirLaudoImediato quando ativas=concluidas>0 (inativadas presentes)', async () => {
  // 1) SELECT lote_id FROM avaliacoes WHERE id = $1
  mockQuery.mockResolvedValueOnce({
    rows: [{ lote_id: 42 }],
    rowCount: 1,
  } as unknown as QueryResult<unknown>);

  // 2) stats: total=5, ativas=3, concluidas=3, iniciadas=0 -> concluido
  mockQuery.mockResolvedValueOnce({
    rows: [
      {
        total_avaliacoes: '5',
        ativas: '3',
        concluidas: '3',
        inativadas: '2',
        iniciadas: '0',
      },
    ],
    rowCount: 1,
  } as unknown as QueryResult<unknown>);

  // 3) SELECT status FROM lotes_avaliacao
  mockQuery.mockResolvedValueOnce({
    rows: [{ status: 'ativo' }],
    rowCount: 1,
  } as unknown as QueryResult<unknown>);
});
```

```typescript
test('❌ DELETE direto deve ser BLOQUEADO', async () => {
  // Simular erro do trigger PostgreSQL
  const triggerError = new Error(
    'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita.'
  );
  mockQuery.mockRejectedValue(triggerError);

  // Verificar que operação é bloqueada
  await expect(
    query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [18])
  ).rejects.toThrow('OPERAÇÃO BLOQUEADA');
});
```

#### ❌ O Que os Piores Fazem

```typescript
it('retorna valor_pago igual ao pagamento registrado quando cp.valor_pago é nulo', async () => {
  const { GET } = await import('@/app/api/admin/cobranca/route');

  const resp = await GET(
    new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
  );
  const data = await resp.json();
  console.log('Cobranca API response:', data); // ❌ console.log

  expect(data.success).toBe(true);
  // Sem comentários explicando o que está sendo testado
});
```

#### 🎯 Como Aplicar

**Template:**

```typescript
it('deve [comportamento esperado]', async () => {
  // Arrange: Preparar dados e mocks
  // [Explicar o que está sendo configurado]
  // Act: Executar a ação
  // [Explicar o que a função faz]
  // Assert: Verificar resultado
  // [Explicar o que está sendo validado]
});
```

**Exemplo de Aplicação:**

```typescript
it('retorna valor_pago igual ao pagamento registrado quando cp.valor_pago é nulo', async () => {
  // Arrange: Carregar API route
  const { GET } = await import('@/app/api/admin/cobranca/route');

  // Act: Fazer requisição GET com CNPJ
  const resp = await GET(
    new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
  );
  const data = await resp.json();

  // Assert: Verificar que fallback funciona corretamente
  expect(data.success).toBe(true);
  expect(data.cobranca.valor_pago).toBe(360); // Valor da primeira parcela
  expect(data.cobranca.parcelas_pagas).toBe(1);
  expect(data.cobranca.parcelas_pendentes).toBe(4);
});
```

---

### 5. 🎨 Emojis e Organização Visual

#### ✅ O Que os Top 10 Fazem

```typescript
describe('🔒 Sistema de Proteção Crítica de Senhas', () => {
  describe('🚫 Trigger de Bloqueio - DELETE Direto', () => {
    test('❌ DELETE direto deve ser BLOQUEADO', async () => {
      // ...
    });

    test('❌ DELETE sem WHERE deve ser BLOQUEADO', async () => {
      // ...
    });
  });

  describe('✅ Função Segura de Deleção', () => {
    test('✅ Deleção autorizada deve SUCEDER', async () => {
      // ...
    });
  });
});
```

#### 🎯 Como Aplicar

**Emojis Recomendados:**

```typescript
// Categorias de teste
🔒 Segurança
🚫 Bloqueios/Rejeições
✅ Sucessos
❌ Falhas Esperadas
🔄 Fluxos Completos
📊 Dados e Estatísticas
🎯 Validações
⚠️ Casos de Borda
🧹 Cleanup
🏗️ Setup

// Nos testes
describe('🔒 Autenticação', () => {
  describe('✅ Login Bem-sucedido', () => {
    it('✅ deve autenticar com credenciais válidas', () => {});
  });

  describe('❌ Falhas de Login', () => {
    it('❌ deve rejeitar senha incorreta', () => {});
    it('❌ deve rejeitar usuário inexistente', () => {});
  });
});
```

---

### 6. 🎯 Estrutura Arrange-Act-Assert Clara

#### ✅ O Que os Top 10 Fazem

```typescript
it('deve ver apenas seus próprios dados de funcionário', async () => {
  // Arrange: Configurar contexto de sessão
  await query(`SET LOCAL app.current_user_cpf = '${funcionarioSession.cpf}'`);
  await query(
    `SET LOCAL app.current_user_perfil = '${funcionarioSession.perfil}'`
  );

  // Act: Buscar dados
  const result = await query(
    'SELECT COUNT(*) as count FROM funcionarios WHERE cpf = $1',
    [funcionarioSession.cpf]
  );

  // Assert: Verificar resultado
  expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
});
```

#### 🎯 Como Aplicar

**Template Completo:**

```typescript
it('deve [comportamento]', async () => {
  // ==================== ARRANGE ====================
  // Preparar dados de teste
  const testData = {
    /* ... */
  };

  // Configurar mocks
  mockFn.mockResolvedValueOnce(/* ... */);

  // ==================== ACT ====================
  // Executar a função/operação sendo testada
  const result = await functionUnderTest(testData);

  // ==================== ASSERT ====================
  // Verificar resultado esperado
  expect(result).toBeDefined();
  expect(result.status).toBe('success');

  // Verificar chamadas de mock
  expect(mockFn).toHaveBeenCalledWith(/* ... */);
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

---

### 7. 🛡️ Tipagem Forte de Mocks

#### ✅ O Que os Top 10 Fazem

```typescript
import type { QueryResult } from 'pg';

const mockQuery = jest.mocked(query, true);

// Mock com tipagem explícita
mockQuery.mockResolvedValueOnce({
  rows: [{ lote_id: 42 }],
  rowCount: 1,
} as unknown as QueryResult<unknown>);
```

#### ❌ O Que os Piores Fazem

```typescript
// Mock sem tipagem
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(() =>
    Promise.resolve({ cpf: '00000000000', perfil: 'admin' })
  ),
}));
```

#### 🎯 Como Aplicar

**Antes:**

```typescript
jest.mock('@/lib/db');

const mockQuery = require('@/lib/db').query;
```

**Depois:**

```typescript
import type { QueryResult } from 'pg';
import { query } from '@/lib/db';

jest.mock('@/lib/db');

const mockQuery = jest.mocked(query, true);

// Usar com tipagem
mockQuery.mockResolvedValueOnce({
  rows: [
    /* ... */
  ],
  rowCount: 1,
} as QueryResult<any>);
```

---

### 8. 🧪 Casos de Teste Específicos e Nomeados

#### ✅ O Que os Top 10 Fazem

```typescript
describe('Isolamento: Perfil Funcionário', () => {
  it('deve ver apenas seus próprios dados de funcionário', async () => {});
  it('NÃO deve ver dados de outros funcionários', async () => {});
  it('NÃO deve acessar dados de outras empresas', async () => {});
});

describe('Isolamento: Perfil RH', () => {
  it('deve ver todos os funcionários da sua empresa', async () => {});
  it('NÃO deve ver funcionários de outras empresas', async () => {});
});
```

#### 🎯 Como Aplicar

**Princípios:**

1. **Agrupe por funcionalidade/cenário**
2. **Nomes descritivos e específicos**
3. **Um comportamento por teste**
4. **Casos positivos e negativos**

**Template:**

```typescript
describe('Módulo Principal', () => {
  describe('Cenário 1: Caso de Sucesso', () => {
    it('deve [ação] quando [condição]', () => {});
    it('deve [ação] com [dados específicos]', () => {});
  });

  describe('Cenário 2: Validações', () => {
    it('deve rejeitar [entrada inválida]', () => {});
    it('deve retornar erro quando [condição de erro]', () => {});
  });

  describe('Cenário 3: Casos de Borda', () => {
    it('deve lidar com [caso especial]', () => {});
  });
});
```

---

### 9. 🔄 Cleanup Adequado

#### ✅ O Que os Top 10 Fazem

```typescript
describe('Sistema de Testes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Limpar mocks antes de CADA teste
  });

  afterAll(async () => {
    // Limpar dados de teste no banco
    await query('DELETE FROM tabela WHERE id = $1', [testId]);
  });
});
```

#### 🎯 Como Aplicar

**Template Completo:**

```typescript
describe('Testes com Dados de Banco', () => {
  let testDataId: number;

  // Setup que roda UMA VEZ antes de todos os testes
  beforeAll(async () => {
    // Criar dados de teste
    testDataId = await createTestData();
  });

  // Setup que roda antes de CADA teste
  beforeEach(() => {
    // Sempre limpar mocks
    jest.clearAllMocks();

    // Resetar estados
    // store.reset();
  });

  // Cleanup que roda UMA VEZ depois de todos os testes
  afterAll(async () => {
    // Limpar dados de teste do banco
    await cleanupTestData(testDataId);
  });

  // Cleanup que roda depois de CADA teste (se necessário)
  afterEach(() => {
    // Cleanup específico por teste
  });
});
```

---

### 10. 📊 Sem console.log em Produção

#### ❌ O Que os Piores Fazem

```typescript
it('teste', async () => {
  const data = await api.fetch();
  console.log('API response:', data); // ❌ NÃO FAZER
  expect(data).toBeDefined();
});
```

#### ✅ Como Corrigir

**Remover completamente:**

```typescript
it('teste', async () => {
  const data = await api.fetch();
  // console.log removido
  expect(data).toBeDefined();
});
```

**Ou usar apenas em debug:**

```typescript
it('teste', async () => {
  const data = await api.fetch();

  // ✅ OK: Comentado para debug futuro
  // if (process.env.DEBUG_TESTS) {
  //   console.log('API response:', data);
  // }

  expect(data).toBeDefined();
});
```

---

## 📋 Checklist de Aplicação

### Para Cada Teste que Precisa Melhoria:

```typescript
// ✅ CHECKLIST DE SANITIZAÇÃO

// [ ] 1. JSDoc Completo
/**
 * Testes de [Módulo]
 * @description [O que testa]
 * Cobertura: [Lista]
 */

// [ ] 2. Type Imports
import type { TipoX } from '@/lib/modulo';

// [ ] 3. Mocks no topo, tipados
jest.mock('@/lib/db');
const mockFn = jest.mocked(fn, true);

// [ ] 4. beforeEach com clearAllMocks
beforeEach(() => {
  jest.clearAllMocks();
});

// [ ] 5. Estrutura organizada
describe('Módulo', () => {
  describe('Cenário', () => {
    it('deve comportar-se', () => {});
  });
});

// [ ] 6. Comentários Arrange-Act-Assert
it('teste', () => {
  // Arrange
  // Act
  // Assert
});

// [ ] 7. Nomes descritivos
it('deve [ação] quando [condição]', () => {});

// [ ] 8. Cleanup adequado
afterAll(async () => {
  // Limpar dados
});

// [ ] 9. Sem console.log
// (remover todos)

// [ ] 10. Assertions robustas
expect(result).toMatchObject({
  /* específico */
});
```

---

## 🎯 Plano de Ação: Top 10 Piores

### 1. **tests**/hooks/useCadastroContratante.test.ts (Score: 30)

**Ações:**

- [ ] Adicionar JSDoc completo
- [ ] Adicionar `import type` para tipos React
- [ ] Adicionar `beforeEach(() => jest.clearAllMocks())`
- [ ] Estruturar com describe/it
- [ ] Adicionar comentários AAA

**Template de Melhoria:**

```typescript
/**
 * Testes do Hook useCadastroContratante
 *
 * @description
 * Valida o comportamento do hook de cadastro de contratantes
 *
 * Cobertura:
 * - Estados do formulário
 * - Validações de entrada
 * - Submissão de dados
 * - Tratamento de erros
 *
 * @see {@link /lib/hooks/useCadastroContratante.ts}
 */

import type { RenderResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useCadastroContratante } from '@/lib/hooks/useCadastroContratante';

jest.mock('@/lib/api');

describe('Hook: useCadastroContratante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', () => {
      // Arrange & Act
      const { result } = renderHook(() => useCadastroContratante());

      // Assert
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
```

### 2. **tests**/api/admin-cobranca-get.test.ts (Score: 40)

**Ações:**

- [ ] Adicionar JSDoc
- [ ] Adicionar type imports
- [ ] Adicionar beforeEach
- [ ] Remover console.log
- [ ] Adicionar comentários AAA

**Antes vs Depois:**

```typescript
// ❌ ANTES (Score: 40)
import { query } from '@/lib/db';

describe('GET /api/admin/cobranca - fallback to pagamento.valor', () => {
  let contratanteId: number;

  beforeAll(async () => {
    contratanteId = await createTestContratante({});
  });

  it('retorna valor_pago', async () => {
    const { GET } = await import('@/app/api/admin/cobranca/route');
    const resp = await GET(
      new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
    );
    const data = await resp.json();
    console.log('Cobranca API response:', data);
    expect(data.success).toBe(true);
  });
});
```

```typescript
// ✅ DEPOIS (Score: 85+)
/**
 * Testes da API GET /api/admin/cobranca
 *
 * @description
 * Valida o fallback para pagamento.valor quando cobranca_pagamento.valor_pago é nulo
 *
 * Cobertura:
 * - Fallback para valor do pagamento registrado
 * - Cálculo de parcelas pagas/pendentes
 * - Retorno de dados por CNPJ
 *
 * @see {@link /app/api/admin/cobranca/route.ts}
 */

import type { QueryResult } from 'pg';
import { query } from '@/lib/db';
import { createTestContratante } from '../helpers/test-data-factory';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(() =>
    Promise.resolve({ cpf: '00000000000', perfil: 'admin' })
  ),
}));

describe('API: GET /api/admin/cobranca', () => {
  let contratanteId: number;
  let pagamentoId: number;
  const cnpj = '99999999000101';

  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    // Arrange: Criar dados de teste
    contratanteId = await createTestContratante({
      tipo: 'clinica',
      cnpj,
      nome: 'Teste Cobrança Fallback',
      email: `cobranca-${Date.now()}@example.com`,
    });

    // Criar pagamento com parcelas
    const detalhes = [
      { numero: 1, valor: 360, data_vencimento: '2025-12-30', pago: true },
      { numero: 2, valor: 360, data_vencimento: '2026-01-30', pago: false },
    ];

    const result = (await query(
      `INSERT INTO pagamentos (contratante_id, valor, numero_parcelas, detalhes_parcelas, status)
       VALUES ($1, $2, $3, $4, 'pago') RETURNING id`,
      [contratanteId, '720.00', 2, JSON.stringify(detalhes)]
    )) as QueryResult;

    pagamentoId = result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  describe('Fallback de Valor Pago', () => {
    it('deve retornar valor_pago do pagamento quando cp.valor_pago é nulo', async () => {
      // Arrange: Importar API route
      const { GET } = await import('@/app/api/admin/cobranca/route');

      // Act: Fazer requisição GET
      const resp = await GET(
        new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
      );
      const data = await resp.json();

      // Assert: Verificar resposta
      expect(data.success).toBe(true);
      expect(data.cobranca.valor_pago).toBe(360);
      expect(data.cobranca.parcelas_pagas).toBe(1);
      expect(data.cobranca.parcelas_pendentes).toBe(1);
    });
  });
});
```

---

## 📊 Comparação de Scores

### Aplicando Todas as Características:

| Característica             | Pontos | Cumulativo |
| -------------------------- | ------ | ---------- |
| JSDoc Completo             | +20    | 20         |
| Type Imports               | +15    | 35         |
| beforeEach + clearAllMocks | +15    | 50         |
| Sem @ts-nocheck            | +20    | 70         |
| Sem console.log            | +10    | 80         |
| describe presente          | +10    | 90         |
| it/test presente           | +10    | 100        |

**Score Mínimo para Qualidade**: 70/100  
**Score Atual dos Piores**: 30-40/100  
**Score Após Aplicação**: 85-100/100 ✨

---

## 🎓 Conclusão

Os top 10 testes não são perfeitos por acaso. Eles seguem um padrão consistente que resulta em:

### ✅ Benefícios Imediatos

- **Legibilidade**: Qualquer desenvolvedor entende o teste rapidamente
- **Manutenibilidade**: Fácil atualizar quando código muda
- **Confiabilidade**: Testes isolados e determinísticos
- **Debugabilidade**: Fácil identificar o que falhou

### 🎯 Próximos Passos

1. **Escolha um teste do top 10 piores**
2. **Aplique o checklist de sanitização**
3. **Execute**: `pnpm quality:tests-analyze`
4. **Compare o score antes/depois**
5. **Repita para os outros 9**

### 📈 Meta

**Transformar todos os testes 30-40 em 85-100 em 2 semanas!**

---

**Criado**: 31 de Janeiro de 2026  
**Baseado em**: Análise dos 494 testes do projeto  
**Ferramenta**: `pnpm quality:tests-analyze`
