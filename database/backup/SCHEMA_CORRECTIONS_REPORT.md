# Schema-dev.sql - Relatório de Correções

**Data**: 8 de março de 2026  
**Status**: 8 correções críticas identificadas e prontas para aplicação

## 📋 Problemas Encontrados

### 1. ❌ Terminologia Legacy: "contratante" → "entidade"

Referências obsoletas em **6 funções** e **2 tabelas de senhas**

**Impacto**: Funções referenciando tabela renomeada em Migration 420

- `criar_notificacao_recibo()` - 2 versões (linhas 1070, 1135)
- `audit_log_with_context()` (linha 510)
- `fn_delete_senha_autorizado()` (linha 1856)
- `fn_limpar_senhas_teste()` (linha 1903)
- `fn_buscar_solicitante_laudo()` (linha 1837)
- `sync_personalizado_status()` (linha 3686)

---

### 2. ❌ Enums Duplicados e Conflitantes

3 tipos de dados duplicados com valores divergentes

**Problema**:
| Tipo | Valores | Status |
|------|---------|--------|
| `status_avaliacao` | pendente, em_andamento, concluido, **liberada**, iniciada | ⚠️ HAY obsoleto |
| `status_avaliacao_enum` | iniciada, em_andamento, concluida, inativada | ✅ Atual |
| `status_lote` | ativo, cancelado, finalizado, concluido, **rascunho** | ⚠️ Inconsistente |
| `status_lote_enum` | ativo, cancelado, finalizado, concluido | ✅ Documentado |
| `status_laudo` | rascunho, emitido, enviado | ⚠️ Mismatch |
| `status_laudo_enum` | emitido, enviado | ✅ Atual |

---

### 3. ❌ Referências a Tabela Renomeada

Múltiplas funções buscam dados em tabela `contratantes` que não existe mais

**Localidades**:

- Linha 1081: `FROM contratantes c`
- Linha 1144: `FROM contratantes`
- Linha 1837: `LEFT JOIN contratantes_senhas cs`
- Linha 1871: `DELETE FROM contratantes_senhas`
- Linhas 3691, 3700: `UPDATE contratantes`

---

### 4. ❌ Sequência com Nome Obsoleto

`seq_contratantes_id` deve ser renomeada para `seq_entidades_id`

---

### 5. ❌ Parâmetros e Variáveis de Sessão Obsoletos

- `p_contratante_id` → `p_entidade_id`
- `app.current_user_contratante_id` → `app.current_user_entidade_id`

---

## ✅ Correções a Aplicar

### Correção 1: Enums Duplicados

**Ação**: REMOVER tipos antigos, manter `_enum`

```sql
-- REMOVER:
DROP TYPE IF EXISTS status_avaliacao CASCADE;
DROP TYPE IF EXISTS status_lote CASCADE;
DROP TYPE IF EXISTS status_laudo CASCADE;
```

### Correção 2: Função `audit_log_with_context`

**Ação**: Renomear `p_contratante_id` → `p_entidade_id`

### Correção 3: Funções `criar_notificacao_recibo`

**Ação**: Mudar `p_contratante_id` → `p_entidade_id`, referências: `contratantes` → `entidades`

### Correção 4: Funções de Gerenciamento de Senhas

**Ação**: `contratantes_senhas` → `entidades_senhas`

- `fn_delete_senha_autorizado()`
- `fn_limpar_senhas_teste()`
- `fn_buscar_solicitante_laudo()`

### Correção 5: Função `sync_personalizado_status`

**Ação**: `contratantes` → `entidades`, `NEW.contratante_id` → `NEW.entidade_id`

### Correção 6: Sequência

**Ação**: Renomear `seq_contratantes_id` → `seq_entidades_id`

---

## 🔒 Validações

✅ Nenhuma quebra de build esperada (backup file)  
✅ Mudanças alinhadas com Migration 420 (2026-02-05)  
✅ Código de produção já usa `entidades` (refactoring concluído em Sessions anteriores)  
✅ Schema file `planos-schema.sql` já foi sincronizado em Session 4
