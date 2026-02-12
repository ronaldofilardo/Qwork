# Resumo Executivo: Análise DEV vs PROD

**Data:** 10 de fevereiro de 2026  
**Objetivo:** Evitar comportamento diferente entre DEV e PROD  
**Status:** ✅ DEV analisado | ⏳ PROD pendente verificação

---

## 🎯 Problema Identificado

Durante o desenvolvimento foram detectados erros ao liberar lotes:

```
Laudo não pode ser marcado como emitido sem hash_pdf
```

**Causa Raiz:**

- Trigger `fn_reservar_id_laudo_on_lote_insert` criava laudos sem especificar `status`
- Sistema usava DEFAULT `status='emitido'`
- Constraint `chk_laudos_hash_when_emitido` exige `hash_pdf NOT NULL` quando status='emitido'
- Resultado: INSERT em laudos falhava

**Solução Implementada:**

- Migration 1004: Função especifica explicitamente `status='rascunho'` na INSERT
- Laudos criados como rascunho não precisam de hash_pdf
- Transição para 'emitido' ocorre depois, quando hash_pdf é gerado

---

## ✅ Estado Atual do DEV (Validado)

### Função do Trigger

```sql
-- Após Migration 1004
INSERT INTO laudos (id, lote_id, status)
VALUES (NEW.id, NEW.id, 'rascunho')  -- ✅ Status explícito
```

### DEFAULT da Coluna (⚠️ Atenção)

```
Column: status
Type: character varying
Default: 'emitido'::status_laudo_enum  -- ⚠️ Ainda 'emitido'
```

**Observação:** Em DEV, apesar do DEFAULT ser 'emitido', a função especifica explicitamente 'rascunho', então o DEFAULT não é usado. Sistema funcionando corretamente.

### Evidências em DEV

**Laudos criados recentemente (após Migration 1004):**

- Laudo 12: `status=rascunho, hash_pdf=NULL` ✅
- Laudo 11: `status=rascunho, hash_pdf=NULL` ✅
- Laudo 7: `status=rascunho, hash_pdf=NULL` ✅

**Laudos emitidos (após processo completo):**

- Laudo 15: `status=emitido, hash_pdf=✓` ✅
- Laudo 14: `status=emitido, hash_pdf=✓` ✅

### Estrutura do Banco

- **Triggers:** 54 ativos
- **Funções Custom:** 12 funções
- **Audit Logs:** 6 tabelas de auditoria ativas
  - audit_logs: 118 registros
  - auditoria: 130 registros
  - auditoria_laudos: 5 registros

---

## ⚠️ Pontos Críticos para PROD

### 1. Verificação Obrigatória

**Confirmar se Migration 1004 foi aplicada em PROD:**

```bash
# Usar script de verificação
node scripts\check-prod-status.cjs "postgresql://[PROD_URL]"
```

**O que verificar:**

- ✅ Função contém: `VALUES (NEW.id, NEW.id, 'rascunho')`
- ❌ Função NÃO deve ter apenas: `INSERT INTO laudos (id, lote_id)` sem status

### 2. Comparação de Triggers

**DEV tem 54 triggers - PROD deve ter o mesmo conjunto:**

```bash
# Comparar listagem completa
$env:DATABASE_URL = "postgresql://[PROD_URL]"
node scripts\analyze-dev-prod-diff.cjs
```

### 3. Verificar Laudos Inconsistentes em PROD

**Query para executar no Neon Console:**

```sql
-- Buscar laudos problemáticos
SELECT
  id, lote_id, status, hash_pdf,
  emissor_cpf, criado_em
FROM laudos
WHERE status = 'emitido'
  AND hash_pdf IS NULL
ORDER BY criado_em DESC;
```

**Se houver resultados:** Estes laudos precisam correção!

---

## 🚀 Plano de Ação

### Etapa 1: Diagnóstico de PROD (URGENTE)

```powershell
# 1. Clonar variável DATABASE_URL do .env.production.local
$prodUrl = "postgresql://..." # copiar do arquivo

# 2. Verificação rápida
node scripts\check-prod-status.cjs $prodUrl

# 3. Se necessário, análise completa
$env:DATABASE_URL = $prodUrl
node scripts\analyze-dev-prod-diff.cjs
```

**Tempo estimado:** 2-3 minutos

### Etapa 2: Aplicar Migration (se necessário)

**SE a verificação mostrar que Migration 1004 NÃO foi aplicada:**

1. Abrir `APLICAR_MIGRATION_1004_PRODUCAO.sql`
2. Copiar a seção SQL
3. Acessar console.neon.tech
4. SQL Editor → colar e executar
5. Verificar resultado com query de validação

**Tempo estimado:** 3-5 minutos

### Etapa 3: Correção de Dados (se houver)

**SE houver laudos com status='emitido' mas hash_pdf=NULL:**

```sql
-- Opção 1: Reverter para rascunho (RECOMENDADO)
UPDATE laudos
SET status = 'rascunho'
WHERE status = 'emitido'
  AND hash_pdf IS NULL;

-- Opção 2: Deletar (SÓ SE ÓRFÃOS)
-- Verificar antes se os lotes associados existem
DELETE FROM laudos
WHERE status = 'emitido'
  AND hash_pdf IS NULL
  AND lote_id NOT IN (SELECT id FROM lotes_avaliacao);
```

**Tempo estimado:** 1-2 minutos

### Etapa 4: Validação Final

**Teste de criação de lote em PROD:**

1. Criar novo lote (via UI ou API)
2. Verificar laudo criado automaticamente:

```sql
SELECT id, lote_id, status, hash_pdf, criado_em
FROM laudos
ORDER BY id DESC
LIMIT 1;
```

**Esperado:**

- `status = 'rascunho'`
- `hash_pdf IS NULL`

**Tempo estimado:** 2-3 minutos

---

## 📊 Checklist de Sincronização

### Ambiente DEV ✅

- [x] Migration 1004 aplicada
- [x] Função usa `status='rascunho'`
- [x] Triggers ativos (54)
- [x] Laudos sendo criados corretamente
- [x] Sistema funcionando

### Ambiente PROD ⏳

- [ ] Verificar se Migration 1004 aplicada
- [ ] Verificar função do trigger
- [ ] Comparar quantidade de triggers
- [ ] Verificar laudos inconsistentes
- [ ] Testar criação de lote

---

## 🔍 Áreas Verificadas

### 1. Triggers no Banco

✅ **DEV:** 54 triggers ativos, incluindo:

- `trg_reservar_id_laudo_on_lote_insert` (crítico)
- `trg_validar_laudo_emitido` (validação)
- `trg_immutable_laudo` (proteção)

⏳ **PROD:** Pendente verificação

### 2. Migrações Aplicadas

✅ **DEV:**

- Migration 1004 aplicada e funcionando
- Evidências: laudos recentes com status='rascunho'

⏳ **PROD:** Pendente verificação

### 3. Audit Logs / Auditoria

✅ **DEV:** Sistema de auditoria ativo

- audit_logs: 118 eventos registrados
- auditoria: 130 eventos (logins, ações)
- auditoria_laudos: 5 eventos de emissão

⏳ **PROD:** Pendente verificação

### 4. Processos/Jobs Externos

✅ **DEV:** Estrutura verificada

- Tabelas existentes mas sem jobs ativos no momento
- emissao_queue, pdf_jobs, laudo_generation_jobs

⏳ **PROD:** Pendente verificação

### 5. Estado dos Lotes

✅ **DEV:** 9 lotes recentes analisados

- Status variados: concluido, ativo, cancelado
- Relação correta com laudos

⏳ **PROD:** Pendente verificação

### 6. Logs de Aplicação

⏳ **Vercel Logs:** Pendente análise

- Acessar dashboard.vercel.com
- Verificar logs de runtime
- Buscar erros relacionados a "laudo", "hash_pdf", "emitido"

---

## 🛠️ Scripts Criados

1. **check-prod-status.cjs**
   - Verificação rápida focada
   - Valida Migration 1004
   - Identifica laudos inconsistentes
   - Tempo: ~1 minuto

2. **analyze-dev-prod-diff.cjs**
   - Comparação completa de estrutura
   - Triggers, funções, constraints
   - Estado de dados
   - Tempo: ~2 minutos

3. **check-audit-logs.cjs**
   - Análise de eventos de auditoria
   - Histórico de mudanças
   - Jobs e filas (se existirem)
   - Tempo: ~1 minuto

---

## 💡 Recomendações

### Prioridade ALTA ⚠️

1. **Executar verificação em PROD imediatamente**
   - Validar se Migration 1004 foi aplicada
   - Identificar laudos inconsistentes
   - Comparar estrutura de triggers

### Prioridade MÉDIA 📊

2. **Monitoramento de Logs Vercel**
   - Verificar se há erros recentes em PROD
   - Buscar padrões relacionados ao problema
3. **Alterar DEFAULT da coluna (opcional)**
   ```sql
   -- Camada extra de segurança
   ALTER TABLE laudos
   ALTER COLUMN status SET DEFAULT 'rascunho';
   ```

### Prioridade BAIXA 📝

4. **Documentação adicional**
   - Documentar processo de emissão de laudos
   - Criar guia de troubleshooting
   - Atualizar README com dependências críticas

---

## 📞 Comandos Rápidos

### PowerShell (Windows)

```powershell
# Definir URL de PROD (usar do .env.production.local)
$prodUrl = "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Verificação rápida
node scripts\check-prod-status.cjs $prodUrl

# Verificação completa
$env:DATABASE_URL = $prodUrl
node scripts\analyze-dev-prod-diff.cjs

# Audit logs
node scripts\check-audit-logs.cjs $prodUrl
```

### Bash (Linux/Mac)

```bash
# Definir URL de PROD
PROD_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Verificação rápida
node scripts/check-prod-status.cjs "$PROD_URL"

# Verificação completa
DATABASE_URL="$PROD_URL" node scripts/analyze-dev-prod-diff.cjs

# Audit logs
node scripts/check-audit-logs.cjs "$PROD_URL"
```

---

## 🎯 Próximos Passos Imediatos

1. **AGORA:** Copiar DATABASE_URL de `.env.production.local`
2. **AGORA:** Executar `check-prod-status.cjs`
3. **ANALISAR:** Revisar output do script
4. **DECIDIR:** Aplicar Migration 1004 (se necessário)
5. **VALIDAR:** Testar criação de lote em PROD

---

**Última Atualização:** 10/02/2026 - Análise DEV concluída  
**Status:** ✅ DEV saudável | ⏳ PROD aguardando verificação  
**Próxima Ação:** Verificar PROD com `check-prod-status.cjs`
