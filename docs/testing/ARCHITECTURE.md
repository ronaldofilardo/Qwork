# Arquitetura do Pipeline de Testes — QWork

> Última atualização: 18/04/2026

## Ferramentas

| Ferramenta | Escopo | Config | Comando |
|------------|--------|--------|---------|
| **Jest** | Unitário, API, Integração, DB, Componentes | `jest.config.cjs` | `pnpm test` |
| **Vitest** | Regressão visual/estática | `vitest.config.ts` | `pnpm test:regression` |
| **Cypress** | E2E (browser real) | `cypress.config.ts` | `pnpm cypress` |

### Quando usar cada ferramenta

- **Jest**: Tudo que não precisa de browser real. Testes de API routes, funções lib, componentes React (via jsdom), queries SQL, RLS/RBAC.
- **Vitest**: Testes de regressão que usam `import { ... } from 'vitest'`. Mantido por compatibilidade com testes migrados.
- **Cypress**: Fluxos E2E que necessitam de browser real, interação visual, navegação entre páginas.

## Estrutura de Pastas

```
__tests__/
├── api/              # Testes de rotas API (route.ts) — 215+ arquivos
│                     # Testa status codes, validação, auth, business logic
├── components/       # Testes React (render, interação, estados) — 116+ arquivos
├── database/         # Schema, migrations, queries, triggers — 42+ arquivos
├── integration/      # Fluxos multi-step (cadastro→contrato→pagamento) — 50+ arquivos
├── lib/              # Funções utilitárias puras (hash, CPF, session) — 94+ arquivos
├── hooks/            # Custom React hooks — 8+ arquivos
├── regression/       # Validação pós-correção (Vitest) — 30+ arquivos
├── security/         # RLS, RBAC, audit, route guards — 20+ arquivos
├── unit/             # Funções puras isoladas — 5+ arquivos
├── e2e/              # Testes E2E em Jest (não Cypress) — 3 arquivos
├── config/           # Setup, fixtures, helpers
│   ├── jest.setup.js           # Polyfills, proteção DB
│   ├── jest.react-setup.js     # @testing-library/jest-dom
│   ├── jest.global-setup.cjs   # Conexão DB, migrations
│   ├── jest.global-teardown.cjs # Cleanup
│   ├── vitest.setup.ts         # Shim jest↔vitest
│   └── jest-globals-vitest-shim.ts
└── [domínio]/        # Testes por domínio (admin, auth, clinica, emissor, rh, etc.)
```

## Scripts Disponíveis

| Script | Escopo | DB? | Velocidade |
|--------|--------|-----|------------|
| `pnpm test` | Todos os testes Jest | Sim | ~5-10min |
| `pnpm test:unit` | `__tests__/lib` + `__tests__/unit` | Não | ~30s |
| `pnpm test:api` | `__tests__/api` | Sim | ~3-5min |
| `pnpm test:integration` | `__tests__/integration` | Sim | ~2-3min |
| `pnpm test:database` | `__tests__/database` | Sim | ~1-2min |
| `pnpm test:components` | `__tests__/components` | Não | ~1-2min |
| `pnpm test:security` | `__tests__/security` | Sim | ~1min |
| `pnpm test:regression` | `__tests__/regression` (Vitest) | Não | ~30s |
| `pnpm test:coverage` | Todos + coverage report | Sim | ~10-15min |
| `pnpm test:ci` | CI mode (bail=50) | Sim | ~5-10min |
| `pnpm test:audit` | Relatório de auditoria | Não | ~5s |
| `pnpm cypress` | E2E interativo | Sim (dev server) | Manual |
| `pnpm test:e2e` | E2E headless | Sim (dev server) | ~5-10min |

## Coverage Targets

| Categoria | Target | Justificativa |
|-----------|--------|--------------|
| **Global** | 80% | Meta do projeto |
| **Branches** | 40% | Stepping stone — aumentar gradualmente |
| **Functions** | 50% | Stepping stone — aumentar gradualmente |
| **Lines** | 50% | Stepping stone — aumentar gradualmente |
| **Rotas API críticas** | 90%+ | auth, pagamento, emissão |
| **Componentes críticos** | 80%+ | formulários, modais, dashboard |

## Convenções

### Nomenclatura
- `[feature].test.ts` — teste padrão
- `[feature].integration.test.ts` — teste de integração
- `[feature].cy.ts` — teste Cypress E2E

### Padrão AAA (Arrange/Act/Assert)
```typescript
describe('Feature X', () => {
  it('deve fazer Y quando Z', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await action(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Descrições em Português
- `deve retornar 401 quando não autenticado`
- `deve criar entidade com dados válidos`
- `deve bloquear acesso cross-tenant`

## Segurança de Testes

### Proteção do Banco
- `jest.setup.js` **remove** `DATABASE_URL` do ambiente
- Apenas `TEST_DATABASE_URL` é permitido (`nr-bps_db_test`)
- **BLOQUEIO ABSOLUTO** em URLs contendo `neon.tech`
- `jest.global-setup.cjs` aplica migrations no banco de testes

### Isolamento
- Cada teste deve limpar seus dados (ou usar transactions)
- **Nunca** compartilhar estado entre describes
- `clearMocks: true` garante mocks limpos entre testes

## CI/CD

### Pipeline Recomendado
```
1. Lint + Type Check     (~2min)
2. Unit Tests            (~30s)  — sem DB
3. Component Tests       (~1min) — sem DB
4. API Tests             (~5min) — com DB
5. Integration Tests     (~3min) — com DB
6. Database Tests        (~2min) — com DB
7. Security Tests        (~1min) — com DB
8. Regression Tests      (~30s)  — sem DB (Vitest)
9. E2E Tests (Cypress)   (~10min) — com dev server
```

### Otimizações
- Steps 1-3 podem rodar em paralelo (sem DB)
- Steps 4-7 rodam sequencialmente (compartilham DB)
- Step 8-9 rodam após tudo passar
