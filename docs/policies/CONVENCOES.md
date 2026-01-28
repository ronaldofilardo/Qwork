# Convenções de Código - QWork

## Ferramentas de Qualidade

Este projeto utiliza ferramentas automatizadas para manter a qualidade do código:

### Pre-commit Hooks (Husky + lint-staged)

- **ESLint**: Executado automaticamente em arquivos modificados
- **Prettier**: Formatação automática de código
- **TypeScript**: Verificação de tipos

> Nota: Para PRs grandes que alterem dezenas/centenas de arquivos, o lint local pode travar por causa do volume de arquivos. Use o fluxo chunked com `pnpm run lint:staged:daemon` ou consulte `docs/contributing/linting.md` para instruções e mitigação de bloqueios.

### Scripts Disponíveis

```bash
pnpm quality:check    # Verifica tipos + linting
pnpm quality:fix      # Corrige problemas automaticamente
pnpm lint             # Apenas linting
pnpm type-check       # Apenas verificação de tipos
```

## Regras de Qualidade

### 1. Funções Síncronas vs Assíncronas

- `getSession()` e `destroySession()` são **síncronas** - NÃO use `await`
- Sempre verifique se uma função retorna `Promise<T>` antes de usar `await`

### 2. Tipos de Banco de Dados

- Use `queryWithContext<T>()` com tipos explícitos quando necessário
- O tipo padrão `Record<string, unknown>` evita erros de tipo desconhecido

### 3. API Routes Dinâmicas

- Rotas que usam `cookies` precisam de `export const dynamic = 'force-dynamic'`
- Isso força renderização no servidor, permitindo acesso a cookies

### 4. Estrutura de Imports

- Imports absolutos com `@/` (ex: `@/lib/session`)
- Agrupar imports: React, bibliotecas externas, internos

### 5. Tratamento de Erros

- Sempre usar try/catch em operações assíncronas
- Logs estruturados com contexto relevante
- Mensagens de erro claras para o usuário

### 6. Testes

- Mocks devem corresponder aos tipos reais das funções
- Usar tipos explícitos em mocks de banco de dados
- Testes de integração devem validar fluxos completos
- **Política de Mocks**: Seguir o padrão documentado em `docs/testing/MOCKS_POLICY.md`
- Usar `mockImplementationOnce` para controle preciso de comportamento
- Sempre limpar mocks entre testes com `jest.clearAllMocks()`

#### Ferramentas de Apoio a Testes

```bash
# Executar teste específico
pnpm test -- --testNamePattern="nome do teste"

# Executar arquivo específico
pnpm test -- --testPathPattern="arquivo.test.tsx"

# Debug de mocks
pnpm test -- --verbose
```

## Configurações do VS Code

O arquivo `.vscode/settings.json` configura:

- Formatação automática ao salvar
- Correção automática de ESLint
- Formatação com Prettier

## Manutenção

### Atualização de Dependências

```bash
pnpm update --latest
pnpm quality:check  # Verificar se tudo ainda funciona
```

### Adição de Novas Regras

1. Atualizar `.eslintrc.cjs`
2. Testar com `pnpm lint`
3. Atualizar documentação

### Novos Tipos

- Adicionar em `lib/types/`
- Exportar no arquivo `index.ts` do diretório
- Usar em toda aplicação

## Checklist de Pull Request

- [ ] `pnpm quality:check` passa
- [ ] Build funciona (`pnpm build`)
- [ ] Testes passam (`pnpm test`)
- [ ] Documentação atualizada se necessário
- [ ] Novos tipos exportados corretamente

## Problemas Comuns

### "Unexpected `await` of a non-Promise"

- Verificar se a função é realmente assíncrona
- Remover `await` se for síncrona

### "Dynamic server usage"

- Adicionar `export const dynamic = 'force-dynamic'` na rota

### Erros de Tipo em Mocks

- Ajustar tipos dos mocks para corresponder às interfaces reais
- Usar `as any` apenas em último caso

### Imports Não Resolvidos

- Verificar se arquivo existe no caminho
- Usar imports absolutos com `@/`
