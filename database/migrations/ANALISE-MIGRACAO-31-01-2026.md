# Análise Profunda das Migrações - 31/01/2026

## 📊 Resumo Executivo

**Total de arquivos analisados:** 282 arquivos SQL + 2 arquivos CJS  
**Status:** Sistema com sérios problemas de organização e manutenibilidade  
**Prioridade:** 🔴 CRÍTICA - Requer ação imediata

---

## 🚨 Problemas Críticos Identificados

### 1. **Duplicação Massiva de Migrações**

#### 1.1 Múltiplas Versões do Mesmo Arquivo

| Arquivo Base                                          | Versões                          | Problema                             |
| ----------------------------------------------------- | -------------------------------- | ------------------------------------ |
| `001_security_rls_rbac.sql`                           | 2 arquivos (normal + utf8)       | Encoding duplicado                   |
| `030_protecao_senhas_critica.sql`                     | 3 arquivos (normal, utf8, ascii) | Encoding triplicado                  |
| `062_add_calcular_elegibilidade_lote_contratante.sql` | 3 arquivos (normal, utf8, clean) | Versões conflitantes                 |
| `105/108_add_contratante_id_to_funcionarios.sql`      | 2 arquivos                       | Mesma funcionalidade, IDs diferentes |
| `071/104_add_data_nascimento_funcionarios.sql`        | 2 arquivos                       | Coluna adicionada 2x                 |
| `206_add_gestor_role.sql`                             | 2 arquivos (normal + clean)      | Versão limpa duplicada               |
| `207_add_current_user_contratante_id_helper.sql`      | 2 arquivos (normal + clean)      | Versão limpa duplicada               |
| `063/207_current_user_contratante_id.sql`             | 2 arquivos                       | Função criada 2x com IDs diferentes  |
| `211_create_dba_maintenance_role.sql`                 | 2 arquivos (normal + neon)       | Ambiente duplicado                   |
| `208_sync_with_neon.sql`                              | 2 arquivos (normal + test)       | Teste e produção misturados          |
| `999_correcoes_criticas_seguranca.sql`                | 2 arquivos (normal + test)       | Crítico duplicado                    |

**Impacto:** 20+ arquivos duplicados com conflitos potenciais

#### 1.2 Migrações Obsoletas/Descontinuadas

- `080_add_liberada_status.sql.DESCONTINUADA` - Marcada como descontinuada, mas presente
- `081_remove_liberada_status.sql` - Remove o que 080 adiciona (conflito direto)
- Múltiplos arquivos de "fix" corrigindo migrações anteriores

### 2. **Sistema de Numeração Quebrado**

#### 2.1 Sequências Conflitantes

```
000-117: Sequência principal (gaps: 088, 095)
200-222: Segunda sequência (???)
996-999: Sequência de emergência/consolidação
1000-1002: Terceira sequência (???)
20260126_*: Formato de data (inconsistente)
```

#### 2.2 Prefixos Inconsistentes

- Sem prefixo numérico: ~30 arquivos
- Formato `migration-NNN-*`: 5 arquivos
- Formato `YYYYMMDD_*`: 1 arquivo
- Prefixo alfabético (`fix-*`, `apply-*`, `add-*`): 15+ arquivos

### 3. **Arquivos Fora do Padrão**

#### 3.1 Arquivos de Script (.cjs)

```
final-migration.cjs
run-migration-042.cjs
```

**Problema:** Scripts de execução misturados com definições SQL

#### 3.2 Arquivos Descritivos

```
APLICAR-096-SE-NECESSARIO.sql
apply_migrations_manual.sql
apply-all-fixes.sql
```

**Problema:** Nomenclatura em maiúsculas, sem número de sequência

#### 3.3 Nomenclaturas Ad-hoc

```
insert_senha.sql
fix_add_link_enviado_em.sql
allow-hash-backfill.sql
add-gestor-entidade-constraints.sql
```

**Problema:** Sem versionamento, dificulta rastreamento

### 4. **Migrações de Teste Misturadas com Produção**

Arquivos específicos de teste na pasta principal:

- `071_add_missing_columns_for_test_sync.sql`
- `072_convert_lotes_status_to_enum_test.sql`
- `073_drop_views_and_convert_status_test.sql`
- `075_defensive_verificar_conclusao_lote_test.sql`
- `081_add_missing_test_db_columns.sql`
- `090_adjust_fn_audit_entidades_senhas_for_tests.sql`
- `208_sync_with_neon_test.sql`
- `999_correcoes_criticas_seguranca_test.sql`
- `999_fix_nr_bps_db_test.sql`

**Total:** 9 arquivos de teste na pasta principal (deveriam estar em `/tests`)

### 5. **Conflitos Funcionais Diretos**

#### 5.1 Emissão Automática

- `011_add_auto_emitir_em.sql` - Adiciona campos
- `096_desabilitar_emissao_automatica_trigger.sql` - Desabilita
- `097_remover_campos_emissao_automatica.sql` - Remove campos
- `024_limpar_legado_emissao_automatica.sql` - Limpa legado
- `221_remove_obsolete_auto_emission.sql` - Remove obsoleto

**Problema:** Sistema adicionado e removido múltiplas vezes

#### 5.2 Status do Laudo

- `012_simplify_laudo_status.sql` - Simplifica
- `025_substituir_laudo_emitido_por_enviado.sql` - Substitui status
- `112_canonizar_status_laudo_enviado.sql` - Canoniza novamente

**Problema:** Múltiplas refatorações do mesmo enum

#### 5.3 Perfil Gestor Entidade

- `093_allow_gestor_with_contratante.sql` - Permite
- `203_disallow_gestor_in_funcionarios.sql` - Desabilita
- `206_add_gestor_role.sql` - Adiciona novamente

**Problema:** Funcionalidade ligada/desligada/religada

#### 5.4 Admin RLS Policies

- Múltiplas migrações removendo policies de admin:
  - `005_remove_admin_empresas_policies.sql`
  - `018_remove_admin_laudos_permissions.sql`
  - `020_remove_admin_operational_rls.sql`
  - `021_cleanup_admin_role_permissions.sql`
  - `022_remove_admin_funcionarios_policies.sql`
  - `023_remove_all_admin_operational_rls.sql`
  - `024_cleanup_final_admin_policies.sql`
  - `025_remove_remaining_admin_policies.sql`
  - `209_fix_admin_rls_critical.sql`

**Problema:** 9 migrações para remover/ajustar policies de admin

### 6. **Encoding Issues**

Múltiplas versões com diferentes encodings:

- Arquivos normais
- Versões `.utf8.sql`
- Versões `.ascii.sql`
- Versões `.clean.sql`

**Problema:** Indica problemas de encoding no projeto, gerando múltiplas tentativas

---

## 📂 Categorização por Funcionalidade

### Segurança & Autenticação (25 arquivos)

- RLS/RBAC: 001, 002, 004, 005, 029, 063, 064, 114, 201, 209, 210, 213, 997
- Senhas: 030 (x3), 020260126, 090, 999
- Auditoria: 003, 013, 016, 043, 046, 067, 074, 076, 077, 078

### Estrutura de Dados (40+ arquivos)

- Contratantes: 003, 031, 032, 033, 053, 084, 086, 087, 091, 115
- Funcionários: 009, 068-074, 082, 093, 100-105, 108-110, 202-203
- Empresas/Clínicas: 011, 042, 055, 201, 212
- Lotes: 000, 061, 220
- Avaliações: 007, 013, 080-081, 113, 205
- Laudos: 004, 013, 017, 065, 070, 079, 081, 091-093, 112, 1002

### Integrações & Fluxos (30+ arquivos)

- Pagamentos: 007, 021, 026, 028, 030, 041-044, 047-048, 052-054, 106-107
- Contratos: 004-006, 009, 021, 050-054, 084
- Emissão de Laudos: 011, 024, 070, 075, 082, 096-097, 221, 996
- Fila de Emissão: 007b, 070, 101, 997-998
- Recibos: 041-044, 107-108

### Notificações (10 arquivos)

- Sistema: 008, 010, 015, 023 (x2), 024 (x3), 034, 076

### Performance & Manutenção (15 arquivos)

- Índices: 014, 017, 060, 222
- Views: 007e, 008, 010-011, 016, 042, 044, 066, 076
- Funções: 006, 054, 063, 080, 092, 094, 207
- Triggers: 007c, 026, 047-048, 057-059, 072, 074, 079, 096-099

### Testes & Sincronização (15 arquivos)

- Testes: 071, 072, 073, 075, 081, 090, 208, 999
- Sincronização: 033, 045, 208, 212
- Neon Sync: 208, 211

### Correções & Fixes (60+ arquivos)

Padrão `fix_*`, `*_fix_*`, correções incrementais

---

## 🏗️ Estrutura de Dependências

### Migrações Fundamentais (Não Podem Ser Removidas)

1. `001_security_rls_rbac.sql` - Sistema de segurança base
2. `002_enable_rls.sql` - Ativação RLS
3. `003_auditoria_completa.sql` - Sistema de auditoria
4. `006_centralize_enums.sql` - Enums centralizados
5. `007a-e_*.sql` - Refatoração estrutural (5 partes)
6. `011_enable_pgcrypto_extension.sql` - Extensão de criptografia

### Migrações Estruturais (Schema Core)

- Tabelas principais: contratantes, funcionários, empresas, clínicas, lotes, avaliações, laudos
- Relacionamentos: foreign keys, constraints
- Índices críticos

### Migrações Incrementais (Podem ser Consolidadas)

- Adições de colunas: 200+ ALTER TABLE
- Ajustes de constraints: 100+ operações
- Correções de RLS: 50+ policies
- Ajustes de triggers: 30+ triggers

---

## 📋 Plano de Higienização

### Fase 1: Backup Crítico

```powershell
# Criar backup completo da pasta atual
Copy-Item -Path "database/migrations" -Destination "database/migrations.BACKUP-20260131" -Recurse

# Exportar estado atual do banco
pg_dump -U postgres -h localhost -d nr-bps_db --schema-only > database/migrations/BACKUP-schema-20260131.sql
```

### Fase 2: Criar Estrutura Organizada

```
database/migrations/
├── archived/              # Migrações antigas (< 100)
│   ├── 2024/
│   └── 2025/
├── deprecated/            # Migrações descontinuadas
├── tests/                 # Migrações de teste
├── scripts/               # Scripts CJS/MJS
├── consolidated/          # Migrações consolidadas
└── active/                # Migrações ativas (>= 200)
```

### Fase 3: Consolidação de Duplicatas

#### Ação 1: Resolver Encoding

**Decisão:** Manter apenas versões UTF-8

```sql
-- MANTER:
001_security_rls_rbac.utf8.sql → renomear para 001_security_rls_rbac.sql
030_protecao_senhas_critica_utf8.sql → renomear para 030_protecao_senhas_critica.sql
062_add_calcular_elegibilidade_lote_contratante_utf8.sql → renomear

-- REMOVER:
001_security_rls_rbac.sql (versão antiga)
030_protecao_senhas_critica.sql (versão antiga)
030_protecao_senhas_critica_ascii.sql
062_add_calcular_elegibilidade_lote_contratante.sql
062_add_calcular_elegibilidade_lote_contratante_clean.sql
```

#### Ação 2: Consolidar Duplicatas Funcionais

```sql
-- CONSOLIDAR: add_contratante_id_to_funcionarios
-- Criar: 105_108_consolidated_add_contratante_id_to_funcionarios.sql
-- Mesclar funcionalidade de ambos
-- REMOVER: 105_add_contratante_id_to_funcionarios.sql
-- REMOVER: 108_add_contratante_id_to_funcionarios.sql

-- CONSOLIDAR: add_data_nascimento_funcionarios
-- MANTER: 071_add_data_nascimento_funcionarios.sql (primeira versão)
-- REMOVER: 104_add_data_nascimento_funcionarios.sql

-- CONSOLIDAR: gestor_role
-- MANTER: 206_add_gestor_role_clean.sql
-- REMOVER: 206_add_gestor_role.sql

-- CONSOLIDAR: current_user_contratante_id
-- MANTER: 207_add_current_user_contratante_id_helper_clean.sql
-- REMOVER: 063_5_add_current_user_contratante_id_function.sql
-- REMOVER: 207_add_current_user_contratante_id_helper.sql
```

#### Ação 3: Arquivar Migrações de Teste

```bash
# Mover para database/migrations/tests/
mv 071_add_missing_columns_for_test_sync.sql tests/
mv 072_convert_lotes_status_to_enum_test.sql tests/
mv 073_drop_views_and_convert_status_test.sql tests/
mv 075_defensive_verificar_conclusao_lote_test.sql tests/
mv 081_add_missing_test_db_columns.sql tests/
mv 090_adjust_fn_audit_entidades_senhas_for_tests.sql tests/
mv 208_sync_with_neon_test.sql tests/
mv 999_correcoes_criticas_seguranca_test.sql tests/
mv 999_fix_nr_bps_db_test.sql tests/
```

#### Ação 4: Deprecar Migrações Obsoletas

```bash
# Mover para database/migrations/deprecated/
mv 080_add_liberada_status.sql.DESCONTINUADA deprecated/
mv 011_add_auto_emitir_em.sql deprecated/
mv 096_desabilitar_emissao_automatica_trigger.sql deprecated/
mv 097_remover_campos_emissao_automatica.sql deprecated/
mv 024_limpar_legado_emissao_automatica.sql deprecated/
mv 221_remove_obsolete_auto_emission.sql deprecated/
```

#### Ação 5: Organizar Scripts

```bash
# Mover para database/migrations/scripts/
mv final-migration.cjs scripts/
mv run-migration-042.cjs scripts/
```

#### Ação 6: Consolidar Admin RLS Cleanup

Criar arquivo único:

```sql
-- CONSOLIDADO: admin_rls_complete_cleanup.sql
-- Mesclar:
--   005_remove_admin_empresas_policies.sql
--   018_remove_admin_laudos_permissions.sql
--   020_remove_admin_operational_rls.sql
--   021_cleanup_admin_role_permissions.sql
--   022_remove_admin_funcionarios_policies.sql
--   023_remove_all_admin_operational_rls.sql
--   024_cleanup_final_admin_policies.sql
--   025_remove_remaining_admin_policies.sql
--   209_fix_admin_rls_critical.sql
```

### Fase 4: Criar Migração Master Consolidada

```sql
-- 300_consolidated_schema.sql
-- Consolida TODAS as migrações 001-222 em um único arquivo
-- Este será o ponto de partida para novos ambientes
-- Mantém histórico em /archived
```

### Fase 5: Normalizar Nomenclatura

Padrão final:

```
NNN_<categoria>_<descricao_snake_case>.sql

Onde:
- NNN: Número sequencial (001-999)
- categoria: security|schema|data|feature|fix|perf
- descricao: snake_case descritivo

Exemplos:
- 301_security_update_rls_policies.sql
- 302_schema_add_user_preferences.sql
- 303_data_migrate_legacy_users.sql
- 304_feature_implement_notifications.sql
- 305_fix_null_pointer_triggers.sql
- 306_perf_add_composite_indexes.sql
```

---

## 🎯 Recomendações Críticas

### 1. Implementar Sistema de Versionamento Adequado

**Opção A: Ferramenta de Migração**

- **Recomendado:** Prisma Migrate, TypeORM, Flyway, ou Liquibase
- **Vantagem:** Rastreamento automático de estado
- **Desvantagem:** Requer refatoração do sistema atual

**Opção B: Script de Controle Manual**

```sql
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64),
  description TEXT,
  execution_time_ms INTEGER,
  applied_by VARCHAR(255)
);
```

### 2. Estabelecer Política de Migrações

#### 2.1 Nunca Editar Migrações Aplicadas

- ✅ Criar nova migração de correção
- ❌ Editar migração antiga

#### 2.2 Consolidação Periódica

- Trimestral: revisar e consolidar
- Anual: criar snapshot consolidado

#### 2.3 Testes Obrigatórios

- Toda migração deve ter rollback
- Testar em ambiente de desenvolvimento primeiro
- Documentar breaking changes

### 3. Criar CI/CD para Migrações

```yaml
# .github/workflows/migrations.yml
name: Validate Migrations
on: [pull_request]
jobs:
  test-migrations:
    - Verificar numeração sequencial
    - Validar sintaxe SQL
    - Rodar em DB de teste
    - Verificar rollback
    - Gerar diff de schema
```

---

## 📈 Métricas de Qualidade

### Estado Atual

- ❌ Organização: 2/10
- ❌ Duplicação: 8/10 (crítico)
- ❌ Conflitos: 7/10 (alto)
- ⚠️ Documentação: 4/10
- ⚠️ Rastreabilidade: 3/10

### Estado Esperado Pós-Higienização

- ✅ Organização: 9/10
- ✅ Duplicação: 1/10 (mínimo)
- ✅ Conflitos: 0/10
- ✅ Documentação: 8/10
- ✅ Rastreabilidade: 9/10

---

## ⏱️ Estimativa de Esforço

| Fase                       | Tempo Estimado  | Risco          |
| -------------------------- | --------------- | -------------- |
| Backup                     | 30 min          | Baixo          |
| Análise Detalhada          | 4 horas         | Baixo          |
| Consolidação Duplicatas    | 6 horas         | Médio          |
| Reorganização Estrutural   | 4 horas         | Baixo          |
| Criação Master Consolidada | 8 horas         | Alto           |
| Testes & Validação         | 8 horas         | Alto           |
| Documentação               | 4 horas         | Baixo          |
| **TOTAL**                  | **34-40 horas** | **Médio-Alto** |

---

## 🚀 Próximos Passos Imediatos

### Dia 1: Backup & Preparação

1. ✅ Criar backup completo
2. ✅ Documentar estado atual (este arquivo)
3. ⬜ Obter aprovação do time
4. ⬜ Criar branch de higienização

### Dia 2-3: Consolidação

5. ⬜ Resolver duplicatas de encoding
6. ⬜ Consolidar duplicatas funcionais
7. ⬜ Mover arquivos de teste
8. ⬜ Deprecar obsoletos

### Dia 4-5: Reorganização

9. ⬜ Criar estrutura de pastas
10. ⬜ Reorganizar arquivos
11. ⬜ Criar migração consolidada
12. ⬜ Atualizar documentação

### Dia 6: Validação

13. ⬜ Testar em ambiente dev
14. ⬜ Validar com equipe
15. ⬜ Criar PR
16. ⬜ Merge e deploy

---

## 📞 Contato & Revisão

**Analista:** GitHub Copilot  
**Data da Análise:** 31/01/2026  
**Próxima Revisão:** Após higienização completa

---

## 🔖 Anexos

### A. Lista Completa de Duplicatas

Ver seção "Problemas Críticos Identificados" > "Duplicação Massiva"

### B. Grafo de Dependências

(Requer ferramenta de visualização - recomendado: pgModeler, dbdiagram.io)

### C. Checklist de Validação Pós-Higienização

- [ ] Todas as migrações numeradas sequencialmente
- [ ] Sem duplicatas
- [ ] Encoding consistente (UTF-8)
- [ ] Arquivos de teste isolados
- [ ] Scripts de execução isolados
- [ ] Migração consolidada criada
- [ ] Documentação atualizada
- [ ] README.md com instruções
- [ ] CI/CD configurado
- [ ] Política de migrações documentada
