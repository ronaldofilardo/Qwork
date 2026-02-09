# 🧪 Testes do Sistema

## 📁 Estrutura

```
__tests__/
├── admin/                - Testes de funcionalidades admin
├── auth/                 - Login, autenticação, controle de acesso
├── avaliacao/            - Cascata, índices, efeito
├── clinica/              - Fluxos específicos de clínicas
├── components/           - UI components (React)
├── contratos/            - Criação e gerenciamento
├── database/             - Queries, schema, triggers
├── emissor/              - Emissão de laudos
├── funcionarios/         - Gerenciamento de funcionários
├── integration/          - Fluxos de ponta a ponta
├── qualidade/            - Quality monitoring
├── rh/                   - Fluxos de RH
├── registration/         - Cadastro de entidades/clínicas
├── relatorio/            - Geração de relatórios
├── rls-rbac/             - Policies e permissões
├── visual-regression/    - Testes visuais
└── e2e/                  - Cypress end-to-end
```

---

## 🏃 Como Executar

### Testes Unitários

```bash
pnpm test
```

### Testes de Integração

```bash
pnpm test -- --testPathPattern="integration"
```

### Testes E2E (Cypress)

```bash
pnpm cypress open
pnpm cypress run
```

### Testes de Regressão Visual

```bash
pnpm test -- --testPathPattern="visual-regression"
```

---

## 📊 Cobertura

Objetivo mínimo: **80% coverage**

Executar com coverage:

```bash
pnpm test -- --coverage
```

---

## ✅ Convenções

### Nomenclatura

- Teste simples: `[feature].test.ts`
- Teste de integração: `[feature]-integration.test.ts`
- Teste E2E: `[feature].cy.ts`

### Estrutura (AAA)

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange - preparação
    const data = { ... };

    // Act - execução
    const result = await action(data);

    // Assert - validação
    expect(result).toBe(expected);
  });
});
```

---

## 🔐 Testes RLS/RBAC

Validam isolamento por entidade/clínica:

- Usuário de entidade X não vê dados de entidade Y
- Cada perfil acessa apenas suas operações

Localização: `__tests__/rls-rbac/`

---

## 📈 Qualidade

### TOP 10 Testes

Score maior que 100 pontos:

- Tipagem completa (tsc)
- Sem `@ts-nocheck`
- Documentação JSDoc
- Cobertura > 80%

---

## 🐛 Debugging

### Modo Verbose

```bash
pnpm test -- --verbose
```

### Single Test

```bash
pnpm test -- --testNamePattern="should do something"
```

### Watch Mode

```bash
pnpm test -- --watch
```

---

**Última atualização**: 7 de fevereiro de 2026
