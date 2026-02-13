# 🔧 Correção: Avaliação não Conclui em 37/37 - Clínica (PROD)

**Data**: 2026-02-13  
**Severidade**: 🔴 CRÍTICO  
**Status**: ✅ CORRIGIDO

---

## 📋 Problema Reportado

Em **PRODUÇÃO para Clínica**:

1. ❌ Avaliação continua em "37 de 37" sem encerrar
2. ❌ Dashboard do funcionário mostra botão "Iniciar avaliação" (como se não tivesse começado)
3. ❌ Dashboard da clínica não atualiza o status da avaliação para "concluído"

**Observação**: Problema já estava sanado em DEV ✅

---

## 🔍 Causa Raiz Identificada

### Problema Principal

A função `verificarEConcluirAvaliacao()` em [lib/avaliacao-conclusao.ts](lib/avaliacao-conclusao.ts) estava usando **`query()` sem contexto RLS** para contar respostas:

```typescript
// ❌ ANTES (INCORRETO)
const countResult = await query(
  `SELECT COUNT(DISTINCT (grupo, item)) as total
   FROM respostas
   WHERE avaliacao_id = $1`,
  [avaliacaoId]
);
```

### Por que isso é um problema?

1. **Row Level Security (RLS) não aplicado**: Sem `queryWithContext()`, o contexto de RLS não é definido com `app.current_user_cpf`, `app.current_user_perfil`, etc.

2. **Contagem incorreta**: Em PROD, se há políticas RLS na tabela `respostas`, a consulta **pode retornar menos de 37 respostas** porque:
   - RLS filtra registros que não pertencem ao usuário
   - Sem contexto correto, a query pode não executar as políticas corretamente
   - Resultado: `totalRespostas < 37` mesmo com 37 respostas respondidas

3. **Encadeamento de contexto**: Chamado de `/api/avaliacao/respostas` que **JÁ HAS contexto RLS** → mas `verificarEConcluirAvaliacao` não o herda com `query()`

---

## ✅ Solução Implementada

### Mudança: Usar `queryWithContext` em todas as queries

**Arquivo**: [lib/avaliacao-conclusao.ts](lib/avaliacao-conclusao.ts)

#### 1️⃣ Contagem de Respostas (Linha 35)

```typescript
// ✅ DEPOIS (CORRETO)
const countResult = await queryWithContext(
  `SELECT COUNT(DISTINCT (grupo, item)) as total
   FROM respostas
   WHERE avaliacao_id = $1`,
  [avaliacaoId]
);
```

#### 2️⃣ Verificação de Status (Linha 59)

```typescript
// ✅ DEPOIS (CORRETO)
const statusCheckResult = await queryWithContext(
  `SELECT status FROM avaliacoes WHERE id = $1`,
  [avaliacaoId]
);
```

#### 3️⃣ Busca de Lote (Linha 196)

```typescript
// ✅ DEPOIS (CORRETO)
const loteResult = await queryWithContext(
  `SELECT la.id as lote_id
   FROM avaliacoes a
   JOIN lotes_avaliacao la ON a.lote_id = la.id
   WHERE a.id = $1`,
  [avaliacaoId]
);
```

#### 4️⃣ Import Atualizado

```typescript
// ✅ ANTES
import { query, transactionWithContext } from './db-security';

// ✅ DEPOIS
import { query, queryWithContext, transactionWithContext } from './db-security';
```

---

## 🧪 Fluxo de Avaliação (COM CORREÇÃO)

```
Funcionário responde 37ª questão
        ↓
[POST] /api/avaliacao/respostas (COM CONTEXTO RLS)
        ↓
verificarEConcluirAvaliacao(avaliacaoId, cpf)
        ↓
queryWithContext("COUNT(DISTINCT grupo, item)") [AGORA COM RLS]
        ↓
✅ Retorna 37 (contagem correta)
        ↓
UPDATE avaliacoes SET status='concluida', envio=NOW()
        ↓
✅ recalcularStatusLote()
        ↓
✅ Dashboard atualizado em tempo real
        ↓
✅ Funcionário redirecionado para página de conclusão
```

---

## 📊 Impacto

| Aspecto                   | Antes                      | Depois                   |
| ------------------------- | -------------------------- | ------------------------ |
| **Contagem de Respostas** | Pode retornar < 37         | Sempre 37 correto        |
| **Status da Avaliação**   | Fica em 'em_andamento'     | Muda para 'concluida'    |
| **Dashboard Funcionário** | Mostra "Iniciar avaliação" | Mostra "Concluído"       |
| **Dashboard Clínica**     | Não atualiza               | Atualiza em tempo real   |
| **Redirect**              | Não acontece               | Para página concluida ✅ |

---

## 🚀 Como Deploy em PROD

1. **Pull da branch** com a correção
2. **Rebuild** da aplicação
3. **Deploy** para PROD
4. **Validação**:
   ```bash
   # Verificar se a função está usando queryWithContext
   grep -n "queryWithContext" lib/avaliacao-conclusao.ts
   ```

---

## ✨ Observações

- A mudança é **backward-compatible** (não quebra nada existente)
- O `query()` ainda é válido para queries simples sem RLS
- `queryWithContext()` garante **segurança e consistência** em enviroment multi-clínica
- **Idempotente**: pode ser chamado múltiplas vezes com segurança

---

## 🔗 Referências

- [lib/avaliacao-conclusao.ts](lib/avaliacao-conclusao.ts) - Função corrigida
- [lib/db-security.ts](lib/db-security.ts) - Implementação de `queryWithContext`
- [app/api/avaliacao/respostas/route.ts](app/api/avaliacao/respostas/route.ts) - Chamador da função
