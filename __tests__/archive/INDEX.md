# 📚 Índice Master - Testes QWork

> Ponto central de navegação para toda a documentação de testes

## 🗺️ Navegação Rápida

### 📖 Documentação Principal

- **[README.md](__tests__/README.md)** - Estrutura completa de testes
- **[INVENTORY.md](__tests__/INVENTORY.md)** - Inventário e análise de testes
- **[SANITIZATION-GUIDE.md](__tests__/SANITIZATION-GUIDE.md)** - Guia de sanitização

### 📂 Documentação por Módulo

- **[tests/api/emissor/laudos/README.md](tests/api/emissor/laudos/README.md)** - Testes de hash SHA-256

### 📋 Políticas e Convenções

- **[MOCKS_POLICY.md](docs/testing/MOCKS_POLICY.md)** - Política de mocks
- **[QUALITY-POLICY.md](docs/testing/QUALITY-POLICY.md)** - Política de qualidade
- **[MOCKS_POLICY_EXAMPLE.test.tsx](docs/testing/MOCKS_POLICY_EXAMPLE.test.tsx)** - Exemplos práticos

## 🎯 Início Rápido

### Para Desenvolvedores

#### Executar Testes

```bash
# Todos os testes
pnpm test

# Testes específicos
pnpm test __tests__/api/emissor

# Com cobertura
pnpm test:coverage

# Modo watch
pnpm test:watch
```

#### Criar Novo Teste

1. Escolha o diretório apropriado
2. Siga o template em [SANITIZATION-GUIDE.md]
3. Execute `pnpm validate:mocks`
4. Execute os testes

#### Analisar Qualidade

```bash
# Analisar qualidade dos testes
node scripts/analyze-test-quality.js

# Validar política de mocks
pnpm validate:mocks
```

### Para Revisores

#### Checklist de Review

- [ ] Testes seguem estrutura padronizada
- [ ] JSDoc presente e completo
- [ ] Mocks configurados corretamente
- [ ] `beforeEach()` com `jest.clearAllMocks()`
- [ ] Assertions robustas e verificáveis
- [ ] Casos de erro cobertos
- [ ] Sem `@ts-nocheck` desnecessário
- [ ] Sem `console.log` em produção

## 📊 Estrutura Visual

```
QWork/
├── __tests__/                    # Testes gerais
│   ├── README.md                 # 📖 Índice de testes
│   ├── INVENTORY.md              # 📊 Inventário completo
│   ├── SANITIZATION-GUIDE.md     # 🧹 Guia de sanitização
│   ├── INDEX.md                  # 📚 Este arquivo
│   │
│   ├── api/                      # Testes de API
│   │   ├── admin/
│   │   ├── emissor/
│   │   ├── rh/
│   │   └── system/
│   │
│   ├── components/               # Testes de componentes
│   ├── hooks/                    # Testes de hooks
│   ├── lib/                      # Testes de utilitários
│   │   ├── hooks/
│   │   └── test-helpers.ts       # 🛠️ Utilitários de teste
│   │
│   ├── visual-regression/        # Testes visuais
│   │   └── README.md
│   │
│   ├── integration/              # Testes de integração
│   ├── e2e/                      # Testes E2E
│   └── unit/                     # Testes unitários
│
├── tests/                        # Testes de API isolados
│   └── api/
│       └── emissor/
│           └── laudos/
│               ├── README.md     # 📖 Doc específica
│               └── hash-sha256-laudo.test.ts
│
├── docs/
│   └── testing/                  # Documentação de testes
│       ├── MOCKS_POLICY.md
│       ├── QUALITY-POLICY.md
│       └── MOCKS_POLICY_EXAMPLE.test.tsx
│
└── scripts/
    └── analyze-test-quality.js   # 🔍 Análise de qualidade
```

## 🎨 Convenções

### Nomenclatura

| Tipo        | Padrão                          | Localização                      |
| ----------- | ------------------------------- | -------------------------------- |
| API Test    | `<recurso>.test.ts`             | `__tests__/api/` ou `tests/api/` |
| Component   | `<Nome>.test.tsx`               | `__tests__/components/`          |
| Hook        | `use<Nome>.test.ts`             | `__tests__/hooks/`               |
| Integration | `<feature>.integration.test.ts` | `__tests__/integration/`         |
| E2E         | `<fluxo>.e2e.test.ts`           | `__tests__/e2e/`                 |
| Unit        | `<modulo>.unit.test.ts`         | `__tests__/unit/`                |

### Template de Teste

```typescript
/**
 * Testes de [Descrição]
 *
 * @module tests/[caminho]
 * @description O que é testado e por quê
 */

import type { Request } from 'next/server';
// ... outros imports

// Mocks
jest.mock('@/lib/modulo');

describe('Módulo - Funcionalidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Caso de uso', () => {
    /**
     * Cenário: Descrição do cenário
     *
     * Verifica que:
     * - Comportamento 1
     * - Comportamento 2
     */
    it('deve fazer algo específico', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 📈 Métricas de Qualidade

### Objetivos

| Métrica                  | Meta | Status Atual |
| ------------------------ | ---- | ------------ |
| Cobertura - Statements   | 80%  | ~75%         |
| Cobertura - Branches     | 70%  | ~65%         |
| Cobertura - Functions    | 80%  | ~70%         |
| Cobertura - Lines        | 80%  | ~75%         |
| Testes com JSDoc         | 80%  | ~30% ⚠️      |
| Testes sem @ts-nocheck   | 95%  | ~90%         |
| Score Médio de Qualidade | 70+  | ~55 ⚠️       |

### Como Melhorar

Execute periodicamente:

```bash
# Analisar qualidade
node scripts/analyze-test-quality.js

# Verificar cobertura
pnpm test:coverage

# Validar mocks
pnpm validate:mocks
```

## 🔄 Manutenção

### Tarefas Regulares

#### Diariamente

- [ ] Executar testes antes de commit
- [ ] Verificar testes falhando no CI

#### Semanalmente

- [ ] Revisar relatório de qualidade
- [ ] Atualizar snapshots se necessário
- [ ] Revisar warnings do ESLint

#### Mensalmente

- [ ] Analisar cobertura de código
- [ ] Atualizar documentação
- [ ] Consolidar testes duplicados
- [ ] Arquivar testes obsoletos

#### Trimestralmente

- [ ] Auditoria completa de testes
- [ ] Atualizar políticas
- [ ] Treinar equipe
- [ ] Revisar métricas e objetivos

## 🚀 Comandos Úteis

### Testes

```bash
# Executar todos os testes
pnpm test

# Testes de um arquivo específico
pnpm test path/to/file.test.ts

# Testes com pattern
pnpm test emissor

# Modo watch
pnpm test:watch

# Cobertura
pnpm test:coverage

# Testes visuais
pnpm test:visual

# E2E
pnpm test:e2e
```

### Qualidade

```bash
# Validar mocks
pnpm validate:mocks

# Analisar qualidade
node scripts/analyze-test-quality.js

# Verificar tipos
pnpm type-check

# Lint
pnpm lint
```

### Documentação

```bash
# Gerar relatório de qualidade
node scripts/analyze-test-quality.js

# Ver relatório
cat __tests__/quality-report.json
```

## 📚 Recursos Adicionais

### Links Úteis

- **Jest**: https://jestjs.io/
- **Testing Library**: https://testing-library.com/
- **React Testing**: https://testing-library.com/docs/react-testing-library/intro/
- **Mocking**: https://jestjs.io/docs/mock-functions

### Documentação Interna

1. **[README.md](__tests__/README.md)** - Estrutura e organização
2. **[INVENTORY.md](__tests__/INVENTORY.md)** - Análise detalhada
3. **[SANITIZATION-GUIDE.md](__tests__/SANITIZATION-GUIDE.md)** - Processo de sanitização
4. **[tests/api/emissor/laudos/README.md](tests/api/emissor/laudos/README.md)** - Exemplo de doc específica

### Políticas e Padrões

1. **[MOCKS_POLICY.md](docs/testing/MOCKS_POLICY.md)** - Como mockar corretamente
2. **[QUALITY-POLICY.md](docs/testing/QUALITY-POLICY.md)** - Padrões de qualidade
3. **[MOCKS_POLICY_EXAMPLE.test.tsx](docs/testing/MOCKS_POLICY_EXAMPLE.test.tsx)** - Exemplos práticos

## 🤝 Contribuindo

### Adicionar Novo Teste

1. Escolha o diretório apropriado
2. Siga o template padronizado
3. Adicione JSDoc completo
4. Configure mocks corretamente
5. Execute `pnpm validate:mocks`
6. Execute os testes
7. Verifique cobertura

### Atualizar Documentação

1. Identifique a documentação relevante
2. Faça as alterações necessárias
3. Atualize data e versão
4. Execute os testes
5. Commit com mensagem descritiva

### Reportar Problemas

- Use issues do GitHub
- Inclua contexto completo
- Adicione logs e screenshots
- Proponha solução se possível

## 📅 Histórico

### Janeiro 2026

- ✅ Criada estrutura de documentação
- ✅ Sanitizado `tests/api/emissor/laudos/hash-sha256-laudo.test.ts`
- ✅ Criado inventário completo
- ✅ Criado guia de sanitização
- ✅ Criado script de análise de qualidade

### Próximos Passos

- [ ] Sanitizar mais 20 arquivos de teste
- [ ] Aumentar cobertura para 80%
- [ ] Eliminar @ts-nocheck injustificados
- [ ] Criar templates automatizados

---

**Última atualização**: 31 de Janeiro de 2026  
**Versão**: 1.0.0  
**Mantenedor**: Equipe de Desenvolvimento QWork

**Status do Projeto de Sanitização**: 🟡 Em Progresso (Fase 1 de 3 completa)
