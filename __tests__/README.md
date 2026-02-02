# Estrutura de Testes - QWork

> **Última Atualização**: 31 de janeiro de 2026

Este diretório contém todos os testes automatizados do projeto QWork, organizados por categoria e funcionalidade.

## 📚 Documentação

### 📖 Guias de Navegação

- **[STRUCTURE.md](STRUCTURE.md)** - Estrutura completa de testes e categorias (79 testes organizados)
- **[docs/QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md)** - Referência rápida de comandos e convenções
- **[docs/TOP10-CHARACTERISTICS.md](docs/TOP10-CHARACTERISTICS.md)** - Sistema de pontuação de qualidade de testes

### 📊 Relatórios de Qualidade

- **[reports/FINAL-REFACTORING-REPORT.md](reports/FINAL-REFACTORING-REPORT.md)** - Relatório final da refatoração (0% @ts-nocheck)
- **[reports/REFACTORING-CRITICOS-REPORT.md](reports/REFACTORING-CRITICOS-REPORT.md)** - Refatoração de testes críticos
- **[reports/TS-NOCHECK-REPORT.md](reports/TS-NOCHECK-REPORT.md)** - Eliminação de @ts-nocheck

### 📦 Arquivo Histórico

- **[archive/](archive/)** - Documentação legada e relatórios antigos

---

## 🗂️ Estrutura de Diretórios

### `/api` - Testes de API

Testes de endpoints da API, organizados por módulo:

### 🔐 **admin/** (2 testes)

Testes de funcionalidades administrativas e dashboards de admin.

### 🔑 **auth/** (3 testes)

Testes de autenticação, login e controle de acesso.

### 📋 **avaliacao/** (5 testes)

Testes de avaliações psicossociais, efeito cascata e índices.

### 🏥 **clinica/** (5 testes)

Testes da aplicação SPA de clínicas.

### 📄 **contracts/** (4 testes)

Testes de contratos, pagamentos e planos.

### 🔧 **corrections/** (12 testes)

Testes de correções e sanitização de bugs históricos.

### 📊 **dashboard/** (2 testes)

Testes de dashboards gerais do sistema.

### 🗄️ **database/** (2 testes)

Testes de migrações e schema do banco de dados.

### 📝 **emissor/** (13 testes)

Testes de emissão de laudos, PDFs e workflows de emissão.

### 🏢 **entidade/** (4 testes)

Testes da aplicação de entidades (empresas).

### 📦 **lotes/** (1 teste)

Testes de lotes de avaliações.

### 🔀 **middleware/** (2 testes)

Testes de middleware e integrações de API.

### 📝 **registration/** (8 testes)

Testes de cadastro de contratantes e criação de contas.

### 👥 **rh/** (12 testes)

Testes de funcionalidades de RH, lotes, funcionários e estatísticas.

### ⚙️ **system/** (9 testes)

Testes de sistema, infraestrutura e integrações gerais.

### 🎨 **visual-regression/** (2 testes)

Testes de consistência visual e responsividade.

---

### 📁 Estruturas Adicionais

### `/api` - Testes de API

Testes de endpoints da API, organizados por módulo.

### `/components` - Testes de Componentes React

Testes unitários de componentes UI isolados.

### `/hooks` - Testes de Custom Hooks

Testes de hooks React customizados.

### `/lib` - Testes de Bibliotecas e Utilitários

Testes de funções utilitárias e bibliotecas.

### `/e2e` - Testes End-to-End

Testes de fluxos completos da aplicação.

### `/integration` - Testes de Integração

Testes que envolvem múltiplos módulos trabalhando juntos.

### `/unit` - Testes Unitários Puros

Testes unitários de funções isoladas.

## 🔧 Convenções de Nomenclatura

### Padrões de Nomes de Arquivos

- **`.test.tsx`** - Testes de componentes React
- **`.test.ts`** - Testes de lógica/APIs/utils
- **`.integration.test.ts`** - Testes de integração
- **`.unit.test.ts`** - Testes unitários isolados
- **`.e2e.test.ts`** - Testes end-to-end

### Localização de Testes

Testes devem estar na pasta que melhor representa seu **domínio funcional**.

**Exemplo**:

- ❌ `__tests__/app/admin/dashboard.test.tsx`
- ✅ `__tests__/admin/dashboard.test.tsx`

---- Fluxos completos

- Interação entre módulos

## 🚀 Comandos de Teste

```bash
# Todos os testes
pnpm test

# Testes unitários
pnpm test:unit

# Testes visuais
pnpm test:visual

# Testes com cobertura
pnpm test:coverage

# Modo watch
pnpm test:watch

# E2E
pnpm test:e2e

# Análise de qualidade
node scripts/analyze-test-quality.cjs
```

---

## 📝 Convenções de Código

### Estrutura de Teste

````typescript
describe('Módulo/Componente', () => {
  beforeEach(() => {
    // Setup comum
    jest.clearAllMocks();
  });

  describe('Funcionalidade específica', () => {
    it('deve comportar-se como esperado', () => {
## 📋 Melhores Práticas

### Estrutura de Testes (AAA Pattern)

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange: Setup
    const data = { id: 1, name: 'Test' };

    // Act: Execute
    const result = processData(data);

    // Assert: Verify
    expect(result).toBe(expected);
  });
});
````

### TypeScript e Type Safety

- ✅ **Sempre tipar mocks**: Use `jest.MockedFunction`, `Mock`, `QueryResult<T>`
- ✅ **Criar interfaces para dados mockados**: Evite `as any`
- ✅ **Adicionar JSDoc completo**: `@fileoverview`, `@test`, `@expected`
- ❌ **Nunca usar `@ts-nocheck`**: Remova e corrija os tipos
- ✅ **Importar types**: `import type { Type }` para interfaces

### Mocks e Assertions

- Usar `jest.clearAllMocks()` em `beforeEach`
- Preferir `mockImplementationOnce` para controle preciso
- Usar `waitFor` para operações assíncronas
- Preferir matchers específicos (`toHaveBeenCalledWith` vs `toBeCalled`)

### Qualidade do Código

**Características de testes de alta qualidade** (score 100/100):

- ✅ JSDoc completo (+20 pontos)
- ✅ Type imports (+15 pontos)
- ✅ beforeEach/afterEach (+15 pontos)
- ✅ Comentários AAA (+10 pontos)
- ✅ Mocks tipados (+10 pontos)
- ✅ Sem @ts-nocheck (+10 pontos)
- ✅ Sem console.log (+10 pontos)
- ✅ Assertions claras (+10 pontos)

Veja [docs/TOP10-CHARACTERISTICS.md](docs/TOP10-CHARACTERISTICS.md) para detalhes completos.

---

## 📖 Documentação Adicional

- **[STRUCTURE.md](STRUCTURE.md)** - Estrutura detalhada de 79 testes organizados
- **[docs/QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md)** - Guia rápido de comandos
- **[reports/FINAL-REFACTORING-REPORT.md](reports/FINAL-REFACTORING-REPORT.md)** - Relatório de refatoração (0% @ts-nocheck)

---

## ⚡ Quick Start

1. **Adicionar novo teste**: Identifique a categoria correta (auth, rh, emissor, etc.)
2. **Seguir convenção**: Use `.test.tsx` para React, `.test.ts` para lógica
3. **Estrutura AAA**: Arrange → Act → Assert com comentários
4. **Type Safety**: Sempre tipar mocks e dados
5. **JSDoc**: Documentar propósito do teste

**Exemplo**:

```typescript
/**
 * @fileoverview Testes de autenticação de usuários
 * @test Login com credenciais válidas
 * @expected Usuário autenticado e redirecionado
 */
import type { Mock } from 'jest';

interface MockUser {
  id: number;
  email: string;
}

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve autenticar usuário com credenciais válidas', async () => {
    // Arrange: Setup de mock
    const mockUser: MockUser = { id: 1, email: 'user@test.com' };
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response);

    // Act: Executar login
    const result = await login('user@test.com', 'password');

    // Assert: Verificar resultado
    expect(result).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@test.com', password: 'password' }),
    });
  });
});
```

---

## ⚠️ Práticas a Evitar

- ❌ `@ts-nocheck` - Sempre tipar corretamente em vez de ignorar erros
- ❌ `as any` - Criar interfaces específicas para tipos
- ❌ `console.log` em testes - Usar debugger ou remover antes do commit
- ❌ Testes sem comentários AAA - Sempre documentar estrutura
- ❌ Mocks sem tipos - Usar `Mock`, `jest.MockedFunction<T>`
- ❌ Arquivos de teste na raiz - Usar categorias apropriadas
- ❌ Testes monolíticos - Dividir em testes focados por funcionalidade

---

**Documentação completa e atualizada!** ✨  
**Última revisão**: 31 de janeiro de 2026
