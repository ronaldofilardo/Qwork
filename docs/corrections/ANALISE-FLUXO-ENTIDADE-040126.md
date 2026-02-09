# Análise de Fluxo: Entidade vs Clínica (Conclusão Lote → Emissão Laudo)

**Data:** 04/01/2026  
**Status:** Análise completa - Iniciando implementação

---

## 🎯 Objetivo

Garantir que o fluxo `conclusão de lote → envio ao emissor → geração do laudo` funcione **identicamente** para **entidade** (sem nível `empresa`) e **clínica** (com `clinica → empresa → funcionários`).

---

## ✅ Estrutura Existente (Encontrada)

### 1. Schema do Banco

- ✅ Tabela `tomadores` unificada (tipo: `clinica` | `entidade`)
- ✅ Coluna `tomador_id` adicionada em `lotes_avaliacao` (migration 061)
- ✅ Constraint: `(clinica_id NOT NULL AND tomador_id NULL) OR (clinica_id NULL AND tomador_id NOT NULL)`
- ✅ `clinica_id` e `empresa_id` tornados nullable
- ✅ Função `calcular_elegibilidade_lote_tomador()` existe para entidades

### 2. RLS Policies (Parcialmente Implementadas)

- ✅ Migration 063 criou políticas para entidade:
  - `lotes_entidade_select`
  - `lotes_entidade_insert`
  - `lotes_entidade_update`
- ✅ Políticas dependem de `current_user_tomador_id()`
- ✅ Migration 029 criou função helper `current_user_tomador_id()`

### 3. APIs

- ✅ Endpoint `/api/entidade/liberar-lote` existe e cria lotes com `tomador_id`
- ✅ Endpoint do emissor `/api/emissor/laudos/[loteId]` é genérico (não distingue tipo)

### 4. Session Management

- ✅ `lib/session.ts` tem função `requireEntity()` que valida gestor
- ✅ Session interface tem campo `tomador_id`

---

## ❌ FALHAS CRÍTICAS IDENTIFICADAS

### **P0.1 - RLS: Variável de Sessão NÃO é Definida**

**Gravidade:** 🔴 CRÍTICA - Quebra total de segurança

**Problema:**

- Função `current_user_tomador_id()` existe no banco (migration 029)
- Mas `app.current_user_tomador_id` **NUNCA é definida** em `lib/db.ts`
- Apenas `cpf`, `perfil` e `clinica_id` são setadas via `SET LOCAL`

**Impacto:**

- Políticas RLS para entidade **retornam NULL** → nenhum lote visível ou **todos os lotes visíveis** (vazamento)
- Gestor de entidade não consegue ver seus próprios lotes ou vê lotes de outras entidades

**Localização:**

- `lib/db.ts` linhas 267-335 (função `query()`)
- Falta: `SET LOCAL app.current_user_tomador_id = '...'`

---

### **P0.2 - RBAC: Perfil `gestor` Não Mapeado em RLS**

**Gravidade:** 🔴 CRÍTICA

**Problema:**

- Políticas RLS usam `current_user_perfil() = 'entidade'`
- Mas session usa `perfil = 'gestor'`
- **Mismatch** de nomenclatura

**Impacto:**

- Políticas RLS nunca ativam para gestores de entidade
- Acesso negado ou permissão excessiva

**Localização:**

- `database/migrations/063_update_rls_policies_for_entity_lotes.sql` linha 43
- `lib/session.ts` linha 214 (perfil = 'gestor')

---

### **P0.3 - Constraints: Lotes sem `clinica_id` Podem Quebrar Joins**

**Gravidade:** 🟡 ALTA

**Problema:**

- Fluxo emissor faz JOIN com `empresas_clientes` assumindo `clinica_id` presente
- Lotes de entidade têm `clinica_id = NULL`

**Impacto:**

- Query do emissor retorna 0 linhas para lotes de entidade
- Laudo não é gerado

**Localização:**

- `app/api/rh/liberar-lote/route.ts` linha 85 (JOIN com empresas_clientes)
- `app/api/emissor/laudos/[loteId]/route.ts` linha 44 (JOIN assumindo clinica)

---

### **P1.1 - API: Emissor Assume Estrutura `clinica → empresa`**

**Gravidade:** 🟡 ALTA

**Problema:**

- Endpoint `/api/emissor/laudos/[loteId]` faz query:
  ```sql
  JOIN empresas_clientes ec ON la.empresa_id = ec.id
  JOIN clinicas c ON ec.clinica_id = c.id
  ```
- Para lotes de entidade, `empresa_id` e `clinica_id` são NULL

**Impacto:**

- Erro 404 ou falha na geração do laudo

---

### **P1.2 - Templates: Sem Lookup para Entidade**

**Gravidade:** 🟠 MÉDIA

**Problema:**

- Funções de geração de laudo (`lib/laudo-calculos.ts`) assumem dados de empresa
- Não há fallback para buscar dados do tomador quando `empresa_id = NULL`

**Impacto:**

- Laudo gerado com campos vazios (nome empresa, CNPJ, etc.)

---

### **P1.3 - Jobs/Cron: Filtros por `clinica_id`**

**Gravidade:** 🟠 MÉDIA

**Problema:**

- Workers provavelmente filtram lotes por `clinica_id`
- Lotes de entidade podem ser ignorados

**Impacto:**

- Emissão automática não acontece para entidades

---

### **P2.1 - Observability: Métricas Não Contemplam Entidade**

**Gravidade:** 🔵 BAIXA

**Problema:**

- Dashboards/métricas agrupam por `clinica_id`
- Entidades não aparecem

---

### **P2.2 - Auditoria: Logs Sem `tomador_id`**

**Gravidade:** 🔵 BAIXA

**Problema:**

- Audit logs podem não registrar `tomador_id`
- Perda de rastreabilidade

---

### **P2.3 - Testes: Cobertura Zero para Fluxo Entidade**

**Gravidade:** 🔵 BAIXA

**Problema:**

- Nenhum teste E2E encontrado para fluxo entidade

---

## 📋 Plano de Implementação (Priorizado)

### ✅ Tarefa 1: Adicionar `tomador_id` ao Contexto de Sessão

- Arquivo: `lib/db.ts`
- Adicionar `SET LOCAL app.current_user_tomador_id` quando `session.tomador_id` existe

### ✅ Tarefa 2: Corrigir Mismatch de Perfil em RLS

- Arquivo: Nova migration `064_fix_entidade_perfil_rls.sql`
- Atualizar políticas para aceitar `current_user_perfil() IN ('entidade', 'gestor')`

### ✅ Tarefa 3: Ajustar Query do Emissor para Suportar Lotes sem Empresa

- Arquivo: `app/api/emissor/laudos/[loteId]/route.ts`
- LEFT JOIN condicional e fallback para tomador

### ✅ Tarefa 4: Criar Lookup de Template com Fallback

- Arquivo: `lib/laudo-calculos.ts`
- Função `gerarDadosGeraisEmpresa()` buscar tomador se `empresa_id = NULL`

### ✅ Tarefa 5: Adicionar Idempotência na Emissão

- Arquivo: Nova migration `065_laudo_idempotency.sql`
- Constraint UNIQUE em `laudos(lote_id)` para prevenir duplicação

### ✅ Tarefa 6: Verificar/Atualizar Cron para Entidades

- Arquivo: `app/api/cron/**`
- Garantir que jobs processem lotes com `tomador_id NOT NULL`

### ✅ Tarefa 7: Adicionar Observability (Métricas)

- Criar view agregada por `tomador_id` e `clinica_id`

### ✅ Tarefa 8: Melhorar Auditoria

- Garantir que audit_logs inclua `tomador_id`

### ✅ Tarefa 9: Criar Testes E2E

- Arquivo: `__tests__/entidade-fluxo-laudo.test.ts`
- Cenário completo: criar funcionário → lote → avaliar → emitir

---

## 🔍 Comandos de Verificação Rápida

```sql
-- 1. Verificar lotes de entidade existentes
SELECT id, codigo, tomador_id, clinica_id, empresa_id, status
FROM lotes_avaliacao
WHERE tomador_id IS NOT NULL;

-- 2. Testar política RLS
SET app.current_user_perfil = 'gestor';
SET app.current_user_tomador_id = '1';
SELECT * FROM lotes_avaliacao; -- Deve retornar apenas lotes da entidade 1

-- 3. Verificar função helper
SELECT current_user_tomador_id(); -- Deve retornar valor ou NULL

-- 4. Verificar constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'lotes_avaliacao'::regclass
AND conname LIKE '%tomador%';
```

---

## 📊 Status de Implementação

- [x] Análise completa
- [ ] P0.1 - Sessão tomador_id
- [ ] P0.2 - Fix perfil RLS
- [ ] P0.3 - Joins condicionais
- [ ] P0.4 - Idempotência
- [ ] P1.1 - API emissor
- [ ] P1.2 - Template fallback
- [ ] P1.3 - Jobs/Cron
- [ ] P2.1 - Observability
- [ ] P2.2 - Auditoria
- [ ] P2.3 - Testes E2E

---

**Próximo Passo:** Implementar correções na ordem de prioridade (P0 → P1 → P2).
