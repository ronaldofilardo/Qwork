# ✅ CORREÇÃO: Card do Lote Atualiza Somente Após Upload ao Bucket

## 📋 Problema Identificado

**O card de um lote estava sendo atualizado quando o laudo era GERADO**, mostrando como "disponível para download", mas na verdade estava apenas criado localmente no storage, não estava enviado ao bucket.

```
❌ FLUXO ANTERIOR (INCORRETO):
├─ 1. Emissor clica "Gerar Laudo" (POST /api/emissor/laudos/[loteId])
├─ 2. gerarLaudoCompletoEmitirPDF() marca como status='emitido'
├─ 3. Card atualiza → mostra "Laudo disponível para download" ❌ ERRADO!
│   (mas laudo ainda não está no bucket)
└─ 4. Emissor faz upload ao bucket (POST /api/emissor/laudos/[loteId]/upload)
```

## ✅ Solução Implementada

### Alterar comportamento de `gerarLaudoCompletoEmitirPDF()`

**Arquivo:** `lib/laudo-auto.ts` (linhas 170-188)

```typescript
// ❌ ANTERIOR: Marcava como 'emitido' logo após gerar PDF
UPDATE laudos
SET status = 'emitido',
    hash_pdf = $1,
    emitido_em = NOW(),  // ❌ Preenchido muito cedo
    atualizado_em = NOW()
WHERE id = $2 AND status = 'rascunho'

// ✅ NOVO: Apenas salva hash, mantém como 'rascunho'
UPDATE laudos
SET hash_pdf = $1,  // ✅ Apenas hash
    atualizado_em = NOW()
WHERE id = $2 AND status = 'rascunho'
```

**Resultado:** After PDF generation:

- ✅ `status = 'rascunho'` (ainda não está pronto para o usuário)
- ✅ `hash_pdf = <calculado>` (prova que PDF foi gerado)
- ✅ `emitido_em = NULL` (não preenchido)
- ✅ `arquivo_remoto_url = NULL` (não está no bucket)

### Atualizar validação de upload

**Arquivo:** `app/api/emissor/laudos/[loteId]/upload/route.ts` (linhas 78-90)

```typescript
// ❌ ANTERIOR: Verificava se status='emitido' ou 'enviado'
if (laudo.status !== 'emitido' && laudo.status !== 'enviado') {
  return error('Laudo não está em estado emitido');
}

// ✅ NOVO: Verifica se tem hash (PDF foi gerado localmente)
if (!laudo.hash_pdf) {
  return error('Laudo não foi gerado ainda');
}
```

### Marcar como 'emitido' APÓS upload bem-sucedido

**Arquivo:** `app/api/emissor/laudos/[loteId]/upload/route.ts` (linhas 256-280)

```typescript
// ✅ APÓS upload bem-sucedido: Marcar como 'emitido'
UPDATE laudos
SET arquivo_remoto_provider = $1,
    arquivo_remoto_bucket = $2,
    arquivo_remoto_key = $3,
    arquivo_remoto_url = $4,
    arquivo_remoto_uploaded_at = NOW(),
    status = 'emitido',        // ✅ SOMENTE AQUI
    emitido_em = NOW(),        // ✅ SOMENTE AQUI
    atualizado_em = NOW()
WHERE id = $7 AND status = 'rascunho'
```

**Resultado:** After successful upload:

- ✅ `status = 'emitido'` (agora sim pronto para download)
- ✅ `emitido_em = NOW()` (timestamp do momento)
- ✅ `arquivo_remoto_url = <URL>` (URL do bucket preenchida)
- ✅ `arquivo_remoto_uploaded_at = NOW()` (auditoria)

### Atualizar lógica do card

**Arquivo:** `app/api/emissor/lotes/route.ts` (linhas 100-125)

```typescript
// ❌ ANTERIOR: Considerava como emitido só por ter hash ou emitido_em
const laudoEmitido =
  temLaudo &&
  (lote.status_laudo === 'emitido' ||
    lote.status_laudo === 'enviado' ||
    lote.hash_pdf || // ❌ Problema aqui!
    lote.emitido_em);

// ✅ NOVO: SOMENTE se arquivo está no bucket
const laudoEmitido =
  temLaudo &&
  Boolean(lote.arquivo_remoto_url) && // ✅ DEVE estar no bucket!
  (lote.status_laudo === 'emitido' || lote.status_laudo === 'enviado');
```

## 📊 Novo Fluxo Correto

```
✅ FLUXO NOVO (CORRETO):

FASE 1: Geração Local
├─ 1. Emissor clica "Gerar Laudo"
├─ 2. POST /api/emissor/laudos/[loteId]
├─ 3. gerarLaudoCompletoEmitirPDF()
│   ├─ Gera PDF com Puppeteer
│   ├─ Salva em storage/laudos/laudo-{id}.pdf
│   ├─ Calcula hash SHA-256
│   └─ Preenche: hash_pdf, status='rascunho' ← mantém como rascunho!
├─ 4. Card continua em "Para Emitir" (não muda)
└─ 5. Botão de upload ativado

FASE 2: Upload ao Bucket
├─ 1. Emissor clica "Upload de Laudo"
├─ 2. POST /api/emissor/laudos/[loteId]/upload
├─ 3. Valida hash do PDF
├─ 4. Faz upload ao Backblaze bucket
├─ 5. Atualiza banco:
│   ├─ arquivo_remoto_url = <URL>
│   ├─ arquivo_remoto_uploaded_at = NOW()
│   ├─ status = 'emitido'              ← AQUI!
│   └─ emitido_em = NOW()              ← AQUI!
├─ 6. Card atualiza → "Laudo Emitido"  ✅ AGORA SIM!
└─ 7. Botão muda para "Ver Laudo/Baixar PDF"
```

## 🔄 Tabela de Estados

| Etapa     | status   | hash_pdf | emitido_em | arquivo_remoto_url | Card Mostra       |
| --------- | -------- | -------- | ---------- | ------------------ | ----------------- |
| Preview   | rascunho | NULL     | NULL       | NULL               | "Para Emitir" ✓   |
| Gerado    | rascunho | ✓        | NULL       | NULL               | "Para Emitir" ✓   |
| Upload OK | emitido  | ✓        | ✓          | ✓                  | "Laudo Emitido" ✓ |
| Enviado   | enviado  | ✓        | ✓          | ✓                  | "Laudo Emitido" ✓ |

## 📝 Impacto nos Endpoints

| Endpoint                                     | Antes                               | Depois                                                |
| -------------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| **GET /api/emissor/lotes**                   | Considera como emitido se tem hash  | **Só se tem `arquivo_remoto_url`**                    |
| **GET /api/emissor/laudos/[loteId]**         | `isPrevia` baseado em `emitido_em`  | **Sem mudança** - ainda correto                       |
| **POST /api/emissor/laudos/[loteId]**        | Marca como `emitido`                | Mantém como `rascunho`                                |
| **POST /api/emissor/laudos/[loteId]/upload** | Apenas persiste metadata            | **Agora marca como `emitido`**                        |
| **GET /api/entidade/lote/[id]**              | Considerar como `tem_laudo` se hash | **Só se tem `arquivo_remoto_url` + status='emitido'** |
| **GET /api/rh/lotes/[id]**                   | Considerar como `tem_laudo` se hash | **Só se tem `arquivo_remoto_url` + status='emitido'** |

## 🧪 Validação

### Teste do Fluxo Completo

```bash
# 1. Verificar estado inicial
SELECT lote_id, status, hash_pdf, emitido_em, arquivo_remoto_url
FROM laudos WHERE id = 1;
# Resultado esperado: rascunho, NULL, NULL, NULL

# 2. Gerar laudo
POST /api/emissor/laudos/1

# 3. Verificar após geração
SELECT lote_id, status, hash_pdf, emitido_em, arquivo_remoto_url
FROM laudos WHERE id = 1;
# Resultado esperado: rascunho, <HASH>, NULL, NULL ✅

# 4. Upload ao bucket
POST /api/emissor/laudos/1/upload

# 5. Verificar após upload
SELECT lote_id, status, hash_pdf, emitido_em, arquivo_remoto_url
FROM laudos WHERE id = 1;
# Resultado esperado: emitido, <HASH>, NOW(), <URL> ✅

# 6. Verificar card
GET /api/emissor/lotes
# Resultado esperado: _emitido=true SOMENTE agora ✅
```

## 🔐 Imutabilidade Preservada

A mudança preserva os princípios de imutabilidade:

✅ PDF só pode ser gerado uma vez (hash é imutável após geração)  
✅ Upload só pode acontecer com hash correto (validação de integridade)  
✅ Status só avança (rascunho → emitido → enviado)  
✅ Arquivo no bucket é imutável (não permitido novo upload se já existe)

## 📌 Resumo das Alterações

### 1. **lib/laudo-auto.ts**

- Remove `status='emitido'` e `emitido_em=NOW()` da geração
- Laudo permanece como `status='rascunho'` com hash calculado

### 2. **app/api/emissor/laudos/[loteId]/upload/route.ts**

- Aceita `status='rascunho'` com hash (PDF foi gerado)
- Marca como `emitido` APÓS upload bem-sucedido
- Valida hash antes de aceitar upload

### 3. **app/api/emissor/lotes/route.ts**

- Card só considera como emitido se tem `arquivo_remoto_url`
- Requer tanto a URL do bucket quanto status='emitido'

### 4. **app/api/entidade/lote/[id]/route.ts** ⭐ NOVO

- Corrige query que verificava `status='enviado' OR hash_pdf IS NOT NULL`
- Agora verifica `status='emitido' AND arquivo_remoto_url IS NOT NULL`
- Card do solicitante só mostra laudo disponível quando está no bucket

### 5. **app/api/rh/lotes/[id]/route.ts** ⭐ NOVO

- Corrige a mesma lógica para RH
- Verifica `status='emitido' AND arquivo_remoto_url IS NOT NULL`
- Adiciona `arquivo_remoto_url` na query para uso futuro

---

**Data:** 2026-02-15  
**Status:** ✅ Implementado (Completo - Emissor + Entidade + RH)  
**Testes:** Pendentes de validação em DEV
