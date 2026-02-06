# Guia de Boas Práticas - Testes e Proteção de Dados

## 🎯 Objetivo

Garantir que testes automatizados não afetem dados de produção e que o sistema mantenha integridade de senhas de gestores.

---

## 📋 Regras para Testes

### 1. **IDs de Teste Seguros**

✅ **SEMPRE usar IDs altos para dados de teste:**

```typescript
// ✅ CORRETO
const testContratanteId = 999999;
const testUsuarioId = 888888;

// ❌ ERRADO
const testContratanteId = 1; // Pode conflitar com dados reais!
```

**Range recomendado para IDs de teste:** 900000+

---

### 2. **Isolamento de Dados**

✅ **Usar prefixos identificáveis em dados de teste:**

```typescript
// ✅ CORRETO
const testCnpj = '99999999000199'; // Claramente identificável como teste
const testEmail = 'teste.automatizado@exemplo.com';
const testNome = 'EMPRESA TESTE AUTOMATIZADO';

// ❌ ERRADO
const testCnpj = '12345678000190'; // Pode parecer real
```

---

### 3. **Limpeza Seletiva**

✅ **DELETE com WHERE específico:**

```typescript
// ✅ CORRETO - Específico
await query('DELETE FROM contratantes WHERE id = $1', [testContratanteId]);
await query('DELETE FROM contratantes WHERE nome LIKE $1', ['%TESTE%']);

// ❌ ERRADO - Muito amplo
await query('DELETE FROM contratantes'); // NUNCA!
await query('TRUNCATE contratantes'); // NUNCA!
```

---

### 4. **Uso de Mocks**

✅ **Preferir mocks para testes unitários:**

```typescript
// ✅ CORRETO - Mock
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

test('deve fazer login', async () => {
  mockQuery.mockResolvedValue({
    rows: [{ cpf: '12345678901', senha_hash: '$2a$10$...' }],
  });

  // Teste não toca no banco real
});
```

---

### 5. **Testes de Integração**

✅ **Para testes que precisam do banco real:**

```typescript
describe('Integração Real', () => {
  const TEST_ID = 999999;

  beforeEach(async () => {
    // Limpar apenas dados de teste
    await query('DELETE FROM contratantes WHERE id = $1', [TEST_ID]);
  });

  afterEach(async () => {
    // Limpar novamente
    await query('DELETE FROM contratantes WHERE id = $1', [TEST_ID]);
  });

  test('criar contratante', async () => {
    // Criar com ID de teste
    await query(
      'INSERT INTO contratantes (id, ...) VALUES ($1, ...)',
      [TEST_ID, ...]
    );

    // Validações...
  });
});
```

---

### 6. **Banco de Testes Separado**

✅ **Usar banco dedicado para testes:**

```typescript
// jest.setup.js
if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL =
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test';
}
```

**⚠️ NUNCA rodar testes contra banco de produção!**

---

## 🛡️ Proteção de Senhas de Gestores

### Verificação Automática de Integridade

**Script:** `scripts/verify-gestores-senhas.cjs`

```javascript
/**
 * Verificar integridade de senhas de gestores
 * Executar após aprovação de contratantes
 */

const { Client } = require('pg');

async function verificarSenhas() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  // Buscar contratantes ativos sem senha
  const result = await client.query(`
    SELECT c.id, c.cnpj, c.responsavel_nome, c.responsavel_cpf, c.tipo
    FROM contratantes c
    LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id 
      AND cs.cpf = c.responsavel_cpf
    WHERE c.status = 'aprovado' 
      AND c.ativa = true 
      AND cs.senha_hash IS NULL
    ORDER BY c.id
  `);

  if (result.rows.length > 0) {
    console.error('❌ ALERTA: Contratantes aprovados sem senha!');
    console.table(result.rows);

    // Opcionalmente criar senhas automaticamente
    for (const contratante of result.rows) {
      const cnpjLimpo = contratante.cnpj.replace(/[./-]/g, '');
      const senha = cnpjLimpo.slice(-6);
      const hash = await bcrypt.hash(senha, 10);

      await client.query(
        'INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [contratante.id, contratante.responsavel_cpf, hash]
      );

      console.log(`✅ Senha criada para contratante ID ${contratante.id}`);
    }
  } else {
    console.log('✅ Todos os contratantes aprovados têm senhas');
  }

  await client.end();
}

verificarSenhas().catch(console.error);
```

---

## 🔍 Checklist de Revisão de Testes

Antes de commitar testes novos, verificar:

- [ ] IDs de teste são ≥ 900000?
- [ ] Dados de teste têm prefixo/sufixo identificável?
- [ ] DELETE tem WHERE específico?
- [ ] Usa mocks quando possível?
- [ ] beforeEach/afterEach fazem limpeza seletiva?
- [ ] Não usa TRUNCATE ou DELETE sem WHERE?
- [ ] Testa contra banco de teste (não produção)?

---

## 🚨 Comandos Proibidos em Testes

### ❌ NUNCA usar:

```sql
-- NUNCA!
DELETE FROM contratantes;
DELETE FROM entidades_senhas;
TRUNCATE contratantes;
TRUNCATE entidades_senhas CASCADE;

-- SEMPRE usar WHERE específico:
DELETE FROM contratantes WHERE id = $1;
DELETE FROM entidades_senhas WHERE contratante_id = $1;
```

---

## 📊 Monitoramento

### Criar View de Auditoria

```sql
CREATE OR REPLACE VIEW vw_contratantes_sem_senha AS
SELECT
  c.id,
  c.cnpj,
  c.responsavel_nome,
  c.responsavel_cpf,
  c.tipo,
  c.status,
  c.ativa,
  c.criado_em,
  CASE
    WHEN cs.senha_hash IS NULL THEN '❌ SEM SENHA'
    ELSE '✅ OK'
  END as status_senha
FROM contratantes c
LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id
  AND cs.cpf = c.responsavel_cpf
WHERE c.status = 'aprovado' AND c.ativa = true;
```

**Consulta diária:**

```sql
SELECT * FROM vw_contratantes_sem_senha
WHERE status_senha = '❌ SEM SENHA';
```

---

## 🔧 Script de Manutenção

**Arquivo:** `scripts/maintenance/check-integrity.cjs`

```javascript
/**
 * Verificação de integridade do sistema
 * Executar: node scripts/maintenance/check-integrity.cjs
 */

async function checkIntegrity() {
  console.log('🔍 Verificando integridade do sistema...\n');

  // 1. Contratantes sem senha
  console.log('1️⃣ Verificando senhas de gestores...');
  await verificarSenhas();

  // 2. Funcionários órfãos
  console.log('\n2️⃣ Verificando funcionários órfãos...');
  await verificarFuncionariosOrfaos();

  // 3. Dados de teste no banco
  console.log('\n3️⃣ Verificando dados de teste...');
  await verificarDadosTeste();

  console.log('\n✅ Verificação completa!');
}

checkIntegrity();
```

---

## 📚 Documentação de Referência

- [Análise Autenticação Gestor](./ANALISE-AUTENTICACAO-GESTOR-02494916000170.md)
- [Testing Policy](../TESTING-POLICY.md)
- [Copilot Instructions](./copilot-instructions.md)

---

## ⚡ Comandos Úteis

```bash
# Verificar integridade
node scripts/verify-gestores-senhas.cjs

# Restaurar senha específica
node fix-senha-gestor-[CNPJ].cjs

# Rodar testes (banco de teste)
pnpm test

# Rodar testes de integração
pnpm test:e2e

# Verificar dados de teste no banco
node scripts/check-test-data.cjs
```
