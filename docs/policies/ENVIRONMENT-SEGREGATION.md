# Política de Segregação de Ambientes

## Princípio Fundamental

**OS AMBIENTES DEVEM SER TOTALMENTE ISOLADOS E NUNCA SE MISTURAR.**

## Configuração de Bancos de Dados

### Desenvolvimento (`pnpm dev`)

- **Banco:** `nr-bps_db`
- **Variável:** `LOCAL_DATABASE_URL`
- **Arquivo:** `.env`, `.env.development`, `.env.local`
- **Conexão:** `postgresql://postgres:123456@localhost:5432/nr-bps_db`
- **Uso:** Desenvolvimento local, testes manuais via navegador

### Testes (`pnpm test`)

- **Banco:** `nr-bps_db_test`
- **Variável:** `TEST_DATABASE_URL`
- **Arquivo:** `.env.test`
- **Conexão:** `postgresql://postgres:123456@localhost:5432/nr-bps_db_test`
- **Uso:** Testes automatizados (Jest, Cypress)

### Produção (`vercel deploy`)

- **Banco:** Neon PostgreSQL Cloud
- **Variável:** `DATABASE_URL`
- **Arquivo:** Vercel Environment Variables
- **Conexão:** `postgresql://user:pass@host/database?sslmode=require`
- **Uso:** Aplicação em produção

## Validações Automáticas

### Em `lib/db.ts`

1. **Detecção de Ambiente:**

   ```typescript
   // Prioriza JEST_WORKER_ID para identificar testes
   const isRunningTests = !!process.env.JEST_WORKER_ID;
   ```

2. **Bloqueio em Testes:**
   - Se `environment === 'test'` E qualquer variável apontar para `nr-bps_db` → **ERRO CRÍTICO**
   - Se `TEST_DATABASE_URL` não existir em testes → **ERRO**

3. **Seleção de URL:**
   - `isTest` → `TEST_DATABASE_URL` (obrigatório)
   - `isDevelopment` → `LOCAL_DATABASE_URL` (com fallback)
   - `isProduction` → `DATABASE_URL` (obrigatório)

### Em `jest.setup.js`

1. **Carregamento de `.env.test`:**

   ```javascript
   require('dotenv').config({ path: '.env.test' });
   ```

2. **Validação de `TEST_DATABASE_URL`:**
   - Verificar se existe
   - Verificar se aponta para `nr-bps_db_test`
   - **Bloquear** se apontar para `nr-bps_db`

3. **Hook `beforeEach`:**
   - Validar novamente antes de CADA teste
   - Impedir execução se banco errado

## Regras para Desenvolvimento de Testes

### ✅ SEMPRE FAZER

1. **Carregar `.env.test` explicitamente:**

   ```javascript
   require('dotenv').config({ path: '.env.test', override: true });
   ```

2. **Verificar variáveis de ambiente no início do teste:**

   ```javascript
   if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
     throw new Error('Teste DEVE usar nr-bps_db_test');
   }
   ```

3. **Usar `NODE_ENV=test` em comandos de teste:**

   ```json
   "test": "dotenv -e .env.test --override -- jest"
   ```

4. **Limpar dados após cada teste:**
   ```javascript
   afterEach(async () => {
     await query('DELETE FROM tabela WHERE id = $1', [testId]);
   });
   ```

### ❌ NUNCA FAZER

1. **Usar `DATABASE_URL` em testes**
2. **Usar `LOCAL_DATABASE_URL` em testes**
3. **Executar `pnpm dev` e `pnpm test` simultaneamente**
4. **Modificar `nr-bps_db` em testes automatizados**
5. **Hardcodear conexão sem validar ambiente**

## Checklist para Novos Testes

- [ ] Arquivo `.env.test` carregado explicitamente
- [ ] Validação de `TEST_DATABASE_URL` no início
- [ ] Uso de `NODE_ENV=test` no script npm
- [ ] Cleanup de dados criados no `afterEach`/`afterAll`
- [ ] Nenhuma referência a `nr-bps_db` (apenas `nr-bps_db_test`)
- [ ] Teste roda com `pnpm test` sem erros de ambiente

## Estrutura de Arquivos .env

```
.env                  # Base comum (não comitar)
.env.development      # Desenvolvimento (nr-bps_db)
.env.local            # Local overrides (nr-bps_db)
.env.test             # Testes (nr-bps_db_test)
.env.production       # Produção (Neon)
.env.example          # Template público
```

## Comandos de Verificação

### Verificar banco em uso (dev):

```powershell
$env:NODE_ENV='development'; node -e "require('dotenv').config(); console.log(process.env.LOCAL_DATABASE_URL)"
```

### Verificar banco em uso (test):

```powershell
$env:NODE_ENV='test'; node -e "require('dotenv').config({ path: '.env.test' }); console.log(process.env.TEST_DATABASE_URL)"
```

### Validar segregação:

```powershell
pnpm test -- --listTests  # Deve usar nr-bps_db_test
```

## Troubleshooting

### Erro: "Detectada tentativa de usar banco de DESENVOLVIMENTO em ambiente de TESTES"

**Causa:** Variável de ambiente aponta para `nr-bps_db` durante teste.

**Solução:**

1. Verificar `.env.test` existe e tem `TEST_DATABASE_URL` correto
2. Remover `DATABASE_URL` e `LOCAL_DATABASE_URL` de `.env.test`
3. Executar: `$env:NODE_ENV='test'; pnpm test`

### Erro: "TEST_DATABASE_URL não está definido"

**Causa:** Arquivo `.env.test` não foi carregado.

**Solução:**

1. Criar `.env.test` se não existir
2. Adicionar: `TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db_test`
3. Usar `dotenv -e .env.test --override` no script

### Teste modificou dados em `nr-bps_db`

**Causa:** Teste executou sem carregar `.env.test`.

**Solução:**

1. **NUNCA** rodar testes manualmente com `node script.js`
2. **SEMPRE** usar `pnpm test`
3. Restaurar banco dev: `psql -U postgres -d nr-bps_db -f backup.sql`

## Referências

- [lib/db.ts](../../lib/db.ts) - Lógica de conexão e validação
- [jest.setup.js](../../jest.setup.js) - Configuração global de testes
- [.env.test](../../.env.test) - Configuração de ambiente de teste
- [TESTING-POLICY.md](TESTING-POLICY.md) - Política geral de testes
