# 🔧 Correção: Contexto de Auditoria Perdido no RH liberar-lote

**Data:** 09/02/2026  
**Arquivo:** `app/api/rh/liberar-lote/route.ts`  
**Status:** ✅ Corrigido

---

## 🚨 Problema Identificado

### Erro em Produção

```
NeonDbError: Laudo with id 1003 already exists
    at /var/task/node_modules/@neondatabase/serverless/index.js:3023:19
    ...
    at trg_enforce_laudo_id_equals_lote (trigger function)

Error: SECURITY: app.current_user_cpf not set. Cannot determine user for audit.
    at current_user_cpf() (PostgreSQL function)
    at audit_trigger_func() (trigger on avaliacoes)
```

### Fluxo do Erro

1. **Lote criado com sucesso** → `lote_id: 1003`
2. **Reserva do laudo falha** → `INSERT INTO laudos (id=1003)` → Trigger detecta duplicata → RAISE exception
3. **Contexto de auditoria perdido** → `app.current_user_cpf` não está mais definido
4. **INSERT avaliacoes falha** → `audit_trigger_func` tenta chamar `current_user_cpf()` → Erro de segurança

### Causa Raiz

O código tinha este comentário:

```typescript
// ✅ CORREÇÃO: Remover transação explícita para evitar rollback completo
// em caso de erro na reserva do laudo
// Cada query roda em autocommit (como no fluxo Entidade),
// tornando o sistema mais resiliente
```

**Análise:** Esta "correção" anterior estava ERRADA. Remover a transação causou:

- ❌ Perda do contexto `app.current_user_cpf` após erros
- ❌ Queries rodando em sessões separadas sem estado compartilhado
- ❌ Violação dos requisitos de auditoria

**Comparação com Entidade:**

- ✅ Route entidade usa `queryAsGestorEntidade` consistentemente
- ✅ Mantém contexto de sessão mesmo sem transação explícita
- ✅ Não tem comentário sobre "remover transação"

---

## 🔍 Análise Técnica

### Contexto de Auditoria no PostgreSQL

#### Session-level Config (ERRADO para recuperação de erros)

```sql
-- lib/db-gestor.ts usa isso (terceiro parâmetro = true)
SELECT set_config('app.current_user_cpf', '12345678900', true);
```

- ✅ Persiste durante toda a sessão
- ❌ **Pode ser perdido após erros/exceções** dependendo do driver
- ❌ Não é isolado entre transações concorrentes

#### Transaction-level Config (CORRETO)

```sql
-- lib/db-transaction.ts usa isso (SET LOCAL)
BEGIN;
SET LOCAL app.current_user_cpf = '12345678900';
SET LOCAL app.current_user_perfil = 'rh';
-- ... queries ...
COMMIT;
```

- ✅ **Persiste durante toda a transação, mesmo após erros**
- ✅ Isolamento garantido (cada transação tem seu próprio estado)
- ✅ Rollback automático se qualquer query falhar

---

## ✅ Solução Implementada

### Mudanças no Código

#### 1. Import Adicionado

```typescript
import { withTransactionAsGestor } from '@/lib/db-transaction';
```

#### 2. Envolver Lógica em Transação

**ANTES:**

```typescript
// Queries individuais sem transação
const loteResult = await queryAsGestorRH(`INSERT INTO lotes_avaliacao ...`);
const lote = loteResult.rows[0];

try {
  await queryAsGestorRH(`INSERT INTO laudos ...`);
} catch (err) { ... }

for (const func of funcionarios) {
  await queryAsGestorRH(`INSERT INTO avaliacoes ...`);
}
```

**DEPOIS:**

```typescript
const resultado = await withTransactionAsGestor(async (client) => {
  // 1. Verificar liberado_por
  const liberadoPorCheck = await client.query(
    `SELECT 1 FROM entidades_senhas WHERE cpf = $1 LIMIT 1`,
    [user.cpf]
  );
  const liberadoPor = liberadoPorCheck.rowCount > 0 ? user.cpf : null;

  // 2. Criar lote
  const loteResult = await client.query(
    `INSERT INTO lotes_avaliacao (...) VALUES (...) RETURNING id, liberado_em, numero_ordem`,
    [clinica_id, empresa_id, descricao, tipo, 'ativo', liberadoPor, numeroOrdem]
  );
  const lote = loteResult.rows[0];

  // 3. Reservar laudo (ON CONFLICT já existia)
  try {
    await client.query(
      `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
       VALUES ($1, $1, 'rascunho', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [lote.id]
    );
  } catch (laudoReservaErr: any) {
    console.warn(`[WARN] Falha ao reservar laudo: ${laudoReservaErr.message}`);
  }

  // 4. Criar avaliações
  const agora = new Date().toISOString();
  let avaliacoesCriadas = 0;
  const detalhes = [];
  const errosDetalhados = [];
  const resumoInclusao = { novos: 0, atrasados: 0, ... };

  for (const func of funcionarios) {
    try {
      await client.query(
        `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id)
         VALUES ($1, 'iniciada', $2, $3)`,
        [func.funcionario_cpf, agora, lote.id]
      );
      avaliacoesCriadas++;
      // ... atualizar resumoInclusao e detalhes ...
    } catch (error) {
      errosDetalhados.push({ cpf: func.funcionario_cpf, erro: ... });
    }
  }

  // 5. Validar sucesso
  if (avaliacoesCriadas === 0) {
    throw new Error(`Nenhuma avaliação criada: ${errosDetalhados...}`);
  }

  return { lote, avaliacoesCriadas, detalhes, errosDetalhados, resumoInclusao };
});

// Usar resultado.lote, resultado.avaliacoesCriadas, etc.
```

#### 3. Retornar Resultado

```typescript
return NextResponse.json({
  success: true,
  loteId: resultado.lote.id,
  numero_ordem: resultado.lote.numero_ordem,
  liberado_em: resultado.lote.liberado_em,
  avaliacoes_criadas: resultado.avaliacoesCriadas,
  total_funcionarios: funcionarios.length,
  resumo_inclusao: resultado.resumoInclusao,
  detalhes: resultado.detalhes,
});
```

---

## 🎯 Benefícios da Correção

### 1. Contexto de Auditoria Mantido

- ✅ `SET LOCAL app.current_user_cpf` persiste durante toda a transação
- ✅ Mesmo se laudo falhar, avaliacoes são criadas com contexto correto
- ✅ Triggers de auditoria funcionam corretamente

### 2. Atomicidade

- ✅ Se qualquer avaliação falhar criticamente, **ROLLBACK automático**
- ✅ Lote só é criado se pelo menos uma avaliação for bem-sucedida
- ✅ Não ficam lotes órfãos sem avaliações

### 3. Isolamento

- ✅ Cada requisição tem sua própria transação com estado isolado
- ✅ Concorrência segura entre múltiplos RHs/gestores

### 4. Recuperação de Erros

- ✅ `ON CONFLICT DO NOTHING` no laudo evita exception
- ✅ `try-catch` interno ao withTransactionAsGestor permite log sem abortar
- ✅ Se `avaliacoesCriadas === 0`, throw Error → ROLLBACK de tudo

---

## 📊 Comparação: Antes vs Depois

| Aspecto                             | ANTES (sem transação)                       | DEPOIS (com withTransactionAsGestor)                   |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| **Contexto de auditoria após erro** | ❌ Perdido                                  | ✅ Mantido                                             |
| **Isolamento**                      | ❌ Session-level (compartilhado)            | ✅ Transaction-level (isolado)                         |
| **Atomicidade**                     | ❌ Lote criado mesmo se avaliacoes falharem | ✅ Rollback se nenhuma avaliação criada                |
| **Recuperação de erro no laudo**    | ❌ Perde contexto, próximas queries falham  | ✅ Contexto preservado, avaliacoes criadas normalmente |
| **Lotes órfãos**                    | ❌ Possível (lote sem avaliacoes)           | ✅ Impossível (rollback automático)                    |

---

## 🧪 Testes Recomendados

### 1. Teste de Laudo Duplicado

```bash
# Criar lote manualmente com id=2000
INSERT INTO lotes_avaliacao (id, clinica_id, empresa_id, ...)
VALUES (2000, 1, 10, ...);

# Criar laudo manualmente com id=2000
INSERT INTO laudos (id, lote_id, status)
VALUES (2000, 2000, 'emitido');

# Tentar criar novo lote (deve alocar id=2001, não 2000)
POST /api/rh/liberar-lote
{
  "empresaId": 10,
  "funcionarios": [{"cpf": "12345678900"}]
}

# ✅ Esperado: Lote criado com id=2001, avaliacoes inseridas corretamente
# ❌ ANTES: Lote criado, mas avaliacoes falhariam com "cpf not set"
```

### 2. Teste de Falha Total

```bash
# Desativar empresa temporariamente
UPDATE empresas SET ativa = false WHERE id = 10;

# Tentar criar lote
POST /api/rh/liberar-lote
{ "empresaId": 10, "funcionarios": [...] }

# ✅ Esperado: Erro 400 "Empresa não encontrada ou inativa"
# ✅ Banco: Nenhum registro criado (nem lote, nem avaliacoes)
```

### 3. Teste de Falha Parcial

```bash
# Inserir funcionário inválido (CPF não existe)
POST /api/rh/liberar-lote
{
  "empresaId": 10,
  "funcionarios": [
    {"cpf": "11111111111"},  # Válido
    {"cpf": "99999999999"}   # Inválido (não existe)
  ]
}

# ✅ Esperado:
# - Lote criado
# - Avaliacao para 11111111111 criada
# - Avaliacao para 99999999999 falha (registrado em errosDetalhados)
# - Response: { success: true, avaliacoes_criadas: 1, funcionarios_com_erro: [...] }
```

---

## 📝 Lições Aprendidas

### ❌ Anti-padrões Identificados

1. **"Remover transação para resiliência"** → Na verdade causa perda de contexto
2. **Confiar em session-level config** → Não sobrevive a erros
3. **Assumir que ON CONFLICT não lança exception** → Triggers podem lançar antes do CONFLICT

### ✅ Boas Práticas Validadas

1. **Use transações para operações multi-step** → Garante atomicidade e contexto
2. **SET LOCAL dentro de BEGIN/COMMIT** → Contexto isolado e persistente
3. **withTransactionAsGestor para gestores** → Valida perfil + mantém contexto

---

## 🔗 Arquivos Relacionados

- **Corrigido:** [app/api/rh/liberar-lote/route.ts](app/api/rh/liberar-lote/route.ts)
- **Baseline (funcionando):** [app/api/entidade/liberar-lote/route.ts](app/api/entidade/liberar-lote/route.ts)
- **Transação:** [lib/db-transaction.ts](lib/db-transaction.ts) - `withTransactionAsGestor`
- **Gestor:** [lib/db-gestor.ts](lib/db-gestor.ts) - `queryAsGestorRH`, `queryAsGestorEntidade`
- **Migração relacionada:** [RELATORIO_FINAL_MIGRACAO_1004_PROD.md](RELATORIO_FINAL_MIGRACAO_1004_PROD.md)

---

## ✅ Status

- [x] Problema diagnosticado
- [x] Solução implementada
- [x] Código compilando sem erros
- [ ] Testado em DEV
- [ ] Testado em PROD
- [ ] Laudo duplicado 1003 removido manualmente (se necessário)

---

## 🚀 Próximos Passos

1. **Deploy em DEV**

   ```bash
   git add app/api/rh/liberar-lote/route.ts
   git commit -m "fix: restaurar transação em RH liberar-lote para manter contexto de auditoria"
   git push origin main
   ```

2. **Validar em DEV**
   - Criar lote via /api/rh/liberar-lote
   - Verificar logs de auditoria (created_by_cpf preenchido)
   - Simular erro de laudo duplicado

3. **Deploy em PROD**
   - Após validação em DEV
   - Monitorar logs de produção

4. **Limpar laudo 1003 duplicado (se necessário)**

   ```sql
   -- Verificar laudos duplicados
   SELECT id, lote_id, status, criado_em
   FROM laudos
   WHERE id = 1003;

   -- Remover apenas se status = 'rascunho'
   DELETE FROM laudos
   WHERE id = 1003
     AND status = 'rascunho';
   ```

---

**Autor:** GitHub Copilot  
**Revisado:** QWork Team
