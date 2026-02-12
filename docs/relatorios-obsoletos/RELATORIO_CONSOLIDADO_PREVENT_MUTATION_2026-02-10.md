# Relatório Consolidado: Correção das Funções prevent_mutation em PROD

**Data:** 10/02/2026  
**Problema:** Erros `column "processamento_em" does not exist` bloqueando múltiplas rotas em PROD  
**Status:** ✅ Solução criada (Migration 1010) - Aguardando aplicação

---

## 📊 Sumário Executivo

### Problema

Em produção, múltiplas rotas começaram a falhar com erro PostgreSQL `42703: column "processamento_em" does not exist`. O erro afetava:

- ❌ `/api/avaliacao/respostas` - Salvar respostas
- ❌ `/api/.../avaliacoes/.../inativar` - Inativar avaliações
- ❌ Auto-conclusão de avaliações
- ❌ Atualização de status do lote
- ❌ Botão "Solicitar emissão de laudo" não aparece

### Causa Raiz

Sequência de migrations aplicadas fora de ordem em PROD:

1. **Migration 098** (2026-01-31): Corrigiu `prevent_lote_mutation_during_emission()` ✅
2. **Migration 099** (2026-01-31): Corrigiu `prevent_mutation_during_emission()` ✅
3. **Migration 100** (2026-01-27): **SOBRESCREVEU** as funções, reintroduzindo `processamento_em` ❌
4. **Migration 130** (2026-01-31): Removeu coluna `processamento_em` com CASCADE ❌
5. **Migration 1009** (2026-02-10): Correção parcial (só avaliacoes) ⚠️
6. **Migration 1010** (2026-02-10): **CORREÇÃO DEFINITIVA** (ambas as funções) ✅

### Solução

**Migration 1010** - Consolidação definitiva:

- ✅ Corrige `prevent_mutation_during_emission()` (trigger em avaliacoes)
- ✅ Corrige `prevent_lote_mutation_during_emission()` (trigger em lotes_avaliacao)
- ✅ Recria triggers corretamente
- ✅ Validação completa (verifica ausência de `processamento_em`)
- ✅ Registro em audit_logs

---

## 🔍 Contexto Histórico

### Coluna processamento_em

**Adição:**

- **Migration 007a/007**: Adicionou coluna `processamento_em TIMESTAMP` para controlar janela de processamento automático

**Remoção:**

- **Migration 130** (2026-01-31): Removeu 5 colunas relacionadas a auto-emissão:
  - `auto_emitir_em`
  - `auto_emitir_agendado`
  - `processamento_em` ← Esta é a problemática
  - `cancelado_automaticamente`
  - `motivo_cancelamento`

**Motivo da remoção:**
Sistema migrou de emissão automática para 100% manual.

---

## 🐛 Anatomia do Problema

### Função 1: prevent_mutation_during_emission()

**Trigger:** `trigger_prevent_avaliacao_mutation_during_emission`  
**Tabela:** `avaliacoes`  
**Momento:** BEFORE UPDATE

**Código problemático (Migration 100):**

```sql
SELECT status, emitido_em, processamento_em  -- ❌ processamento_em não existe mais
INTO lote_status, lote_emitido_em, lote_processamento_em
FROM lotes_avaliacao
WHERE id = NEW.lote_id;

-- Depois usava:
IF lote_processamento_em IS NOT NULL THEN
  -- Impedir mudanças durante processamento
END IF;
```

**Erro resultante:**

```
ERROR: column "processamento_em" does not exist
LINE 1: SELECT status, emitido_em, processamento_em FROM lotes_aval...
                                    ^
CONTEXT: PL/pgSQL function prevent_mutation_during_emission() line 8 at SQL statement
```

**Rotas afetadas:**

- `POST /api/avaliacao/respostas` - Salvar respostas
- `PATCH /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar`
- `PATCH /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar`
- Auto-conclusão interna quando avaliacao atinge 100% respostas

### Função 2: prevent_lote_mutation_during_emission()

**Trigger:** `trigger_prevent_lote_mutation_during_emission`  
**Tabela:** `lotes_avaliacao`  
**Momento:** BEFORE UPDATE

**Código problemático (Migration 100):**

```sql
-- Similar ao anterior, também referenciava processamento_em
```

**Impacto:**

- Bloqueava atualizações de status do lote
- Impedia transição para `concluido`
- Botão "Solicitar emissão" não aparecia

---

## 📜 Timeline das Migrations

### Migration 098: Tentativa de Correção (Lotes)

**Arquivo:** `098_corrigir_funcao_prevent_lote_mutation.sql`  
**Data:** 2026-01-31  
**Objetivo:** Remover referências a `processamento_em`

```sql
CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Verifica se já foi emitido (sem usar processamento_em)
    IF EXISTS (SELECT 1 FROM laudos
               WHERE lote_id = OLD.id
               AND status IN ('emitido', 'enviado')) THEN
      -- Impedir mudanças críticas
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

✅ **Correto** - Não referencia `processamento_em`

---

### Migration 099: Tentativa de Correção (Avaliacoes)

**Arquivo:** `099_corrigir_funcao_prevent_mutation.sql`  
**Data:** 2026-01-31  
**Objetivo:** Remover referências a `processamento_em`

```sql
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
  -- Não declara lote_processamento_em
BEGIN
  SELECT status, emitido_em  -- Não seleciona processamento_em
  INTO lote_status, lote_emitido_em
  FROM lotes_avaliacao WHERE id = NEW.lote_id;

  -- Verifica emitido_em ao invés de processamento_em
  IF lote_emitido_em IS NOT NULL THEN
    -- Impedir mudanças
  END IF;
END;
$$ LANGUAGE plpgsql;
```

✅ **Correto** - Não referencia `processamento_em`

---

### Migration 100: Reintrodução do Problema ⚠️

**Arquivo:** `100_add_trigger_block_mutations_during_emission.sql`  
**Data:** 2026-01-27 (mas aplicada após 098/099)  
**Objetivo:** Adicionar bloqueio de mutações durante emissão

**PROBLEMA:** Criou AMBAS as funções novamente, COM referências a `processamento_em`:

```sql
-- Linhas 14-15 (para avaliacoes)
SELECT status, emitido_em, processamento_em  -- ❌ ERRO!
INTO lote_status, lote_emitido_em, lote_processamento_em
FROM lotes_avaliacao WHERE id = NEW.lote_id;

-- Linhas 28, 33, 58, 60, 77, 80
IF lote_processamento_em IS NOT NULL THEN  -- ❌ ERRO!
  -- Lógica de bloqueio
END IF;
```

❌ **Problema:** Sobrescreveu as correções das migrations 098/099

**Por que isso aconteceu?**

1. Migrations 098/099 têm timestamp 2026-01-31 (final de janeiro)
2. Migration 100 tem timestamp 2026-01-27 (antes de 098/099)
3. **MAS** Migration 100 foi aplicada DEPOIS em PROD
4. Resultado: 098/099 corrigem → 100 sobrescreve → 130 remove coluna → ERRO

---

### Migration 130: Remoção da Coluna

**Arquivo:** `130_remove_auto_emission_columns.sql`  
**Data:** 2026-01-31  
**Objetivo:** Remover sistema de auto-emissão

```sql
-- Remove 5 colunas com CASCADE
ALTER TABLE lotes_avaliacao
  DROP COLUMN IF EXISTS auto_emitir_em CASCADE,
  DROP COLUMN IF EXISTS auto_emitir_agendado CASCADE,
  DROP COLUMN IF EXISTS processamento_em CASCADE,  -- ❌ Esta!
  DROP COLUMN IF EXISTS cancelado_automaticamente CASCADE,
  DROP COLUMN IF EXISTS motivo_cancelamento CASCADE;
```

**Esperava-se:** CASCADE deveria atualizar funções automaticamente  
**Realidade:** Funções permaneceram com referências ao campo removido

---

### Migration 1009: Correção Parcial

**Arquivo:** `1009_fix_prevent_mutation_function_prod.sql`  
**Data:** 2026-02-10  
**Objetivo:** Correção emergencial em PROD

**O que fez:**

- ✅ Corrigiu `prevent_mutation_during_emission()` (avaliacoes)
- ✅ Removeu `processamento_em` da query SELECT
- ✅ Validação específica
- ✅ Registro em audit_logs

**Limitação:**

- ⚠️ Não corrigiu `prevent_lote_mutation_during_emission()` (lotes)
- ⚠️ Erros continuaram em rotas que afetam lotes

**Status:** ✅ Aplicada em PROD com sucesso

---

### Migration 1010: Correção Definitiva ⭐

**Arquivo:** `1010_consolidar_correcao_prevent_mutation_functions.sql`  
**Data:** 2026-02-10  
**Objetivo:** Consolidação completa de TODAS as correções

**O que faz:**

#### 1. Corrige função de avaliacoes

```sql
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
  -- NÃO declara lote_processamento_em
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Busca apenas status e emitido_em
    SELECT status, emitido_em  -- SEM processamento_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao WHERE id = NEW.lote_id;

    -- Verifica se já foi emitido
    IF lote_emitido_em IS NOT NULL THEN
      -- Impede mudanças em campos críticos
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos da avaliação após emissão do laudo.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Corrige função de lotes

```sql
CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Verifica se existe laudo emitido/enviado para este lote
    IF EXISTS (SELECT 1 FROM laudos
               WHERE lote_id = OLD.id
               AND status IN ('emitido', 'enviado')) THEN
      -- Impede mudanças em campos críticos
      IF OLD.contratante_id IS DISTINCT FROM NEW.contratante_id
         OR OLD.numero_ordem IS DISTINCT FROM NEW.numero_ordem
         OR OLD.tipo IS DISTINCT FROM NEW.tipo THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos do lote após emissão do laudo.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Recria triggers

```sql
-- Remove triggers antigos
DROP TRIGGER IF EXISTS trigger_prevent_avaliacao_mutation_during_emission
  ON avaliacoes;
DROP TRIGGER IF EXISTS trigger_prevent_lote_mutation_during_emission
  ON lotes_avaliacao;

-- Recria corretamente
CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_mutation_during_emission();

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_lote_mutation_during_emission();
```

#### 4. Validação completa

```sql
DO $$
DECLARE
  v_def_avaliacoes TEXT;
  v_def_lotes TEXT;
  v_has_processamento_avaliacoes BOOLEAN;
  v_has_processamento_lotes BOOLEAN;
BEGIN
  -- Busca definições das funções
  SELECT pg_get_functiondef(oid) INTO v_def_avaliacoes
  FROM pg_proc
  WHERE proname = 'prevent_mutation_during_emission';

  SELECT pg_get_functiondef(oid) INTO v_def_lotes
  FROM pg_proc
  WHERE proname = 'prevent_lote_mutation_during_emission';

  -- Verifica se ainda há referências a processamento_em
  v_has_processamento_avaliacoes := v_def_avaliacoes LIKE '%SELECT%processamento_em%FROM lotes_avaliacao%';
  v_has_processamento_lotes := v_def_lotes LIKE '%processamento_em%';

  IF v_has_processamento_avaliacoes THEN
    RAISE EXCEPTION 'FALHA NA VALIDAÇÃO: prevent_mutation_during_emission() ainda referencia processamento_em no SELECT';
  END IF;

  IF v_has_processamento_lotes THEN
    RAISE EXCEPTION 'FALHA NA VALIDAÇÃO: prevent_lote_mutation_during_emission() ainda referencia processamento_em';
  END IF;

  RAISE NOTICE '✓ Validação OK: Nenhuma função referencia processamento_em';
END $$;
```

#### 5. Registro em audit

```sql
INSERT INTO audit_logs (
  tabela_afetada,
  tipo,
  dados_antigos,
  dados_novos,
  usuario,
  created_at
) VALUES (
  'lotes_avaliacao, avaliacoes',
  'SYSTEM',
  '{"migration": "1010", "action": "consolidate_prevent_mutation_functions"}',
  '{"fixed_functions": ["prevent_mutation_during_emission", "prevent_lote_mutation_during_emission"], "removed_references": "processamento_em"}',
  'SYSTEM',
  NOW()
);
```

**Status:** 📝 Criada, aguardando aplicação

---

## 🔥 Impacto em Produção

### Erros Registrados nos Logs

#### 1. Erro ao Salvar Respostas

```
[POST] /api/avaliacao/respostas
{
  "avaliacaoId": 10004,
  "respostas": [...]
}

❌ Erro ao atualizar status para em_andamento {
  severity: 'ERROR',
  code: '42703',
  message: 'column "processamento_em" does not exist',
  where: 'PL/pgSQL function prevent_mutation_during_emission() line 8 at SQL statement'
}
```

**Fluxo quebrado:**

1. Front-end salva resposta via POST /api/avaliacao/respostas ✅
2. Backend recebe, valida, salva resposta no banco ✅
3. Auto-conclusão detecta: 37/37 respostas completas ✅
4. Tenta atualizar status: `iniciada` → `em_andamento` ❌ FALHA (trigger erro)
5. Retry com transactionWithContext ❌ FALHA novamente
6. Front-end mostra erro, usuário não consegue prosseguir

#### 2. Erro ao Inativar Avaliação

```
[PATCH] /api/entidade/lote/123/avaliacoes/456/inativar

❌ column "processamento_em" does not exist
```

**Impacto:** Gestores não conseguem inativar avaliações problemáticas

#### 3. Bloqueio da Máquina de Estados

**Estados esperados:**

```
avaliacoes: iniciada → em_andamento → concluido
lotes_avaliacao: rascunho → pronto → em_avaliacao → concluido → emitido
```

**Problema:**

- Trigger `prevent_mutation_during_emission()` falha em QUALQUER UPDATE
- Status fica travado em `iniciada` ou `em_andamento`
- Lote nunca atinge `concluido`
- Botão "Solicitar emissão" só aparece quando lote está `concluido`
- Resultado: **Fluxo completamente travado**

---

## 🛠️ Solução Implementada

### Passo 1: Diagnóstico (Completo ✅)

**Scripts criados:**

- `scripts/diagnostico-prevent-mutation-function.sql` - Queries diagnósticas
- Identificação das 2 funções afetadas
- Análise do histórico de migrations

### Passo 2: Correção Emergencial (Migration 1009 ✅)

**Arquivo:** `1009_fix_prevent_mutation_function_prod.sql`  
**Status:** ✅ **APLICADA EM PROD** (2026-02-10 15:30)  
**Efeito:** Corrigiu 1 das 2 funções (avaliacoes)

**Script de aplicação:**

```bash
node scripts/aplicar-correcao-prevent-mutation-simples.cjs
```

**Resultado:**

```
✓ Conectado ao banco de PROD
❌ ANTES: Function tem referência a processamento_em
✓ Migration executada
✅ DEPOIS: Function não tem mais referência a processamento_em
✅ CORREÇÃO APLICADA COM SUCESSO!
```

### Passo 3: Correção Definitiva (Migration 1010 📝)

**Arquivo:** `1010_consolidar_correcao_prevent_mutation_functions.sql`  
**Status:** 📝 **CRIADA** - Aguardando aplicação  
**Efeito:** Corrige AMBAS as funções + validação completa

**Script de aplicação:**

```bash
node scripts/aplicar-migration-1010.cjs
```

**Próximos passos:**

1. ✅ Criar script de aplicação
2. ⏳ Executar em PROD
3. ⏳ Validar correções
4. ⏳ Testar rotas afetadas
5. ⏳ Monitorar logs
6. ⏳ Commit e push

---

## ✅ Checklist de Testes

### Após Aplicar Migration 1010

#### 1. Testes de Respostas

- [ ] **POST /api/avaliacao/respostas** (salvar 1 resposta)
- [ ] **Verificar:** Resposta salva sem erro
- [ ] **Verificar:** Auto-conclusão funciona (se 100% respostas)
- [ ] **Verificar:** Status atualiza: `iniciada` → `em_andamento`
- [ ] **Verificar:** Log "[AUTO-CONCLUSAO] Avaliacao X COMPLETA" aparece sem erro

#### 2. Testes de Inativação

- [ ] **PATCH /api/entidade/lote/[id]/avaliacoes/[id]/inativar**
- [ ] **PATCH /api/rh/lotes/[id]/avaliacoes/[id]/inativar**
- [ ] **Verificar:** Avaliação fica `inativo: true`
- [ ] **Verificar:** Sem erros nos logs

#### 3. Testes de Conclusão de Lote

- [ ] Completar todas as avaliações de um lote
- [ ] **Verificar:** Lote status atualiza para `concluido`
- [ ] **Verificar:** Trigger `fn_recalcular_status_lote_on_avaliacao_update` dispara
- [ ] **Verificar:** Botão "Solicitar emissão de laudo" aparece no front-end

#### 4. Testes de Edição (Proteção)

- [ ] Criar laudo com status `emitido`
- [ ] Tentar editar avaliacao do lote
- [ ] **Verificar:** Edição bloqueada com mensagem apropriada
- [ ] **Verificar:** Exceção "Não é permitido alterar campos críticos após emissão"

#### 5. Monitoramento de Logs (24h)

- [ ] Verificar ausência de erros `42703` (column does not exist)
- [ ] Verificar ausência de erros em `/api/avaliacao/respostas`
- [ ] Verificar auto-conclusões acontecendo normalmente
- [ ] Verificar transições de status funcionando

---

## 📚 Documentação Relacionada

### Arquivos Criados

1. **RELATORIO_CORRECAO_PREVENT_MUTATION_2026-02-10.md** (600+ linhas)
   - Análise detalhada do problema
   - Migration 1009
2. **RELATORIO_CORRECAO_PREVENT_MUTATION_APLICADA_2026-02-10.md** (400+ linhas)
   - Status de aplicação da Migration 1009
3. **RELATORIO_CONSOLIDADO_PREVENT_MUTATION_2026-02-10.md** (este arquivo)
   - Visão completa do problema e solução

### Migrations Relacionadas

- `007a_add_processamento_em.sql` - Adição original
- `098_corrigir_funcao_prevent_lote_mutation.sql` - Tentativa correção 1
- `099_corrigir_funcao_prevent_mutation.sql` - Tentativa correção 2
- `100_add_trigger_block_mutations_during_emission.sql` - Reintrodução do problema
- `130_remove_auto_emission_columns.sql` - Remoção da coluna
- `1009_fix_prevent_mutation_function_prod.sql` - Correção parcial ✅
- `1010_consolidar_correcao_prevent_mutation_functions.sql` - Correção definitiva 📝

### Scripts Utilitários

- `scripts/diagnostico-prevent-mutation-function.sql`
- `scripts/aplicar-correcao-prevent-mutation.ps1`
- `scripts/aplicar-correcao-prevent-mutation.cjs` (v1 complexa)
- `scripts/aplicar-correcao-prevent-mutation-simples.cjs` (v2 usada)
- `scripts/aplicar-migration-1010.cjs` (novo, para 1010)

---

## 🎯 Prevenção Futura

### 1. Validação Antes de Remover Colunas

```sql
-- SEMPRE fazer antes de DROP COLUMN:
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%nome_da_coluna%'
  AND n.nspname = 'public';
```

### 2. Sequência de Migrations

- Usar timestamps corretos (YYYYMMDDHHMMSS)
- Nunca aplicar migrations fora de ordem
- Sempre testar em DEV antes de PROD
- Validar que DEV e PROD têm mesmo schema hash

### 3. Migrations Auto-Validadas

Toda migration que altera funções deve incluir:

```sql
DO $$
DECLARE
  v_function_def TEXT;
BEGIN
  -- Buscar definição
  SELECT pg_get_functiondef(oid) INTO v_function_def
  FROM pg_proc WHERE proname = 'minha_funcao';

  -- Validar ausência de campos removidos
  IF v_function_def LIKE '%campo_removido%' THEN
    RAISE EXCEPTION 'Função ainda referencia campo removido!';
  END IF;
END $$;
```

### 4. Testes Automatizados

Criar teste que valida funções:

```javascript
// tests/database/functions.test.ts
describe('Database Functions', () => {
  it('should not reference removed columns', async () => {
    const result = await db.query(`
      SELECT proname, pg_get_functiondef(oid) as def
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
        AND pg_get_functiondef(oid) LIKE '%processamento_em%';
    `);

    expect(result.rows).toHaveLength(0);
  });
});
```

---

## 📊 Resumo Final

| Item               | Status      | Observações                                 |
| ------------------ | ----------- | ------------------------------------------- |
| **Diagnóstico**    | ✅ Completo | Identificado overwrite de migrations        |
| **Migration 1009** | ✅ Aplicada | Corrigiu prevent_mutation_during_emission() |
| **Migration 1010** | 📝 Criada   | Aguardando aplicação                        |
| **Scripts**        | ✅ Criados  | aplicar-migration-1010.cjs pronto           |
| **Documentação**   | ✅ Completa | 3 relatórios detalhados                     |
| **Testes**         | ⏳ Pendente | Após aplicar 1010                           |
| **Monitoramento**  | ⏳ Pendente | 24h após aplicação                          |

---

## 🚀 Próxima Ação

**EXECUTAR AGORA:**

```bash
cd c:\apps\QWork
node scripts/aplicar-migration-1010.cjs
```

**Após sucesso:**

```bash
git add database/migrations/1010_*.sql scripts/aplicar-migration-1010.cjs RELATORIO_*.md
git commit -m "fix(db): Consolidate prevent_mutation functions corrections (Migration 1010)"
git push origin main
```

**Esperar deploy Vercel** ou forçar:

```bash
vercel --prod
```

**Testar rotas:**

1. POST /api/avaliacao/respostas
2. PATCH /api/.../inativar
3. Verificar botão "Solicitar emissão"

---

## 🔗 Referências

- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) → 42703 = undefined_column
- [PL/pgSQL Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [ALTER TABLE CASCADE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

**Relatório compilado por:** GitHub Copilot  
**Data:** 10/02/2026  
**Versão:** 1.0 (Consolidado)
