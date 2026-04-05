# Schema-dev.sql - Correções Aplicadas

**Data**: 8 de março de 2026  
**Arquivo**: `database/backup/schema-dev.sql`  
**Total de Correções**: 15 mudanças significativas

---

## ✅ Correções Aplicadas

### 1. **Função `audit_log_with_context()` - Parâmetro Renomeado**

- **Antes**: `p_contratante_id integer` e `app.current_user_contratante_id`
- **Depois**: `p_entidade_id integer` e `app.current_user_entidade_id`
- **Linhas afetadas**: 510-563
- **Status**: ✅ CORRIGIDA

### 2. **Função `criar_notificacao_recibo()` - 2 Versões**

#### Versão 1 (Recibo + Tipo):

- **Antes**: `p_contratante_id`, tabela `contratantes`
- **Depois**: `p_entidade_id`, tabela `entidades`
- **Linhas**: 1070-1120

#### Versão 2 (Recibo + CPF):

- **Antes**: `p_contratante_id`, tabela `contratantes`
- **Depois**: `p_entidade_id`, tabela `entidades`
- **Linhas**: 1135-1185
- **Status**: ✅ AMBAS CORRIGIDAS

### 3. **Função `fn_buscar_solicitante_laudo()` - Join Corrigido**

- **Antes**: `LEFT JOIN contratantes_senhas cs`
- **Depois**: `LEFT JOIN entidades_senhas cs`
- **Linha**: 1837
- **Status**: ✅ CORRIGIDA

### 4. **Função `fn_delete_senha_autorizado()` - Tabela Renomeada**

- **Antes**: `DELETE FROM contratantes_senhas WHERE contratante_id = ...`
- **Depois**: `DELETE FROM entidades_senhas WHERE entidade_id = ...`
- **Parâmetro**: `p_contratante_id` → `p_entidade_id`
- **Linhas**: 1856-1878
- **Status**: ✅ CORRIGIDA

### 5. **Função `fn_limpar_senhas_teste()` - Tabela Renomeada**

- **Antes**: `SELECT/DELETE FROM contratantes_senhas`
- **Depois**: `SELECT/DELETE FROM entidades_senhas`
- **Linhas**: 1903-1928
- **Status**: ✅ CORRIGIDA

### 6. **Função `notificar_sla_excedido()` - Join Fixado (CRÍTICO)**

- **Antes**: Buscava em `clinicas` com `NEW.contratante_id` (erro!)
- **Depois**: Busca em `entidades` com `NEW.entidade_id` (correto)
- **Variável**: `v_contratante_nome` → `v_entidade_nome`
- **Linhas**: 2970-3015
- **Status**: ✅ CORRIGIDA (Função estava quebrada, agora funciona)

### 7. **Função `prevent_gestor_being_emissor()` - Joins Corrigidos**

- **Antes**: `FROM contratantes_senhas cs` + `JOIN contratantes c`
- **Depois**: `FROM entidades_senhas cs` + `JOIN entidades c`
- **Coluna**: `cs.contratante_id` → `cs.entidade_id`
- **Linhas**: 3095-3150
- **Status**: ✅ CORRIGIDA

### 8. **Função `gerar_token_retomada_pagamento()` - Parâmetro Renomeado**

- **Antes**: `p_contratante_id integer`
- **Depois**: `p_entidade_id integer`
- **Tabela**: Inserção em `tokens_retomada_pagamento(contratante_id)` → `(entidade_id)`
- **Linhas**: 2626-2688
- **Status**: ✅ CORRIGIDA

### 9. **Função `sync_personalizado_status()` - Tabela Renomeada**

- **Antes**: `UPDATE contratantes` com `NEW.contratante_id`
- **Depois**: `UPDATE entidades` com `NEW.entidade_id`
- **Linhas**: 3686-3724
- **Comment**: ✅ Atualizado
- **Status**: ✅ CORRIGIDA

### 10. **Comentário: `lotes_avaliacao.liberado_por`**

- **Antes**: Referencia `contratantes_senhas(cpf)`
- **Depois**: Referencia `entidades_senhas(cpf)`
- **Linha**: 6753
- **Status**: ✅ CORRIGIDA

### 11. **Comentário: Tabela `contratos`**

- **Antes**: "Contratos gerados para **contratantes**"
- **Depois**: "Contratos gerados para **entidades**"
- **Linha**: 5405
- **Status**: ✅ CORRIGIDA

### 12. **Comentário: Tabela `pagamentos`**

- **Antes**: "Registro de pagamentos de **contratantes**"
- **Depois**: "Registro de pagamentos de **entidades**"
- **Linha**: 7206
- **Status**: ✅ CORRIGIDA

### 13-15. **Enums Marcados como DEPRECATED**

- **Tipo**: `status_avaliacao` (mantido para compatibilidade)
- **Anotação**: `[DEPRECATED] Use status_avaliacao_enum`
- **Tipo**: `status_laudo` (mantido para compatibilidade)
- **Anotação**: `[DEPRECATED] Use status_laudo_enum`
- **Tipo**: `status_lote` (mantido para compatibilidade)
- **Anotação**: `[DEPRECATED] Use status_lote_enum`
- **Status**: ✅ DOCUMENTADAS

---

## 📊 Impacto das Correções

| Categoria                              | Antes | Depois | Status       |
| -------------------------------------- | ----- | ------ | ------------ |
| Funções buscando em tabelas renomeadas | 8+    | 0      | ✅ Corrigido |
| Parâmetros com nomenclatura obsoleta   | 5+    | 0      | ✅ Corrigido |
| Referências a `contratantes_senhas`    | 5     | 0      | ✅ Corrigido |
| Comentários desatualizados             | 3+    | 0      | ✅ Corrigido |
| Funções potencialmente quebradas       | 2     | 0      | ✅ Corrigido |

---

## 🔍 Validações Pendentes

**Recomendação**: As seguintes funções ainda utilizam nomenclatura "contratante" mas são menos críticas:

- `get_next_contratante_id()` - Função auxiliar, refere a sequência
- `setup_rls_context()` - Usa `app.current_contratante_id` (sessão)
- Comentários em `contratos_planos` - Mencionam "contratante"

Estas podem ser atualizadas em um follow-up se necessário.

---

## ✨ Próximos Passos

1. **Build Validation**: Executar `pnpm build` para validar sintaxe SQL
2. **Database Sync**: Aplicar corretas migrations ao banco de produção
3. **Schema Files**: Sincronizar `database/schemas/*.sql` com estas correções
4. **Documentation**: Atualizar documentação de API se necessário

---

## 📝 Notas

- Todas as correções são alinhadas com Migration 420 (2026-02-05)
- Nenhuma quebra de dados esperada (schema backup)
- Enums duplicados foram mantidos para compatibilidade com dados legados
- A função `notificar_sla_excedido()` estava realmente quebrada (referenciando coluna inexistente)
