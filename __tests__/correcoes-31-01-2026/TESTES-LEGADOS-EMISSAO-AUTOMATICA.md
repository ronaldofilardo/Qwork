# TESTES LEGADOS - EMISSÃO AUTOMÁTICA

**Data:** 31/01/2026  
**Status:** Marcados como obsoletos - NÃO atualizar

## ⚠️ ATENÇÃO

Os testes listados abaixo testam funcionalidades **DESCONTINUADAS** do sistema de emissão automática. Eles foram mantidos apenas para histórico e documentação.

**NÃO DEVEM SER ATUALIZADOS** - o sistema agora funciona com emissão 100% MANUAL.

---

## 📋 TESTES QUE USAM COLUNAS REMOVIDAS

### 1. `__tests__/integration/lote-fluxo-completo.test.ts`

**Colunas usadas:**

- `auto_emitir_em`
- `auto_emitir_agendado`

**Linhas:** 313, 322, 329, 330, 351, 355, 368, 369

**Código:**

```typescript
// Linha 313
SET status = $1, auto_emitir_em = NOW() + INTERVAL '10 minutes', auto_emitir_agendado = true

// Linha 322
SELECT status, auto_emitir_agendado, auto_emitir_em

// Linhas 329-330
expect(statusFinal.rows[0].auto_emitir_agendado).toBe(true);
expect(statusFinal.rows[0].auto_emitir_em).toBeTruthy();

// Linha 355
SET auto_emitir_em = NOW() - INTERVAL '1 minute'

// Linhas 368-369
AND auto_emitir_em <= NOW()
AND auto_emitir_agendado = true
```

**Ação:** Marcar teste como `.skip` ou remover completamente

---

### 2. `__tests__/integration/lote-encerramento-com-inativadas.test.ts`

**Colunas usadas:**

- `auto_emitir_agendado`

**Linhas:** 183, 283

**Código:**

```typescript
// Linha 183
call[0].includes('auto_emitir_agendado');

// Linha 283
call[0].includes('auto_emitir_agendado = true');
```

**Ação:** Remover assertions que checam `auto_emitir_agendado`

---

### 3. `__tests__/integration/auto-conclusao-emissao.test.ts`

**Colunas usadas:**

- `auto_emitir_agendado`

**Linhas:** 132, 141, 153, 154

**Código:**

```typescript
// Linhas 132, 141
lote: { status: 'ativo', auto_emitir_agendado: false }

// Linhas 153-154
expect(antes.lote.auto_emitir_agendado).toBe(false);
expect(depois.lote.auto_emitir_agendado).toBe(false);
```

**Ação:** Remover teste ou substituir por teste de emissão manual

---

### 4. `__tests__/entidade/entidade-fluxo-laudo-e2e.test.ts`

**Colunas usadas:**

- `auto_emitir_agendado`
- `auto_emitir_em`

**Linhas:** 191, 197, 201, 407, 416

**Código:**

```typescript
// Linha 191
UPDATE lotes_avaliacao SET status = 'concluido', auto_emitir_agendado = true, auto_emitir_em = NOW() + INTERVAL '5 seconds'

// Linha 197
SELECT status, auto_emitir_agendado FROM lotes_avaliacao WHERE id = $1

// Linha 201
expect(check.rows[0].auto_emitir_agendado).toBe(true);

// Linha 407
auto_emitir_agendado

// Linha 416
auto_emitir_agendado: true
```

**Ação:** Atualizar para testar fluxo manual de solicitação de emissão

---

### 5. `__tests__/corrections/correcoes-criticas-implementadas.test.ts`

**Colunas usadas:**

- `auto_emitir_agendado`
- `auto_emitir_em`

**Linhas:** 47, 59, 90, 91, 149

**Código:**

```typescript
// Linhas 47, 59, 149
auto_emitir_agendado, auto_emitir_em

// Linhas 90-91
AND la.auto_emitir_em <= NOW()
AND la.auto_emitir_agendado = true
```

**Ação:** Remover teste ou marcar como `.skip`

---

### 6. `__tests__/emissor/dashboard-novas-funcionalidades.test.tsx`

**Colunas usadas:**

- `processamento_em`

**Linhas:** 83, 126, 170, 217, 266, 304, 349, 397, 441, 479

**Código:**

```typescript
processamento_em: '2024-01-04T14:30:00Z'; // ou null
```

**Ação:** Remover campo `processamento_em` dos mocks

---

### 7. `__tests__/lib/pdf-emergencia-marcacao.test.ts`

**Colunas usadas:**

- `processamento_em`

**Linhas:** 200, 204, 210, 214, 215, 271

**Código:**

```typescript
// Linha 200
it('deve registrar timestamp de modo emergência via processamento_em', async () => {

// Linha 204
SET processamento_em = NOW()

// Linhas 210, 214, 215
SELECT processamento_em FROM lotes_avaliacao WHERE id = $1
expect(lote.rows[0].processamento_em).not.toBeNull();
expect(new Date(lote.rows[0].processamento_em as string)).toBeInstanceOf(Date);

// Linha 271
la.processamento_em
```

**Ação:** Remover teste ou substituir por outro campo de controle

---

### 8. `__tests__/database/rls_policies_processamento_em.test.ts`

**Arquivo completo testa RLS com `processamento_em`**

**Ação:** Remover arquivo completamente

---

### 9. `__tests__/lotes/recalcular-advisory-locks-and-fila.test.ts`

**Colunas usadas:**

- `processamento_em`

**Linha 43:**

```typescript
UPDATE lotes_avaliacao SET status = 'ativo', emitido_em = NULL, processamento_em = NULL WHERE id = $1
```

**Ação:** Remover referência a `processamento_em`

---

## 🔧 AÇÕES RECOMENDADAS

### Opção 1: Remover Completamente

```bash
# Remover testes legados
rm __tests__/integration/lote-fluxo-completo.test.ts
rm __tests__/integration/auto-conclusao-emissao.test.ts
rm __tests__/corrections/correcoes-criticas-implementadas.test.ts
rm __tests__/database/rls_policies_processamento_em.test.ts
```

### Opção 2: Marcar como Skip

```typescript
// Em cada arquivo, alterar:
describe('Nome do teste', () => {
  // para:
describe.skip('Nome do teste [LEGADO - EMISSÃO AUTO REMOVIDA]', () => {
```

### Opção 3: Atualizar para Fluxo Manual

Reescrever os testes para validar o novo fluxo:

1. RH/Entidade solicita emissão
2. Emissor vê no dashboard
3. Emissor emite manualmente

---

## 📝 SCRIPTS QUE USAM COLUNAS LEGADAS

### `scripts/setup/corrigir-rls-admin-legado.sql`

**Linhas 27, 32:**

```sql
SELECT processamento_em IS NULL FROM public.lotes_avaliacao l WHERE l.id = avaliacoes.lote_id
```

**Ação:** Atualizar RLS policies para remover checagem de `processamento_em`

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Migration 130 criada e pronta para executar
2. ⚠️ Executar migration no banco de desenvolvimento
3. ⚠️ Executar migration no banco de produção
4. ⚠️ Remover/marcar testes legados
5. ⚠️ Atualizar scripts de RLS
6. ⚠️ Validar que sistema funciona sem as colunas
7. ✅ Commit e deploy

---

## 🚨 IMPORTANTE

Após executar a migration 130:

- **NÃO** será possível recuperar os dados das colunas removidas
- Testes legados **FALHARÃO** com erro "column does not exist"
- Sistema de emissão automática estará **PERMANENTEMENTE** desabilitado

**Certifique-se de que todos concordam com a remoção antes de executar!**
