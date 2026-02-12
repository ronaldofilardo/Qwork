# Database Policy

## Segregação de Bancos de Dados

Este projeto utiliza três bancos de dados PostgreSQL isolados para garantir segurança e integridade dos dados em cada ambiente:

### DESENVOLVIMENTO

- **Nome**: `nr-bps_db`
- **Propósito**: Desenvolvimento local e testes de features
- **Acesso**: Localhost (`localhost:5432`)
- **Variáveis de Ambiente**:
  - `DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db`
  - `LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db`
- **Configuração**: `.env.local` (overrides all)
- **Proteção**: Não pode ser usado por testes ou CI/CD

### TESTES

- **Nome**: `nr-bps_db_test`
- **Propósito**: Execução de testes isolados
- **Acesso**: Localhost (`localhost:5432`)
- **Variáveis de Ambiente**:
  - `TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test`
  - `LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test`
- **Configuração**: `.env.test`
- **Proteção**: Isolado de desenvolvimento e produção
- **Reset**: Recriado automaticamente a cada execução de testes

### PRODUÇÃO

- **Nome**: `neondb` (Neon Cloud)
- **Propósito**: Ambiente de produção
- **Acesso**: Neon Cloud (`neon.tech`)
- **Variáveis de Ambiente**:
  - `DATABASE_URL=postgresql://...@...neon.tech/neondb` (Neon connection string)
- **Configuração**: Vercel environment variables (não .env)
- **Proteção**: Acesso restrito via Vercel CI/CD

## Ordem de Carregamento de Variáveis de Ambiente

1. **Variáveis do Sistema** (environment variables)
2. `.env` (base configuration - defaults)
3. `.env.development` (development overrides)
4. `.env.local` (local machine overrides) ✅ **HIGHEST PRIORITY**
5. `.env.test` (test environment) - loaded only during tests

**Configuração em `lib/db.ts`**:

- `override: true` garante que `.env.local` sobrescreva todas as configurações anteriores
- Em testes: `.env.test` é carregado com flag `--override` automaticamente

## Proteção Contra Erros

### 1. Proteção em Runtime (lib/db.ts)

- Valida `NODE_ENV` antes de criar conexão
- Detecta banco de dados para cada conexão
- Impede inserção/atualização em banco errado

### 2. Proteção em Testes (**tests**/config/jest.setup.js)

- Remove `DATABASE_URL` de produção (Neon)
- Valida que `TEST_DATABASE_URL` aponta para `nr-bps_db_test`
- Bloqueia testes que tentam usar `nr-bps_db`

### 3. Proteção em Pre-test Checks (scripts/checks/)

- `validate-test-isolation.js`: Valida isolamento de ambientes
- `ensure-test-env.js`: Confirma `TEST_DATABASE_URL` correto
- `no-dev-db-in-tests.cjs`: Bloqueia referências ao banco de desenvolvimento

## Exceções Documentadas

**Arquivos que podem referenciar `nr-bps_db` intencionalmente** (apenas em comentários/mensagens de erro):

- `__tests__/config/jest.setup.js` - arquivo de proteção com validações e mensagens de erro
- `__tests__/system/database-environment.test.ts` - testes de validação de ambiente
- `__tests__/system/database-configuration.test.ts` - testes de configuração de banco de dados
- `__tests__/system/test-database-guard.ts` - módulo de proteção de testes

Estes arquivos apenas **referenciam** os nomes do banco para validação, não fazem conexões diretas.

## Fluxo de Desenvolvimento

### Local (Development)

```
Usuário edita código → npm run dev → Usa nr-bps_db (.env.local)
```

### Testes

```
npm test → Pre-test loads .env.test → Usa nr-bps_db_test
```

### Produção (CI/CD)

```
git push → Vercel builds → Usa neondb (Vercel env vars)
```

## Verificação de Conformidade

Para verificar se seu ambiente está configurado corretamente:

```bash
# Rodar validação de isolamento
pnpm test -- --testNamePattern="PROTEÇÃO: Configuração de Bancos de Dados"

# Ou verificar variáveis diretas
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.DATABASE_URL)"
```

## Conformidade e Segurança

- ✅ Bancos isolados por ambiente (dev, test, prod)
- ✅ Variáveis de ambiente configuradas por camada (.env, .env.local, .env.test)
- ✅ Override correto em lib/db.ts (`override: true`)
- ✅ Validação em testes impede erros de isolamento
- ✅ Pre-test checks garantem conformidade
- ✅ Documentação para novos desenvolvedores

---

**Última atualização**: 2025-02-09  
**Status**: ✅ Active e validado
