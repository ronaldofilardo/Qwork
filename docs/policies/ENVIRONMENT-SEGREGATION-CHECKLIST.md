# Checklist de Verificação de Segregação de Ambientes

## ✅ Status: IMPLEMENTADO

### Configurações Base

- [x] `.env.test` existe e tem `TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db_test`
- [x] `.env.development` tem `LOCAL_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db`
- [x] `.env.local` removeu `DATABASE_URL` (conflito) e usa apenas `LOCAL_DATABASE_URL`
- [x] `package.json` scripts de teste usam `dotenv -e .env.test --override`

### Validações em `lib/db.ts`

- [x] Detecção de ambiente via `JEST_WORKER_ID` e `NODE_ENV`
- [x] Bloqueio crítico se test usar `nr-bps_db`
- [x] Validação de `TEST_DATABASE_URL` obrigatória em testes
- [x] Fallback correto para desenvolvimento (`LOCAL_DATABASE_URL`)
- [x] Seleção de URL por ambiente isolado

### Validações em `jest.setup.js`

- [x] Carregamento explícito de `.env.test`
- [x] Validação de `TEST_DATABASE_URL` no setup
- [x] Bloqueio se apontar para `nr-bps_db`
- [x] Hook `beforeEach` valida antes de cada teste
- [x] Mensagens de erro claras

### Documentação

- [x] [docs/policies/ENVIRONMENT-SEGREGATION.md](../docs/policies/ENVIRONMENT-SEGREGATION.md) criado
- [x] [Copilot Instructions](../copilot-instructions.md) atualizado com referência
- [x] Seção "Common Pitfalls" expandida
- [x] Checklist para novos testes incluído

### Testes Validados

- [x] `fluxo-cadastro-regressao.test.ts` - usa `@/lib/db` (segregação automática)
- [x] `test-database-guard.ts` - utilitário de proteção correto
- [x] Testes de configuração (`database-configuration.test.ts`) - mockam variáveis corretamente

### Comandos de Verificação

```powershell
# Dev (deve usar nr-bps_db)
$env:NODE_ENV='development'; pnpm dev

# Test (deve usar nr-bps_db_test)
$env:NODE_ENV='test'; pnpm test

# Verificar URL ativa
node -e "require('dotenv').config({ path: '.env.test' }); console.log(process.env.TEST_DATABASE_URL)"
```

### Exclusão de Dados de Teste

- [x] tomadores 282, 283, 284 removidas de `nr-bps_db`
- [x] tomadores 282, 283, 284 removidas de `nr-bps_db_test`
- [x] Registros relacionados (funcionarios, pagamentos, contratos) removidos

## Próximos Passos

### Para Novos Testes

1. **SEMPRE** carregar `.env.test` no início:

   ```typescript
   require('dotenv').config({ path: '.env.test', override: true });
   ```

2. **Verificar** `TEST_DATABASE_URL` antes de executar:

   ```typescript
   if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
     throw new Error('Teste DEVE usar nr-bps_db_test');
   }
   ```

3. **Usar** `@/lib/db` para queries (segregação automática)

4. **Limpar** dados criados em `afterEach`/`afterAll`

### Para Revisão de Testes Existentes

- [ ] Auditar todos os testes em `__tests__/` para uso de variáveis
- [ ] Verificar se algum teste faz conexão direta sem `lib/db.ts`
- [ ] Garantir que nenhum teste hardcode `nr-bps_db`
- [ ] Validar scripts de setup/teardown

### Monitoramento Contínuo

- [ ] Criar script de validação automática (CI/CD)
- [ ] Adicionar pre-commit hook para verificar `.env.test`
- [ ] Dashboard de status de ambientes (opcional)

## Referências

- [ENVIRONMENT-SEGREGATION.md](ENVIRONMENT-SEGREGATION.md)
- [lib/db.ts](../../lib/db.ts)
- [jest.setup.js](../../jest.setup.js)
- [.env.test](../../.env.test)
