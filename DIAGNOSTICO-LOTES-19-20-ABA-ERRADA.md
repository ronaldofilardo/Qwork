# 🔍 DIAGNÓSTICO: Lotes 19 e 20 ainda na aba errada

**Situação:** Após todas as correções, lotes 19 e 20 ainda aparecem em "Laudo para Emitir" ao invés de "Laudo Emitido"

---

## ✅ Correções Implementadas no Código

1. **lib/laudo-auto.ts (linha 176)** - Alterado para marcar status='emitido'
2. **app/api/emissor/laudos/[loteId]/pdf/route.ts (linha 278)** - Permite UPDATE com status='emitido'
3. **app/api/emissor/laudos/[loteId]/upload/route.ts (linha 284)** - Remove condição WHERE status='rascunho'

---

## 🔴 POSSÍVEIS CAUSAS

### Causa 1: SQL de correção NÃO foi executado no banco Neon ⚠️

**Sintoma:** Banco ainda tem `status='rascunho'` para lotes 19 e 20

**Solução:**

1. Execute [debug-lotes-19-20.sql](debug-lotes-19-20.sql) no console do Neon
2. Se status='rascunho', execute [fix-rapido-lotes-19-20.sql](fix-rapido-lotes-19-20.sql)
3. Reinicie o servidor Next.js

### Causa 2: Servidor não foi reiniciado após correção do código ⚠️

**Sintoma:** Código novo não está em execução

**Processos Node detectados:**

- PID 2856: Iniciado em 15/02/2026 22:53:56
- PID 8944: Iniciado em 15/02/2026 22:53:56
- PID 17432: Iniciado em 15/02/2026 23:21:14
- PID 19856: Iniciado em 15/02/2026 22:53:53

**Solução:**

```powershell
# Parar servidor
Ctrl + C

# Reiniciar
pnpm dev
```

### Causa 3: Cache do navegador ⚠️

**Sintoma:** Frontend carregando dados antigos da API

**Solução:**

```
Ctrl + Shift + R (hard refresh)
ou
Ctrl + F5
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

Execute em ordem:

### 1️⃣ Verificar Banco de Dados

```sql
-- Execute no console do Neon: debug-lotes-19-20.sql
SELECT lote_id, status, emitido_em FROM laudos WHERE lote_id IN (19, 20);
```

**Resultado esperado:**

```
lote_id | status  | emitido_em
--------|---------|------------------
19      | emitido | 2026-02-16 XX:XX
20      | emitido | 2026-02-16 XX:XX
```

**Se status='rascunho':** Execute fix-rapido-lotes-19-20.sql

### 2️⃣ Verificar Código em Execução

```powershell
# Verificar quando o servidor foi iniciado
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object StartTime
```

**Se StartTime < Hora da correção do código:** Reinicie o servidor

### 3️⃣ Limpar Cache do Navegador

```
1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Marque "Disable cache"
4. Faça hard refresh (Ctrl + Shift + R)
```

### 4️⃣ Testar API Diretamente

```javascript
// Abra o console do navegador (F12) e execute:
fetch('/api/emissor/lotes?page=1')
  .then((r) => r.json())
  .then((data) => {
    const lotes19_20 = data.lotes.filter((l) => [19, 20].includes(l.id));
    console.table(
      lotes19_20.map((l) => ({
        lote_id: l.id,
        status_laudo: l.laudo?.status,
        _emitido: l.laudo?._emitido,
        aba_esperada: l.laudo?._emitido ? 'Laudo Emitido' : 'Laudo para Emitir',
      }))
    );
  });
```

**Resultado esperado:**

```
lote_id | status_laudo | _emitido | aba_esperada
--------|--------------|----------|---------------
19      | emitido      | true     | Laudo Emitido
20      | emitido      | true     | Laudo Emitido
```

**Se \_emitido=false:**

- ❌ Banco ainda não foi corrigido OU
- ❌ Servidor não foi reiniciado

---

## 🎯 SOLUÇÃO RÁPIDA (Passo a Passo)

### Passo 1: Execute no Neon

```sql
-- Arquivo: fix-rapido-lotes-19-20.sql
UPDATE laudos
SET status = 'emitido', emitido_em = NOW(), atualizado_em = NOW()
WHERE lote_id IN (19, 20) AND status = 'rascunho' AND hash_pdf IS NOT NULL;
```

### Passo 2: Reinicie o servidor

```powershell
# No terminal do Next.js
Ctrl + C

# Depois
pnpm dev
```

### Passo 3: Limpe cache e atualize

```
1. Feche a página /emissor
2. Abra DevTools (F12)
3. Vá para Application > Clear storage > Clear site data
4. Reabra /emissor
5. Faça hard refresh (Ctrl + Shift + R)
```

### Passo 4: Verifique

- ✅ Lote 18: Aba "Laudo Emitido" com checkmark verde
- ✅ Lote 19: Aba "Laudo Emitido" com botão "Enviar ao Bucket"
- ✅ Lote 20: Aba "Laudo Emitido" com botão "Enviar ao Bucket"
- ✅ Lote 21: Aba "Laudo para Emitir" com botão "Iniciar Laudo"

---

## 🚨 SE AINDA NÃO FUNCIONAR

Execute o teste da API no console do navegador (Passo 4 do Checklist).

**Se `_emitido=false`:**

- Problema está no BACKEND (banco ou servidor)
- Volte ao Passo 1

**Se `_emitido=true` mas aba errada:**

- Problema está no FRONTEND (cache ou código)
- Volte ao Passo 3

---

**Documentação de Referência:**

- [ANALISE-MAQUINA-ESTADOS-LAUDOS.md](ANALISE-MAQUINA-ESTADOS-LAUDOS.md)
- [debug-lotes-19-20.sql](debug-lotes-19-20.sql)
- [fix-rapido-lotes-19-20.sql](fix-rapido-lotes-19-20.sql)
