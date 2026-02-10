# Relatório de Correção: Erro ao Inativar Avaliação em PROD

**Data:** 10/02/2026  
**Severidade:** 🔴 CRÍTICO  
**Status:** ✅ CORREÇÃO IMPLEMENTADA  
**Ambiente:** Produção (Neon Database)

---

## 🔍 Problema Identificado

### Erro Reportado

```
NeonDbError: column "processamento_em" does not exist
  at PL/pgSQL function prevent_mutation_during_emission() line 8 at SQL statement
  
internalQuery: 
  SELECT status, emitido_em, processamento_em 
  FROM lotes_avaliacao 
  WHERE id = NEW.lote_id
```

### Contexto

- **Rotas Afetadas:**
  - `/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar`
  - `/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar`
  
- **Impacto:** Impossível inativar avaliações em produção (funcionalidade crítica bloqueada)

- **Causa Raiz:** 
  - Coluna `processamento_em` foi removida na **Migration 130** (remoção de automação)
  - Função `prevent_mutation_during_emission()` não foi atualizada em PROD
  - **Migration 099** (que corrige a função) nunca foi aplicada em produção

---

##  Análise Técnica

### Histórico de Migrações

```
Migration 097: Remove campo processamento_em (planejada mas não executada)
Migration 099: Corrige função prevent_mutation_during_emission() ⚠️ NÃO APLICADA EM PROD
Migration 130: Remove definitivamente coluna processamento_em (aplicada)
```

**Problema:** Migration 099 corrige a função, mas não foi executada antes da 130 remover a coluna.

### Função Problemática

**Versão INCORRETA em PROD:**
```sql
CREATE FUNCTION prevent_mutation_during_emission() RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- ❌ ERRO: Tenta acessar processamento_em que não existe
    SELECT status, emitido_em, processamento_em
    INTO lote_status, lote_emitido_em, processamento_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;
    -- ...
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Versão CORRETA (Migration 099):**
```sql
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission() RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- ✅ CORRETO: Não acessa processamento_em
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;
    
    IF lote_emitido_em IS NOT NULL THEN
      -- Previne mudanças críticas
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Solução Implementada

### Migração Criada: `1009_fix_prevent_mutation_function_prod.sql`

**Ações:**
1. ✅ Verificação prévia: Checa se coluna `processamento_em` existe
2. ✅ Substitui função com versão correta (sem referência a `processamento_em`)
3. ✅ Atualiza comentário da função
4. ✅ Validação pós-correção: Confirma que função não menciona `processamento_em`
5. ✅ Auditoria: Registra correção em `audit_logs`

**Características:**
- **Idempotente:** Pode ser executada múltiplas vezes sem erro
- **Segura:** Validações antes e depois
- **Auditada:** Registra ação no log do sistema
- **Reversível:** Inclui instruções de rollback

### Scripts de Suporte

1. **`scripts/diagnostico-prevent-mutation-function.sql`**
   - Verifica estado atual da função
   - Checa se coluna `processamento_em` existe
   - Mostra definição completa da função
   - Valida trigger associado

2. **`scripts/aplicar-correcao-prevent-mutation.ps1`**
   - Executa diagnóstico pré-correção
   - Aplica migração 1009
   - Executa diagnóstico pós-correção
   - Validação automática do resultado

---

## 📋 Como Aplicar a Correção

### Opção 1: Script PowerShell (Recomendado)

```powershell
cd c:\apps\QWork
.\scripts\aplicar-correcao-prevent-mutation.ps1
```

**O script fará:**
1. Carrega DATABASE_URL do `.env.production.local`
2. Exibe resumo do problema
3. Solicita confirmação (digite "SIM")
4. Executa diagnóstico
5. Aplica correção
6. Valida resultado

### Opção 2: Manual com psql

```bash
# 1. Diagnóstico
psql $DATABASE_URL -f scripts/diagnostico-prevent-mutation-function.sql

# 2. Aplicar correção
psql $DATABASE_URL -f database/migrations/1009_fix_prevent_mutation_function_prod.sql

# 3. Validação
psql $DATABASE_URL -c "SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);"
```

### Opção 3: Prisma Studio / DBeaver

```sql
-- Copiar e executar conteúdo de:
-- database/migrations/1009_fix_prevent_mutation_function_prod.sql
```

---

## 🧪 Validação Pós-Correção

### 1. Verificar Definição da Função

```sql
SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);
```

**Deve retornar:** Query com `SELECT status, emitido_em` (SEM `processamento_em`)

### 2. Testar Inativação de Avaliação

**ENTIDADE:**
```bash
curl -X PATCH https://seu-dominio.vercel.app/api/entidade/lote/10004/avaliacoes/10004/inativar \
  -H "Cookie: session_token=..." \
  -H "Content-Type: application/json"
```

**RH:**
```bash
curl -X PATCH https://seu-dominio.vercel.app/api/rh/lotes/1005/avaliacoes/10006/inativar \
  -H "Cookie: session_token=..." \
  -H "Content-Type: application/json"
```

**Resultado Esperado:** HTTP 200 com `{ "success": true }`

### 3. Verificar Logs de Produção

```bash
vercel logs --prod --follow
```

**Buscar por:**
- ✅ `[entidade] /avaliacoes/{id}/inativar status=200`
- ✅ `[rh] /avaliacoes/{id}/inativar status=200`
- ❌ Não deve aparecer: `column "processamento_em" does not exist`

---

## 🔄 Sincronização DEV ↔ PROD

### Estado Atual

| Ambiente | Função Corrigida? | Coluna Existe? | Status |
|----------|-------------------|----------------|--------|
| **DEV (nr-bps_db)** | ✅ Sim (via migration 099) | ❌ Não (removida em 130) | ✅ OK |
| **PROD (Neon)** | ❌ Não | ❌ Não (removida em 130) | 🔴 **ERRO** |

### Após Aplicar Migration 1009

| Ambiente | Função Corrigida? | Coluna Existe? | Status |
|----------|-------------------|----------------|--------|
| **DEV** | ✅ Sim | ❌ Não | ✅ OK |
| **PROD** | ✅ Sim (via migration 1009) | ❌ Não | ✅ **OK** |

---

## 🚨 Prevenção de Reincidência

### 1. Processo de Deploy de Migrações

**Adicionar ao workflow de CI/CD:**

```yaml
# .github/workflows/deploy-migrations.yml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'database/migrations/**'

jobs:
  deploy-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Migrations on Production
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: |
          for migration in database/migrations/*.sql; do
            echo "Applying $migration..."
            psql $DATABASE_URL -f $migration
          done
```

### 2. Ordem de Execução

**Sempre seguir:**
1. Criar função/trigger na migration N
2. Remover coluna na migration N+1 (nunca na mesma)
3. Aplicar migrations em ordem (nunca pular)

### 3. Checklist de Migration

- [ ] Migration testada em DEV
- [ ] Schema dumped após aplicação
- [ ] Script de rollback documentado
- [ ] Aplicada em todos os ambientes
- [ ] Validada em staging antes de prod

---

## 📚 Referências

- **Migration 099:** `database/migrations/099_corrigir_funcao_prevent_mutation_during_emission.sql`
- **Migration 130:** `database/migrations/130_remove_auto_emission_columns.sql` (remove processamento_em)
- **Migration 1009:** `database/migrations/1009_fix_prevent_mutation_function_prod.sql` (correção urgente)
- **Diagnóstico:** `docs/process/DIAGNOSTICO-STATUS-AVALIACAO-PRODUCAO.md`
- **Schema Backup:** `database/schemas/schema-neon-backup.sql` (mostra estado correto)

---

## ✅ Checklist de Resolução

- [x] Problema diagnosticado
- [x] Causa raiz identificada (migration 099 não aplicada)
- [x] Migration 1009 criada
- [x] Scripts de diagnóstico criados
- [x] Script PowerShell de aplicação criado
- [ ] **TODO: Aplicar correção em PROD**
- [ ] **TODO: Validar rotas /inativar (ENTIDADE e RH)**
- [ ] **TODO: Commit e push das migrations**
- [ ] **TODO: Documentar no CHANGELOG**

---

**Próximas Ações:**

1. Aplicar correção executando `.\scripts\aplicar-correcao-prevent-mutation.ps1`
2. Testar ambas as rotas de inativação
3. Monitorar logs de produção por 24h
4. Fazer commit das migrations criadas
5. Atualizar documentação de processo

---

**Autor:** GitHub Copilot  
**Data:** 10/02/2026  
**Revisão:** Pendente após aplicação em PROD
