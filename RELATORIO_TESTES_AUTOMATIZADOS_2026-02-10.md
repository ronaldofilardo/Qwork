# 📊 Relatório de Testes Automatizados - Correções 09-10/02/2026

**Data:** 10/02/2026  
**Escopo:** Análise de cobertura de testes para correções críticas em PROD  
**Status:** 🔴 **COBERTURA CRÍTICA INSUFICIENTE**

---

## 📋 Sumário Executivo

### Correções Implementadas (Sem Testes)

1. ✅ **Migração 1004** - Função `fn_reservar_id_laudo_on_lote_insert` com status='rascunho'
2. ✅ **Contexto de Auditoria RH** - `withTransactionAsGestor` para manter `app.current_user_cpf`
3. ✅ **Lotes Órfãos** - Transações em RH e Entidade para garantir atomicidade
4. ✅ **SAVEPOINT para Laudos** - Isolar erros de laudo duplicado sem abortar transação

### Riscos Atuais

- 🔴 **ALTO:** Nenhum teste valida transações com SAVEPOINT
- 🔴 **ALTO:** Nenhum teste valida contexto de auditoria após erros
- 🟡 **MÉDIO:** Testes de lotes órfãos estão `.skip` (desabilitados)
- 🟡 **MÉDIO:** Nenhum teste valida Migração 1004 em cenário de produção

### Recomendação

**URGENTE:** Criar suite de testes de integração antes de próximo deploy crítico.

---

## 🔍 Análise Detalhada por Correção

### 1. Migração 1004 - Status Rascunho em Laudos

#### O Que Foi Corrigido

**Arquivo:** `database/functions/fn_reservar_id_laudo_on_lote_insert.sql`

**Mudança:**

```sql
-- ANTES (DEV)
INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- DEPOIS (PROD - Migração 1004)
INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;  -- ✅ Agora inclui 'rascunho'
```

#### Testes Existentes

- ❌ **Nenhum teste valida a função `fn_reservar_id_laudo_on_lote_insert`**
- ❌ **Nenhum teste valida trigger `trg_reservar_id_laudo_on_lote_insert`**
- ❌ **Nenhum teste valida status='rascunho' em laudos criados automaticamente**

#### Testes Necessários

##### 🔴 CRÍTICO: Teste de Trigger (Unitário)

```typescript
// __tests__/database/triggers/reservar-laudo-on-lote.test.ts

describe('Trigger: trg_reservar_id_laudo_on_lote_insert', () => {
  it('deve criar laudo com status=rascunho quando lote é criado', async () => {
    // Criar lote
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
       VALUES ($1, $2, $3, 'completo', 'ativo', $4, $5)
       RETURNING id`,
      [clinicaId, empresaId, 'Teste trigger', cpf, 1]
    );
    const loteId = loteResult.rows[0].id;

    // Verificar laudo criado automaticamente
    const laudoResult = await query(
      `SELECT id, lote_id, status FROM laudos WHERE id = $1`,
      [loteId]
    );

    expect(laudoResult.rowCount).toBe(1);
    expect(laudoResult.rows[0].id).toBe(loteId);
    expect(laudoResult.rows[0].lote_id).toBe(loteId);
    expect(laudoResult.rows[0].status).toBe('rascunho'); // ✅ CRÍTICO
  });

  it('não deve falhar se laudo com mesmo ID já existe (ON CONFLICT)', async () => {
    // Pré-criar laudo
    await query(
      `INSERT INTO laudos (id, lote_id, status) VALUES (999, 999, 'emitido')`
    );

    // Tentar criar lote com ID 999 (trigger tentará criar laudo duplicate)
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
       VALUES (999, $1, $2, 'Teste conflict', 'completo', 'ativo', $3, 1)
       RETURNING id`,
      [clinicaId, empresaId, cpf]
    );

    // ✅ Não deve falhar (ON CONFLICT DO NOTHING)
    expect(loteResult.rowCount).toBe(1);
  });
});
```

---

### 2. Contexto de Auditoria com Transações

#### O Que Foi Corrigido

**Arquivos:**

- `app/api/rh/liberar-lote/route.ts`
- `app/api/entidade/liberar-lote/route.ts`

**Mudança:**

```typescript
// ANTES (queries individuais - perdia contexto após erros)
const loteResult = await queryAsGestorRH(`INSERT INTO lotes_avaliacao ...`);
for (const func of funcionarios) {
  await queryAsGestorRH(`INSERT INTO avaliacoes ...`); // ❌ Perdia app.current_user_cpf
}

// DEPOIS (transação - mantém contexto)
await withTransactionAsGestor(async (client) => {
  const loteResult = await client.query(`INSERT INTO lotes_avaliacao ...`);
  for (const func of funcionarios) {
    await client.query(`INSERT INTO avaliacoes ...`); // ✅ Mantém app.current_user_cpf
  }
});
```

#### Testes Existentes

- ✅ `__tests__/security/audit-logs.test.ts` - Valida logs de auditoria básicos
- ✅ `__tests__/database/audit-log-with-context.test.ts` - Valida contexto de auditoria
- ❌ **Nenhum teste valida contexto após erro dentro de transação**
- ❌ **Nenhum teste valida `withTransactionAsGestor` especificamente**

#### Testes Necessários

##### 🔴 CRÍTICO: Teste de Contexto em Transação com Erro

```typescript
// __tests__/integration/transaction-audit-context.test.ts

import { withTransactionAsGestor } from '@/lib/db-transaction';
import { query } from '@/lib/db';

describe('Contexto de Auditoria em Transações', () => {
  beforeEach(async () => {
    // Configurar sessão de teste
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678909',
      perfil: 'rh',
      clinica_id: 1,
    });
  });

  it('deve manter app.current_user_cpf durante toda a transação', async () => {
    await withTransactionAsGestor(async (client) => {
      // 1. Criar lote
      const loteResult = await client.query(
        `INSERT INTO lotes_avaliacao (...) VALUES (...) RETURNING id`,
        [...]
      );
      const loteId = loteResult.rows[0].id;

      // 2. Criar avaliação (usa trigger de auditoria)
      await client.query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, 'iniciada', NOW())`,
        ['12345678900', loteId]
      );

      // 3. Verificar audit_logs tem created_by_cpf preenchido
      const auditResult = await client.query(
        `SELECT user_cpf FROM audit_logs
         WHERE resource = 'avaliacoes'
         AND action = 'INSERT'
         ORDER BY created_at DESC LIMIT 1`
      );

      expect(auditResult.rows[0].user_cpf).toBe('12345678909'); // ✅ CRÍTICO
    });
  });

  it('deve manter contexto mesmo após erro intermediário isolado', async () => {
    await withTransactionAsGestor(async (client) => {
      // 1. Criar lote
      const loteResult = await client.query(
        `INSERT INTO lotes_avaliacao (...) VALUES (...) RETURNING id`,
        [...]
      );
      const loteId = loteResult.rows[0].id;

      // 2. Tentar criar laudo (pode falhar com SAVEPOINT)
      try {
        await client.query('SAVEPOINT laudo_reserva');
        await client.query(
          `INSERT INTO laudos (id, lote_id, status) VALUES ($1, $1, 'rascunho')`,
          [loteId]
        );
        await client.query('RELEASE SAVEPOINT laudo_reserva');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
      }

      // 3. Criar avaliação (deve funcionar mesmo se laudo falhou)
      await client.query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, 'iniciada', NOW())`,
        ['12345678900', loteId]
      );

      // 4. Verificar audit_logs tem user_cpf
      const auditResult = await client.query(
        `SELECT user_cpf FROM audit_logs
         WHERE resource = 'avaliacoes'
         AND action = 'INSERT'
         ORDER BY created_at DESC LIMIT 1`
      );

      expect(auditResult.rows[0].user_cpf).toBe('12345678909'); // ✅ CRÍTICO
    });
  });
});
```

---

### 3. Lotes Órfãos (Atomicidade)

#### O Que Foi Corrigido

**Problema:** Lotes criados SEM avaliações (órfãos) porque queries rodavam em autocommit.

**Solução:** Envolver criação de lote + avaliações em `withTransactionAsGestor`.

#### Testes Existentes

- ⚠️ `__tests__/integration/liberar-lote-rh-resilience.test.ts` - **DESABILITADO** (`.skip`)
- ✅ `__tests__/api/entidade/liberar-lote.test.ts` - Testa mocks (não banco real)
- ❌ **Nenhum teste valida rollback de lote se avaliações falharem**

#### Testes Necessários

##### 🔴 CRÍTICO: Teste de Atomicidade (Integração)

```typescript
// __tests__/integration/liberar-lote-atomicity.test.ts

describe('Atomicidade: Lote + Avaliações', () => {
  it('deve criar lote E avaliações em mesma transação', async () => {
    const req = new NextRequest('http://localhost/api/rh/liberar-lote', {
      method: 'POST',
      body: JSON.stringify({
        empresaId: 1,
        tipo: 'completo',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.loteId).toBeDefined();
    expect(data.avaliacoes_criadas).toBeGreaterThan(0);

    // Verificar que lote tem avaliações
    const avaliacoes = await query(
      `SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id = $1`,
      [data.loteId]
    );
    expect(avaliacoes.rows[0].total).toBe(data.avaliacoes_criadas);
  });

  it('deve fazer ROLLBACK de lote se nenhuma avaliação for criada', async () => {
    // Simular cenário onde todas avaliações falham
    // (ex: funcionários sem CPF válido, FK constraint)

    // Mock queryAsGestorRH para simular elegíveis mas com CPFs inválidos
    mockQueryAsGestorRH
      .mockResolvedValueOnce({ rows: [{ numero_ordem: 1 }] }) // numero ordem
      .mockResolvedValueOnce({
        rows: [{ funcionario_cpf: 'INVALID', funcionario_nome: 'Teste' }],
      }); // elegibilidade

    const req = new NextRequest('http://localhost/api/rh/liberar-lote', {
      method: 'POST',
      body: JSON.stringify({ empresaId: 1 }),
    });

    const response = await POST(req);
    const data = await response.json();

    // ✅ Deve retornar erro
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);

    // ✅ Lote NÃO deve existir no banco (ROLLBACK)
    const loteCheck = await query(
      `SELECT id FROM lotes_avaliacao 
       WHERE descricao LIKE '%Teste%' 
       AND liberado_em > NOW() - INTERVAL '1 minute'`
    );
    expect(loteCheck.rowCount).toBe(0); // ✅ CRÍTICO - Sem lotes órfãos
  });

  it('NÃO deve criar lotes órfãos (sem avaliações)', async () => {
    // Verificar no banco todos os lotes ativos
    const lotesOrfaos = await query(`
      SELECT la.id, la.numero_ordem
      FROM lotes_avaliacao la
      WHERE la.status = 'ativo'
        AND NOT EXISTS (
          SELECT 1 FROM avaliacoes WHERE lote_id = la.id
        )
    `);

    expect(lotesOrfaos.rowCount).toBe(0); // ✅ CRÍTICO
  });
});
```

---

### 4. SAVEPOINT para Laudos Duplicados

#### O Que Foi Corrigido

**Problema:** INSERT laudo duplicado abortava transação inteira, impedindo criação de avaliações.

**Solução:** Usar SAVEPOINT para isolar erro do laudo.

```typescript
// ANTES (ON CONFLICT não funcionava dentro de transação)
try {
  await client.query(`INSERT INTO laudos ... ON CONFLICT DO NOTHING`);
} catch (err) {
  console.warn(err); // ❌ Transação já abortada!
}

// DEPOIS (SAVEPOINT isola o erro)
try {
  await client.query('SAVEPOINT laudo_reserva');
  await client.query(`INSERT INTO laudos ...`);
  await client.query('RELEASE SAVEPOINT laudo_reserva');
} catch (err) {
  await client.query('ROLLBACK TO SAVEPOINT laudo_reserva'); // ✅ Rollback apenas do savepoint
}
```

#### Testes Existentes

- ❌ **Nenhum teste valida SAVEPOINT**
- ❌ **Nenhum teste valida isolamento de erro**
- ❌ **Nenhum teste valida continuação da transação após erro em SAVEPOINT**

#### Testes Necessários

##### 🔴 CRÍTICO: Teste de SAVEPOINT (Integração)

```typescript
// __tests__/integration/savepoint-laudo-duplicate.test.ts

describe('SAVEPOINT: Laudo Duplicado', () => {
  it('deve continuar transação após erro de laudo duplicado', async () => {
    // 1. Pré-criar laudo com ID específico
    const laudoId = 9999;
    await query(
      `INSERT INTO laudos (id, lote_id, status) VALUES ($1, $1, 'emitido')`,
      [laudoId]
    );

    // 2. Tentar criar lote com mesmo ID (trigger + SAVEPOINT deve isolar erro)
    await withTransactionAsGestor(async (client) => {
      // Criar lote (trigger tenta criar laudo com ID 9999)
      const loteResult = await client.query(
        `INSERT INTO lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, $3, 'Teste SAVEPOINT', 'completo', 'ativo', $4, 1)
         RETURNING id`,
        [laudoId, clinicaId, empresaId, cpf]
      );

      // ✅ Lote criado com sucesso (trigger usou SAVEPOINT)
      expect(loteResult.rowCount).toBe(1);

      // 3. Criar avaliação (deve funcionar mesmo com erro de laudo)
      await client.query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, 'iniciada', NOW())`,
        ['12345678900', laudoId]
      );

      // 4. Verificar avaliação foi criada
      const avaliacaoResult = await client.query(
        `SELECT id FROM avaliacoes WHERE lote_id = $1`,
        [laudoId]
      );
      expect(avaliacaoResult.rowCount).toBe(1); // ✅ CRÍTICO
    });
  });

  it('deve criar avaliações mesmo se reserva de laudo falhar', async () => {
    // Simular cenário real: laudo ID já existe
    const existingLaudoId = 8888;
    await query(
      `INSERT INTO laudos (id, lote_id, status) VALUES ($1, $1, 'rascunho')`,
      [existingLaudoId]
    );

    // Criar lote via route RH
    const req = new NextRequest('http://localhost/api/rh/liberar-lote', {
      method: 'POST',
      body: JSON.stringify({
        empresaId: empresaId,
        tipo: 'completo',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    // ✅ Lote criado com sucesso
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // ✅ Avaliações criadas MESMO com erro de laudo
    expect(data.avaliacoes_criadas).toBeGreaterThan(0);

    // Verificar no banco
    const avaliacoes = await query(
      `SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id = $1`,
      [data.loteId]
    );
    expect(avaliacoes.rows[0].total).toBe(data.avaliacoes_criadas);
  });
});
```

---

## 📈 Matriz de Cobertura de Testes

| Correção               | Tipo de Teste                 | Prioridade | Status Atual  | Teste Proposto                                        |
| ---------------------- | ----------------------------- | ---------- | ------------- | ----------------------------------------------------- |
| **Migração 1004**      | Unitário (Trigger)            | 🔴 CRÍTICO | ❌ Não existe | `reservar-laudo-on-lote.test.ts`                      |
| **Migração 1004**      | Integração (E2E)              | 🟡 MÉDIO   | ❌ Não existe | Incluir em `liberar-lote-atomicity.test.ts`           |
| **Contexto Auditoria** | Integração                    | 🔴 CRÍTICO | ⚠️ Parcial    | `transaction-audit-context.test.ts`                   |
| **Contexto Auditoria** | Unitário (lib/db-transaction) | 🟡 MÉDIO   | ❌ Não existe | `db-transaction.test.ts`                              |
| **Lotes Órfãos**       | Integração                    | 🔴 CRÍTICO | ⚠️ `.skip`    | Habilitar + expandir `liberar-lote-atomicity.test.ts` |
| **Lotes Órfãos**       | Visual/Smoke                  | 🟢 BAIXO   | ❌ Não existe | Script de verificação periódica                       |
| **SAVEPOINT**          | Integração                    | 🔴 CRÍTICO | ❌ Não existe | `savepoint-laudo-duplicate.test.ts`                   |
| **SAVEPOINT**          | Unitário (PostgreSQL)         | 🟡 MÉDIO   | ❌ Não existe | `savepoint-isolation.test.ts`                         |

**Legenda:**

- 🔴 **CRÍTICO:** Teste ausente para funcionalidade que já causou bug em PROD
- 🟡 **MÉDIO:** Teste desejável mas não bloqueia deploy
- 🟢 **BAIXO:** Nice-to-have

---

## 🎯 Plano de Ação Recomendado

### Fase 1 - CRÍTICO (Antes do Próximo Deploy)

**Prazo:** 2-3 dias

1. **Criar `__tests__/integration/liberar-lote-atomicity.test.ts`**
   - Validar lote + avaliações em transação
   - Validar rollback se avaliações falharem
   - Validar ausência de lotes órfãos

2. **Criar `__tests__/integration/savepoint-laudo-duplicate.test.ts`**
   - Validar isolamento de erro de laudo
   - Validar continuação da transação
   - Validar criação de avaliações após erro de laudo

3. **Criar `__tests__/integration/transaction-audit-context.test.ts`**
   - Validar contexto `app.current_user_cpf` durante transação
   - Validar contexto após erro isolado (SAVEPOINT)
   - Validar audit_logs preenchidos corretamente

4. **Habilitar e corrigir `liberar-lote-rh-resilience.test.ts`**
   - Remover `.skip`
   - Adaptar para nova arquitetura com transações
   - Adicionar casos de SAVEPOINT

### Fase 2 - IMPORTANTE (Próxima Sprint)

**Prazo:** 1 semana

5. **Criar `__tests__/database/triggers/reservar-laudo-on-lote.test.ts`**
   - Validar trigger cria laudo com status='rascunho'
   - Validar ON CONFLICT não quebra transação
   - Validar laudo.id === lote.id

6. **Criar `__tests__/lib/db-transaction.test.ts`**
   - Validar `withTransaction` básico
   - Validar `withTransactionAsGestor` com perfil
   - Validar SET LOCAL de variáveis de auditoria

7. **Criar `__tests__/integration/migration-1004-validation.test.ts`**
   - Validar função `fn_reservar_id_laudo_on_lote_insert`
   - Validar status='rascunho' em laudos automáticos
   - Validar comportamento em DEV vs PROD

### Fase 3 - MELHORIA CONTÍNUA

**Prazo:** Backlog

8. **Script de verificação de lotes órfãos** (já existe: `check-lotes-orfaos-prod.cjs`)
   - Automatizar execução via cron/GitHub Actions
   - Alertar Slack/Email se órfãos detectados
   - Dashboard de métricas

9. **Smoke tests de produção**
   - POST /api/rh/liberar-lote (com rollback)
   - POST /api/entidade/liberar-lote (com rollback)
   - Executar após cada deploy

10. **Testes de carga/concorrência**
    - Múltiplos lotes simultâneos
    - Validar fn_next_lote_id() não gera duplicatas
    - Validar transações não se bloqueiam

---

## 🚨 Riscos de Não Implementar Testes

### Cenários de Falha Não Cobertos

#### 1. Laudo Duplicado em Produção

**Sem teste:** Deploy de código que adiciona lógica de criação de laudo manual.
**Resultado:** Laudo duplicado → Transação abortada → Lote órfão → **PROD quebrada**.
**Impacto:** Clientes não conseguem criar lotes. Dados inconsistentes.

#### 2. Contexto de Auditoria Perdido

**Sem teste:** Refatoração de `withTransactionAsGestor` que remove SET LOCAL.
**Resultado:** Trigger `audit_trigger_func` falha com "app.current_user_cpf not set".
**Impacto:** Nenhuma avaliação criada. Auditoria corrompida. **Não-conformidade legal**.

#### 3. Rollback Não Funciona

**Sem teste:** Mudança no fluxo que remove throw Error ao final da transação.
**Resultado:** Lote criado MESMO sem avaliações.
**Impacto:** **Lotes órfãos voltam a aparecer em PROD**. Dados inconsistentes.

#### 4. Migração 1004 Não Aplicada em Outro Ambiente

**Sem teste:** Deploy em staging sem aplicar Migração 1004.
**Resultado:** Laudos criados SEM status='rascunho' → Queries quebram.
**Impacto:** Staging quebrado. Delay em deploy para PROD.

---

## 📊 Métricas de Sucesso

### KPIs de Testes

- ✅ **Cobertura de Transações:** 0% → 80% (target)
- ✅ **Cobertura de SAVEPOINT:** 0% → 100% (target)
- ✅ **Cobertura de Contexto Auditoria:** 30% → 90% (target)
- ✅ **Testes de Integração Ativos:** 1 (`.skip`) → 5+ habilitados

### KPIs de Qualidade

- ✅ **Lotes Órfãos em PROD:** Reduzir de 2-3/dia → 0
- ✅ **Erros de Auditoria:** Reduzir de 5-10/semana → 0
- ✅ **Rollbacks de Deploy:** Reduzir de 1-2/mês → 0

---

## 🛠️ Ferramentas e Configuração

### Executar Testes Localmente

```bash
# Todos os testes
pnpm test

# Apenas integração
pnpm test:integration

# Apenas testes de transação (quando criados)
pnpm test __tests__/integration/liberar-lote-atomicity.test.ts
pnpm test __tests__/integration/savepoint-laudo-duplicate.test.ts
pnpm test __tests__/integration/transaction-audit-context.test.ts
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/tests.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    env:
      TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:integration
      - run: pnpm test __tests__/integration/liberar-lote-atomicity.test.ts
      - run: pnpm test __tests__/integration/savepoint-laudo-duplicate.test.ts
```

### Verificação de Saúde em PROD

```bash
# Executar após cada deploy
node scripts/check-lotes-orfaos-prod.cjs
node scripts/check-elegibilidade-prod.cjs

# Automatizar via cron (diário)
0 8 * * * cd /apps/QWork && node scripts/check-lotes-orfaos-prod.cjs | mail -s "Lotes Órfãos PROD" devops@empresa.com
```

---

## ✅ Checklist de Implementação

### Fase 1 - CRÍTICO

- [ ] Criar `liberar-lote-atomicity.test.ts` (3 testes)
- [ ] Criar `savepoint-laudo-duplicate.test.ts` (2 testes)
- [ ] Criar `transaction-audit-context.test.ts` (2 testes)
- [ ] Habilitar `liberar-lote-rh-resilience.test.ts` (remover `.skip`)
- [ ] Executar todos os testes localmente (DEV)
- [ ] Configurar TEST_DATABASE_URL em CI/CD
- [ ] Configurar GitHub Actions para rodar testes em PRs

### Fase 2 - IMPORTANTE

- [ ] Criar `reservar-laudo-on-lote.test.ts` (2 testes)
- [ ] Criar `db-transaction.test.ts` (3 testes)
- [ ] Criar `migration-1004-validation.test.ts` (2 testes)
- [ ] Documentar processo de execução de testes
- [ ] Adicionar cobertura de código (Istanbul/NYC)

### Fase 3 - MELHORIA CONTÍNUA

- [ ] Automatizar `check-lotes-orfaos-prod.cjs` via cron
- [ ] Criar smoke tests de produção
- [ ] Implementar testes de carga/concorrência
- [ ] Dashboard de métricas de testes

---

## 📚 Referências

### Arquivos Relacionados

- [CORRECAO_CONTEXTO_AUDITORIA_RH_2026-02-09.md](CORRECAO_CONTEXTO_AUDITORIA_RH_2026-02-09.md)
- [CORRECAO_LOTES_ORFAOS_2026-02-10.md](CORRECAO_LOTES_ORFAOS_2026-02-10.md)
- [RELATORIO_FINAL_MIGRACAO_1004_PROD.md](RELATORIO_FINAL_MIGRACAO_1004_PROD.md)

### Scripts de Verificação

- [scripts/check-lotes-orfaos-prod.cjs](scripts/check-lotes-orfaos-prod.cjs)
- [scripts/check-elegibilidade-prod.cjs](scripts/check-elegibilidade-prod.cjs)

### Testes Existentes

- `__tests__/integration/liberar-lote-rh.integration.test.ts`
- `__tests__/integration/liberar-lote-rh-resilience.test.ts` (❌ `.skip`)
- `__tests__/api/entidade/liberar-lote.test.ts`
- `__tests__/security/audit-logs.test.ts`

---

**Conclusão:** As correções implementadas são **críticas** mas **não têm cobertura de testes adequada**. Recomenda-se **priorizar Fase 1** antes do próximo deploy para evitar regressões e garantir estabilidade em PROD.

**Autor:** GitHub Copilot  
**Revisado:** QWork Team  
**Data:** 10/02/2026
