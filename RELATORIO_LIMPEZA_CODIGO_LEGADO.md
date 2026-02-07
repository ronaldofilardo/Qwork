# 📋 RELATÓRIO DE LIMPEZA DE CÓDIGO LEGADO

**Data:** 06 de fevereiro de 2026  
**Objetivo:** Remover código obsoleto relacionado a arquitetura antiga e permissões incorretas de admin

---

## 🎯 PARTE 1: PERMISSÕES INCORRETAS DO ADMIN

### ❌ Problema Identificado

O admin tem permissões operacionais indevidas. Segundo a definição correta em `roles`:

> **Admin:** Administrador do sistema - gerencia APENAS aspectos administrativos: tomadores [clínicas e entidades], planos e emissores. NÃO tem acesso operacional (empresas, funcionários, avaliações, lotes, laudos)

### 📍 Locais com "Admin tem acesso total" ou "admin_todas_empresas"

#### **Migrações SQL**

1. **database/migrations/501_adicionar_empresa_id.sql**
   - Linha 96-102: Policy `admin_todas_empresas` ON `empresas_clientes`
   - **Ação:** REMOVER policy completa

2. **database/migrations/499_criar_tabela_clinicas.sql**
   - Linha 208: Comentário "Política para administradores (acesso total)"
   - **Ação:** REMOVER policy e comentário

3. **database/migrations/301_remove_admin_emissor_incorrect_permissions.sql**
   - Linha 164: Comment "admin tem acesso total via RBAC"
   - **Ação:** CORRIGIR comentário

4. **database/migrations/001_security_rls_rbac.sql**
   - Linha 163: Admin descrito como "Administrador do sistema com acesso amplo"
   - Múltiplas policies dando acesso operacional ao admin
   - **Ação:** REMOVER todas as policies operacionais para admin

#### **Schemas**

5. **database/schemas/schema_nr-bps_db_test.sql**
   - Linha 2784: Function `is_admin_or_master()` com comment "acesso total"
   - **Ação:** REVISAR função ou REMOVER se obsoleta

#### **Documentação**

6. **docs/RELATORIO-AUDITORIA-PERMISSOES-ADMIN-EMISSOR.md**
   - Linha 75, 299: Menciona policies removidas e acesso total
   - **Ação:** ATUALIZAR para refletir estado correto

7. **docs/solucao-definitiva-status-avaliacoes.md**
   - Linha 9: Policy `admin_all_avaliacoes` - "Permite acesso total se perfil = 'admin'"
   - **Ação:** REMOVER referência

8. **docs/security/GUIA-COMPLETO-RLS-RBAC.md**
   - Linha 127: "Admin: Acesso total"
   - **Ação:** CORRIGIR para "Admin: Acesso administrativo apenas"

9. **docs/GUIA-DE-USO.md**
   - Linha 107: "admin: Acesso total (gestão + dashboard)"
   - **Ação:** CORRIGIR para "admin: Acesso administrativo (tomadores, planos, emissores)"

10. **docs/archived/ANALISE-ROLE-GESTOR-ENTIDADE.md**
    - Linha 116: Super admin com "acesso total"
    - **Ação:** ARQUIVADO - apenas documentar que está deprecated

11. **docs/archived/db-security-integration-guide.ts**
    - Linha 106: "Com perfil admin, RLS permite acesso total"
    - **Ação:** ARQUIVADO - apenas documentar que está deprecated

12. **docs/archived/IMPLEMENTACAO-PLANO-PERSONALIZADO.md**
    - Linha 54: "Admin: Acesso total a todas as contratações"
    - **Ação:** ARQUIVADO - apenas documentar que está deprecated

13. **docs/archived/RESUMO-VISUAL-RLS.md**
    - Linha 9: "Admin tinha acesso TOTAL a:"
    - **Ação:** ARQUIVADO - apenas documentar que está deprecated

#### **Deprecated** (Pasta database/migrations/deprecated)

14. Arquivos já movidos para deprecated:
    - `001_security_rls_rbac.OLD.sql`
    - `020_remove_admin_operational_rls.sql`
    - `018_remove_admin_laudos_permissions.sql`
    - `005_remove_admin_empresas_policies.sql`
    - `022_remove_admin_funcionarios_policies.sql`
    - `021_cleanup_admin_role_permissions.sql`
    - `023_remove_all_admin_operational_rls.sql`
    - `025_remove_remaining_admin_policies.sql`
    - **Ação:** MANTER (já está deprecated/correto)

---

## 🎯 PARTE 2: MIGRAÇÕES OBSOLETAS (ARQUITETURA CONTRATANTE LEGACY)

### ❌ Arquitetura Antiga vs. Nova

**ANTIGA (OBSOLETA):** `contratante_id` era usado para ambos tipos (clínica e entidade)  
**NOVA (CORRETA):**

- Entidades: `entidade_id` (tabela `entidades`)
- Clínicas: `clinica_id` + `empresa_id` (tabelas `clinicas` e `empresas_clientes`)

### 📂 Migrações Obsoletas Encontradas

#### **Confirmadas Existentes:**

1. **database/migrations/420_rename_contratantes_to_entidades.sql**
   - Renomeou tabela contratantes → entidades
   - **Status:** OBSOLETA - arquitetura intermediária

2. **database/migrations/421_rename_contratantes_funcionarios.sql**
   - Renomeou relação contratantes_funcionarios
   - **Status:** OBSOLETA - arquitetura intermediária

3. **database/migrations/499_criar_tabela_clinicas.sql**
   - Criou tabela clinicas inicial
   - **Status:** OBSOLETA - foi substituída por migração mais recente

4. **database/migrations/500_segregar_fks_entidades_clinicas.sql**
   - Tentativa de segregação de FKs
   - **Status:** OBSOLETA - substituída por 501

5. **database/migrations/501_adicionar_empresa_id.sql**
   - Adicionou empresa_id (migration atual recente)
   - **Status:** MANTER - É a migration VÁLIDA atual

6. **database/migrations/501_recreate_views.sql**
   - Recria views com nova estrutura
   - **Status:** REVISAR - ver se conflita com 501

7. **database/migrations/CRITICAL_500_fix_architecture.sql**
   - Correção crítica de arquitetura
   - **Status:** OBSOLETA - foi merged na 500/501

8. **database/migrations/400_remove_gestores_from_funcionarios_final.sql**
   - Remove perfil gestor da tabela funcionarios
   - **Status:** OBSOLETA - arquitetura antiga

9. **database/migrations/400_corrigir_estrutura_entidades_empresas.sql**
   - Correção de estrutura intermediária
   - **Status:** OBSOLETA - arquitetura antiga

#### **Migrações 999 (Hotfixes):**

10-17. **database/migrations/999\_\*.sql** (8 arquivos): - `999_reserva_id_laudo_on_lote_insert.sql` - `999_padronizacao_status_avaliacao_concluido.sql` - `999_fix_missing_audit_and_validator.sql` - `999_fix_contratos_numero_contrato.sql` ⚠️ - `999_fix_audit_lote_and_status_security.sql` - `999_fix_audit_laudo_trigger.sql` - `999_correcoes_criticas_seguranca.sql` ⚠️ - `999_consolidacao_tipo_plano.sql` ⚠️ - **Status:** REVISAR individualmente - algumas podem ser importantes

#### **Deprecated (Já movidas):**

18+. **database/migrations/deprecated/** (37 arquivos): - `105_add_contratante_id_to_funcionarios.sql` ✅ - `062_add_calcular_elegibilidade_lote_contratante.sql` ✅ - `062_add_calcular_elegibilidade_lote_contratante_clean.sql` ✅ - `030_protecao_senhas_critica.OLD.sql` ✅ - `030_protecao_senhas_critica_ascii.sql` ✅ - `207_add_current_user_contratante_id_helper.OLD.sql` ✅ - Entre outros... - **Status:** MANTER (já está deprecated)

#### **Não Encontradas (Bom sinal - já foram removidas):**

- `400b_correcao_parcial.sql` ✅ NÃO EXISTE
- `400c_estrutura_organizacional_final.sql` ✅ NÃO EXISTE
- `422_update_views_for_entidades.sql` ✅ NÃO EXISTE
- `410_enforce_usuarios_only_for_accounts.sql` ✅ NÃO EXISTE
- `073_drop_views_and_convert_status_test.sql` ✅ NÃO EXISTE
- `090_adjust_fn_audit_contratantes_senhas_for_tests.sql` ✅ NÃO EXISTE
- Scripts manuais: `apply-*.sql`, `fix-*.sql`, `insert_*.sql` ✅ NÃO EXISTEM
- **Status:** JÁ FORAM LIMPAS

---

## 🎯 PARTE 3: REFERÊNCIAS A `contratante_id` NO CÓDIGO

### 📊 Estatísticas

- **lib/**: 93 ocorrências
- **app/**: 150+ ocorrências (mais resultados disponíveis)
- **components/**: 22 ocorrências
- ****tests**/**: 100+ ocorrências
- **Total estimado:** ~450+ ocorrências

### 🔍 Categorização

#### **A. MANTER (Retrocompatibilidade/Transição Legítima)**

1. **lib/session.ts**
   - Linhas 37-38: `contratante_id?: number; // @deprecated`
   - Linha 200, 273-313: Funções `requireEntity()` com fallback
   - **Ação:** MANTER por enquanto com `@deprecated`, remover em versão futura

2. **lib/validation.ts, lib/validations/plano-personalizado.schemas.ts**
   - Schemas Zod com `contratante_id` opcional
   - **Ação:** MANTER para backward compatibility de APIs

3. **app/api/test/session/route.ts**
   - API de teste que aceita `contratante_id`
   - **Ação:** MANTER (é teste)

#### **B. REVISAR E REFATORAR (Uso Misto Entidade/Clínica)**

##### **APIs que precisam distinguir entidade vs clínica:**

4. **app/api/pagamento/\*** (12 arquivos)
   - `iniciar/route.ts`: Linha 9-19 aceita `contratante_id || entidade_id`
   - `simulador/route.ts`: Linha 18-30 aceita ambos
   - `simular/route.ts`: Linha 18-80 lógica com `contratante_id`
   - `confirmar/route.ts`: 70+ ocorrências (ativa entidade, cria conta, gera recibos)
   - **Ação:** REFATORAR para usar explicitamente `entidade_id` ou `clinica_id`

5. **app/api/proposta/\*** (2 arquivos)
   - `[token]/route.ts`: Busca proposta por `contratante_id`
   - `aceitar/route.ts`: Aceita proposta usando `contratante_id`
   - **Ação:** REFATORAR - propostas são apenas para entidades, usar `entidade_id`

6. **app/api/entidade/\*** (15 arquivos)
   - Todos os endpoints de entidade usam `session.contratante_id`
   - **Ação:** REFATORAR para `session.entidade_id`

7. **app/api/lotes/[loteId]/solicitar-emissao/route.ts**
   - Linhas 25-96: Valida `lote.contratante_id`
   - **Ação:** REFATORAR para validar `entidade_id` ou `clinica_id` dependendo do tipo

8. **app/api/recibo/gerar/route.ts**
   - Linha 185-465: Gera recibos usando `contratante_id`
   - **Ação:** REFATORAR - recibos devem usar `entidade_id` (entidades) ou `clinica_id` (clínicas)

9. **app/api/rh/account-info/route.ts**
   - Linha 179-181: LEFT JOIN com `contratante_id`
   - **Ação:** REFATORAR para usar clinica_id

10. **app/api/public/contratante/route.ts**
    - API pública que busca por `contratante_id`
    - **Ação:** REFATORAR ou DEPRECAR - substituir por `/api/public/entidade` e `/api/public/clinica`

#### **C. LIB - FUNÇÕES CORE**

11. **lib/db-gestor.ts**
    - Linhas 261-308: Valida acesso do gestor usando `contratante_id`
    - **Ação:** REFATORAR para `entidade_id`

12. **lib/db-contratacao.ts**
    - Linhas 69-285: Contratos e pagamentos usando `contratante_id`
    - **Ação:** REFATORAR - contratos devem ter `entidade_id` ou `clinica_id`

13. **lib/auth-require.ts**
    - Linhas 91-172: Validações de autorização usando `contratante_id`
    - **Ação:** REFATORAR para suportar `entidade_id` E `clinica_id`

14. **lib/laudo-calculos.ts**
    - Linha 181: LEFT JOIN `contratantes cont ON la.contratante_id`
    - **Ação:** REFATORAR query para usar `entidades` ou `clinicas`

15. **lib/notifications/create-notification.ts**
    - Linhas 147-227: Lógica de notificações usando `contratante_id`
    - **Ação:** REFATORAR para determinar tipo (entidade/clinica) e usar campo correto

16. **lib/infrastructure/pdf/generators/receipt-generator.ts**
    - Linhas 22-513: Gerador de recibos usando `contratante_id`
    - **Ação:** REFATORAR para aceitar `entidade_id` ou `clinica_id` via parâmetro de tipo

#### **D. COMPONENTS (Frontend)**

17. **components/modals/ModalContrato.tsx**
    - Linha 15: Interface com `contratante_id: number`
    - **Ação:** REFATORAR para `entidade_id` ou `tomador_id: { tipo, id }`

18. **components/modals/ModalPagamento.tsx**
    - Linhas 94, 174: Envia `contratante_id` para API
    - **Ação:** REFATORAR para enviar `entidade_id`

19. **components/admin/\*** (2 arquivos)
    - `NovoscadastrosContent.tsx`: Usa `contratante_id` para simulador
    - `CobrancaContent.tsx`: Interface com `contratante_id`
    - **Ação:** REFATORAR para usar `entidade_id` ou `clinica_id` dependendo do tipo

#### **E. TESTES**

20. ****tests**/\*** (100+ ocorrências em ~30 arquivos)
    - Diversos testes usam `contratante_id`
    - **Ação:** ATUALIZAR testes após refatoração do código principal

---

## 📋 PLANO DE AÇÃO RECOMENDADO

### **FASE 1: LIMPEZA IMEDIATA (Sem Risco)**

✅ **Remover migrações obsoletas confirmadas:**

1. Mover para `deprecated/`:
   - `420_rename_contratantes_to_entidades.sql`
   - `421_rename_contratantes_funcionarios.sql`
   - `499_criar_tabela_clinicas.sql`
   - `500_segregar_fks_entidades_clinicas.sql`
   - `CRITICAL_500_fix_architecture.sql`
   - `400_remove_gestores_from_funcionarios_final.sql`
   - `400_corrigir_estrutura_entidades_empresas.sql`

✅ **Remover policies incorretas do Admin:** 2. Migration nova: `502_remover_admin_operacional.sql`

```sql
-- Remover policies operacionais do admin
DROP POLICY IF EXISTS admin_todas_empresas ON empresas_clientes;
DROP POLICY IF EXISTS admin_all_avaliacoes ON avaliacoes;
DROP POLICY IF EXISTS admin_all_funcionarios ON funcionarios;
-- etc para todas as policies operacionais
```

✅ **Atualizar documentação:** 3. Corrigir docs mencionados na Parte 1 4. Adicionar nota em README sobre arquitetura correta

### **FASE 2: REFATORAÇÃO GRADUAL (Médio Prazo)**

🔄 **Substituir `contratante_id` por `entidade_id` onde aplicável:**

1. Começar pelas funções core em `lib/`
2. Depois APIs em `app/api/`
3. Por último componentes em `components/`
4. Atualizar testes conforme refatoração

🔄 **Migration de dados (se necessário):**

1. Verificar se existem dados com `contratante_id` no banco
2. Criar migration para migrar para `entidade_id` ou `clinica_id`

### **FASE 3: CLEANUP FINAL (Longo Prazo)**

🧹 **Remover retrocompatibilidade:**

1. Remover campos `@deprecated` de `lib/session.ts`
2. Remover schemas Zod com `contratante_id`
3. Atualizar toda documentação final

---

## 📊 RESUMO EXECUTIVO

| Categoria                       | Itens Encontrados | Ação Recomendada                |
| ------------------------------- | ----------------- | ------------------------------- |
| **Permissões Admin Incorretas** | 14 locais         | REMOVER policies, CORRIGIR docs |
| **Migrações Obsoletas**         | 9 confirmadas     | MOVER para deprecated/          |
| **Migrações Deprecated**        | 37 já movidas     | MANTER como está                |
| **Migrações 999 (hotfix)**      | 8 arquivos        | REVISAR individualmente         |
| **Código `contratante_id`**     | ~450+ ocorrências | REFATORAR gradualmente          |
| **Testes**                      | 100+ ocorrências  | ATUALIZAR após refatoração      |

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO DELETAR:**
   - `501_adicionar_empresa_id.sql` - É a migration válida atual
   - `501_recreate_views.sql` - Revisar antes de remover
   - Migrações `999_*` sem análise individual
   - Arquivos em `deprecated/` (já estão arquivados)

2. **TESTAR APÓS CADA FASE:**
   - Rodar migrations em ambiente de dev
   - Executar suite de testes
   - Validar flows de cadastro de entidade e clínica
   - Validar flows de pagamento e emissão

3. **BACKUP ANTES DE DELETAR:**
   - Git commit antes de cada fase
   - Backup do banco antes de rodar migrations de cleanup
   - Documentar decisões de remoção

---

**Próximos Passos:** Aguardar aprovação do usuário para proceder com FASE 1.
