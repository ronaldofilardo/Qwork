# Relatório Final de Permissões por Tipo de Usuário

**Versão**: 3.0.0  
**Data**: 04/02/2026  
**Status**: ✅ Correções Completas (Backend, Frontend, Database, Documentação)

---

## 📋 Resumo Executivo

Este relatório documenta as permissões **corretas e validadas** para cada tipo de usuário após a auditoria de segurança e remoção agressiva de permissões incorretas que violavam o princípio de menor privilégio.

**Problemas Corrigidos**:

- ❌ 40+ políticas RLS removidas que davam acesso incorreto ao admin
- ❌ 3 endpoints backend removidos (gestores-rh, contratantes, funcionarios em /admin)
- ❌ 9 políticas removidas do dump SQL principal
- ❌ 4 chamadas frontend corrigidas (page.tsx e page-novo.tsx)
- ❌ Menu admin limpo (seção Contratantes removida)

---

## 🔐 Matriz de Permissões por Tabela

### Legenda

- ✅ **PERMITIDO** - Acesso concedido por política RLS
- ❌ **NEGADO** - Sem acesso (blocked by RLS)
- 🔒 **FILTRADO** - Acesso apenas a registros específicos (own/clinica/entidade)

---

## 1️⃣ ADMIN (Sistema)

**Objetivo**: Gerenciar usuários, papéis, permissões e auditoria do sistema.

| Tabela                | SELECT | INSERT | UPDATE | DELETE | Observações                        |
| --------------------- | ------ | ------ | ------ | ------ | ---------------------------------- |
| **usuarios**          | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Gerenciamento completo de usuários |
| **roles**             | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Gerenciamento de papéis            |
| **permissions**       | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Gerenciamento de permissões        |
| **role_permissions**  | ✅ ALL | ✅ ALL | ✅ ALL | ✅ ALL | Vinculação papéis-permissões       |
| **audit_logs**        | ✅ ALL | ❌     | ❌     | ❌     | Apenas leitura de logs             |
| **contratantes**      | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **clinicas**          | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **empresas_clientes** | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **funcionarios**      | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **avaliacoes**        | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **lotes**             | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **laudos**            | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |
| **fila_emissao**      | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                     |

**Políticas RLS Ativas** (Migration 301):

```sql
usuarios_admin_select
usuarios_admin_insert
usuarios_admin_update
usuarios_admin_delete
roles_admin_all
permissions_admin_all
role_permissions_admin_all
audit_logs_admin_select
```

**Endpoints Disponíveis**:

- ✅ `/api/admin/usuarios/*` - Gerenciamento de usuários
- ✅ `/api/admin/novos-cadastros/*` - Aprovação de cadastros
- ✅ `/api/admin/emissores/*` - Gestão de emissores
- ❌ `/api/admin/gestores-rh/*` - **REMOVIDO** (04/02/2026)
- ❌ `/api/admin/contratantes/*` - **REMOVIDO** (04/02/2026)
- ❌ `/api/admin/funcionarios/*` - **REMOVIDO** (04/02/2026)

---

## 2️⃣ EMISSOR (Operacional)

**Objetivo**: Emitir laudos através da fila de emissão.

| Tabela                | SELECT | INSERT | UPDATE    | DELETE | Observações                       |
| --------------------- | ------ | ------ | --------- | ------ | --------------------------------- |
| **fila_emissao**      | ✅ ALL | ❌     | ✅ Status | ❌     | Consumir fila de emissão          |
| **laudos**            | ❌     | ✅ NEW | ❌        | ❌     | Criar laudos gerados              |
| **avaliacoes**        | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO** (somente via fila) |
| **lotes**             | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO**                    |
| **funcionarios**      | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO**                    |
| **empresas_clientes** | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO**                    |
| **clinicas**          | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO**                    |
| **contratantes**      | ❌     | ❌     | ❌        | ❌     | **SEM ACESSO**                    |

**Políticas RLS Ativas**:

```sql
fila_emissao_emissor_select
fila_emissao_emissor_update
laudos_emissor_insert
```

**Políticas REMOVIDAS** (Migration 301):

```sql
-- ❌ lotes_emissor_select (REMOVIDO - emissor não gerencia lotes)
```

**Endpoints Disponíveis**:

- ✅ `/api/emissor/fila/*` - Consumir fila de emissão
- ✅ `/api/emissor/laudos/*` - Criar laudos

---

## 3️⃣ RH (Clínica)

**Objetivo**: Gerenciar empresas-cliente, funcionários, avaliações e lotes da clínica.

| Tabela                | SELECT       | INSERT | UPDATE | DELETE | Observações                            |
| --------------------- | ------------ | ------ | ------ | ------ | -------------------------------------- |
| **empresas_clientes** | 🔒 Clínica   | ✅ Own | ✅ Own | ❌     | Empresas da clínica                    |
| **funcionarios**      | 🔒 Clínica   | ✅ Own | ✅ Own | ❌     | Funcionários das empresas              |
| **avaliacoes**        | 🔒 Clínica   | ✅ Own | ✅ Own | ❌     | Avaliações dos funcionários            |
| **lotes**             | 🔒 Clínica   | ✅ Own | ✅ Own | ❌     | Lotes de avaliações                    |
| **laudos**            | 🔒 Avaliação | ❌     | ❌     | ❌     | Apenas laudos de avaliações da clínica |
| **clinicas**          | 🔒 Own       | ❌     | ✅ Own | ❌     | Apenas sua clínica (info básica)       |
| **contratantes**      | ❌           | ❌     | ❌     | ❌     | **SEM ACESSO DIRETO**                  |
| **usuarios**          | ❌           | ❌     | ❌     | ❌     | **SEM ACESSO**                         |

**Filtro RLS**: `clinica_id = auth.jwt() ->> 'clinica_id'`

**Políticas RLS Ativas**:

```sql
empresas_clientes_rh_select
empresas_clientes_rh_insert
empresas_clientes_rh_update
funcionarios_rh_select
funcionarios_rh_insert
funcionarios_rh_update
avaliacoes_rh_select
avaliacoes_rh_insert
avaliacoes_rh_update
lotes_rh_select
lotes_rh_insert
lotes_rh_update
laudos_rh_select
clinicas_rh_select
clinicas_rh_update
```

**Endpoints Disponíveis**:

- ✅ `/api/rh/empresas/*` - Gerenciar empresas-cliente
- ✅ `/api/rh/funcionarios/*` - Gerenciar funcionários
- ✅ `/api/rh/avaliacoes/*` - Gerenciar avaliações
- ✅ `/api/rh/lotes/*` - Gerenciar lotes
- ✅ `/api/rh/laudos/*` - Visualizar laudos (read-only)

---

## 4️⃣ GESTOR ENTIDADE (Entidade)

**Objetivo**: Gerenciar funcionários, avaliações e lotes das empresas da entidade.

| Tabela                | SELECT       | INSERT | UPDATE | DELETE | Observações                             |
| --------------------- | ------------ | ------ | ------ | ------ | --------------------------------------- |
| **funcionarios**      | 🔒 Entidade  | ✅ Own | ✅ Own | ❌     | Funcionários das empresas               |
| **avaliacoes**        | 🔒 Entidade  | ✅ Own | ✅ Own | ❌     | Avaliações dos funcionários             |
| **lotes**             | 🔒 Entidade  | ✅ Own | ✅ Own | ❌     | Lotes de avaliações                     |
| **laudos**            | 🔒 Avaliação | ❌     | ❌     | ❌     | Apenas laudos de avaliações da entidade |
| **empresas_clientes** | 🔒 Entidade  | ❌     | ❌     | ❌     | Apenas empresas da entidade (read-only) |
| **contratantes**      | 🔒 Own       | ❌     | ✅ Own | ❌     | Apenas sua entidade (info básica)       |
| **clinicas**          | ❌           | ❌     | ❌     | ❌     | **SEM ACESSO**                          |
| **usuarios**          | ❌           | ❌     | ❌     | ❌     | **SEM ACESSO**                          |

**Filtro RLS**: `entidade_id = auth.jwt() ->> 'entidade_id'`

**Políticas RLS Ativas**:

```sql
funcionarios_gestor_select
funcionarios_gestor_insert
funcionarios_gestor_update
avaliacoes_gestor_select
avaliacoes_gestor_insert
avaliacoes_gestor_update
lotes_gestor_select
lotes_gestor_insert
lotes_gestor_update
laudos_gestor_select
empresas_clientes_gestor_select
contratantes_gestor_select
contratantes_gestor_update
```

**Endpoints Disponíveis**:

- ✅ `/api/entidade/funcionarios/*` - Gerenciar funcionários
- ✅ `/api/entidade/avaliacoes/*` - Gerenciar avaliações
- ✅ `/api/entidade/lotes/*` - Gerenciar lotes
- ✅ `/api/entidade/laudos/*` - Visualizar laudos (read-only)
- ✅ `/api/entidade/empresas/*` - Visualizar empresas (read-only)

---

## 5️⃣ FUNCIONARIO (Final User)

**Objetivo**: Visualizar suas próprias avaliações e laudos.

| Tabela                | SELECT | INSERT | UPDATE | DELETE | Observações                   |
| --------------------- | ------ | ------ | ------ | ------ | ----------------------------- |
| **avaliacoes**        | 🔒 Own | ❌     | ❌     | ❌     | Apenas suas avaliações        |
| **laudos**            | 🔒 Own | ❌     | ❌     | ❌     | Apenas seus laudos            |
| **funcionarios**      | 🔒 Own | ❌     | ❌     | ❌     | Apenas seus dados (read-only) |
| **lotes**             | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                |
| **empresas_clientes** | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                |
| **clinicas**          | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                |
| **contratantes**      | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                |
| **usuarios**          | ❌     | ❌     | ❌     | ❌     | **SEM ACESSO**                |

**Filtro RLS**: `funcionario_id = auth.jwt() ->> 'funcionario_id'`

**Políticas RLS Ativas**:

```sql
avaliacoes_funcionario_select
laudos_funcionario_select
funcionarios_funcionario_select
```

**Endpoints Disponíveis**:

- ✅ `/api/funcionario/avaliacoes` - Visualizar avaliações (read-only)
- ✅ `/api/funcionario/laudos` - Visualizar laudos (read-only)

---

## 📊 Comparação: Antes vs Depois

### ADMIN - Antes da Auditoria ❌

```
ACESSO TOTAL: clinicas, contratantes, empresas, funcionarios, avaliacoes, lotes
POLÍTICAS: 40+ admin_all_* políticas
ENDPOINTS: /api/admin/gestores-rh, /api/admin/contratantes, /api/admin/funcionarios
MENU: Seção "Contratantes" com Clínicas e Entidades
```

### ADMIN - Depois da Auditoria ✅

```
ACESSO RESTRITO: usuarios, roles, permissions, role_permissions, audit_logs
POLÍTICAS: 8 políticas específicas (usuarios_admin_*, roles_admin_all, etc)
ENDPOINTS: /api/admin/usuarios, /api/admin/novos-cadastros, /api/admin/emissores
MENU: Seção "Contratantes" REMOVIDA
```

### EMISSOR - Antes da Auditoria ❌

```
ACESSO: fila_emissao, laudos, lotes (SELECT ALL)
POLÍTICAS: lotes_emissor_select
```

### EMISSOR - Depois da Auditoria ✅

```
ACESSO: fila_emissao (SELECT + UPDATE status), laudos (INSERT only)
POLÍTICAS: lotes_emissor_select REMOVIDA
```

---

## 🔍 Evidências de Correção

### 1. Migration 301 - Remoção de Políticas

**Arquivo**: `database/migrations/301_remove_admin_emissor_incorrect_permissions.sql`

**Políticas Removidas** (40+):

```sql
DROP POLICY IF EXISTS admin_all_avaliacoes ON avaliacoes;
DROP POLICY IF EXISTS admin_all_empresas ON empresas_clientes;
DROP POLICY IF EXISTS admin_all_lotes ON lotes;
DROP POLICY IF EXISTS clinicas_admin_all ON clinicas;
DROP POLICY IF EXISTS contratantes_admin_all ON contratantes;
DROP POLICY IF EXISTS funcionarios_admin_all ON funcionarios;
DROP POLICY IF EXISTS lotes_emissor_select ON lotes;
-- ... (mais 33 políticas)
```

**Políticas Criadas**:

```sql
CREATE POLICY usuarios_admin_select ON usuarios FOR SELECT TO admin USING (true);
CREATE POLICY usuarios_admin_insert ON usuarios FOR INSERT TO admin WITH CHECK (true);
CREATE POLICY usuarios_admin_update ON usuarios FOR UPDATE TO admin USING (true);
CREATE POLICY usuarios_admin_delete ON usuarios FOR DELETE TO admin USING (true);
-- ... (roles, permissions, role_permissions, audit_logs)
```

**Resultado**: ✅ Aplicado com sucesso em test DB (exit code 0)

### 2. Dump SQL - Limpeza

**Arquivo**: `sql-files/013b_create_nivel_cargo_enum_column.sql`

**Políticas Removidas/Comentadas** (9):

```sql
-- ❌ REMOVIDO: admin não tem acesso a avaliacoes
-- CREATE POLICY admin_all_avaliacoes ON public.avaliacoes FOR ALL TO admin USING (true);

-- ❌ REMOVIDO: admin não tem acesso a empresas_clientes
-- CREATE POLICY admin_all_empresas ON public.empresas_clientes FOR ALL TO admin USING (true);
```

**Backup Criado**: `sql-files/013b_create_nivel_cargo_enum_column.sql.backup-20260204-HHMMSS`

### 3. Backend - Endpoints Removidos

**Arquivos Deletados**:

```
✅ app/api/admin/gestores-rh/route.ts
✅ app/api/admin/gestores-rh/[cpf]/route.ts
✅ app/api/admin/gestores-rh/substituir/route.ts
✅ app/api/admin/contratantes/route.ts
✅ app/api/admin/funcionarios/route.ts
```

**Motivo**: Admin não pode acessar tabelas `clinicas`, `contratantes`, `funcionarios` usadas nesses endpoints.

### 4. Frontend - Correções

**Arquivo**: `app/admin/page.tsx`

**Antes**:

```typescript
const clinicasRes = await fetch('/api/admin/contratantes?tipo=clinica');
const entidadesRes = await fetch('/api/admin/contratantes?tipo=entidade');
```

**Depois**:

```typescript
// ❌ REMOVIDO: Admin não gerencia contratantes (clínicas/entidades)
// Endpoints /api/admin/contratantes removidos em 04/02/2026
setClinicasCount(0);
setEntidadesCount(0);
```

**Arquivo**: `components/admin/AdminSidebar.tsx`

**Antes**:

```tsx
<MenuItem icon={Building2} label="Contratantes" ... />
  <SubMenuItem label="Clínicas" count={counts.clinicas} ... />
  <SubMenuItem label="Entidades" count={counts.entidades} ... />
```

**Depois**:

```tsx
{
  /* ❌ REMOVIDO: Contratantes (Admin não gerencia clínicas/entidades)
    Endpoints removidos em 04/02/2026 por auditoria de segurança
    Admin não tem acesso a tabela contratantes por RLS policies */
}
```

### 5. Testes - Correções

**Arquivo**: `__tests__/security/rls-rbac.test.ts`

**Testes Corrigidos** (4):

```typescript
// ANTES: expect(adminEmpresas.rows.length).toBeGreaterThan(0);
// DEPOIS: expect(adminEmpresas.rows.length).toBe(0);

// ANTES: expect(adminClinicas.rows.length).toBeGreaterThan(0);
// DEPOIS: expect(adminClinicas.rows.length).toBe(0);

// ANTES: expect(adminAvaliacoes.rows.length).toBeGreaterThan(0);
// DEPOIS: expect(adminAvaliacoes.rows.length).toBe(0);

// ANTES: expect(adminLotes.rows.length).toBeGreaterThan(0);
// DEPOIS: expect(adminLotes.rows.length).toBe(0);
```

---

## 📝 Documentação Atualizada

### Arquivos Corrigidos

1. ✅ `docs/REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md` - Tabela de permissões
2. ✅ `docs/GUIA-IMPLEMENTACAO-REESTRUTURACAO.md` - Warnings e políticas
3. ✅ `docs/DIAGRAMA-USUARIOS-FUNCIONARIOS.md` - Diagrama de permissões

### Arquivos Criados

1. ✅ `docs/RELATORIO-AUDITORIA-PERMISSOES-ADMIN-EMISSOR.md` - Relatório completo de auditoria
2. ✅ `docs/PROCESSO-RESTORE-SEGURO.md` - Processo seguro de restore
3. ✅ `docs/ENDPOINTS-REMOVIDOS.md` - Documentação de endpoints removidos
4. ✅ `docs/RELATORIO-FINAL-PERMISSOES.md` - Este documento

---

## ✅ Checklist de Validação

### Banco de Dados

- [x] Migration 301 criada e aplicada
- [x] Dump SQL limpo (backup criado)
- [x] Políticas admin*all*\* removidas
- [x] Políticas lotes_emissor_select removidas
- [x] Scripts de cleanup criados (SQL + bash)

### Backend

- [x] Endpoints /api/admin/gestores-rh removidos
- [x] Endpoints /api/admin/contratantes removidos
- [x] Endpoints /api/admin/funcionarios removidos
- [x] Verificação de outros endpoints admin (limpo)

### Frontend

- [x] Chamadas a /api/admin/contratantes removidas (page.tsx)
- [x] Chamadas a /api/admin/contratantes removidas (page-novo.tsx)
- [x] Menu "Contratantes" removido (AdminSidebar.tsx)
- [x] Imports de ClinicasContent/EntidadesContent comentados
- [x] Renderização de conteúdo de contratantes comentada

### Testes

- [x] rls-rbac.test.ts corrigido (4 testes)
- [x] Testes de admin bloqueado em clinicas, empresas, avaliacoes, lotes

### Documentação

- [x] 3 arquivos .md corrigidos
- [x] 4 arquivos .md criados (auditoria, processo, endpoints, este relatório)
- [x] Warnings adicionados sobre permissões incorretas

---

## 🚀 Próximos Passos

### 1. Validação em Produção

```bash
# 1. Aplicar Migration 301
psql -d production_db -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql

# 2. Verificar políticas
psql -d production_db -c "
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE 'admin_all_%' OR policyname = 'lotes_emissor_select';"
# Resultado esperado: 0 rows

# 3. Testar acesso admin
psql -d production_db -c "SET ROLE admin; SELECT COUNT(*) FROM clinicas;"
# Resultado esperado: ERROR: permission denied

# 4. Testar acesso emissor
psql -d production_db -c "SET ROLE emissor; SELECT COUNT(*) FROM lotes;"
# Resultado esperado: ERROR: permission denied
```

### 2. Deploy Frontend

```bash
# Deploy das correções frontend
git add app/admin/page.tsx app/admin/page-novo.tsx components/admin/AdminSidebar.tsx
git commit -m "fix: remover acesso admin a contratantes (auditoria segurança)"
git push origin main
```

### 3. Monitoramento

- Verificar logs de erro 403/404 em `/api/admin/contratantes`
- Monitorar tentativas de acesso admin a tabelas restritas
- Validar audit_logs para tentativas de violação de RLS

---

## 📞 Suporte

Para dúvidas sobre permissões ou problemas de acesso:

1. Consulte este relatório para matriz de permissões
2. Verifique `docs/RELATORIO-AUDITORIA-PERMISSOES-ADMIN-EMISSOR.md`
3. Execute queries de validação no `docs/PROCESSO-RESTORE-SEGURO.md`

---

**Assinatura Digital**:

```
Gerado automaticamente por GitHub Copilot
Data: 04/02/2026
Versão: 3.0.0
Hash: SHA256(migration-301 + frontend-fixes + dump-cleanup)
```
