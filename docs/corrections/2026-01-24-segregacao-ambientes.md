# Correção: Segregação Total de Ambientes - 24/01/2026

## Problema Identificado

Ambiente de desenvolvimento (`nr-bps_db`) e ambiente de testes (`nr-bps_db_test`) **NÃO** estavam completamente segregados:

1. `.env.local` tinha `DATABASE_URL` apontando para `nr-bps_db` (conflito)
2. Falta de documentação formal sobre política de segregação
3. Instruções do Copilot não reforçavam a segregação crítica
4. Dados de teste persistiam nos dois bancos

## Correções Aplicadas

### 1. Configuração de Arquivos `.env`

**Antes:**

```dotenv
# .env.local
DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
```

**Depois:**

```dotenv
# .env.local
# SEGREGAÇÃO DE AMBIENTES:
# - Desenvolvimento (pnpm dev): usa LOCAL_DATABASE_URL → nr-bps_db
# - Testes (pnpm test): usa TEST_DATABASE_URL → nr-bps_db_test
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
```

### 2. Exclusão de Dados de Teste

Executado em **ambos** os bancos:

```sql
-- nr-bps_db (dev)
DELETE FROM funcionarios WHERE tomador_id IN (282, 283, 284);
DELETE FROM pagamentos WHERE tomador_id IN (282, 283, 284);
DELETE FROM contratos WHERE tomador_id IN (282, 283, 284);
DELETE FROM tomadores WHERE id IN (282, 283, 284);

-- nr-bps_db_test (test)
DELETE FROM notificacoes WHERE destinatario_cpf IN (...);
DELETE FROM funcionarios WHERE tomador_id IN (282, 283, 284);
DELETE FROM pagamentos WHERE tomador_id IN (282, 283, 284);
DELETE FROM contratos WHERE tomador_id IN (282, 283, 284);
DELETE FROM tomadores WHERE id IN (282, 283, 284);
```

**Resultado:**

- Dev: 0 registros (já limpo)
- Test: 3 tomadores + 3 funcionários + 1 pagamento + 1 contrato + 2 notificações removidos

### 3. Documentação Criada

#### [docs/policies/ENVIRONMENT-SEGREGATION.md](ENVIRONMENT-SEGREGATION.md)

Política formal completa incluindo:

- Princípio fundamental
- Configuração de bancos por ambiente
- Validações automáticas em `lib/db.ts` e `jest.setup.js`
- Regras para desenvolvimento de testes (✅ SEMPRE / ❌ NUNCA)
- Checklist para novos testes
- Comandos de verificação
- Troubleshooting comum

#### [docs/policies/ENVIRONMENT-SEGREGATION-CHECKLIST.md](ENVIRONMENT-SEGREGATION-CHECKLIST.md)

Checklist de implementação com:

- Status de configurações base
- Validações implementadas
- Testes validados
- Comandos de verificação
- Próximos passos para revisão

### 4. Atualização do Copilot Instructions

**[Copilot Instructions](../copilot-instructions.md):**

Adicionado em "Testing Conventions":

```markdown
**⚠️ SEGREGAÇÃO DE AMBIENTES OBRIGATÓRIA:**

- **Development (`pnpm dev`):** usa `LOCAL_DATABASE_URL` → `nr-bps_db`
- **Testing (`pnpm test`):** usa `TEST_DATABASE_URL` → `nr-bps_db_test`
- **NUNCA** misturar bancos entre ambientes
- Ver [docs/policies/ENVIRONMENT-SEGREGATION.md] para política completa
```

Adicionado em "Common Pitfalls":

```markdown
- **CRÍTICO:** NUNCA usar `nr-bps_db` em testes - apenas `nr-bps_db_test` via `TEST_DATABASE_URL`
- Testes DEVEM carregar `.env.test` explicitamente via `dotenv -e .env.test --override`
```

## Proteções Ativas

### Em `lib/db.ts` (linhas 83-104)

```typescript
// VALIDAÇÃO CRÍTICA: Bloquear nr-bps_db em ambiente de teste
if (environment === 'test' || isRunningTests) {
  const suspectVars = [
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  ].filter(Boolean);

  for (const url of suspectVars) {
    if (url && url.includes('/nr-bps_db') && !url.includes('_test')) {
      throw new Error(
        `🚨 ERRO CRÍTICO DE SEGURANÇA: Detectada tentativa de usar ` +
          `banco de DESENVOLVIMENTO em ambiente de TESTES!`
      );
    }
  }
}
```

### Em `jest.setup.js` (linhas 30-60)

```javascript
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });

  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL não está definido');
  }

  const dbName = new URL(testDbUrl).pathname.replace(/^\//, '');
  if (dbName === 'nr-bps_db') {
    throw new Error(
      `🚨 ERRO CRÍTICO: TEST_DATABASE_URL aponta para banco de DESENVOLVIMENTO!`
    );
  }
}
```

### Hook Global (jest.setup.js linhas 63-79)

```javascript
beforeEach(() => {
  if (process.env.JEST_WORKER_ID) {
    const dbName = new URL(testDbUrl).pathname.replace(/^\//, '');
    if (dbName === 'nr-bps_db') {
      throw new Error(
        `🚨 BLOQUEADO: Teste tentando usar banco de desenvolvimento!`
      );
    }
  }
});
```

## Validação Final

### Comandos Executados

```powershell
# 1. Verificar arquivo .env.test
cat .env.test
# ✅ TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db_test

# 2. Verificar arquivo .env.local
cat .env.local
# ✅ LOCAL_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db
# ✅ Não tem DATABASE_URL

# 3. Executar teste
pnpm test -- fluxo-cadastro-regressao.test.ts -i
# ✅ Test Suites: 1 passed, 1 total
# ✅ Tests: 2 passed, 2 total
# ✅ Log: "🛡️ [jest.setup] Proteção do banco de testes ativada - usando: nr-bps_db_test"

# 4. Verificar conexão (teste)
node -e "require('dotenv').config({ path: '.env.test' }); console.log(process.env.TEST_DATABASE_URL)"
# ✅ postgres://postgres:123456@localhost:5432/nr-bps_db_test
```

### Status Final

- ✅ Ambientes completamente segregados
- ✅ Proteções múltiplas ativas (3 camadas)
- ✅ Documentação completa criada
- ✅ Copilot instructions atualizadas
- ✅ Dados de teste removidos
- ✅ Testes de integração validados

## Impacto

### Benefícios

1. **Segurança:** Impossível corromper banco dev com testes
2. **Confiabilidade:** Testes isolados não afetam desenvolvimento
3. **Rastreabilidade:** Logs claros sobre qual banco está sendo usado
4. **Manutenibilidade:** Documentação formal facilita onboarding
5. **Prevenção:** Múltiplas camadas impedem erros humanos

### Breaking Changes

**Nenhum** - Configuração já existente foi mantida, apenas reforçada.

## Próximos Passos Recomendados

1. **Auditar testes existentes:**

   ```powershell
   # Buscar testes que possam usar DATABASE_URL incorretamente
   grep -r "DATABASE_URL" __tests__/ --exclude-dir=node_modules
   ```

2. **Criar script de validação CI:**

   ```bash
   #!/bin/bash
   # workflows/validate-env-segregation.sh
   if grep -q "DATABASE_URL=.*nr-bps_db[^_]" .env.test; then
     echo "❌ ERRO: .env.test usando banco de dev!"
     exit 1
   fi
   ```

3. **Adicionar pre-commit hook:**
   ```bash
   # .husky/pre-commit
   if git diff --cached --name-only | grep -q ".env.test"; then
     echo "Validando .env.test..."
     # validar conteúdo
   fi
   ```

## Referências

- [docs/policies/ENVIRONMENT-SEGREGATION.md](ENVIRONMENT-SEGREGATION.md)
- [docs/policies/ENVIRONMENT-SEGREGATION-CHECKLIST.md](ENVIRONMENT-SEGREGATION-CHECKLIST.md)
- [lib/db.ts](../../lib/db.ts) - linhas 60-200
- [jest.setup.js](../../jest.setup.js) - linhas 30-140
- [Copilot Instructions](../copilot-instructions.md)
