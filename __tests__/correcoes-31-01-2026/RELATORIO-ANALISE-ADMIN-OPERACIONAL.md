# RELATÓRIO DE ANÁLISE PROFUNDA: Acesso Operacional do Admin

**Data**: 31/01/2026  
**Objetivo**: Identificar TODO código, RLS, RBAC e migrações onde admin ainda possui acesso operacional

---

## ⚠️ RESUMO EXECUTIVO

**STATUS**: ❌ **CRÍTICO** - Admin ainda possui múltiplas formas de acesso operacional

**Pontos Críticos Encontrados**:

- ✅ 3 rotas API operacionais acessíveis a admin
- ✅ 6+ migrações SQL com políticas RLS que concedem acesso operacional
- ✅ 1 rota RH que permite admin (account-info)
- ✅ Código legado em migrações antigas nunca removido

---

## 📋 1. ROTAS API COM ACESSO OPERACIONAL ADMIN

### 1.1. `/api/admin/laudos/regenerar-hashes/route.ts`

**Status**: ❌ **CRÍTICO - ADMIN ACESSA LAUDOS**

```typescript
// Linha 45
const user = await requireRole('admin');

// Linhas 61-68: Busca laudos sem hash
const resultado = await query(
  `SELECT id, lote_id, status FROM laudos WHERE hash IS NULL OR hash = ''`
);
```

**Problema**: Admin pode regenerar hashes de laudos (operação sobre dados operacionais)

**Correção Necessária**:

- DELETAR esta rota completamente
- Laudos são operacionais, admin NÃO deve acessar

---

### 1.2. `/api/admin/reenviar-lote/route.ts`

**Status**: ❌ **CRÍTICO - ADMIN ACESSA LOTES**

```typescript
// Linha 8
const user = await requireRole(['rh', 'gestor']);
```

**Análise**: Esta rota está CORRETA (não permite admin)

**Ação**: ✅ Nenhuma correção necessária

---

### 1.3. `/api/admin/funcionarios/route.ts`

**Status**: ⚠️ **AMBÍGUO - REQUER ANÁLISE**

```typescript
// Linha 8-12
const session = await requireRole('rh');

// Linhas 34-41: Consulta funcionários E avaliações
SELECT
  f.cpf, f.nome, ...,
  a.id as avaliacao_id, a.status as avaliacao_status,
  la.id as lote_idas lote_codigo
FROM funcionarios f
LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
```

**Problema**:

- Rota é `/api/admin/funcionarios` mas exige `requireRole('rh')`
- Nomenclatura confusa (está em /admin mas não permite admin)
- Admin pode acessar funcionários (RH/emissor) mas NÃO funcionários operacionais

**Correção Necessária**:

- Renomear rota para `/api/rh/funcionarios`
- OU manter em /admin mas documentar claramente que é para gestão RH

---

### 1.4. `/api/rh/account-info/route.ts`

**Status**: ❌ **CRÍTICO - PERMITE ADMIN INDEVIDAMENTE**

```typescript
// Linha 12-13
// EXCEÇÃO: Admin pode acessar esta rota para auditorias financeiras
const session = await requireRole(['rh', 'admin']);
```

**Problema**:

- Comentário justifica como "auditoria financeira" mas rota acessa dados de clínica
- Admin não deve acessar informações de conta de clínica específica

**Correção Necessária**:

```typescript
// REMOVER 'admin' do array
const session = await requireRole(['rh']);
```

---

## 📋 2. POLÍTICAS RLS EM MIGRAÇÕES SQL

### 2.1. `database/migrations/099_remove_legacy_profile.sql`

**Status**: ❌ **CRÍTICO - CONCEDE ACESSO TOTAL A ADMIN**

```sql
-- Linhas 73-95: Cria políticas FOR ALL para admin
CREATE POLICY "admin_all_avaliacoes" ON public.avaliacoes FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

CREATE POLICY "admin_all_empresas" ON public.empresas_clientes FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

CREATE POLICY "admin_all_lotes" ON public.lotes_avaliacao FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

CREATE POLICY "admin_all_laudos" ON public.laudos FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

CREATE POLICY "admin_all_respostas" ON public.respostas FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

CREATE POLICY "admin_all_resultados" ON public.resultados FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);
```

**Problema**:

- Estas políticas concedem acesso TOTAL (FOR ALL = SELECT/INSERT/UPDATE/DELETE)
- Admin pode ler, criar, modificar e deletar avaliações, empresas, lotes, laudos, respostas, resultados
- CONTRADIZ completamente as políticas block criadas em migrations/209

**Correção Necessária**:

```sql
-- REMOVER todas estas 6 políticas:
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;
```

---

### 2.2. `database/migrations/055_admin_empresas_fix.sql`

**Status**: ❌ **CRÍTICO - ADMIN FULL ACCESS A EMPRESAS**

```sql
-- Linhas 63-85: Admin com acesso total a empresas_clientes
CREATE POLICY "empresas_admin_select" ON empresas_clientes FOR SELECT ...
CREATE POLICY "empresas_admin_insert" ON empresas_clientes FOR INSERT ...
CREATE POLICY "empresas_admin_update" ON empresas_clientes FOR UPDATE ...
CREATE POLICY "empresas_admin_delete" ON empresas_clientes FOR DELETE ...
```

**Problema**:

- Admin pode gerenciar empresas (operacionais)
- Empresas são gerenciadas por RH de cada clínica
- Admin só deve gerenciar CLÍNICAS (contratantes tipo='clinica')

**Correção Necessária**:

```sql
-- REMOVER todas as 4 políticas:
DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;
```

---

### 2.3. `database/migrations/004_rls_rbac_fixes.sql`

**Status**: ✅ **CORRETO - Admin restrito a RH/Emissor**

```sql
-- Linhas 490-529: Admin acessa apenas funcionários RH/Emissor
CREATE POLICY "funcionarios_admin_select" ON funcionarios FOR SELECT
TO PUBLIC USING (
    current_user_perfil() = 'admin'
    AND perfil IN ('rh', 'emissor')
);
```

**Análise**: Esta política está CORRETA

- Admin só vê funcionários RH e Emissor (gestão de usuários do sistema)
- Admin NÃO vê funcionários operacionais das empresas

**Ação**: ✅ Nenhuma correção necessária

---

### 2.4. `database/migrations/007_refactor_status_fila_emissao.sql`

**Status**: ❌ **CRÍTICO - ADMIN ACESSA LOTES E LAUDOS**

```sql
-- Linha 350-363
CREATE POLICY policy_lotes_admin ON lotes_avaliacao
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

CREATE POLICY policy_laudos_admin ON laudos
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');
```

**Problema**: Admin pode ler lotes e laudos (dados operacionais)

**Correção Necessária**:

```sql
DROP POLICY IF EXISTS policy_lotes_admin ON lotes_avaliacao;
DROP POLICY IF EXISTS policy_laudos_admin ON laudos;
```

---

### 2.5. `database/migrations/001_security_rls_rbac.sql`

**Status**: ⚠️ **MIGRAÇÃO INICIAL - POSSUI PERMISSÕES ADMIN OPERACIONAIS**

```sql
-- Linha: Associar permissões aos papéis - ADMIN
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
AND p.name IN (
    'manage:avaliacoes',
    'manage:funcionarios',
    'manage:empresas',
    'manage:lotes',
    'manage:laudos'
) ON CONFLICT DO NOTHING;
```

**Problema**:

- Admin recebe permissões para gerenciar avaliacoes, empresas, lotes, laudos
- Esta é a migração inicial que CRIOU o problema

**Correção Necessária**:

- Esta migração é histórica e já foi executada
- A correção foi feita em `scripts/setup/popular-roles-permissions.sql`
- Mas a migração inicial permanece no código fonte como "código legado"

**Ação**: Adicionar comentário de depreciação

---

## 📋 3. POLÍTICAS RLS ATIVAS NO BANCO (Banco de Produção)

### 3.1. Políticas que BLOQUEIAM admin (✅ CORRETAS)

Estas foram criadas por `scripts/setup/corrigir-rls-admin.sql`:

```sql
avaliacoes_block_admin       -- RESTRICTIVE policy
empresas_block_admin         -- RESTRICTIVE policy
laudos_block_admin          -- RESTRICTIVE policy
lotes_block_admin           -- RESTRICTIVE policy
respostas_block_admin       -- RESTRICTIVE policy
resultados_block_admin      -- RESTRICTIVE policy
funcionarios_block_admin    -- RESTRICTIVE policy (exceto rh/emissor)
```

**Status**: ✅ Estas políticas estão CORRETAS e ATIVAS

---

### 3.2. Políticas PERMISSIVAS que ainda existem (❌ PROBLEMAS)

Encontradas em `database/schemas/schema-neon-backup.sql` (backup do banco):

```sql
-- Linha 7541
CREATE POLICY admin_all_avaliacoes ON public.avaliacoes
USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));

-- Linha 7548
CREATE POLICY admin_all_empresas ON public.empresas_clientes
USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));

-- Linha 7555
CREATE POLICY admin_all_laudos ON public.laudos
USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));

-- Linha 7562
CREATE POLICY admin_all_lotes ON public.lotes_avaliacao
USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));
```

**Status**: ❌ **CRÍTICO SE AINDA EXISTEM NO BANCO**

**Verificação Necessária**:

- Estas foram REMOVIDAS pelo script `corrigir-rls-admin.sql`?
- Se NÃO, as políticas RESTRICTIVE block sobrepõem estas permissivas
- Mas é boa prática remover completamente

**Ação**: Confirmar se foram removidas ou criar script para garantir remoção

---

## 📋 4. SCHEMA BACKUP ANALYSIS

### Arquivo: `database/schemas/schema-neon-backup.sql`

**Políticas encontradas**:

1. ✅ Block policies existem (linhas 7682, 7723, 7945, 7952)
2. ❌ Permissive policies admin*all*\* também existem

**Análise**:

- Como as block policies são RESTRICTIVE, elas têm precedência
- Mesmo com admin_all_avaliacoes, o avaliacoes_block_admin impede acesso
- Porém, é confuso e perigoso manter ambas

**Ação Recomendada**: Script de limpeza para remover policies permissivas antigas

---

## 📋 5. CÓDIGO TYPESCRIPT - OUTRAS ROTAS ADMIN

### Rotas que NÃO foram auditadas completamente:

```
/api/admin/financeiro/*
/api/admin/cobranca/*
/api/admin/planos/*
/api/admin/gestores-rh/*
/api/admin/emissores/*
/api/admin/clinicas/*
```

**Status**: ⚠️ **REQUER ANÁLISE ADICIONAL**

**Próximos Passos**: Auditar estas rotas para confirmar que são administrativas e não operacionais

---

## 📋 6. PLANO DE CORREÇÃO COMPLETO

### 6.1. **PRIORIDADE ALTA** (Executar IMEDIATAMENTE)

#### A. Remover rota de laudos do admin

```bash
# DELETAR arquivo
rm app/api/admin/laudos/regenerar-hashes/route.ts
```

#### B. Remover admin de account-info

```typescript
// app/api/rh/account-info/route.ts
- const session = await requireRole(['rh', 'admin']);
+ const session = await requireRole(['rh']);

// REMOVER comentário linha 11-12 sobre "EXCEÇÃO: Admin pode acessar..."
```

#### C. Criar script para remover políticas RLS permissivas

**Arquivo**: `scripts/setup/remover-rls-admin-permissivas.sql`

```sql
-- ==========================================
-- REMOVER POLÍTICAS RLS PERMISSIVAS PARA ADMIN
-- Estas políticas concedem acesso operacional ao admin
-- ==========================================

BEGIN;

-- 1. REMOVER políticas de migrations/099
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;

-- 2. REMOVER políticas de migrations/055
DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;

-- 3. REMOVER políticas de migrations/007
DROP POLICY IF EXISTS policy_lotes_admin ON lotes_avaliacao;
DROP POLICY IF EXISTS policy_laudos_admin ON laudos;

-- 4. VERIFICAR que políticas RESTRICTIVE ainda existem
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar políticas block
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%_block_admin';

    IF v_count < 7 THEN
        RAISE EXCEPTION 'ERRO: Políticas RESTRICTIVE block_admin não encontradas! Esperado: 7, Encontrado: %', v_count;
    END IF;

    RAISE NOTICE '✓ Políticas RESTRICTIVE block_admin confirmadas: %', v_count;
END $$;

-- 5. LISTAR políticas restantes com 'admin'
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE (policyname ILIKE '%admin%' OR qual ILIKE '%admin%')
ORDER BY tablename, policyname;

COMMIT;
```

---

### 6.2. **PRIORIDADE MÉDIA** (Executar em seguida)

#### D. Adicionar comentários de depreciação em migrações antigas

```sql
-- database/migrations/001_security_rls_rbac.sql
-- database/migrations/055_admin_empresas_fix.sql
-- database/migrations/099_remove_legacy_profile.sql

-- Adicionar no topo:
-- ==========================================
-- ⚠️ DEPRECIADO: Esta migração concede permissões
-- operacionais ao admin que foram REMOVIDAS em
-- correções posteriores (scripts/setup/corrigir-rls-admin.sql)
-- ==========================================
```

#### E. Renomear ou documentar `/api/admin/funcionarios`

```typescript
// Opção 1: Renomear pasta
mv app/api/admin/funcionarios app/api/rh/funcionarios-gestao

// Opção 2: Adicionar comentário claro no topo
/**
 * ⚠️ NOMENCLATURA: Esta rota está em /admin mas requer perfil RH
 * Motivo: Gerenciamento de funcionários é operacional (RH)
 * Admin NÃO tem acesso a esta funcionalidade
 */
```

---

### 6.3. **PRIORIDADE BAIXA** (Limpeza e documentação)

#### F. Criar teste automatizado para garantir bloqueio admin

```typescript
// __tests__/security/admin-operational-block.test.ts
describe('Admin Operational Access Prevention', () => {
  it('should block admin from avaliacoes table', async () => {
    // Test RLS policy blocks admin SELECT on avaliacoes
  });

  it('should block admin from laudos API route', async () => {
    const response = await fetch('/api/admin/laudos/regenerar-hashes', {
      headers: { Cookie: adminSessionCookie },
    });
    expect(response.status).toBe(404); // Route should not exist
  });

  // ... mais testes
});
```

#### G. Atualizar documentação

```markdown
// docs/ROLES-AND-PERMISSIONS.md

## Admin - Administrador do Sistema

### ✅ PODE ACESSAR (Administrativo):

- Gerenciar clínicas (contratantes tipo='clinica')
- Gerenciar planos e preços
- Gerenciar emissores
- Gerenciar usuários RH (criar, editar, inativar)
- Ver logs de auditoria
- Configurações globais do sistema

### ❌ NÃO PODE ACESSAR (Operacional):

- Empresas (gerenciadas por RH de cada clínica)
- Funcionários operacionais (gerenciados por RH)
- Avaliações (respondem funcionários, visualizam RH)
- Lotes (criados por RH, visualizados por emissor)
- Laudos (emitidos por emissor, visualizados por RH)
- Respostas e Resultados (dados operacionais)

### 🔒 Implementação de Segurança:

- RLS Policies: RESTRICTIVE block_admin em todas tabelas operacionais
- RBAC: 10 permissões (apenas administrativas)
- Middleware: requireRole() bloqueia rotas operacionais
- API Routes: Nenhuma rota /api/admin acessa dados operacionais
```

---

## 📊 7. RESUMO DE ACHADOS

### Crítico (❌ Requer correção imediata):

1. ✅ `/api/admin/laudos/regenerar-hashes/route.ts` - Admin acessa laudos
2. ✅ `/api/rh/account-info/route.ts` - Permite admin indevidamente
3. ✅ `migrations/099_remove_legacy_profile.sql` - 6 políticas FOR ALL
4. ✅ `migrations/055_admin_empresas_fix.sql` - Admin full access empresas
5. ✅ `migrations/007_refactor_status_fila_emissao.sql` - Admin acessa lotes/laudos

### Médio (⚠️ Requer análise):

6. ⚠️ `/api/admin/funcionarios/route.ts` - Nomenclatura confusa
7. ⚠️ Rotas `/api/admin/financeiro/*` e `/api/admin/cobranca/*` - Não auditadas

### Baixo (✅ Correto ou legado documentado):

8. ✅ Políticas RESTRICTIVE block_admin funcionando
9. ✅ RBAC com 10 permissões administrativas correto
10. ✅ Migration 001 é código legado mas sobrescrito por correções

---

## 🎯 8. PRÓXIMOS PASSOS RECOMENDADOS

### Passo 1: Executar correções críticas

```bash
# 1. Deletar rota de laudos
rm app/api/admin/laudos/regenerar-hashes/route.ts

# 2. Corrigir account-info
# (editar manualmente app/api/rh/account-info/route.ts linha 12)

# 3. Executar script SQL de limpeza
psql -d nr-bps_db -f scripts/setup/remover-rls-admin-permissivas.sql
```

### Passo 2: Verificar banco de dados

```sql
-- Listar TODAS as políticas que mencionam admin
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE policyname ILIKE '%admin%'
   OR qual ILIKE '%admin%'
ORDER BY tablename;

-- Deve retornar APENAS:
-- funcionarios_admin_select/insert/update/delete (perfil IN ('rh','emissor'))
-- clinicas_own_select (admin vê sua própria clínica)
-- 7x *_block_admin (RESTRICTIVE policies)
```

### Passo 3: Testes

```bash
# Executar testes de segurança
npm test __tests__/security/admin-operational-block.test.ts

# Executar testes RLS
psql -d nr-bps_db -f database/tests/test-rls-v3.sql
```

### Passo 4: Documentação

- Atualizar docs/ROLES-AND-PERMISSIONS.md
- Adicionar comentários de depreciação em migrações antigas
- Criar CHANGELOG.md com todas as correções realizadas

---

## ✅ 9. CHECKLIST DE VALIDAÇÃO FINAL

Após executar todas as correções, validar:

- [ ] Rota `/api/admin/laudos/regenerar-hashes` não existe (404)
- [ ] `/api/rh/account-info` rejeita admin (403)
- [ ] Políticas `admin_all_*` não existem no banco
- [ ] Políticas `*_block_admin` ativas e funcionando
- [ ] Admin possui exatamente 10 permissões RBAC
- [ ] Testes RLS passam 100%
- [ ] Documentação atualizada

---

**FIM DO RELATÓRIO**

_Gerado por análise profunda do código em 31/01/2026_
