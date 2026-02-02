# 🛡️ Sistema de Proteção de Ambientes - QWork BPS

Este documento explica as múltiplas camadas de proteção que garantem que **testes nunca usem o banco de desenvolvimento** (`nr-bps_db`).

---

## 📊 Arquitetura de Proteção (5 Camadas)

```
┌─────────────────────────────────────────────────────┐
│  CAMADA 1: Validação no package.json (pretest)     │
│  ✓ validate-test-isolation.js                      │
│  ✓ ensure-test-env.js                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  CAMADA 2: Validação no jest.setup.js              │
│  ✓ Verifica TEST_DATABASE_URL existe               │
│  ✓ Bloqueia se apontar para nr-bps_db              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  CAMADA 3: Validação no lib/db.ts (runtime)        │
│  ✓ Detecta ambiente (test vs dev vs prod)          │
│  ✓ Valida URL do banco por ambiente                │
│  ✓ Lança erro se ambiente errado                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  CAMADA 4: Validação em cada query()               │
│  ✓ Valida URL antes de executar qualquer query     │
│  ✓ Erro crítico se banco errado                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  CAMADA 5: Logs e rastreabilidade                  │
│  ✓ Log de conexão mostra banco usado               │
│  ✓ Logs de debug identificam ambiente              │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Detalhamento das Camadas

### Camada 1: Validação Pre-Test (package.json)

**Arquivo:** `scripts/checks/validate-test-isolation.js`

**O que faz:**

- Executa ANTES de qualquer teste (via `pretest` no package.json)
- Valida 6 pontos críticos:
  1. `TEST_DATABASE_URL` está definida
  2. Não aponta para `nr-bps_db`
  3. `DATABASE_URL` não está definida (testes não devem usar)
  4. `LOCAL_DATABASE_URL` não contamina testes
  5. `NODE_ENV === 'test'`
  6. `JEST_WORKER_ID` existe

**Saída esperada:**

```
🔍 Validando isolamento de ambientes...

✅ TEST_DATABASE_URL: nr-bps_db_test
✅ JEST_WORKER_ID: 1 (ambiente Jest confirmado)

======================================================================

✅ VALIDAÇÃO PASSOU: Ambiente de teste está isolado e seguro
   Banco de testes: nr-bps_db_test
   Banco de desenvolvimento protegido: nr-bps_db
   Política: TESTING-POLICY.md
```

**Se falhar:**

```
❌ FALHA CRÍTICA: TEST_DATABASE_URL aponta para banco de DESENVOLVIMENTO
   Banco atual: nr-bps_db
   Esperado: nr-bps_db_test
   NUNCA execute testes contra o banco de desenvolvimento!
```

---

### Camada 2: Validação Jest Setup (jest.setup.js)

**Arquivo:** `jest.setup.js` (linhas 21-33)

**O que faz:**

```javascript
if (process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL) {
  require('dotenv').config({ path: '.env.test' });
}

if (process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL não está definido. Defina TEST_DATABASE_URL para apontar ' +
      'para um banco de teste (ex: "nr-bps_db_test") antes de executar os testes ' +
      'para evitar alterações no banco de desenvolvimento (nr-bps_db).'
  );
}
```

**Quando executa:** No início de cada worker do Jest

---

### Camada 3: Validação Runtime (lib/db.ts)

**Arquivo:** `lib/db.ts` (linhas 58-89)

**O que faz:**

1. **Detecção de ambiente:**

```typescript
const isRunningTests = !!process.env.JEST_WORKER_ID;
const hasTestDatabaseUrl = !!process.env.TEST_DATABASE_URL;

const environment = isRunningTests
  ? 'test'
  : process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'development';
```

2. **Validação crítica (NOVA):**

```typescript
// VALIDAÇÃO CRÍTICA: Bloquear nr-bps_db em ambiente de teste
if (environment === 'test' || isRunningTests) {
  const suspectVars = [
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  ].filter(Boolean);

  for (const url of suspectVars) {
    if (
      url &&
      (url.includes('/nr-bps_db') || url.includes('/nr-bps-db')) &&
      !url.includes('_test')
    ) {
      throw new Error(
        `🚨 ERRO CRÍTICO DE SEGURANÇA: Detectada tentativa de usar banco de DESENVOLVIMENTO em ambiente de TESTES!\n` +
          `URL suspeita: ${url}\n` +
          `Ambiente: ${environment}\n` +
          `JEST_WORKER_ID: ${process.env.JEST_WORKER_ID}\n` +
          `\nTestes DEVEM usar exclusivamente nr-bps_db_test via TEST_DATABASE_URL.\n` +
          `Consulte TESTING-POLICY.md para mais informações.`
      );
    }
  }
}
```

3. **Validações específicas por URL:**

```typescript
// Em getDatabaseUrl()
if (isTest) {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL não está definido...');
  }

  const parsed = new URL(process.env.TEST_DATABASE_URL);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
    throw new Error(
      'TEST_DATABASE_URL aponta para o banco de desenvolvimento...'
    );
  }
}
```

---

### Camada 4: Validação por Query (lib/db.ts)

**Arquivo:** `lib/db.ts` (linhas 230-250)

**O que faz:**

```typescript
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session
): Promise<QueryResult<T>> {
  // Validação adicional de isolamento
  if (isDevelopment && databaseUrl && databaseUrl.includes('nr-bps_db_test')) {
    throw new Error(
      'ERRO CRÍTICO: Tentativa de usar banco de testes (nr-bps_db_test) em ambiente de desenvolvimento!'
    );
  }

  if (isTest && databaseUrl) {
    const parsedDb = new URL(databaseUrl);
    const dbName = parsedDb.pathname.replace(/^\//, '');
    if (dbName === 'nr-bps_db') {
      throw new Error(
        'ERRO CRÍTICO: Tentativa de usar banco de desenvolvimento (nr-bps_db) em ambiente de testes!'
      );
    }
  }

  // ... resto da função
}
```

**Quando executa:** A CADA query executada no sistema

---

### Camada 5: Logs e Rastreabilidade

**Arquivo:** `lib/db.ts` (adicionado após configuração do pool)

**O que faz:**

```typescript
if ((isDevelopment || isTest) && databaseUrl) {
  localPool = new Pool({
    connectionString: databaseUrl,
    max: isTest ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Log claro do banco sendo usado
  if (process.env.DEBUG_DB || isTest) {
    try {
      const parsed = new URL(databaseUrl);
      const dbName = parsed.pathname.replace(/^\//, '');
      const host = parsed.hostname;
      console.log(
        `🔌 [lib/db.ts] Conectado ao banco: ${dbName} @ ${host} (ambiente: ${environment})`
      );
    } catch {
      // Se parsing falhar, não bloquear
    }
  }
}
```

**Saída esperada em testes:**

```
🔌 [lib/db.ts] Conectado ao banco: nr-bps_db_test @ localhost (ambiente: test)
```

---

## 🧪 Como Testar as Proteções

### Teste 1: Forçar uso de banco errado (deve falhar)

```bash
# Temporariamente mudar .env.test
TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db

# Tentar rodar testes
pnpm test
```

**Resultado esperado:**

```
❌ FALHA CRÍTICA: TEST_DATABASE_URL aponta para banco de DESENVOLVIMENTO
```

### Teste 2: Remover TEST_DATABASE_URL (deve falhar)

```bash
# Remover variável
unset TEST_DATABASE_URL

# Tentar rodar testes
pnpm test
```

**Resultado esperado:**

```
❌ FALHA CRÍTICA: TEST_DATABASE_URL não está definida
```

### Teste 3: Ambiente correto (deve passar)

```bash
# .env.test correto
TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db_test
NODE_ENV=test

# Rodar testes
pnpm test
```

**Resultado esperado:**

```
✅ VALIDAÇÃO PASSOU: Ambiente de teste está isolado e seguro
```

---

## 📁 Arquivos Envolvidos

| Arquivo                                     | Responsabilidade                      | Quando Executa                    |
| ------------------------------------------- | ------------------------------------- | --------------------------------- |
| `TESTING-POLICY.md`                         | Política oficial de testes            | Documentação                      |
| `scripts/checks/validate-test-isolation.js` | Validação pre-test completa           | Antes de cada `pnpm test`         |
| `scripts/checks/ensure-test-env.js`         | Validação básica de TEST_DATABASE_URL | Antes de cada `pnpm test`         |
| `jest.setup.js`                             | Setup do Jest + validações            | Início de cada worker Jest        |
| `lib/db.ts`                                 | Conexão ao banco + validações runtime | Importação do módulo + cada query |
| `.env.test`                                 | Variáveis de ambiente de teste        | Carregado pelo dotenv             |
| `package.json`                              | Scripts npm incluindo pretest         | Ao executar `pnpm test`           |

---

## 🔄 Fluxo de Execução

```
1. Desenvolvedor executa: pnpm test
                ↓
2. package.json executa: pretest (5 scripts de validação)
   - validate-test-isolation.js ✓
   - ensure-test-env.js ✓
   - no-dev-db-in-tests.cjs ✓
   - fix-duplicated-fk.cjs ✓
   - fix-detectar-anomalias.cjs ✓
                ↓
3. Jest inicia e carrega jest.setup.js
   - Valida TEST_DATABASE_URL ✓
   - Configura mocks ✓
                ↓
4. Testes importam lib/db.ts
   - Detecta ambiente: test ✓
   - Valida URLs de banco ✓
   - Cria pool de conexões ✓
   - Loga banco conectado ✓
                ↓
5. Cada teste executa queries
   - query() valida ambiente a cada chamada ✓
   - Bloqueia se banco errado ✓
                ↓
6. Testes completam
   - Resultados exibidos
   - Conexões fechadas
```

---

## ⚡ Resumo Executivo

**5 Camadas de Proteção:**

1. ✅ **Pre-test:** 5 scripts de validação bloqueiam antes de iniciar
2. ✅ **Jest Setup:** Validação ao iniciar workers
3. ✅ **Runtime:** Validação ao conectar ao banco
4. ✅ **Per-Query:** Validação a cada operação de banco
5. ✅ **Logs:** Rastreabilidade completa do banco usado

**Garantias:**

- ❌ Impossível usar `nr-bps_db` em testes
- ✅ Validação em múltiplos pontos de falha
- 🔍 Logs claros para debugging
- 📝 Política documentada (`TESTING-POLICY.md`)

**Filosofia:**

> "Código fonte é a fonte da verdade. Testes validam o código, não o contrário."

---

**Última atualização:** 23/12/2025  
**Responsável:** Sistema QWork BPS  
**Status:** Ativo e Obrigatório
