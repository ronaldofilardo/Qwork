# Correção: Status "Pendente" em Lotes Concluídos

**Data:** 03/02/2026  
**Commit:** `76aa0af`  
**Status:** ✅ Corrigido e testado

---

## 🐛 Problema Identificado

Os lotes que estavam **concluídos** no banco de dados (`status = 'concluido'`) apareciam como **"Pendente"** nos cards da interface, mesmo com:

- ✅ 100% das avaliações concluídas
- ✅ Botão "Solicitar Emissão do Laudo" habilitado
- ✅ Banco mostrando status correto

### Evidências do Problema

**Banco de dados (Neon):**

```sql
SELECT id, codigo, status FROM lotes_avaliacao
WHERE id IN (3, 4);

-- Resultado:
-- id | codigo      | status
-- 3  | 001-030226  | concluido  ✅
-- 4  | 002-030226  | concluido  ✅
```

**Interface (Card):**

```
Status relatório: Pendente ❌  (deveria ser "Pronto")
```

---

## 🔍 Causa Raiz

A API `/api/entidade/lotes` estava mapeando incorretamente o retorno da função SQL `validar_lote_pre_laudo`.

**Função SQL retorna:**

```typescript
{
  valido: true,           // ← Campo correto
  bloqueante: false,
  alertas: [...],
  detalhes: {...}
}
```

**API estava verificando:**

```typescript
pode_emitir_laudo: !!(
  validacao?.pode_emitir ?? // ❌ Campo inexistente
  validacao?.pode_emitir_laudo ?? // ❌ Campo inexistente
  false
);
```

Como ambos os campos não existiam, o fallback era `false`, fazendo com que **todos os lotes** aparecessem como "Pendente".

---

## ✅ Solução Aplicada

### 1. Corrigir mapeamento na API

**Arquivo:** `app/api/entidade/lotes/route.ts`

```typescript
pode_emitir_laudo: !!(
  validacao?.valido ??              // ✅ Campo correto (prioridade 1)
  validacao?.pode_emitir ??         // Fallback 1
  validacao?.pode_emitir_laudo ??   // Fallback 2
  false
),
```

### 2. Remover duplicação de código

**Arquivo:** `lib/templates/relatorio-individual-html.ts`

Removida função `escapeHtml` duplicada que estava causando erro de build:

```
the name `escapeHtml` is defined multiple times
```

---

## 🧪 Testes Realizados

### Script 1: Verificar status no banco

```bash
npx tsx scripts/debug-lotes-status.ts
```

**Resultado:**

```
✅ 10 lotes concluídos encontrados
✅ Todos com validacao.valido = true
✅ Status no card deveria ser: Pronto
```

### Script 2: Testar lógica da API

```bash
npx tsx scripts/test-api-lotes-status.ts
```

**Resultado:**

```
✅ pode_emitir_laudo: true
✅ Status no card: Pronto
✅ OK: Lote concluído será exibido como "Pronto"
```

### Build

```bash
pnpm run build
```

**Resultado:**

```
✓ Compiled successfully
```

---

## 📊 Comparação: Antes vs Depois

| Cenário                               | Antes                          | Depois                 |
| ------------------------------------- | ------------------------------ | ---------------------- |
| **Lote concluído (100%)**             | ❌ Pendente                    | ✅ Pronto              |
| **Lote concluído (50% + inativadas)** | ❌ Pendente                    | ✅ Pronto (com alerta) |
| **Lote ativo**                        | ⚠️ Pendente                    | ⚠️ Pendente            |
| **Build**                             | ❌ Erro (escapeHtml duplicado) | ✅ Sucesso             |

---

## 🎯 Impacto da Correção

✅ **Cards de lotes concluídos** agora exibem corretamente "Status relatório: Pronto"  
✅ **Botão "Solicitar Emissão"** alinhado com o status real  
✅ **API da entidade** alinhada com a API do RH (que já usava `valido` corretamente)  
✅ **Build** compila sem erros

---

## 📝 Notas Adicionais

- A API do RH (`/api/rh/lotes`) já estava usando o mapeamento correto (`resultado.valido`)
- A função SQL `validar_lote_pre_laudo` considera lotes com avaliações concluídas como válidos, mesmo que tenha inativações (desde que não sejam 100% inativadas)
- Alertas sobre alta taxa de inativação (>30%) continuam sendo exibidos como informativos

---

## 🔗 Arquivos Modificados

1. `app/api/entidade/lotes/route.ts` - Corrigir mapeamento `valido`
2. `lib/templates/relatorio-individual-html.ts` - Remover duplicação `escapeHtml`
3. `scripts/debug-lotes-status.ts` - Novo script diagnóstico
4. `scripts/test-api-lotes-status.ts` - Novo script de teste

---

✅ **Correção concluída e testada com sucesso!**
