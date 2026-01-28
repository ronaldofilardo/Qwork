# Política de Testes - Padrão de Resolução de Problemas com Mocks

## Visão Geral

Esta política estabelece uma abordagem sistemática e padronizada para identificar, diagnosticar e corrigir falhas em testes unitários e de integração causadas por configurações inadequadas de mocks no Jest. O padrão foi desenvolvido através da resolução iterativa de múltiplas falhas de teste, resultando em um processo consistente e previsível.

## Aplicabilidade

Esta política se aplica a:

- Todos os testes unitários e de integração usando Jest
- Qualquer falha relacionada a mocks (fetch, router, módulos, APIs do navegador)
- Desenvolvimento de novos testes que requerem mocks

## Etapas do Processo Padronizado

### 1. Identificação da Falha

**Objetivo**: Entender claramente qual teste está falhando e por quê

**Ações Obrigatórias**:

- Executar o teste específico: `pnpm test -- --testNamePattern="nome do teste"`
- Analisar a mensagem de erro completa
- Identificar se a falha é relacionada a mocks através de mensagens como:
  - "TypeError: X is not a function"
  - "Cannot read property 'Y' of undefined"
  - "Expected mock function to have been called"

**Ações Recomendadas**:

- Verificar se o erro é de timeout, expectativa não atendida ou erro de execução
- Documentar o erro exato no comentário do teste

### 2. Análise do Contexto do Teste

**Objetivo**: Compreender o que o teste está tentando validar

**Ações Obrigatórias**:

- Ler o código do teste para entender o cenário de teste
- Identificar quais componentes/módulos estão sendo testados
- Mapear dependências externas (APIs, navegação, localStorage, etc.)

**Ações Recomendadas**:

- Verificar se o teste tem descrição clara do comportamento esperado
- Analisar se o teste cobre um caminho de código real da aplicação

### 3. Diagnóstico dos Mocks

**Objetivo**: Identificar por que os mocks não estão funcionando corretamente

**Ações Obrigatórias**:

- Verificar se os mocks estão sendo chamados (usar `jest.clearAllMocks()` e logs)
- Checar se as implementações mockadas correspondem ao uso real no código
- Analisar conflitos entre mocks ou setups globais

**Problemas Comuns a Verificar**:

- `mockResolvedValueOnce` vs `mockImplementationOnce` para controle preciso
- Mocks não resetados entre testes causando interferência
- Componentes necessários para efeitos colaterais não renderizados
- APIs do navegador não mockadas (matchMedia, ResizeObserver, etc.)

### 4. Correção dos Mocks

**Objetivo**: Implementar mocks que simulem corretamente o comportamento real

#### 4.1 Mocks de Fetch/API

**Padrão Correto**:

```typescript
// ✅ Padrão aprovado - controle preciso com mockImplementationOnce
mockFetch.mockImplementationOnce(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: [] }),
  } as Response)
);

// ✅ Para cenários de erro
mockFetch.mockImplementationOnce(() =>
  Promise.reject(new Error('Erro de rede'))
);

// ❌ Evitar - pode não funcionar consistentemente
mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
```

#### 4.2 Mocks de Router/Navigation

**Padrão Correto**:

```typescript
// ✅ Padrão aprovado - mock consistente
const mockUseRouter = jest.mocked(require('next/navigation').useRouter);
mockUseRouter.mockReturnValue({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
});
```

#### 4.3 Mocks de APIs do Navegador

**Padrão Correto**:

```typescript
// ✅ Mock para matchMedia (PWA, responsividade)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ✅ Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

#### 4.4 Renderização de Componentes para Efeitos

**Padrão Correto**:

```typescript
// ✅ Renderizar componentes que configuram listeners/efeitos
it('deve sincronizar ao reconectar', async () => {
  // Renderizar componente que configura listeners
  render(<PWAInitializer />);

  // Aguardar efeitos colaterais
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/sync');
  });

  // Disparar evento
  window.dispatchEvent(new Event('online'));

  // Verificar comportamento
  await waitFor(() => {
    expect(screen.getByText('Sincronizado')).toBeInTheDocument();
  });
});
```

### 5. Ajuste das Expectativas

**Objetivo**: Garantir que as asserções correspondam exatamente ao comportamento mockado

**Ações Obrigatórias**:

- Verificar se o texto esperado existe exatamente no componente renderizado
- Usar seletores robustos (getByRole, getByLabelText) ao invés de getByText
- Incluir todas as propriedades retornadas pelos mocks nas expectativas

**Exemplos de Correção**:

```typescript
// ❌ Frágil - depende de texto exato
expect(screen.getByText('Entrando...')).toBeInTheDocument();

// ✅ Robusto - usa papel semântico
expect(
  screen.getByRole('button', { name: /entrando\.\.\./i })
).toBeInTheDocument();

// ❌ Incorreto - propriedade faltando
expect(mockFunction).toHaveBeenCalledWith({ data: [] });

// ✅ Correto - todas as propriedades
expect(mockFunction).toHaveBeenCalledWith({
  data: [],
  total: 0,
  hasMore: false,
});
```

### 6. Validação da Correção

**Objetivo**: Confirmar que a correção resolve o problema sem quebrar outros testes

**Ações Obrigatórias**:

- Executar o teste específico corrigido: `pnpm test -- --testPathPattern="arquivo.test.tsx"`
- Executar testes relacionados para verificar regressões
- Verificar cobertura de teste não diminuiu

**Ações Recomendadas**:

- Executar todos os testes: `pnpm test`
- Verificar logs de console para warnings ou erros
- Documentar a correção aplicada

## Casos de Aplicação Documentados

### Caso 1: Login Component (login.test.tsx)

- **Problema**: Mocks de fetch não funcionavam para cenários de erro
- **Aplicação do Padrão**: Corrigido para `mockImplementationOnce` com Promise.reject
- **Resultado**: Testes de erro de login passaram consistentemente

### Caso 2: Componentes PWA (planos-components.test.tsx)

- **Problema**: Listener de online não configurado
- **Aplicação do Padrão**: Adicionado render de `PWAInitializer` + mock de `matchMedia`
- **Resultado**: Testes de sincronização offline funcionaram

### Caso 3: Scripts de Auditoria (auditar-cpfs.test.ts)

- **Problema**: Propriedade faltando no objeto esperado
- **Aplicação do Padrão**: Adicionada propriedade `duplicatasCount: 0`
- **Resultado**: Teste de auditoria passou

## Boas Práticas Obrigatórias

### Configuração de Mocks

- Sempre usar `mockImplementationOnce` para controle preciso de comportamento
- Limpar mocks entre testes: `jest.clearAllMocks()` no `beforeEach`
- Mockar APIs do navegador quando usadas por componentes
- Usar `jest.mocked()` para tipagem correta de mocks

### Estrutura de Testes

- Renderizar componentes necessários para efeitos colaterais
- Usar `waitFor` para operações assíncronas
- Preferir seletores semânticos (role, label) sobre texto
- Documentar cenários complexos com comentários

### Debugging

- Adicionar logs temporários: `console.log` em mocks durante desenvolvimento
- Usar `screen.debug()` para inspecionar DOM renderizado
- Executar testes individualmente durante correções
- Verificar ordem de execução quando múltiplos mocks são usados

## Ferramentas de Apoio

### Scripts Disponíveis

```bash
# Executar teste específico
pnpm test -- --testNamePattern="nome do teste"

# Executar arquivo específico
pnpm test -- --testPathPattern="arquivo.test.tsx"

# Executar com verbose para debugging
pnpm test -- --verbose

# Executar testes relacionados a um arquivo
pnpm test -- --testPathPattern="component" --watch
```

### Utilitários de Mock

```typescript
// Utilitário para mock consistente de fetch
export const mockFetchResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

// Utilitário para mock de router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};
```

## Responsabilidades

### Desenvolvedores

- Seguir este padrão em todos os testes que envolvam mocks
- Documentar casos complexos encontrados
- Contribuir para melhoria contínua do padrão

### Revisores de Código

- Verificar se testes seguem o padrão estabelecido
- Sugerir melhorias no padrão quando identificado padrões recorrentes
- Garantir que correções de teste não quebrem outros testes

## Métricas de Qualidade

- **Taxa de Sucesso de Testes**: > 95% em CI/CD
- **Tempo Médio de Correção**: < 30 minutos por falha de mock
- **Cobertura de Testes**: > 80% mantida
- **Regressões por Mock**: 0 (zero)

## Atualização do Padrão

Este padrão deve ser atualizado quando:

- Novos padrões de falha são identificados
- Melhorias significativas são descobertas
- Novos tipos de mock são necessários

## Documentação Relacionada

- **Exemplo Prático**: `docs/testing/MOCKS_POLICY_EXAMPLE.test.tsx`
- **Helpers de Teste**: `__tests__/lib/test-helpers.ts`
- **Validador Automático**: `scripts/validate-mock-policy.cjs`
- **Convenções Gerais**: `CONVENCOES.md` (seção Testes)</content>
  <parameter name="filePath">c:\apps\QWork\docs\testing\MOCKS_POLICY.md
