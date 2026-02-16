# 🔍 ANÁLISE PROFUNDA: MÁQUINA DE ESTADOS DE LAUDOS

**Data:** 16/02/2026  
**Solicitação:** Análise completa do fluxo desde solicitação até upload ao bucket

---

## 🎯 ROOT CAUSE IDENTIFICADO

### ❌ Problema: CONTRADIÇÃO FATAL na Máquina de Estados

O sistema tem **2 fluxos conflitantes** para o status do laudo:

#### Fluxo 1: gerarLaudoCompletoEmitirPDF() (lib/laudo-auto.ts linha 176)

```typescript
// ETAPA 7: APENAS SALVAR HASH - NÃO marcar como 'emitido'
// ⚠️ IMPORTANTE: O laudo será marcado como 'emitido' SOMENTE quando for enviado ao bucket
UPDATE laudos
SET hash_pdf = $1, atualizado_em = NOW()
WHERE id = $2 AND status = 'rascunho'
```

**Resultado:** PDF gerado → Hash salvo → Status permanece **'rascunho'**

#### Fluxo 2: API Emissor endpoint `/api/emissor/lotes` (linha 105)

```typescript
const laudoEmitido =
  temLaudo &&
  (lote.status_laudo === 'emitido' || lote.status_laudo === 'enviado');
```

**Resultado:** Flag `_emitido` depende de **status='emitido'** ou 'enviado'

#### Fluxo 3: Filtro das Abas no Frontend (app/emissor/page.tsx linha 212)

```typescript
case 'laudo-para-emitir':
  return lote.status === 'concluido' && (!lote.laudo || !lote.laudo._emitido);
case 'laudo-emitido':
  return lote.status === 'concluido' && lote.laudo?._emitido;
```

**Resultado:** Aba depende de `_emitido` que depende de **status='emitido'**

### 💥 Contradição:

1. `gerarLaudoCompletoEmitirPDF()` gera PDF mas mantém status='rascunho'
2. API retorna `_emitido=FALSE` porque status não é 'emitido'
3. Frontend coloca lote na aba "Laudo para Emitir" com botão "Reprocessar"
4. **ESPERADO:** Lote deveria estar na aba "Laudo Emitido" com botão "Enviar ao Bucket"

---

## 📊 MÁQUINA DE ESTADOS ATUAL (QUEBRADA)

```
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO 1: SOLICITAÇÃO                                           │
├─────────────────────────────────────────────────────────────────┤
│ • RH/Entidade clica "Solicitar Laudo"                          │
│ • POST /api/lotes/[loteId]/solicitar-emissao                   │
│ • Cria registro em auditoria_laudos                            │
│ • Lote fica disponível no dashboard do emissor                 │
│                                                                  │
│ DB: laudos NÃO existe ainda                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO 2: GERAÇÃO DO LAUDO                                      │
├─────────────────────────────────────────────────────────────────┤
│ • Emissor clica "Iniciar Laudo"                                │
│ • POST /api/emissor/laudos/[loteId]                           │
│ • Chama gerarLaudoCompletoEmitirPDF()                         │
│                                                                  │
│ Passos internos:                                                │
│ 1. INSERT INTO laudos (status='rascunho') -- linha 75         │
│ 2. Gerar HTML do laudo                                          │
│ 3. Gerar PDF com Puppeteer                                      │
│ 4. Salvar storage/laudos/laudo-{id}.pdf                       │
│ 5. Calcular hash SHA-256 do PDF                                │
│ 6. UPDATE laudos SET hash_pdf=xxx WHERE status='rascunho'     │
│ 7. ❌ Status PERMANECE 'rascunho' (LINHA 176)                  │
│ 8. Salvar laudo-{id}.json com metadata                        │
│                                                                  │
│ DB FINAL:                                                        │
│ • status = 'rascunho' ❌                                        │
│ • hash_pdf = 'd1463...' ✅                                     │
│ • emitido_em = NULL ❌                                          │
│ • arquivo_remoto_url = NULL ✅                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO 3: BACKEND API /api/emissor/lotes                       │
├─────────────────────────────────────────────────────────────────┤
│ Cálculo do flag _emitido (linha 105):                          │
│                                                                  │
│ const laudoEmitido = temLaudo &&                                │
│   (lote.status_laudo === 'emitido' ||                          │
│    lote.status_laudo === 'enviado');                           │
│                                                                  │
│ Resultado para lote 19/20:                                      │
│ • temLaudo = TRUE ✅                                           │
│ • status_laudo = 'rascunho' ❌                                 │
│ • laudoEmitido = FALSE ❌❌❌                                   │
│                                                                  │
│ Response JSON:                                                   │
│ {                                                                │
│   "laudo": {                                                     │
│     "_emitido": false  ← AQUI ESTÁ O PROBLEMA!                 │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO 4: FRONTEND - FILTRO DAS ABAS (linha 212)               │
├─────────────────────────────────────────────────────────────────┤
│ case 'laudo-para-emitir':                                       │
│   return lote.status === 'concluido' &&                         │
│          (!lote.laudo || !lote.laudo._emitido);                │
│                                                                  │
│ Avaliação para lotes 19/20:                                     │
│ • lote.status = 'concluido' ✅                                 │
│ • lote.laudo existe ✅                                         │
│ • lote.laudo._emitido = FALSE ❌                               │
│ • Resultado: TRUE → Lote NA ABA ERRADA! ❌                     │
│                                                                  │
│ case 'laudo-emitido':                                           │
│   return lote.status === 'concluido' &&                         │
│          lote.laudo?._emitido;                                 │
│                                                                  │
│ Avaliação para lotes 19/20:                                     │
│ • lote.laudo._emitido = FALSE ❌                               │
│ • Resultado: FALSE → Lote NÃO aparece nesta aba ❌             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ESTADO 5: RENDERIZAÇÃO DOS BOTÕES (linha 837)                  │
├─────────────────────────────────────────────────────────────────┤
│ {lote.laudo && lote.laudo._emitido && (                        │
│   <UploadLaudoButton ... />  ← Botão "Enviar ao Bucket"       │
│ )}                                                               │
│                                                                  │
│ {lote.status === 'concluido' &&                                │
│  (!lote.laudo || !lote.laudo._emitido) && (                   │
│   <button>Reprocessar</button>  ← Botão errado aparece!       │
│ )}                                                               │
│                                                                  │
│ Resultado para lotes 19/20:                                     │
│ • _emitido = FALSE ❌                                          │
│ • Botão "Enviar ao Bucket" NÃO aparece ❌                      │
│ • Botão "Reprocessar" aparece ❌ (errado!)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ MÁQUINA DE ESTADOS CORRETA (ESPERADA)

```
ESTADO 2 (CORRETO):
┌─────────────────────────────────────────────────────────────────┐
│ gerarLaudoCompletoEmitirPDF() DEVE FAZER:                      │
│                                                                  │
│ 6. UPDATE laudos SET                                            │
│      hash_pdf = xxx,                                            │
│      status = 'emitido',      ← ADICIONAR ISTO!               │
│      emitido_em = NOW(),      ← ADICIONAR ISTO!               │
│      atualizado_em = NOW()                                      │
│    WHERE id = $2 AND status = 'rascunho'                       │
│                                                                  │
│ DB FINAL:                                                        │
│ • status = 'emitido' ✅✅✅                                     │
│ • hash_pdf = 'd1463...' ✅                                     │
│ • emitido_em = NOW() ✅✅✅                                     │
│ • arquivo_remoto_url = NULL ✅                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
ESTADO 3 (CORRETO):
┌─────────────────────────────────────────────────────────────────┐
│ const laudoEmitido = temLaudo &&                                │
│   (lote.status_laudo === 'emitido' ||                          │
│    lote.status_laudo === 'enviado');                           │
│                                                                  │
│ Resultado:                                                       │
│ • status_laudo = 'emitido' ✅                                  │
│ • laudoEmitido = TRUE ✅✅✅                                    │
│                                                                  │
│ Response JSON:                                                   │
│ {                                                                │
│   "laudo": {                                                     │
│     "_emitido": true  ← CORRETO!                               │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
ESTADO 4 (CORRETO):
┌─────────────────────────────────────────────────────────────────┐
│ case 'laudo-emitido':                                           │
│   return lote.laudo?._emitido;                                 │
│                                                                  │
│ • _emitido = TRUE ✅                                           │
│ • Lote aparece na aba "Laudo Emitido" ✅✅✅                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
ESTADO 5 (CORRETO):
┌─────────────────────────────────────────────────────────────────┐
│ {lote.laudo && lote.laudo._emitido && (                        │
│   <UploadLaudoButton />  ← Botão "Enviar ao Bucket" APARECE!  │
│ )}                                                               │
│                                                                  │
│ Resultado:                                                       │
│ • Botão verde "Enviar ao Bucket" aparece ✅✅✅                │
│ • Botão "Reprocessar" NÃO aparece ✅                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. lib/laudo-auto.ts (linhas 176-189)

**ATUAL (ERRADO):**

```typescript
// ETAPA 7: APENAS SALVAR HASH - NÃO marcar como 'emitido'
const updateResult = await query(
  `UPDATE laudos 
   SET hash_pdf = $1,
       atualizado_em = NOW()
   WHERE id = $2 AND status = 'rascunho'
   RETURNING id`,
  [hashReal, laudoId]
);
```

**CORRIGIDO:**

```typescript
// ETAPA 7: Salvar hash E marcar como 'emitido'
// O laudo é considerado 'emitido' quando o PDF é gerado localmente
// O status só mudará para 'enviado' quando for feito o upload ao bucket
const updateResult = await query(
  `UPDATE laudos 
   SET hash_pdf = $1,
       status = 'emitido',
       emitido_em = NOW(),
       atualizado_em = NOW()
   WHERE id = $2 AND status = 'rascunho'
   RETURNING id`,
  [hashReal, laudoId]
);
```

### 2. app/api/emissor/laudos/[loteId]/pdf/route.ts (linhas 273-284)

**ATUAL (COM CONDIÇÃO CONFLITANTE):**

```typescript
const updateHash = await query(
  `UPDATE laudos 
   SET hash_pdf = $1
   WHERE id = $2 
     AND (hash_pdf IS NULL OR hash_pdf = '')
     AND status IN ('rascunho', 'aprovado')  ← PROBLEMA!
   RETURNING id, hash_pdf`,
  [hash, laudo.id]
);
```

**CORRIGIDO:**

```typescript
// Este endpoint é usado para download do PDF já gerado
// Não deve atualizar o hash, pois PDF já foi gerado e é imutável
// Remover lógica de UPDATE completamente OU permitir status='emitido'
const updateHash = await query(
  `UPDATE laudos 
   SET hash_pdf = $1
   WHERE id = $2 
     AND (hash_pdf IS NULL OR hash_pdf = '')
     AND status IN ('rascunho', 'aprovado', 'emitido')  ← ADICIONAR 'emitido'
   RETURNING id, hash_pdf`,
  [hash, laudo.id]
);
```

### 3. Banco de Dados - Correção Manual para Lotes 19, 20

**SQL:**

```sql
UPDATE laudos
SET
  status = 'emitido',
  emitido_em = NOW(),
  atualizado_em = NOW()
WHERE
  lote_id IN (19, 20)
  AND status = 'rascunho'
  AND hash_pdf IS NOT NULL;
```

---

## 📋 ESTADOS FINAIS CORRETOS

| Estado       | status     | hash_pdf | emitido_em   | arquivo_remoto_url | Significado                                        |
| ------------ | ---------- | -------- | ------------ | ------------------ | -------------------------------------------------- |
| **Rascunho** | 'rascunho' | NULL     | NULL         | NULL               | Laudo criado mas PDF não gerado                    |
| **Emitido**  | 'emitido'  | ✅ hash  | ✅ timestamp | NULL               | PDF gerado localmente, pronto para bucket          |
| **Enviado**  | 'enviado'  | ✅ hash  | ✅ timestamp | ✅ URL             | Enviado ao Backblaze, disponível para solicitantes |

---

## 🎯 RESUMO EXECUTIVO

### Causa Raiz:

`gerarLaudoCompletoEmitirPDF()` gera PDF mas mantém `status='rascunho'` → Backend retorna `_emitido=false` → Frontend coloca na aba errada → Botão "Enviar ao Bucket" não aparece

### Solução:

Alterar linha 176 de `lib/laudo-auto.ts` para marcar `status='emitido'` APÓS gerar o PDF

### Impacto:

- ✅ Lotes 19 e 20 aparecerão na aba "Laudo Emitido"
- ✅ Botão "Enviar ao Bucket" aparecerá corretamente
- ✅ Fluxo normal de emissão → upload → disponibilização funcionará

### Arquivos Afetados:

1. `lib/laudo-auto.ts` (linha 176) - CRÍTICO
2. `app/api/emissor/laudos/[loteId]/pdf/route.ts` (linha 278) - Opcional
3. Banco Neon - Correção manual para lotes 19, 20

---

**Status:** Causa raiz identificada com precisão. Correção pronta para implementação.
