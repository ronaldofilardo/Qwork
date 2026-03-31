# Correção: Separação de Validação de Bucket - Emissor vs Solicitantes

**Data:** 2026-02-16  
**Tipo:** Correção de Bug - Backend e Frontend  
**Prioridade:** Alta  
**Status:** ✅ CONCLUÍDA

---

## 📋 Contexto do Problema

Após implementar validações de `arquivo_remoto_url` no backend para garantir que laudos só sejam considerados disponíveis após upload ao bucket, **efeitos colaterais** afetaram o **emissor**:

### Sintomas Reportados (Lotes 19 e 20)

1. ❌ **Emissor não conseguia baixar laudos** gerados localmente (erro 500)
2. ❌ **Botão "Enviar ao Bucket" não aparecia** para laudos emitidos
3. ⚠️ **Card do solicitante mostrava status incorreto** (deveria mostrar "aguardando emissão")

### Causa Raiz

As validações implementadas anteriormente **não distinguiam entre emissor e solicitantes**:

- **Emissor** precisa acessar laudos **antes** de enviar ao bucket (revisar e enviar)
- **Solicitantes (RH/Entidade)** só devem ver laudos **depois** do envio ao bucket

---

## 🔧 Correções Implementadas

### 1. API `/api/emissor/lotes/route.ts` - Campo `_emitido`

**Linha ~105:** Removida validação de bucket para cálculo de `_emitido`

```typescript
// ❌ ANTES: Exigia arquivo no bucket
const laudoEmitido =
  temLaudo &&
  Boolean(lote.arquivo_remoto_url) && // 🔴 Bloqueava botão!
  (lote.status_laudo === 'emitido' || lote.status_laudo === 'enviado');

// ✅ DEPOIS: Emissor não precisa validar bucket
const laudoEmitido =
  temLaudo &&
  (lote.status_laudo === 'emitido' || lote.status_laudo === 'enviado');
```

**Resultado:** Botão "Enviar ao Bucket" volta a aparecer para laudos com `status='emitido'`

---

### 2. API `/api/emissor/laudos/[loteId]/download/route.ts`

**Linha ~38:** Removida validação de `arquivo_remoto_url` da query

```sql
-- ❌ ANTES: Emissor não conseguia baixar laudo gerado
WHERE l.lote_id = $1
  AND l.emissor_cpf = $2
  AND l.status = 'emitido'
  AND l.arquivo_remoto_url IS NOT NULL  -- 🔴 Causava erro 500!

-- ✅ DEPOIS: Emissor pode baixar antes de enviar ao bucket
WHERE l.lote_id = $1
  AND l.emissor_cpf = $2
  AND l.status = 'emitido'
```

**Resultado:** Emissor pode baixar e revisar PDFs gerados localmente

---

### 3. API `/api/rh/laudos/route.ts` - Listagem de Laudos

**Linha ~135-136:** Adicionada validação de bucket (estava faltando!)

```sql
-- ❌ ANTES: Listava laudos não enviados ao bucket
SELECT l.id, l.lote_id, l.status, l.enviado_em, l.hash_pdf, ...
FROM laudos l
WHERE ec.clinica_id = $1
ORDER BY l.enviado_em DESC

-- ✅ DEPOIS: Apenas laudos efetivamente no bucket
SELECT l.id, l.lote_id, l.status, l.enviado_em, l.hash_pdf, ...
FROM laudos l
WHERE ec.clinica_id = $1
  AND l.status = 'emitido'
  AND l.arquivo_remoto_url IS NOT NULL
ORDER BY l.enviado_em DESC
```

**Resultado:** Componente `LotesGrid` não encontra laudo → mostra "Emissão Solicitada" em vez de "Laudo Disponível"

---

### 4. API `/api/clinica/laudos/route.ts` ✅ JÁ CORRETO

**Status:** Não precisou correção - já tinha validação desde correção anterior

```sql
WHERE la.clinica_id = $1
  AND l.status = 'emitido'
  AND l.arquivo_remoto_url IS NOT NULL  -- ✅ Já estava correto
```

---

## 🎯 Comportamento Esperado Após Correções

### Para o Emissor (Lotes 19 e 20)

| Ação                      | Status Atual                                  | Comportamento Esperado              |
| ------------------------- | --------------------------------------------- | ----------------------------------- |
| Ver lista de lotes        | `status='emitido'`, `arquivo_remoto_url=NULL` | ✅ Lote aparece normalmente         |
| Campo `_emitido`          | `true` (status='emitido')                     | ✅ Botão "Enviar ao Bucket" visível |
| Baixar laudo (download)   | API retorna PDF local                         | ✅ Download funciona                |
| Clicar "Enviar ao Bucket" | Inicia upload                                 | ✅ Funcionalidade liberada          |

### Para Solicitantes RH/Entidade (Lotes 19 e 20)

| Ação                        | Status Atual               | Comportamento Esperado                           |
| --------------------------- | -------------------------- | ------------------------------------------------ |
| Ver card do lote            | `arquivo_remoto_url=NULL`  | ✅ Card roxo com "📄 Emissão Solicitada"         |
| Botão "Ver Laudo"           | Não aparece                | ✅ Oculto (frontend valida `arquivo_remoto_url`) |
| Seção Hash                  | Não aparece                | ✅ Oculta (frontend valida `arquivo_remoto_url`) |
| Lista de laudos disponíveis | API não retorna lote 19/20 | ✅ Laudos só aparecem após bucket                |

### Após Emissor Enviar ao Bucket

| Ação                 | Status Resultante                  | Comportamento                    |
| -------------------- | ---------------------------------- | -------------------------------- |
| Upload concluído     | `arquivo_remoto_url='https://...'` | ✅ Laudo registrado no bucket    |
| Card RH/Entidade     | `tem_laudo=true`                   | ✅ Botão "Ver Laudo" aparece     |
| Lista de laudos      | API retorna laudo                  | ✅ Laudo na lista de disponíveis |
| Download RH/Entidade | PDF do bucket                      | ✅ Download funciona             |

---

## 📊 Resumo das Validações por Perfil

### Emissor

```typescript
// APIs do emissor NÃO validam arquivo_remoto_url
// Permitem acesso a laudos com status='emitido' antes do bucket

✅ /api/emissor/lotes - Campo _emitido baseado apenas em status
✅ /api/emissor/laudos/[loteId]/download - Permite download de PDFs locais
✅ Interface mostra botão "Enviar ao Bucket" para status='emitido'
```

### Solicitantes (RH/Entidade)

```typescript
// APIs de solicitantes EXIGEM arquivo_remoto_url IS NOT NULL
// Garantem que só laudos no bucket são visíveis

✅ /api/rh/laudos - Filtra por arquivo_remoto_url IS NOT NULL
✅ /api/rh/laudos/[id]/download - Valida arquivo_remoto_url
✅ /api/entidade/laudos/[id]/download - Valida arquivo_remoto_url
✅ /api/clinica/laudos - Filtra por arquivo_remoto_url IS NOT NULL
✅ Frontend valida lote.arquivo_remoto_url antes de mostrar botão/hash
```

---

## ✅ Arquivos Modificados

### Backend (3 arquivos)

1. **c:\apps\QWork\app\api\emissor\lotes\route.ts**
   - Linha 105-110: Removida validação `Boolean(lote.arquivo_remoto_url)` de `laudoEmitido`

2. **c:\apps\QWork\app\api\emissor\laudos\[loteId]\download\route.ts**
   - Linha 38: Removida cláusula `AND l.arquivo_remoto_url IS NOT NULL`

3. **c:\apps\QWork\app\api\rh\laudos\route.ts**
   - Linha 135-136: Adicionadas validações `AND l.status = 'emitido' AND l.arquivo_remoto_url IS NOT NULL`

### Frontend (Correções anteriores mantidas)

- `app/rh/empresa/[id]/lote/[loteId]/page.tsx` - Valida `arquivo_remoto_url` antes de mostrar botão/hash
- `app/entidade/lote/[id]/page.tsx` - Valida `arquivo_remoto_url` antes de mostrar botão/hash

---

## 🧪 Validação de Compilação

```bash
✅ Nenhum erro TypeScript
✅ Todas as APIs compiladas com sucesso
✅ Lógica consistente entre emissor e solicitantes
```

---

## 🚀 Testes Manuais Sugeridos

### Teste A: Emissor - Lotes 19 e 20

1. ✅ Acessar dashboard do emissor
2. ✅ Verificar que lotes 19 e 20 aparecem na lista
3. ✅ Verificar que botão "Enviar ao Bucket" está visível
4. ✅ Clicar em "Ver Laudo" - deve baixar PDF local com sucesso
5. ✅ Clicar em "Enviar ao Bucket" - deve iniciar upload

### Teste B: RH/Entidade - Lotes 19 e 20 (Antes do Bucket)

1. ✅ Acessar dashboard RH/Entidade da empresa dos lotes 19/20
2. ✅ Verificar que cards mostram **"📄 Emissão Solicitada"** (não "Laudo Disponível")
3. ✅ Verificar que **botão "Ver Laudo" NÃO aparece**
4. ✅ Verificar que **seção de hash NÃO aparece**
5. ✅ Verificar que lotes 19/20 **não aparecem em /rh/laudos** (lista de laudos)

### Teste C: RH/Entidade - Após Upload ao Bucket

1. ✅ Emissor clica em "Enviar ao Bucket" nos lotes 19/20
2. ✅ Aguardar confirmação de upload
3. ✅ Recarregar página do solicitante
4. ✅ Verificar que card agora mostra **"📄 Laudo disponível"**
5. ✅ Verificar que **botão "Ver Laudo"** aparece
6. ✅ Verificar que **seção de hash** aparece
7. ✅ Clicar em "Ver Laudo" - deve baixar PDF com sucesso
8. ✅ Verificar que lotes 19/20 **aparecem em /rh/laudos** (lista de laudos)

---

## 📝 Documentação Relacionada

- `CORRECAO_FRONTEND_CARD_LAUDO_BUCKET.md` - Correção frontend (validação de `arquivo_remoto_url`)
- `BUILD_APPROVAL_CARD_LAUDO_BUCKET_FIX.md` - Correção inicial backend (download endpoints)

---

## 🎓 Lições Aprendidas

1. **Separação de Contextos:** Emissor e solicitantes têm necessidades diferentes - validações devem ser específicas por perfil
2. **Efeitos Colaterais:** Validações genéricas podem bloquear fluxos legítimos - sempre testar todos os perfis
3. **Consistência de Dados:** APIs de listagem devem filtrar da mesma forma que APIs de download

---

## ✅ STATUS FINAL

**Pronto para Testes Manuais**

Todas as correções implementadas. Sistema agora:

- ✅ Emissor pode baixar e enviar laudos gerados
- ✅ Solicitantes só veem laudos após bucket
- ✅ Cards mostram status correto ("Emissão Solicitada" vs "Laudo Disponível")
- ✅ Botões aparecem apenas quando ações são possíveis

---

**FIM DO DOCUMENTO**
