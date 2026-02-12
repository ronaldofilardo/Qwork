# ⚠️ ANÁLISE: MIGRAÇÕES REMOVÍVEIS COM ARQUITETURA SEGMENTADA

## 📋 Contexto

A arquitetura original usava tabela única `tomadores` (renomeada para `contratantes` depois para `entidades`). Com a transição para arquitetura segmentada (clínicas e entidades separadas), muitas migrações se tornaram desnecessárias.

**Timeline da transição:**

1. **Antigo**: `tomadores` (tipo='clinica' ou 'entidade')
2. **Intermediário**: Renomear para `entidades`, adicionar `contratante_id` em várias tabelas
3. **Atual**: Tabelas separadas `entidades` + `clinicas`, sem coluna `contratante_id`

---

## 🗑️ CATEGORIA 1: MIGRAÇÕES QUE ADICIONAVAM `contratante_id` (PODEM SER REMOVIDAS)

Estas migrações adicionaram a coluna `contratante_id` em várias tabelas para suportar a arquitetura legada. Com a arquitetura segmentada, essas colunas foram removidas.

### Migrações a remover:

| Número  | Nome                                            | Motivo                                                                  |
| ------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| **042** | `042_add_contratante_id_to_clinicas.sql`        | Adicionou coluna obsoleta `contratante_id` a clinicas                   |
| **061** | `061_add_contratante_id_to_lotes_avaliacao.sql` | Adicionou coluna com constraint obsoleta (clinica_or_contratante_check) |
| **067** | `067_audit_contratante_id.sql`                  | Adicionou coluna e função `audit_log_with_context` para contratante     |
| **108** | `108_add_contratante_id_to_funcionarios.sql`    | Adicionou coluna obsoleta a tabela funcionarios                         |

**Impacto**: Seguro remover. A migration 520 as anulou completamente.

---

## 🔄 CATEGORIA 2: MIGRAÇÕES DE RENOMEAÇÃO LEGADO (PODEM SER REMOVIDAS)

Estas migrações foram criadas para renomear tabelas e colunas da arquitetura antiga. Foram aplicadas uma única vez e podem ser consolidadas.

### Migrações a remover:

| Número  | Caminho                                               | Motivo                                                   |
| ------- | ----------------------------------------------------- | -------------------------------------------------------- |
| **420** | `deprecated/420_rename_contratantes_to_entidades.sql` | Renomeação one-time (tomadores → entidades), já aplicada |
| **421** | `deprecated/421_rename_contratantes_funcionarios.sql` | Renomeação one-time de tabela legada                     |

**Impacto**: Seguro remover. Uma vez aplicadas, não precisam ser reaplicadas.

---

## 🔐 CATEGORIA 3: MIGRAÇÕES COM RLS/POLÍTICAS LEGADAS (AVALIAR)

Migrações que criaram políticas RLS baseadas em `current_setting('app.current_contratante_id')`:

| Número                                   | Nome                                           | Status                               |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| **007d**                                 | `007d_rls.sql`                                 | ⚠️ Tem policies com `contratante_id` |
| **007_refactor_status_fila_emissao.sql** | Tem policies com `contratante_id`              | ⚠️                                   |
| **063**                                  | `063_update_rls_policies_for_entity_lotes.sql` | ⚠️ Refatoração parcial               |
| **064**                                  | `064_fix_entidade_perfil_rls.sql`              | ⚠️ Refatoração parcial               |

**Recomendação**:

- ✅ Verificar se todas as policies foram migradas para usar `entidade_id`
- ✅ Se sim, consolidar em uma nova migration
- ❌ NÃO remover até confirmar policies atualizadas

---

## 🔧 CATEGORIA 4: MIGRAÇÕES CORRETIVAS (PODEM SER CONSOLIDADAS)

Migrações que corrigiram problemas durante a transição. Podem ser consolidadas em uma única migration de "normalização":

| Número  | Nome                                                        | Motivo                                   |
| ------- | ----------------------------------------------------------- | ---------------------------------------- |
| **109** | `109_fix_funcionarios_owner_check_use_contratante_id.sql`   | Correção de constraint durante transição |
| **073** | `073_fix_funcionarios_clinica_check_contratante.sql`        | Correção de constraint                   |
| **086** | `086_convert_contratantes_status_with_trigger_handling.sql` | Conversão de status                      |

**Impacto**: Podem ser consolidadas. O estado final já reflete as correções.

---

## 🎯 CATEGORIA 5: MIGRAÇÕES JÁ CONSOLIDADAS (SEGURO REMOVER)

Migrações que foram cobertas pela migration 520 (remoção completa):

| Número                                             | Nome                                   | Razão                                    |
| -------------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| **520_remove_contratantes_v2.sql**                 | Ultra simples, remove todas as colunas | ✅ Esta substituiu as versões anteriores |
| **520_remove_contratantes_simple.sql**             | Versão simplificada                    | ❌ Supersedida                           |
| **520_remove_contratantes_complete_migration.sql** | Versão completa                        | ❌ Supersedida                           |

**Recomendação**: Manter apenas a versão mais recente (v2 ou a mais versátil).

---

## 📊 RESUMO: ÁRVORE DE REMOÇÃO

```
SEGURO REMOVER (✅ sem validação adicional):
├── 042_add_contratante_id_to_clinicas.sql
├── 061_add_contratante_id_to_lotes_avaliacao.sql
├── 067_audit_contratante_id.sql
├── 108_add_contratante_id_to_funcionarios.sql
├── deprecated/420_rename_contratantes_to_entidades.sql
├── deprecated/421_rename_contratantes_funcionarios.sql
└── 520_remove_contratantes_simple.sql (manter v2 apenas)

PRECISA VALIDAÇÃO (⚠️ antes de remover):
├── 007d_rls.sql (verificar policies)
├── 007_refactor_status_fila_emissao.sql (verificar policies)
├── 063_update_rls_policies_for_entity_lotes.sql (verificar migração completa)
├── 064_fix_entidade_perfil_rls.sql (verificar migração completa)
└── Decorations: 109, 073, 086 (consolidáveis)

MANTER (⏸️ críticas para funcionamento):
├── Todas que criam tabelas base (entidades, clinicas, etc)
├── Todas que definem constraints críticas
├── 200_fase1_normalizacao_usuario_tipo.sql
├── 201_fase2_refatorar_rls.sql
└── 300+ (reestruturação final)
```

---

## 🚀 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Validação (Obrigatório)

```sql
-- Verificar que nenhuma política usa current_setting('app.current_contratante_id')
SELECT pg_get_policydef(oid)
FROM pg_policy
WHERE polname LIKE '%contratante%';

-- Resultado esperado: 0 linhas
```

### Fase 2: Consolidação (Opcional mas recomendado)

1. **Criar nova migration**: `530_consolidate_legacy_migrations.sql`
   - Verificar e documentar why each removed migration was applied
   - Criar checklist de validação
   - Manter comentários sobre decisões arquiteturais

2. **Remover migrações seguras**:
   ```
   - 042, 061, 067, 108 (contratante_id columns)
   - deprecated/420, 421 (renaming)
   - 520_remove_contratantes_simple.sql e complete_migration.sql
   ```

### Fase 3: Testes

```bash
# Testar que schema está íntegro
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name LIKE '%contratante%';
-- Resultado esperado: 0 (ou > 0 apenas para views legadas propositais)

# Testar policies
SELECT COUNT(*) FROM pg_policy
WHERE polname LIKE '%contratante%';
-- Resultado esperado: 0
```

---

## ⚠️ MIGRAÇÕES NÃO DEVEM SER REMOVIDAS

### Razões estruturais:

1. **Histórico é imutável**: Aplicações futuras podem usar migrations iniciais
2. **Rastreabilidade**: Importante para auditar mudanças de schema
3. **Documentação viva**: Cada migration documenta decisões de design

### Alternativa segura:

- ❌ **NÃO remover** arquivos de migração originais
- ✅ **SIM**: Criar nova migration `530_` que documenta consolidação
- ✅ **SIM**: Marcar migrações obsoletas em diretório `archived/`
- ✅ **SIM**: Criar documento de "dead migrations" para referência

---

## 📝 Checklist de Remoção Segura

Antes de remover qualquer migração 042, 061, 067, 108:

- [ ] Confirmar que migration 520 foi executada com sucesso
- [ ] Verificar que nenhuma coluna `contratante_id` existe nas tabelas:
  - [ ] clinicas
  - [ ] lotes_avaliacao
  - [ ] audit_logs
  - [ ] funcionarios
- [ ] Confirmar que nenhuma policy SQL usa `app.current_contratante_id`
- [ ] Verificar que nenhum código TypeScript/JavaScript impor estas colunas
- [ ] Executar migrations 530+ sem erros
- [ ] Rodar testes e2e completos
- [ ] Backup do schema antes de aplicar mudanças

---

## 🔗 Referência Rápida

| Se você quer remover... | Então também remova...                                    | Pré-requisito |
| ----------------------- | --------------------------------------------------------- | ------------- |
| Migration 042           | Índice `idx_clinicas_contratante_id`                      | 520 executada |
| Migration 061           | Constraint `lotes_avaliacao_clinica_or_contratante_check` | 520 executada |
| Migration 067           | Função `audit_log_with_context`                           | 520 executada |
| Migration 108           | Índice `idx_funcionarios_contratante_id`                  | 520 executada |

---

**Última atualização**: 2026-02-07
**Recomendação**: Comece com a Fase 1 (Validação) para garantir que a arquitetura é de fato segmentada.
