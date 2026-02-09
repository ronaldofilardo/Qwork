# Política de Testes - QWork BPS

**Data:** 6 de janeiro de 2026
**Status:** OFICIAL - OBRIGATÓRIO

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### 1. CÓDIGO FONTE É A FONTE DA VERDADE

**REGRA ABSOLUTA:** O código fonte da aplicação (`app/`, `lib/`, `components/`) é a **única fonte da verdade** sobre o comportamento do sistema.

- ✅ **Testes DEVEM refletir o código fonte**
- ✅ **Testes DEVEM validar comportamento real das APIs**
- ❌ **Testes NÃO DEVEM criar fluxos SQL paralelos**
- ❌ **Testes NÃO DEVEM assumir comportamentos não implementados**

**Quando há divergência:**

- Se o código fonte implementa feature X mas o teste valida feature Y → **TESTE ESTÁ ERRADO**
- Se o código fonte remove comportamento mas teste ainda valida → **TESTE ESTÁ OBSOLETO**
- Se o código fonte adiciona validação mas teste não valida → **TESTE ESTÁ INCOMPLETO**

### 2. INTEGRIDADE DO CÓDIGO FONTE

**REGRA ABSOLUTA:** Um teste para ser aprovado **JAMAIS** pode regredir ou quebrar o código fonte.

- ✅ **Testes DEVEM validar sem modificar o comportamento esperado**
- ✅ **Testes DEVEM passar com o código fonte atual**
- ❌ **Testes NÃO DEVEM causar falhas no código fonte**
- ❌ **Testes NÃO DEVEM introduzir regressões**

**Consequências de violação:**

- Teste que falha indica problema no código fonte → **CORREÇÃO OBRIGATÓRIA NO CÓDIGO**
- Teste que passa mas código tem bug → **TESTE INEFICAZ, DEVE SER MELHORADO**
- Nunca ajustar código para "passar" em teste incorreto → **TESTE DEVE SER CORRIGIDO**

---

## 🔒 ISOLAMENTO DE AMBIENTES

### Bancos de Dados

| Ambiente            | Banco            | Uso                              | Proteção                       |
| ------------------- | ---------------- | -------------------------------- | ------------------------------ |
| **Desenvolvimento** | `nr-bps_db`      | Desenvolvimento local, debugging | ⚠️ NÃO rodar testes            |
| **Testes**          | `nr-bps_db_test` | Execução de testes automatizados | ✅ Único permitido para testes |
| **Produção**        | Neon Cloud       | Aplicação em produção            | 🔒 Nunca rodar testes          |

### Garantias de Isolamento

**PROIBIÇÃO ABSOLUTA:** É proibido um teste inserir qualquer dado no banco `nr-bps_db`.

- ✅ **Testes DEVEM usar exclusivamente `nr-bps_db_test`**
- ✅ **Testes DEVEM validar isolamento antes de executar**
- ❌ **Testes NÃO DEVEM inserir dados em `nr-bps_db`**
- ❌ **Testes NÃO DEVEM modificar estado de desenvolvimento**

**Validações ativas em `lib/db.ts`:**

```typescript
// VALIDAÇÃO 1: Ambiente de teste SEM TEST_DATABASE_URL
if (environment === 'test' && !hasTestDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL não definida');
}

// VALIDAÇÃO 2: Teste usando banco de desenvolvimento
if (isTest && dbName === 'nr-bps_db') {
  throw new Error('Testes NÃO devem usar nr-bps_db');
}

// VALIDAÇÃO 3: Desenvolvimento usando banco de testes
if (isDevelopment && databaseUrl.includes('nr-bps_db_test')) {
  throw new Error('Desenvolvimento não deve usar nr-bps_db_test');
}
```

**Validações em `scripts/checks/ensure-test-env.js`:**

- Executa ANTES de cada suíte de testes
- Bloqueia execução se `TEST_DATABASE_URL` aponta para `nr-bps_db`
- Bloqueia se nome do banco não contém "test"

---

## 📋 PADRÕES DE ESCRITA DE TESTES

### ✅ PADRÃO CORRETO: Testar via API

```typescript
// ✅ CORRETO: Chama a API real
it('deve cadastrar tomador com plano fixo', async () => {
  const request = new NextRequest(
    'http://localhost:3000/api/cadastro/tomador',
    {
      method: 'POST',
      body: JSON.stringify({
        tipo: 'entidade',
        nome: 'Empresa Teste',
        cnpj: '12345678000199',
        plano_id: 1,
        // ... demais campos
      }),
    }
  );

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.simulador_url).toBeDefined(); // Valida comportamento REAL
});
```

### ❌ PADRÃO INCORRETO: SQL Direto

```typescript
// ❌ ERRADO: INSERT direto ignora lógica da aplicação
it('deve criar tomador', async () => {
  const result = await query(`
    INSERT INTO tomadores (tipo, nome, cnpj, status)
    VALUES ('entidade', 'Teste', '12345678000199', 'aguardando_pagamento')
    RETURNING id
  `);

  // Este teste NÃO valida:
  // - Se a API realmente cria com esse status
  // - Se há validações de CNPJ
  // - Se há criação automática de contrato
  // - Se há geração de link de pagamento
});
```

---

## 🔧 SETUP E TEARDOWN

### beforeEach / beforeAll

**SEMPRE:**

1. Limpar dados de testes anteriores
2. Inserir dados mínimos necessários (seed)
3. Validar que prerequisitos existem

```typescript
beforeEach(async () => {
  // 1. Limpar
  await query(
    'DELETE FROM contratos WHERE tomador_id IN (SELECT id FROM tomadores WHERE cnpj = $1)',
    [testCNPJ]
  );
  await query('DELETE FROM tomadores WHERE cnpj = $1', [testCNPJ]);

  // 2. Seed necessário (planos, por exemplo)
  // Verificar se plano existe, se não, inserir
  const planoResult = await query(
    'SELECT id FROM planos WHERE tipo = $1 LIMIT 1',
    ['fixo']
  );
  if (planoResult.rows.length === 0) {
    await query(`
      INSERT INTO planos (nome, tipo, preco, ativo)
      VALUES ('Plano Teste Fixo', 'fixo', 24.00, true)
    `);
  }
});
```

### afterEach / afterAll

**SEMPRE:**

1. Limpar dados criados pelo teste
2. Não assumir que outros testes farão limpeza

---

## 🚫 ANTI-PADRÕES PROIBIDOS

### 1. Hardcoding de IDs

```typescript
// ❌ ERRADO
plano_id: 3; // E se o plano 3 não existir? E se for outro tipo?

// ✅ CORRETO
const planoResult = await query(
  'SELECT id FROM planos WHERE tipo = $1 LIMIT 1',
  ['fixo']
);
const planoId = planoResult.rows[0]?.id;
if (!planoId) throw new Error('Plano fixo não encontrado - seed necessário');
```

### 2. Assumir Estado do Banco

```typescript
// ❌ ERRADO
it('deve buscar plano', async () => {
  const result = await query('SELECT * FROM planos WHERE id = 1');
  expect(result.rows[0]).toBeDefined(); // Pode falhar!
});

// ✅ CORRETO
it('deve buscar plano', async () => {
  // Inserir o dado que vamos testar
  const insertResult = await query(`
    INSERT INTO planos (nome, tipo, preco, ativo)
    VALUES ('Plano Teste', 'fixo', 24.00, true)
    RETURNING id
  `);
  const planoId = insertResult.rows[0].id;

  // Agora sim, testar busca
  const result = await query('SELECT * FROM planos WHERE id = $1', [planoId]);
  expect(result.rows[0]).toBeDefined();
});
```

### 3. Testar Fluxo SQL ao Invés de API

```typescript
// ❌ ERRADO: Testa SQL mas não valida se a API faz isso
it('deve aceitar contrato', async () => {
  await query('UPDATE contratos SET aceito = true WHERE id = $1', [contratoId]);
  // E a lógica de aceite? E validações? E side-effects?
});

// ✅ CORRETO: Testa endpoint de aceite
it('deve aceitar contrato', async () => {
  const request = new NextRequest(
    `http://localhost:3000/api/contratos/${contratoId}/aceitar`,
    {
      method: 'POST',
      body: JSON.stringify({ ip_aceite: '127.0.0.1' }),
    }
  );

  const response = await POST(request);
  expect(response.status).toBe(200);

  // Validar efeitos colaterais esperados
  const contratoResult = await query(
    'SELECT aceito, data_aceite FROM contratos WHERE id = $1',
    [contratoId]
  );
  expect(contratoResult.rows[0].aceito).toBe(true);
  expect(contratoResult.rows[0].data_aceite).toBeDefined();
});
```

---

## 📊 VALIDAÇÃO DE CONFORMIDADE

### Checklist para Pull Requests

Antes de aprovar PR com testes novos:

- [ ] Testes chamam APIs/funções do código fonte (não fazem SQL direto)?
- [ ] Testes fazem seed dos dados necessários (não assumem estado)?
- [ ] Testes usam `TEST_DATABASE_URL` (verificar logs de execução)?
- [ ] Testes validam comportamento atual do código (não comportamento fantasma)?
- [ ] Testes limpam dados criados (afterEach/afterAll)?
- [ ] Testes não usam IDs hardcoded (buscam ou criam dados)?

### Comandos de Validação

```bash
# Verificar que testes usam banco correto
pnpm test -- --verbose 2>&1 | Select-String "nr-bps_db[^_]"
# Resultado esperado: NENHUMA ocorrência

# Verificar variável de ambiente
node -e "console.log(process.env.TEST_DATABASE_URL)"
# Resultado esperado: postgres://...nr-bps_db_test

# Verificar isolamento
pnpm test __tests__/lib/database-configuration.test.ts
# Resultado esperado: todos os testes passam
```

---

## 🔄 PROCESSO DE CORREÇÃO DE TESTES

Quando encontrar teste desatualizado:

1. **Identificar comportamento atual do código**
   - Ler a implementação atual da API/função
   - Verificar se o comportamento mudou

2. **Atualizar o teste para refletir o código**
   - Ajustar assertions para comportamento atual
   - Remover validações de features não implementadas

3. **Adicionar comentário explicativo**

   ```typescript
   // ATUALIZADO em 2025-12-23: API agora retorna simulador_url ao invés de redirect_url
   expect(data.simulador_url).toBeDefined();
   ```

4. **Não modificar código para passar em teste obsoleto**
   - ❌ ERRADO: Mudar API para passar em teste antigo
   - ✅ CORRETO: Atualizar teste para refletir API atual

---

## 📝 RESPONSABILIDADES

### Desenvolvedor

- Escrever testes que validam código fonte
- Atualizar testes quando código muda
- Nunca commitar código que falha em testes

### Revisor de PR

- Verificar que testes seguem esta política
- Rejeitar testes que fazem SQL direto sem justificativa
- Validar que testes não assumem estado do banco

### CI/CD

- Rodar `ensure-test-env.js` antes de cada suíte
- Bloquear merge se testes falharem
- Alertar se banco de desenvolvimento for detectado

---

## ⚡ RESUMO EXECUTIVO

1. **Código fonte é a verdade** - Testes validam código, não o contrário
2. **Apenas `nr-bps_db_test`** - Testes NUNCA usam `nr-bps_db`
3. **Testar via API** - Não fazer SQL direto quando há endpoint
4. **Seed explícito** - Não assumir que dados existem
5. **Limpeza obrigatória** - Sempre limpar após testes
6. **Sem IDs hardcoded** - Buscar ou criar dados dinamicamente

---

**Assinado digitalmente:** Sistema QWork BPS
**Vigência:** Imediata e permanente
**Última atualização:** 6/01/2026
