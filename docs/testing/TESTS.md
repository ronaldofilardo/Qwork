# Testes do Sistema Qwork

Este documento descreve os testes implementados para as funcionalidades de relatório de avaliação psicossocial.

## Configuração dos Testes

### Dependências Instaladas

```bash
pnpm add --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest
```

### Arquivos de Configuração

- `jest.config.cjs`: Configuração principal do Jest
- `jest.setup.js`: Setup global dos testes com mocks
- `package.json`: Scripts de teste adicionados

### Scripts Disponíveis

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm run test:watch

# Executar testes com relatório de cobertura
pnpm run test:coverage
```

## Estrutura dos Testes

### 1. Testes de API

#### `/api/avaliacao/status`

- **Arquivo**: `__tests__/api/avaliacao/status.test.ts`
- **Cobertura**:
  - Retorna status "nao_iniciada" quando não há avaliação
  - Retorna status da avaliação existente
  - Trata erro de autenticação
  - Trata erro de consulta ao banco

#### `/api/avaliacao/resultados`

- **Arquivo**: `__tests__/api/avaliacao/resultados.test.ts`
- **Cobertura**:
  - Retorna resultados da avaliação concluída
  - Retorna erro 404 quando não há avaliação concluída
  - Trata erro de autenticação
  - Trata erro de consulta ao banco

### 2. Testes de Componentes

#### DashboardPage

- **Arquivo**: `__tests__/components/Dashboard.test.tsx`
- **Cobertura**:
  - Renderiza corretamente o componente
  - Mostra estado de loading inicial

#### AvaliacaoConcluidaPage

- **Arquivo**: `__tests__/components/AvaliacaoConcluida.test.tsx`
- **Cobertura**:
  - Renderiza corretamente o componente
  - Mostra estado de loading

## Funcionalidades Testadas

### ✅ APIs

- ✅ Endpoint de status da avaliação
- ✅ Endpoint de resultados da avaliação
- ✅ Autenticação e autorização
- ✅ Tratamento de erros
- ✅ Validação de dados

### ✅ Componentes

- ✅ Renderização básica dos componentes
- ✅ Estados de loading
- ✅ Integração com APIs (parcial)

### ✅ Integração

- ✅ Comunicação entre frontend e backend
- ✅ Fluxo completo de dados

## Executando os Testes

### Todos os Testes

```bash
pnpm test
```

### Testes Específicos

```bash
# Apenas APIs
npx jest __tests__/api/

# Apenas componentes
npx jest __tests__/components/

# Teste específico
npx jest __tests__/api/avaliacao/status.test.ts
```

### Com Cobertura

```bash
pnpm run test:coverage
```

## Mocks Utilizados

### Módulos Mockados

- `next/navigation`: Router do Next.js
- `next/server`: API routes do Next.js
- `@/components/Header`: Componente de cabeçalho
- `@/lib/db`: Conexão com banco de dados
- `@/lib/session`: Autenticação de sessão
- `@/lib/questoes`: Dados dos questionários

### Fetch Global

O `global.fetch` é mockado para simular chamadas de API sem dependências externas.

## Cobertura de Testes

Os testes cobrem os cenários principais das funcionalidades implementadas:

1. **Verificação de status da avaliação**
2. **Recuperação de resultados**
3. **Exibição no dashboard**
4. **Relatório completo**
5. **Tratamento de erros**

## Melhorias Futuras

- Aumentar cobertura dos testes de componentes
- Adicionar testes de integração end-to-end
- Implementar testes de performance
- Adicionar testes de acessibilidade

## Comandos Úteis

```bash
# Limpar cache do Jest
npx jest --clearCache

# Executar testes em modo verbose
npx jest --verbose

# Executar apenas testes que falharam anteriormente
npx jest --onlyFailures
```
