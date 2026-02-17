# 🚨 Correção Crítica - Trigger Produção

**Data:** 16 de Fevereiro de 2026  
**Status:** ⚠️ URGENTE - Bloqueando liberação de lotes em PROD

---

## 📋 Problema Identificado

### Erro em Produção

```
error: record "new" has no field "funcionario_id"
WHERE id = NEW.funcionario_id
PL/pgSQL function atualizar_ultima_avaliacao_funcionario() line 3 at SQL statement
```

### Causa Raiz

A função trigger `atualizar_ultima_avaliacao_funcionario()` em **PRODUÇÃO** está com código **INCORRETO**:

❌ **Versão Errada (em PROD atualmente):**

- Tenta acessar `NEW.funcionario_id` (campo que **NÃO existe** na tabela `avaliacoes`)
- Usa `WHERE id = NEW.funcionario_id` (campo errado na tabela `funcionarios`)
- Cria trigger na tabela `lotes_avaliacao` (tabela errada)
- Tenta atualizar campos inexistentes: `ultima_avaliacao_data`, `ultima_avaliacao_score`

✅ **Versão Correta (migração 165):**

- Usa `NEW.funcionario_cpf` (campo correto da tabela `avaliacoes`)
- Usa `WHERE cpf = NEW.funcionario_cpf` (campo correto da tabela `funcionarios`)
- Cria trigger na tabela `avaliacoes` (tabela correta)
- Atualiza apenas campos que existem: `ultima_avaliacao_id`, `ultima_avaliacao_data_conclusao`, `ultima_avaliacao_status`

---

## 🔧 Solução Implementada

### Arquivos Corrigidos

1. ✅ [scripts/URGENT_FIX_TRIGGER_PROD.sql](scripts/URGENT_FIX_TRIGGER_PROD.sql) - **NOVO**
   - Script de correção urgente para aplicar em PROD
2. ✅ [scripts/deploy-prod-migrations.sql](scripts/deploy-prod-migrations.sql)
   - Corrigida função trigger na Migração 1
3. ✅ [DEPLOYMENT-PRODUCAO-72H.md](DEPLOYMENT-PRODUCAO-72H.md)
   - Atualizada seção de Migração 165
4. ✅ [DEPLOYMENT-QUICK-REFERENCE.md](DEPLOYMENT-QUICK-REFERENCE.md)
   - Atualizado comando de correção
5. ✅ [GUIA-TECNICO-ALTERACOES-PROD.md](GUIA-TECNICO-ALTERACOES-PROD.md)
   - Atualizado resumo da migração 165

---

## 🚀 Como Aplicar a Correção em PROD

### Opção 1: Script Urgente (Recomendado)

```bash
# Conectar ao banco de produção
psql -U <usuario> -d <database> -h <host>

# Executar script de correção
\i scripts/URGENT_FIX_TRIGGER_PROD.sql
```

### Opção 2: Comandos Manuais

```sql
BEGIN;

-- 1. Remover trigger e função existentes
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes CASCADE;
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON lotes_avaliacao CASCADE;
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario() CASCADE;

-- 2. Criar função CORRIGIDA
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger CORRIGIDO
CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER UPDATE OF status, envio, inativada_em
ON avaliacoes
FOR EACH ROW
WHEN (
  (NEW.status IN ('concluida', 'inativada') AND OLD.status <> NEW.status)
  OR (NEW.envio IS NOT NULL AND OLD.envio IS NULL)
  OR (NEW.inativada_em IS NOT NULL AND OLD.inativada_em IS NULL)
)
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

COMMIT;
```

### 3. Validação Pós-Correção

```sql
-- Verificar que trigger foi criado corretamente
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';

-- Esperado:
-- trigger_name: trigger_atualizar_ultima_avaliacao
-- event_object_table: avaliacoes
-- action_timing: AFTER
-- event_manipulation: UPDATE

-- Verificar que função existe
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario';

-- Esperado: 1 row
```

---

## 🧪 Teste Pós-Correção

Após aplicar a correção, tente liberar um lote novamente:

1. Acesse o sistema como gestor de entidade
2. Vá para a área de lotes
3. Tente iniciar/liberar um lote
4. ✅ Deve funcionar sem erros

---

## 📊 Impacto

### Antes da Correção

- ❌ Impossível liberar lotes em PROD
- ❌ Erro: "record 'new' has no field 'funcionario_id'"
- ❌ Bloqueio total do fluxo de avaliações

### Após a Correção

- ✅ Lotes podem ser liberados normalmente
- ✅ Trigger funciona corretamente na tabela `avaliacoes`
- ✅ Campos denormalizados são atualizados corretamente

---

## 🔍 Como o Erro Foi Introduzido

1. A migração 165 original estava **correta** no arquivo [database/migrations/165_fix_atualizar_ultima_avaliacao_trigger.sql](database/migrations/165_fix_atualizar_ultima_avaliacao_trigger.sql)

2. Porém, o arquivo [scripts/deploy-prod-migrations.sql](scripts/deploy-prod-migrations.sql) tinha uma **versão incorreta** da função

3. Os guias de deployment também tinham a versão incorreta

4. Quando o deploy foi feito em PROD, foi usada a versão **incorreta** do script de deploy

---

## ✅ Checklist de Correção

- [x] Script urgente criado
- [x] Arquivo `deploy-prod-migrations.sql` corrigido
- [x] Guia `DEPLOYMENT-PRODUCAO-72H.md` atualizado
- [x] Guia `DEPLOYMENT-QUICK-REFERENCE.md` atualizado
- [x] Guia `GUIA-TECNICO-ALTERACOES-PROD.md` atualizado
- [ ] Script aplicado em PROD ⚠️ **PENDENTE**
- [ ] Validação pós-correção ⚠️ **PENDENTE**
- [ ] Teste de liberação de lote ⚠️ **PENDENTE**

---

## 📞 Próximos Passos

1. **URGENTE:** Aplicar script [URGENT_FIX_TRIGGER_PROD.sql](scripts/URGENT_FIX_TRIGGER_PROD.sql) em PROD
2. Executar validação pós-correção
3. Testar liberação de lote
4. Confirmar que sistema voltou ao normal
5. Monitorar logs para garantir que não há mais erros

---

**Criado em:** 16/02/2026  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ⏳ Aguardando aplicação em PROD
