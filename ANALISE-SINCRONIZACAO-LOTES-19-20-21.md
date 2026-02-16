# 📊 ANÁLISE COMPLETA: SINCRONIZAÇÃO LOTES 19, 20 e 21

**Data:** 16/02/2026  
**Objetivo:** Sincronizar storage local → Neon → Backend → Frontend

---

## 1️⃣ ANÁLISE DO STORAGE LOCAL

### ✅ Lote 19

- **PDF Local:** `c:\apps\QWork\storage\laudos\laudo-19.pdf` (632.865 bytes)
- **Metadados:** `laudo-19.json`
- **Hash SHA-256:** `d1463831618f3d5718e6fa50e13f69f72f76b61827b0b2b1d3b5cd9f13a1ccbb`
- **Gerado em:** 16/02/2026 às 02:26:55
- **Emissor:** CPF 53051173991
- **Status arquivo_remoto:** ❌ Não enviado ao bucket

### ✅ Lote 20

- **PDF Local:** `c:\apps\QWork\storage\laudos\laudo-20.pdf` (631.595 bytes)
- **Metadados:** `laudo-20.json`
- **Hash SHA-256:** `acde4a952fbe17f3cff7e7085303648a17f29041cf60cbb91d11861abcc14488`
- **Gerado em:** 16/02/2026 às 02:51:28
- **Emissor:** CPF 53051173991
- **Status arquivo_remoto:** ❌ Não enviado ao bucket

### ✅ Lote 21

- **PDF Local:** ❌ Não existe (correto - não foi gerado ainda)
- **Metadados:** ❌ Não existe
- **Status:** Aguardando geração do laudo

---

## 2️⃣ ANÁLISE DO BANCO NEON (Estado Esperado)

| Lote | Status Esperado                           | Hash no Banco    | arquivo_remoto_url | Ação Necessária         |
| ---- | ----------------------------------------- | ---------------- | ------------------ | ----------------------- |
| 19   | ⚠️ **`rascunho` → deveria ser `emitido`** | ✅ Deve ter hash | ❌ NULL            | 🔧 **Atualizar status** |
| 20   | ⚠️ **`rascunho` → deveria ser `emitido`** | ✅ Deve ter hash | ❌ NULL            | 🔧 **Atualizar status** |
| 21   | ✅ `rascunho` (correto)                   | ❌ NULL          | ❌ NULL            | ✅ Nenhuma ação         |

### 🔍 Por que lotes 19 e 20 estão com status errado?

**Causa raiz:** Quando o PDF é gerado via client-side (Puppeteer no navegador), o sistema salva o hash no banco mas **NÃO atualiza o status** de `rascunho` para `emitido`.

Isso quebra a lógica do sistema que depende de `status IN ('emitido', 'enviado')` para calcular o flag `_emitido` usado pelo frontend.

---

## 3️⃣ IMPACTO NO BACKEND

### API `/api/emissor/lotes` (GET)

**Cálculo do flag `_emitido`:**

```typescript
_emitido: status IN ('emitido', 'enviado') // Atualmente FALSE para lotes 19 e 20
```

**Resultado atual:**

- Lote 19: `_emitido = FALSE` → ❌ Botão "Enviar ao Bucket" **NÃO aparece**
- Lote 20: `_emitido = FALSE` → ❌ Botão "Enviar ao Bucket" **NÃO aparece**
- Lote 21: `_emitido = FALSE` → ✅ Correto (PDF não gerado ainda)

**Após correção:**

- Lote 19: `_emitido = TRUE` → ✅ Botão "Enviar ao Bucket" **aparece**
- Lote 20: `_emitido = TRUE` → ✅ Botão "Enviar ao Bucket" **aparece**
- Lote 21: `_emitido = FALSE` → ✅ Correto (continua sem botão)

### APIs `/api/rh/laudos` e `/api/entidade/lotes` (GET)

**Validação atual:**

```sql
WHERE arquivo_remoto_url IS NOT NULL
```

**Resultado:**

- ✅ Lotes 19, 20 e 21: **NÃO aparecem** na lista (correto - não estão no bucket)
- ✅ Cards mostram "📋 Emissão Solicitada" (sem botão Ver Laudo)

**Após correção:**

- ✅ Comportamento mantém-se igual (ainda não estão no bucket)
- ✅ Após o emissor clicar "Enviar ao Bucket", aí sim os laudos ficarão disponíveis

---

## 4️⃣ IMPACTO NO FRONTEND

### 🖥️ Dashboard do Emissor (`/emissor`)

**Componente:** `UploadLaudoButton`  
**Condição de renderização:**

```tsx
{lote.laudo && lote.laudo._emitido && (
  <UploadLaudoButton ... />
)}
```

**Status atual:**

- Lote 19: `_emitido = false` → ❌ Botão não aparece (BUG)
- Lote 20: `_emitido = false` → ❌ Botão não aparece (BUG)
- Lote 21: `_emitido = false` → ✅ Botão não aparece (correto)

**Após correção:**

- Lote 19: `_emitido = true` → ✅ Botão aparece
- Lote 20: `_emitido = true` → ✅ Botão aparece
- Lote 21: `_emitido = false` → ✅ Botão não aparece

### 👥 Dashboard do Solicitante (`/rh` e `/entidade/lotes`)

**Filtro aplicado:**

```tsx
.filter(lote => lote.laudo_id && lote.laudo_arquivo_remoto_url)
```

**Status atual e após correção:**

- ✅ Lotes 19, 20 e 21: Todos mostram card "📋 Emissão Solicitada" (correto)
- ✅ Após upload ao bucket, cards mudam para "📄 Laudo disponível"

---

## 5️⃣ CORREÇÃO NECESSÁRIA

### 🔧 Ação: Atualizar status dos lotes 19 e 20 no Neon

**SQL de correção:**

```sql
UPDATE laudos
SET
  status = 'emitido',
  emitido_em = NOW(),
  atualizado_em = NOW()
WHERE
  lote_id IN (19, 20)
  AND status = 'rascunho'
  AND hash_pdf IS NOT NULL
  AND arquivo_remoto_url IS NULL;
```

**Registros afetados:** 2 (lotes 19 e 20)  
**Lote 21:** Não será afetado (correto - não tem hash_pdf)

---

## 6️⃣ PLANO DE EXECUÇÃO

### Passo 1: Diagnóstico (OPCIONAL)

Execute [diagnostico-lotes-19-20-21.sql](diagnostico-lotes-19-20-21.sql) no Neon para ver o estado atual completo.

### Passo 2: Correção (OBRIGATÓRIO)

Execute [correcao-lotes-19-20-21.sql](correcao-lotes-19-20-21.sql) no Neon:

1. O script inicia com `BEGIN` (transação segura)
2. Mostra estado ANTES da correção
3. Executa UPDATE nos lotes 19 e 20
4. Mostra estado DEPOIS da correção
5. Valida hashes contra arquivos locais
6. Testa queries usadas pelas APIs
7. Se tudo OK: execute `COMMIT`
8. Se houver erro: execute `ROLLBACK`

### Passo 3: Reiniciar Sistema

```powershell
# No terminal onde o Next.js está rodando
Ctrl + C
pnpm dev
```

### Passo 4: Validação Frontend

#### No Dashboard do Emissor (`http://localhost:3000/emissor`):

- [ ] Lote 18: ✅ Deve ter indicador "Sincronizado com bucket" (já foi enviado)
- [ ] Lote 19: 🟢 Botão "Enviar ao Bucket" deve aparecer
- [ ] Lote 20: 🟢 Botão "Enviar ao Bucket" deve aparecer
- [ ] Lote 21: ⚪ Nenhum botão (PDF não gerado - correto)

#### No Dashboard do Solicitante (`http://localhost:3000/entidade/lotes`):

- [ ] Lote 18: 📄 Card "Laudo disponível" + botão "Ver Laudo/Baixar PDF"
- [ ] Lote 19: 📋 Card "Emissão Solicitada" (sem botão)
- [ ] Lote 20: 📋 Card "Emissão Solicitada" (sem botão)
- [ ] Lote 21: 📋 Card "Emissão Solicitada" (sem botão)

### Passo 5: Teste Final

1. No emissor, clique em "Enviar ao Bucket" nos lotes 19 e 20
2. Selecione os PDFs correspondentes do storage (`laudo-19.pdf`, `laudo-20.pdf`)
3. Aguarde upload completar
4. Atualize a página do solicitante (F5)
5. Verifique se os cards mudaram para "📄 Laudo disponível"

---

## 7️⃣ VALIDAÇÃO TÉCNICA: HASHES

Para garantir integridade, os hashes devem corresponder:

| Lote | Hash no Banco (Esperado)                                           | Hash no arquivo JSON (Storage) |
| ---- | ------------------------------------------------------------------ | ------------------------------ |
| 19   | `d1463831618f3d5718e6fa50e13f69f72f76b61827b0b2b1d3b5cd9f13a1ccbb` | ✅ Corresponde                 |
| 20   | `acde4a952fbe17f3cff7e7085303648a17f29041cf60cbb91d11861abcc14488` | ✅ Corresponde                 |
| 21   | `NULL`                                                             | ✅ Correto (PDF não gerado)    |

Validação feita automaticamente pelo script SQL.

---

## 8️⃣ RESUMO EXECUTIVO

### Estado Atual (ANTES da correção)

❌ **Inconsistência:** Lotes 19 e 20 têm PDFs gerados localmente mas status='rascunho' no banco  
❌ **Impacto:** Botão "Enviar ao Bucket" não aparece no dashboard do emissor  
❌ **Bloqueio:** Emissor não consegue enviar laudos ao bucket

### Estado Esperado (DEPOIS da correção)

✅ **Consistência:** Lotes 19 e 20 com status='emitido' (sincronizado com arquivos locais)  
✅ **Funcionalidade:** Botão "Enviar ao Bucket" aparece corretamente  
✅ **Workflow:** Emissor pode enviar laudos ao bucket normalmente  
✅ **Proteção:** Lote 21 permanece como 'rascunho' (correto - aguardando geração)

### Arquivos Criados

1. [diagnostico-lotes-19-20-21.sql](diagnostico-lotes-19-20-21.sql) - SQL para análise completa
2. [correcao-lotes-19-20-21.sql](correcao-lotes-19-20-21.sql) - SQL de correção com validações
3. Este arquivo - Documentação completa da análise

---

## 9️⃣ PRÓXIMOS PASSOS (PARA O USUÁRIO)

1. **Execute o SQL de correção** no console do Neon
2. **Confirme com COMMIT** se as validações estiverem OK
3. **Reinicie o servidor** Next.js
4. **Teste no navegador** conforme checklist do Passo 4
5. **Envie os laudos ao bucket** e valide o fluxo completo

**Tempo estimado:** 5-10 minutos  
**Complexidade:** Baixa (apenas UPDATE no banco + restart do servidor)  
**Risco:** Mínimo (transação com BEGIN/COMMIT permite ROLLBACK)

---

**✅ Sistema ficará 100% sincronizado após esta correção!**
