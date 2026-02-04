# MIGRATIONS LEGADAS COM AUTO-EMISSÃO

## Migration 302: Sanitização Agressiva de Auto-Emissão

Data: 2026-02-04

---

## ⚠️ MIGRATIONS LEGADAS IDENTIFICADAS

As migrations abaixo foram aplicadas no passado e contém lógica de auto-emissão que foi **REMOVIDA** pela Migration 302. Estas migrations **NÃO DEVEM SER RE-APLICADAS** em produção.

### 1. `072_fix_lote_trigger_allow_date_updates.sql` ❌ LEGADO

- **Linhas 38-39**: Verifica mudanças em `auto_emitir_em` e `auto_emitir_agendado`
- **Status**: Trigger legado - Migration 302 remove essas colunas
- **Ação**: NÃO re-aplicar. Coluna não existe mais.

### 2. `076_create_auditoria_notificacoes.sql` ⚠️ PARCIALMENTE LEGADO

- **Linha 29**: Comentário menciona `emissao_automatica` como exemplo de ação
- **Status**: Comentário histórico
- **Ação**: Manter comentário mas entender que `emissao_automatica` não é mais usado

### 3. `130_remove_auto_emission_columns.sql` ✅ VÁLIDA (ANTECESSORA)

- **Propósito**: Tentativa anterior de remover colunas `auto_emitir_em` e `auto_emitir_agendado`
- **Status**: Parcialmente aplicada - Migration 302 garante remoção completa
- **Ação**: Manter como histórico

### 4. `131_replace_recalcular_status_lote_manual.sql` ✅ VÁLIDA (ANTECESSORA)

- **Propósito**: Substituir recalculo automático por manual
- **Linhas 10, 165-166**: Documentação de remoção de `auto_emitir_agendado` e `auto_emitir_em`
- **Status**: Preparatória para Migration 150
- **Ação**: Manter como histórico

### 5. `150_remove_auto_emission_trigger.sql` ✅ CRÍTICA - JÁ APLICADA

- **Propósito**: Remove `INSERT INTO fila_emissao` do trigger `fn_recalcular_status_lote_on_avaliacao_update`
- **Linha 94**: Comentário mostrando código removido
- **Status**: **APLICADA EM PRODUÇÃO** ✅
- **Ação**: NÃO re-aplicar. Já funcionando.

### 6. `153_restore_manual_emission_requests.sql` ⚠️ INVESTIGAR

- **Linha 14**: `INSERT INTO fila_emissao`
- **Status**: Pode ter reintroduzido lógica de fila
- **Ação**: **REVISAR** - Verificar se essa migration reverteu a 150

### 7. `202_otimizar_auditoria_laudos.sql` ⚠️ PARCIALMENTE LEGADO

- **Linha 133**: Comentário menciona `emissao_automatica` e `envio_automatico`
- **Status**: Comentário histórico no campo `acao` de `auditoria_laudos`
- **Ação**: Manter comentário mas entender que `emissao_automatica` não é mais usado

### 8. `302_sanitize_auto_emission_aggressive.sql` ✅ NOVA - A SER APLICADA

- **Propósito**: **SANITIZAÇÃO DEFINITIVA** de toda auto-emissão
- **Status**: CRIADA - aguardando aplicação em produção
- **Ação**: **APLICAR** esta migration para limpar sistema completamente

---

## 🔍 MIGRATION 153 - INVESTIGAÇÃO OBRIGATÓRIA

A migration `153_restore_manual_emission_requests.sql` **PRECISA SER INVESTIGADA** imediatamente:

```sql
INSERT INTO fila_emissao (
```

**PROBLEMA POTENCIAL**: Se essa migration reinsere registros em `fila_emissao`, pode ter REVERTIDO a Migration 150!

**AÇÃO OBRIGATÓRIA**:

1. Ler migration 153 completa
2. Verificar se ela reintroduz auto-emissão
3. Se sim, comentar/remover essa logic antes de aplicar Migration 302

---

## ✅ VALIDAÇÃO PÓS-MIGRATION 302

Após aplicar Migration 302, executar queries de validação:

```sql
-- 1. Verificar que colunas foram removidas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao'
AND column_name IN ('auto_emitir_em', 'auto_emitir_agendado', 'emissao_automatica');
-- Resultado esperado: 0 linhas

-- 2. Verificar que laudos fantasma foram removidos
SELECT COUNT(*) FROM laudos
WHERE hash_pdf IS NULL AND emissor_cpf IS NULL AND status IS NULL;
-- Resultado esperado: 0

-- 3. Verificar que view fila_emissao não existe
SELECT COUNT(*) FROM information_schema.views
WHERE table_name IN ('fila_emissao', 'v_fila_emissao');
-- Resultado esperado: 0

-- 4. Verificar que triggers não inserem em fila_emissao
SELECT pg_get_functiondef(p.oid) FROM pg_proc p
WHERE p.proname LIKE '%recalcular%' OR p.proname LIKE '%emitir%';
-- Não deve conter "INSERT INTO fila_emissao"
```

---

## 📚 HISTÓRICO DE MIGRATIONS DE AUTO-EMISSÃO

### Cronologia:

1. **072** (antiga) - Trigger permitia updates em `auto_emitir_em`
2. **076** (antiga) - Criação de auditoria com ações de `emissao_automatica`
3. **130** (2024?) - Primeira tentativa de remover colunas `auto_emitir_*`
4. **131** (2024?) - Substituir recalculo automático por manual
5. **150** (2025) - ✅ **CRÍTICA** - Remove `INSERT INTO fila_emissao` do trigger
6. **153** (2025?) - ⚠️ **SUSPEITA** - Pode ter reinserido lógica de fila
7. **302** (2026-02-04) - ✅ **DEFINITIVA** - Sanitização agressiva completa

### Resultado Final Esperado:

- ❌ Nenhuma coluna `auto_emitir_*` em `lotes_avaliacao`
- ❌ Nenhuma view `fila_emissao` ou `v_fila_emissao`
- ❌ Nenhum trigger ou função inserindo em `fila_emissao`
- ❌ Nenhum laudo "fantasma" (sem hash_pdf, sem emissor_cpf)
- ✅ Todos os laudos gerados **MANUALMENTE** pelo emissor
- ✅ Lotes ficam 'concluido' aguardando solicitação de emissão

---

## 🚨 PRIORIDADE MÁXIMA

Antes de aplicar Migration 302, **LER E VALIDAR Migration 153** para garantir que não há conflito!
