# Guia de Sanitização de Testes - QWork

## 🎯 Objetivo

Este guia documenta o processo de sanitização e organização dos testes do projeto QWork, implementado em Janeiro de 2026.

## 📋 Checklist de Sanitização

### ✅ Estrutura de Arquivos

- [x] Criado `/tests` para testes de API isolados
- [x] Mantido `/__tests__` para testes gerais
- [x] Organização por módulo/funcionalidade
- [x] README.md em cada pasta principal
- [x] INVENTORY.md para rastreamento

### ✅ Documentação

- [x] README.md principal em `__tests__/`
- [x] README.md específico em `tests/api/emissor/laudos/`
- [x] INVENTORY.md com análise completa
- [x] Comentários JSDoc em testes críticos

### ✅ Qualidade de Código

- [x] Imports organizados e tipados
- [x] Mocks devidamente configurados
- [x] Cleanup em `beforeEach()`
- [x] Assertions robustas
- [x] Comentários descritivos

## 🔧 Padrões Aplicados

### Estrutura de Teste Padronizada

```typescript
/**
 * Testes de [Módulo/Funcionalidade]
 *
 * @module tests/[caminho]
 * @description Descrição do que é testado
 *
 * @see {@link /caminho/arquivo.ts} - Arquivo testado
 */

import type { Request } from 'next/server';
// ... outros imports

// Mocks
jest.mock('@/lib/modulo');

// Tipos
const mockFn = fn as jest.MockedFunction<typeof fn>;

/**
 * Suite de testes
 */
describe('Módulo - Funcionalidade', () => {
  /**
   * Setup comum
   */
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup de mocks
  });

  /**
   * Grupo de testes relacionados
   */
  describe('Caso de uso específico', () => {
    /**
     * Cenário: Descrição
     *
     * Verifica que:
     * - Item 1
     * - Item 2
     */
    it('deve comportar-se como esperado', async () => {
      // Arrange: Preparação
      // Act: Ação
      // Assert: Verificação
    });
  });
});
```

### Nomenclatura de Testes

| Tipo       | Padrão                          | Exemplo                    |
| ---------- | ------------------------------- | -------------------------- |
| API        | `<recurso>.test.ts`             | `laudos.test.ts`           |
| Componente | `<nome>.test.tsx`               | `Button.test.tsx`          |
| Hook       | `<nome>.test.ts`                | `useLaudos.test.ts`        |
| Integração | `<feature>.integration.test.ts` | `auth.integration.test.ts` |
| E2E        | `<fluxo>.e2e.test.ts`           | `checkout.e2e.test.ts`     |
| Unitário   | `<modulo>.unit.test.ts`         | `utils.unit.test.ts`       |

### Organização de Mocks

```typescript
// ✅ BOM: Mocks bem definidos e tipados
const mockQuery = query as jest.MockedFunction<typeof query>;

beforeEach(() => {
  jest.clearAllMocks();

  mockQuery.mockResolvedValueOnce({
    rows: [
      /* dados */
    ],
    rowCount: 1,
  } as any);
});

// ❌ EVITAR: Mock sem tipo ou cleanup
const mockQuery = query;
mockQuery.mockResolvedValue({ rows: [] }); // Sem cleanup
```

### Assertions Robustas

```typescript
// ✅ BOM: Assertions específicas e verificáveis
expect(response.status).toBe(200);
expect(data.success).toBe(true);
expect(data.hash).toMatch(/^[a-f0-9]{64}$/);

// ❌ EVITAR: Assertions frágeis
expect(element.className).toBe('flex justify-center items-center p-4'); // Específico demais
expect(screen.getByText('Clique aqui para continuar')); // Texto exato
```

## 📊 Métricas de Qualidade

### Antes da Sanitização

- Testes sem documentação clara
- Mocks inconsistentes
- Nomenclatura variada
- Sem organização por categoria
- @ts-nocheck em vários arquivos

### Depois da Sanitização

- ✅ Documentação completa (README, JSDoc)
- ✅ Mocks padronizados e tipados
- ✅ Nomenclatura consistente
- ✅ Organização por módulo/funcionalidade
- ✅ Redução de @ts-nocheck

## 🔍 Arquivos Sanitizados

### Testes de API

#### `tests/api/emissor/laudos/hash-sha256-laudo.test.ts`

**Melhorias Aplicadas:**

- ✅ JSDoc completo com @module e @description
- ✅ Imports organizados e tipados
- ✅ Comentários descritivos em cada teste
- ✅ Estrutura Arrange-Act-Assert clara
- ✅ Mocks devidamente tipados
- ✅ Assertions robustas com validações regex
- ✅ Casos de erro e sucesso cobertos

**Antes:**

```typescript
// Jest globals available by default
import { POST as emitirLaudo } from '@/app/api/emissor/laudos/[loteId]/route';

describe('Funcionalidades de Hash SHA-256 e Envio de Laudos', () => {
  it('deve gerar e armazenar hash SHA-256 do PDF durante emissão', async () => {
    // Mock verificação de lote
    mockQuery.mockResolvedValueOnce({ rows: [...], rowCount: 1 });
    // ...
  });
});
```

**Depois:**

```typescript
/**
 * Testes de Integração: Hash SHA-256 e Envio de Laudos
 *
 * @module tests/api/emissor/laudos
 * @description Testes para garantir integridade e rastreabilidade...
 */

import type { Request } from 'next/server';
import { POST as emitirLaudo } from '@/app/api/emissor/laudos/[loteId]/route';

describe('API /api/emissor/laudos - Hash SHA-256 e Integridade', () => {
  /**
   * Cenário: Emissão bem-sucedida com hash
   *
   * Verifica que:
   * - PDF é gerado corretamente
   * - Hash SHA-256 é calculado do buffer do PDF
   * ...
   */
  it('deve gerar e armazenar hash SHA-256 do PDF durante emissão', async () => {
    // Arrange: Mock das queries do banco
    mockQuery
      .mockResolvedValueOnce({ rows: [...], rowCount: 1 } as any)
      // ...
  });
});
```

## 📚 Documentação Criada

### Arquivos Novos

1. **`__tests__/README.md`**
   - Índice completo da estrutura de testes
   - Convenções de código
   - Comandos úteis
   - Métricas de qualidade

2. **`__tests__/INVENTORY.md`**
   - Inventário completo de todos os testes
   - Análise de duplicações
   - Recomendações de melhoria
   - Métricas e manutenção

3. **`tests/api/emissor/laudos/README.md`**
   - Documentação específica dos testes de hash
   - Casos de uso cobertos
   - Tecnologias e dependências
   - Guia de execução

4. **`__tests__/SANITIZATION-GUIDE.md`** (este arquivo)
   - Guia do processo de sanitização
   - Padrões aplicados
   - Exemplos antes/depois

## 🔄 Processo de Sanitização

### Passo 1: Análise

```bash
# Listar todos os testes
pnpm test --listTests

# Verificar padrões
pnpm validate:mocks
```

### Passo 2: Organização

- Agrupar testes por categoria
- Identificar duplicações
- Mapear dependências

### Passo 3: Sanitização

- Adicionar documentação JSDoc
- Padronizar imports
- Configurar mocks corretamente
- Melhorar assertions
- Adicionar comentários descritivos

### Passo 4: Validação

```bash
# Executar testes
pnpm test

# Verificar cobertura
pnpm test:coverage

# Validar políticas
pnpm validate:mocks
```

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas)

- [ ] Aplicar padrão em mais 10 arquivos de teste
- [ ] Revisar testes com @ts-nocheck
- [ ] Consolidar testes de correções antigas

### Médio Prazo (1 mês)

- [ ] Sanitizar todos os testes de `__tests__/api`
- [ ] Criar templates para novos testes
- [ ] Atualizar CI/CD com validações

### Longo Prazo (3 meses)

- [ ] 100% dos testes documentados
- [ ] Cobertura > 80%
- [ ] Zero @ts-nocheck injustificados
- [ ] Automação completa de validação

## 📖 Referências

- **Política de Mocks**: `/docs/testing/MOCKS_POLICY.md`
- **Política de Qualidade**: `/docs/testing/QUALITY-POLICY.md`
- **Exemplos**: `/docs/testing/MOCKS_POLICY_EXAMPLE.test.tsx`

## 🤝 Contribuindo

Ao adicionar novos testes:

1. ✅ Siga o padrão de estrutura documentado
2. ✅ Adicione JSDoc completo
3. ✅ Use comentários descritivos
4. ✅ Configure mocks corretamente
5. ✅ Execute `pnpm validate:mocks`
6. ✅ Atualize documentação se necessário

---

**Data de Sanitização**: 31 de Janeiro de 2026  
**Responsável**: Equipe de Desenvolvimento QWork  
**Status**: ✅ Fase 1 Completa
