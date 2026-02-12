# Análise de Diferenças DEV vs PROD

**Data:** 10 de fevereiro de 2026  
**Objetivo:** Identificar diferenças que podem causar comportamento inconsistente entre ambientes

---

## 📊 Estado Atual do Ambiente DEV (Local)

### ✅ Resumo Geral

- **Triggers:** 54 triggers ativos
- **Funções Custom:** 12 funções
- **Lotes recentes:** 9 lotes (mix de status: concluido, ativo, cancelado)
- **Laudos recentes:** 9 laudos (mix: rascunho e emitido)

### ⚠️ PONTOS DE ATENÇÃO EM DEV

#### 1. DEFAULT da Coluna `laudos.status`

```
Column: status
Type: character varying
Default: 'emitido'::status_laudo_enum
```

**PROBLEMA:** DEFAULT ainda é `'emitido'`, embora a Migration 1004 tenha sido aplicada.

**IMPACTO:** Se alguma query fizer `INSERT INTO laudos` sem especificar o `status`, usará 'emitido' como padrão, podendo causar o erro:

```
Laudo não pode ser marcado como emitido sem hash_pdf
```

**MITIGAÇÃO ATUAL:** A função `fn_reservar_id_laudo_on_lote_insert` (Migration 1004) especifica explicitamente `status='rascunho'`, então o DEFAULT não é usado pelo trigger.

#### 2. Constraints Críticas

- `chk_laudos_hash_when_emitido`: Valida que status='emitido' requer hash_pdf NOT NULL
- `chk_laudos_emissor_when_emitido`: Valida emissor_cpf quando emitido
- `chk_laudos_emitido_em_when_emitido`: Valida emitido_em quando emitido

#### 3. Evidências de Migration 1004 Aplicada

**Laudos criados APÓS migration:**

```
- Laudo 12 (lote 12): status=rascunho, hash=✗, emissor=NULL  ← CORRETO
- Laudo 11 (lote 11): status=rascunho, hash=✗, emissor=NULL  ← CORRETO
- Laudo 7 (lote 7): status=rascunho, hash=✗, emissor=NULL    ← CORRETO
- Laudo 6 (lote 6): status=rascunho, hash=✗, emissor=NULL    ← CORRETO
```

**Laudos emitidos:**

```
- Laudo 15 (lote 15): status=emitido, hash=✓, emissor=53051173991  ← VÁLIDO
- Laudo 14 (lote 14): status=emitido, hash=✓, emissor=53051173991  ← VÁLIDO
```

✅ **CONCLUSÃO DEV:** Migration 1004 está funcionando corretamente. Laudos são criados como 'rascunho' e depois transitam para 'emitido' quando hash_pdf é gerado.

---

## 🔍 Verificações Necessárias em PRODUÇÃO

### Scripts de Verificação

#### Script 1: Verificação Rápida

```bash
# Verifica se Migration 1004 foi aplicada e status geral de PROD
node scripts\check-prod-status.cjs "postgresql://user:pass@host/db?sslmode=require"
```

**O que verifica:**

- ✓ Se função `fn_reservar_id_laudo_on_lote_insert` usa `status='rascunho'`
- ✓ DEFAULT da coluna `laudos.status`
- ✓ Constraints ativas
- ✓ Laudos recentes e seus status
- ✓ Laudos inconsistentes (emitido sem hash_pdf)

#### Script 2: Análise Completa

```bash
# Compara DEV e PROD lado a lado
$env:DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
node scripts\analyze-dev-prod-diff.cjs
```

**O que compara:**

- Triggers (quantidade e definições)
- Funções custom
- Defaults de colunas
- Constraints
- Estado dos dados (lotes e laudos)
- Jobs/processos externos

---

## 📝 Checklist de Verificação Manual

### 1. Verificar Função em PROD

**SQL para executar no Neon Console:**

```sql
SELECT pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'fn_reservar_id_laudo_on_lote_insert';
```

**O que procurar na resposta:**

- ✅ DEVE conter: `INSERT INTO laudos (id, lote_id, status) VALUES (NEW.id, NEW.id, 'rascunho')`
- ❌ NÃO DEVE conter apenas: `INSERT INTO laudos (id, lote_id)` (sem status)

### 2. Verificar DEFAULT da Coluna em PROD

**SQL:**

```sql
SELECT
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'laudos'
  AND column_name = 'status';
```

**Esperado:**

- `column_default`: Pode ser `'emitido'::status_laudo_enum` (não é problema se função especifica status)
- Ideal: `'rascunho'::status_laudo_enum`

### 3. Verificar Laudos Recentes em PROD

**SQL:**

```sql
SELECT
  id,
  lote_id,
  status,
  hash_pdf IS NOT NULL as tem_hash,
  emissor_cpf,
  criado_em
FROM laudos
ORDER BY criado_em DESC
LIMIT 10;
```

**Análise:**

- Laudos com `status='rascunho'` e `tem_hash=false`: ✅ NORMAL (criados pelo trigger)
- Laudos com `status='emitido'` e `tem_hash=true`: ✅ NORMAL (emissão completada)
- Laudos com `status='emitido'` e `tem_hash=false`: ❌ INCONSISTENTE (erro!)

### 4. Verificar Laudos Inconsistentes

**SQL:**

```sql
SELECT
  id,
  lote_id,
  status,
  hash_pdf,
  emissor_cpf,
  criado_em
FROM laudos
WHERE status = 'emitido'
  AND hash_pdf IS NULL
ORDER BY criado_em DESC;
```

**Se houver resultados:** Estes laudos precisam correção!

---

## 🎯 Cenários e Ações

### Cenário 1: PROD sem Migration 1004

**Sintomas:**

- Função NÃO contém `status='rascunho'`
- Erro "Laudo não pode ser marcado como emitido sem hash_pdf" ao liberar lotes

**Ação:**

1. Abrir arquivo `APLICAR_MIGRATION_1004_PRODUCAO.sql`
2. Copiar o SQL de migração
3. Acessar console.neon.tech → SQL Editor
4. Executar o SQL
5. Verificar com query de validação

### Cenário 2: PROD com Migration 1004 mas DEFAULT='emitido'

**Sintomas:**

- Função contém `status='rascunho'` ✅
- DEFAULT da coluna é `'emitido'` ⚠️
- Laudos sendo criados corretamente como rascunho ✅

**Ação:**

- **OPCIONAL:** Alterar DEFAULT como camada extra de segurança

```sql
ALTER TABLE laudos
ALTER COLUMN status SET DEFAULT 'rascunho';
```

**Justificativa:** Não é obrigatório, mas previne problemas se algum código futuro inserir laudos diretamente sem usar o trigger.

### Cenário 3: Laudos Inconsistentes em PROD

**Sintomas:**

- Existem laudos com `status='emitido'` e `hash_pdf IS NULL`

**Opções de Correção:**

#### Opção A: Reverter para Rascunho (Simples)

```sql
-- Reverter laudos inconsistentes para rascunho
UPDATE laudos
SET status = 'rascunho'
WHERE status = 'emitido'
  AND hash_pdf IS NULL;
```

#### Opção B: Análise Manual (Cauteloso)

1. Exportar lista de laudos problemáticos
2. Verificar cada lote associado
3. Decidir: reverter para rascunho OU deletar (se órfão)

---

## 🚨 Riscos e Considerações

### Risco 1: Divergência de Comportamento

**Problema:** DEV com migration, PROD sem migration = comportamentos diferentes  
**Impacto:** Testes em DEV passam, mas PROD falha em produção  
**Solução:** Sincronizar ambientes aplicando Migration 1004 em PROD

### Risco 2: DEFAULT='emitido' + INSERT Direto

**Problema:** Se algum código fizer `INSERT INTO laudos` sem passar pelo trigger  
**Impacto:** Laudo criado como 'emitido' sem hash_pdf = violação de constraint  
**Solução:**

- Garantir que laudos são criados SOMENTE via trigger (INSERT em lotes_avaliacao)
- OU alterar DEFAULT para 'rascunho'

### Risco 3: Audit Logs e Contexto de Transação

**Problema:** Se PROD ainda usar neon() HTTP API em transações  
**Impacto:** `app.current_user_cpf` não persiste entre queries  
**Solução:** Verificar se `lib/db.ts` usa `getNeonPool()` e `Pool.connect()` em PROD

---

## ✅ Validação Final

### Após Aplicar Migration 1004 em PROD

1. **Teste de Criação de Lote:**

```bash
# Criar lote para entidade ou RH empresa
# Deve criar laudo automaticamente com status='rascunho'
```

2. **Verificar Laudo Criado:**

```sql
SELECT id, lote_id, status, hash_pdf, criado_em
FROM laudos
ORDER BY id DESC
LIMIT 1;
```

**Esperado:**

- `status = 'rascunho'`
- `hash_pdf IS NULL`
- `emissor_cpf IS NULL`

3. **Teste de Liberação de Lote:**

```bash
# Liberar lote (gerar hash_pdf)
# Deve transitar laudo de 'rascunho' para 'emitido'
```

4. **Verificar Transição:**

```sql
SELECT id, lote_id, status, hash_pdf IS NOT NULL as tem_hash, emissor_cpf
FROM laudos
WHERE id = [ID_DO_LAUDO];
```

**Esperado:**

- `status = 'emitido'`
- `tem_hash = true`
- `emissor_cpf IS NOT NULL`

---

## 📁 Arquivos de Referência

- `database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql` - Migration original
- `APLICAR_MIGRATION_1004_PRODUCAO.sql` - Instruções para PROD
- `scripts/check-prod-status.cjs` - Verificação rápida de status
- `scripts/analyze-dev-prod-diff.cjs` - Análise comparativa completa

---

## 🔄 Próximos Passos

1. ✅ **IMEDIATO:** Executar `check-prod-status.cjs` contra PROD
2. ⏳ **SE NECESSÁRIO:** Aplicar Migration 1004 em PROD
3. ⏳ **VALIDAR:** Testar criação de lote e geração de laudo
4. ⏳ **OPCIONAL:** Alterar DEFAULT para 'rascunho'
5. ⏳ **MONITORAR:** Verificar logs de PROD após mudanças

---

## 📞 Comandos Rápidos

### Verificar PROD (PowerShell):

```powershell
# Substituir pela sua DATABASE_URL de produção
$prodUrl = "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Verificação rápida
node scripts\check-prod-status.cjs $prodUrl

# Análise completa
$env:DATABASE_URL = $prodUrl
node scripts\analyze-dev-prod-diff.cjs
```

### Verificar DEV:

```bash
# Verificação local
node scripts\check-prod-status.cjs "postgresql://postgres:123456@localhost:5432/nr-bps_db"
```

---

**Última Atualização:** 10/02/2026  
**Status:** Migration 1004 aplicada em DEV ✅ | PROD pendente de verificação ⏳
