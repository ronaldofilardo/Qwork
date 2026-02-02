# Análise Crítica: Vulnerabilidades de Segurança RLS

**Data**: 2026-01-29  
**Status**: 🔴 CRÍTICO - 6 vulnerabilidades identificadas

---

## 🚨 Situação 1: Conflito entre `contratantes_funcionarios` e `funcionarios.contratante_id`

### Problema Identificado

**Dados duplicados** causando inconsistência arquitetural.

#### Evidências

```sql
-- Banco atual:
SELECT COUNT(*) FROM contratantes_funcionarios;
-- Resultado: 3 registros

SELECT COUNT(*) FROM funcionarios WHERE contratante_id IS NOT NULL;
-- Resultado: 8 registros

-- INCONSISTÊNCIA: 8 funcionários têm contratante_id, mas apenas 3 na tabela de relacionamento
```

#### Estrutura Conflitante

```sql
-- Tabela: funcionarios
contratante_id INTEGER REFERENCES contratantes(id) ON DELETE SET NULL

-- Tabela: contratantes_funcionarios
funcionario_id INTEGER REFERENCES funcionarios(id) ON DELETE CASCADE
contratante_id INTEGER REFERENCES contratantes(id) ON DELETE CASCADE
```

### Impacto

- ⚠️ **Dados duplicados**: Mesma informação em 2 lugares
- ⚠️ **Inconsistência**: 8 vs 3 registros (5 desincronizados)
- ⚠️ **Queries complexas**: Código precisa verificar ambos os lugares
- ⚠️ **Bugs de lógica**: Qual é a fonte da verdade?

### Origem

- Migration 108: Adicionou `funcionarios.contratante_id`
- Migration 201: Tentou limpar `contratantes_funcionarios` mas falhou
- Resultado: Tabela de relacionamento N:N permaneceu ativa

### Recomendações

#### Opção A: Usar `funcionarios.contratante_id` (RECOMENDADO)

```sql
-- Migration: Consolidar em funcionarios.contratante_id

BEGIN;

-- 1. Backfill de contratantes_funcionarios -> funcionarios
UPDATE funcionarios f
SET contratante_id = cf.contratante_id
FROM contratantes_funcionarios cf
WHERE f.id = cf.funcionario_id
  AND f.contratante_id IS NULL;

-- 2. Validar que não há conflitos
DO $$
DECLARE
  conflitos INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflitos
  FROM funcionarios f
  JOIN contratantes_funcionarios cf ON f.id = cf.funcionario_id
  WHERE f.contratante_id != cf.contratante_id;

  IF conflitos > 0 THEN
    RAISE EXCEPTION 'Conflito: % funcionários com contratante_id diferente', conflitos;
  END IF;
END $$;

-- 3. Dropar tabela obsoleta
DROP TABLE contratantes_funcionarios CASCADE;

-- 4. Atualizar constraint
ALTER TABLE funcionarios
  DROP CONSTRAINT IF EXISTS funcionarios_clinica_check,
  ADD CONSTRAINT funcionarios_clinica_or_contratante_check
  CHECK (
    (perfil IN ('funcionario', 'rh') AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
    (perfil = 'gestor_entidade' AND contratante_id IS NOT NULL AND clinica_id IS NULL) OR
    (perfil IN ('emissor', 'admin') AND clinica_id IS NULL AND contratante_id IS NULL)
  ) NOT VALID;

COMMIT;
```

**Vantagens**:

- ✅ 1:1 relationship (gestor pertence a 1 entidade)
- ✅ Performance: Join direto sem tabela intermediária
- ✅ Simplicidade: 1 fonte de verdade
- ✅ Alinhado com arquitetura atual (clinica_id já funciona assim)

#### Opção B: Usar `contratantes_funcionarios`

```sql
-- Migration: Reverter para tabela de relacionamento

BEGIN;

-- 1. Migrar funcionarios.contratante_id -> contratantes_funcionarios
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id)
SELECT id, contratante_id
FROM funcionarios
WHERE contratante_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Limpar coluna
ALTER TABLE funcionarios DROP COLUMN contratante_id;

COMMIT;
```

**Desvantagens**:

- ❌ Overcomplicated para relacionamento 1:1
- ❌ Join extra em toda query
- ❌ Não alinhado com padrão clinica_id

---

## 🚨 Situação 2: Admin NÃO bloqueado de `avaliacoes` (Brecha de Segurança)

### Problema Identificado

**Perfil admin consegue acessar avaliações** sem policy que restrinja.

#### Evidências

```sql
-- Policies atuais em avaliacoes:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'avaliacoes';

-- Resultado:
avaliacoes_own_insert    | INSERT
avaliacoes_own_select    | SELECT | funcionario_cpf = current_user_cpf()
avaliacoes_own_update    | UPDATE | funcionario_cpf = current_user_cpf()
avaliacoes_rh_clinica    | SELECT | perfil='rh' AND clinica match

-- AUSENTE: Policy bloqueando admin de avaliacoes
```

#### Teste de Vulnerabilidade

```sql
-- Simular sessão admin:
SET LOCAL app.current_user_cpf = '12345678900';
SET LOCAL app.current_user_perfil = 'admin';

-- Admin consegue:
SELECT * FROM avaliacoes; -- ✅ PASSA (não deveria!)
```

### Impacto

- 🔴 **GDPR/LGPD**: Admin acessa dados sensíveis de saúde
- 🔴 **Auditoria**: Violação do princípio "least privilege"
- 🔴 **Compliance**: Admin não precisa ver avaliações individuais

### Origem

- Migration 020: `remove_admin_operational_rls.sql`
- Código: "Admin não precisa de policies operacionais"
- Problema: Removeu policies mas **RLS ainda está ENABLED**
- Resultado: RLS sem policies = **ACESSO TOTAL**

### Como RLS Funciona

```
Se tabela tem RLS ENABLED:
  1. Verifica se existe policy que permite o acesso
  2. Se NENHUMA policy permite → NEGA acesso
  3. EXCEÇÃO: Se NÃO HÁ policy alguma → PERMITE (comportamento padrão PostgreSQL)
```

### Recomendações

#### Solução Imediata (Migration 209)

```sql
-- Migration 209: Bloquear admin de avaliacoes

BEGIN;

-- Policy explícita: Admin NÃO acessa avaliacoes
CREATE POLICY "avaliacoes_block_admin" ON avaliacoes
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Validação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'avaliacoes'
      AND policyname = 'avaliacoes_block_admin'
  ) THEN
    RAISE EXCEPTION 'Policy avaliacoes_block_admin nao criada';
  END IF;

  RAISE NOTICE 'OK - Admin bloqueado de avaliacoes';
END $$;

COMMIT;
```

**RESTRICTIVE Policy**: Funciona como AND (todas policies RESTRICTIVE devem passar)

#### Solução Completa

Bloquear admin de **todas** as tabelas operacionais:

- `avaliacoes` ✅
- `respostas` (contém dados de avaliações)
- `resultados` (contém scores)
- `funcionarios` (dados pessoais - admin só precisa de dashboard agregado)

---

## 🚨 Situação 3: Falta policies para `perfil='admin'` (Acesso Indefinido)

### Problema Identificado

**Ausência de policies explícitas para admin** em 8 tabelas críticas.

#### Evidências

```sql
-- Tabelas com RLS mas SEM policies para admin:
SELECT
  schemaname,
  tablename,
  COUNT(policyname) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual NOT LIKE '%admin%' OR qual IS NULL)
GROUP BY schemaname, tablename
HAVING COUNT(policyname) < 4; -- SELECT, INSERT, UPDATE, DELETE

-- Resultado: 8 tabelas
avaliacoes (4 policies, nenhuma para admin)
respostas (4 policies, nenhuma para admin)
resultados (2 policies, nenhuma para admin)
funcionarios (6 policies, nenhuma para admin)
clinicas (1 policy, nenhuma para admin)
lotes_avaliacao (5 policies, nenhuma para admin)
laudos (5 policies, nenhuma para admin)
empresas_clientes (4 policies, nenhuma para admin)
```

### Impacto

- ⚠️ **Comportamento indefinido**: PostgreSQL permite por padrão quando RLS enabled mas sem policy match
- ⚠️ **Auditoria impossível**: Não se sabe o que admin pode/não pode fazer
- ⚠️ **Risco de escalação**: Admin pode acessar dados que não deveria

### Onde Admin DEVERIA ter acesso

```sql
-- Acesso legítimo para admin:
audit_logs           -- ✅ Monitoramento
roles                -- ✅ Gerenciamento RBAC
permissions          -- ✅ Gerenciamento RBAC
role_permissions     -- ✅ Gerenciamento RBAC
clinicas             -- ✅ Cadastro/gestão (metadados, não dados sensíveis)
contratantes         -- ✅ Cadastro/gestão

-- Acesso NEGADO para admin:
avaliacoes           -- ❌ Dados pessoais de saúde
respostas            -- ❌ Respostas individuais
resultados           -- ❌ Scores individuais
funcionarios         -- ❌ Dados pessoais (CPF, email, etc)
lotes_avaliacao      -- ❌ Dados operacionais de clínicas
laudos               -- ❌ Documentos com dados sensíveis
empresas_clientes    -- ❌ Dados das empresas clientes
```

### Recomendações

#### Migration 209: Definir policies explícitas para admin

```sql
BEGIN;

-- 1. Admin PODE acessar tabelas administrativas
CREATE POLICY "roles_admin_all" ON roles
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

CREATE POLICY "permissions_admin_all" ON permissions
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

CREATE POLICY "clinicas_admin_all" ON clinicas
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

CREATE POLICY "contratantes_admin_all" ON contratantes
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- 2. Admin NÃO PODE acessar dados operacionais (RESTRICTIVE)
CREATE POLICY "avaliacoes_block_admin" ON avaliacoes
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "respostas_block_admin" ON respostas
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "resultados_block_admin" ON resultados
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "funcionarios_block_admin" ON funcionarios
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "lotes_block_admin" ON lotes_avaliacao
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "laudos_block_admin" ON laudos
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

CREATE POLICY "empresas_block_admin" ON empresas_clientes
  AS RESTRICTIVE
  FOR ALL TO PUBLIC
  USING (current_user_perfil() != 'admin');

COMMIT;
```

---

## 🚨 Situação 4: Funções helper RLS sem validação (NULL permite bypass)

### Problema Identificado

**Funções retornam NULL sem validar contexto**, permitindo bypass de RLS.

#### Código Atual

```sql
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS text AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;  -- ⚠️ PROBLEMA: Retorna NULL silenciosamente
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### Teste de Vulnerabilidade

```sql
-- Cenário 1: Sem contexto (sessão não inicializada)
-- Não chamar SET LOCAL...

SELECT * FROM avaliacoes WHERE funcionario_cpf = current_user_cpf();
-- current_user_cpf() = NULL
-- WHERE funcionario_cpf = NULL → SEMPRE FALSE (SQL standard)
-- Resultado: Nenhum registro retornado ✅ (seguro por acaso)

-- Cenário 2: Attack via SQL Injection
-- Se policy usa: WHERE funcionario_cpf = current_user_cpf() OR current_user_cpf() IS NULL
SELECT * FROM avaliacoes;
-- Retorna TODOS os registros! ❌ (bypass completo)
```

#### Problema Real

```sql
-- Policy atual em lotes_avaliacao:
CREATE POLICY "lotes_rh_clinica" ON lotes_avaliacao
  FOR SELECT USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
  );

-- Se current_user_clinica_id() retorna NULL:
WHERE clinica_id = NULL -- Sempre FALSE (seguro)

-- MAS se alguém criou policy errada:
WHERE clinica_id IS NULL OR clinica_id = current_user_clinica_id()
-- Com função retornando NULL → BYPASS!
```

### Impacto

- 🔴 **Bypass silencioso**: Erros engolidos sem aviso
- 🔴 **Debug impossível**: NULL pode ser valor legítimo ou erro
- 🔴 **Risco de SQL injection**: Policies mal escritas permitem bypass

### Origem

- Design inicial das funções helper
- Princípio "fail gracefully" aplicado incorretamente
- Falta de validação de requisitos mínimos

### Recomendações

#### Migration 209: Adicionar validação obrigatória

```sql
-- Migration 209: Funções helper com validação

BEGIN;

-- 1. Função com validação obrigatória
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS text AS $$
DECLARE
  v_cpf TEXT;
BEGIN
  v_cpf := NULLIF(current_setting('app.current_user_cpf', TRUE), '');

  -- Validação: CPF obrigatório para operações com RLS
  IF v_cpf IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not set. Call SET LOCAL before query.';
  END IF;

  RETURN v_cpf;
EXCEPTION
  WHEN undefined_object THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not configured.';
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Aplicar em todas as funções helper
CREATE OR REPLACE FUNCTION public.current_user_perfil()
RETURNS text AS $$
DECLARE
  v_perfil TEXT;
BEGIN
  v_perfil := NULLIF(current_setting('app.current_user_perfil', TRUE), '');

  IF v_perfil IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not set.';
  END IF;

  -- Validação extra: perfil válido
  IF v_perfil NOT IN ('funcionario', 'rh', 'emissor', 'admin', 'gestor_entidade') THEN
    RAISE EXCEPTION 'SECURITY: Invalid perfil "%"', v_perfil;
  END IF;

  RETURN v_perfil;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Funções opcionais (podem retornar NULL)
CREATE OR REPLACE FUNCTION public.current_user_clinica_id_optional()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_clinica_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Renomear atual para deixar claro que é opcional
ALTER FUNCTION current_user_clinica_id() RENAME TO current_user_clinica_id_optional;
ALTER FUNCTION current_user_contratante_id() RENAME TO current_user_contratante_id_optional;

COMMIT;
```

**Mudança de comportamento**:

```sql
-- Antes:
SELECT * FROM avaliacoes; -- Retorna 0 registros (NULL silencioso)

-- Depois:
SELECT * FROM avaliacoes;
-- ERROR: SECURITY: app.current_user_cpf not set
-- ✅ Força desenvolvedor a inicializar contexto
```

---

## 🚨 Situação 5: DROP POLICY em tabela errada (Policies duplicadas)

### Problema Identificado

**Migrations tentam dropar policies na tabela errada**, causando duplicação.

#### Evidências

```sql
-- Migration 001_security_rls_rbac.sql (ERRADO):
DROP POLICY IF EXISTS "avaliacoes_own_select" ON public.funcionarios;  -- ❌ Tabela errada!
DROP POLICY IF EXISTS "avaliacoes_own_insert" ON public.funcionarios;  -- ❌ Tabela errada!
CREATE POLICY avaliacoes_own_select ON public.avaliacoes ...            -- ✅ Cria corretamente

-- Migration 004_rls_rbac_fixes.sql (CORRETO):
DROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;           -- ✅ Tabela correta
CREATE POLICY "avaliacoes_own_select" ON avaliacoes ...                 -- ✅ Recria corretamente

-- Resultado: Policy criada 2x (migration 001 e 004)
```

#### Teste

```sql
-- Ver policies duplicadas:
SELECT
  schemaname,
  tablename,
  policyname,
  COUNT(*) as occurrences
FROM pg_policies
GROUP BY schemaname, tablename, policyname
HAVING COUNT(*) > 1;

-- Resultado: 0 (PostgreSQL já trata duplicação)
-- MAS: Log mostra tentativas de DROP em tabela errada
```

### Impacto

- ⚠️ **Confusão em logs**: Warnings sobre policies inexistentes
- ⚠️ **Migrations frágeis**: Comportamento não determinístico
- ⚠️ **Risco em rollback**: Pode dropar policy errada

### Origem

- Copy/paste error em migration 001
- Pattern: `DROP POLICY IF EXISTS "policy_de_avaliacoes" ON public.funcionarios`
- Provavelmente copiado de seção de `funcionarios` e não atualizado

### Recomendações

#### Migration 209: Limpar e validar policies

```sql
-- Migration 209: Cleanup de policies e validação

BEGIN;

-- 1. Listar todas as policies por tabela
CREATE TEMP TABLE expected_policies (
  tablename TEXT,
  policyname TEXT,
  policy_cmd TEXT
);

INSERT INTO expected_policies VALUES
  ('avaliacoes', 'avaliacoes_own_select', 'SELECT'),
  ('avaliacoes', 'avaliacoes_own_insert', 'INSERT'),
  ('avaliacoes', 'avaliacoes_own_update', 'UPDATE'),
  ('avaliacoes', 'avaliacoes_rh_select', 'SELECT'),
  ('avaliacoes', 'avaliacoes_block_admin', 'ALL'),
  -- ... listar todas
  ('funcionarios', 'funcionarios_own_select', 'SELECT'),
  ('funcionarios', 'funcionarios_rh_clinica', 'SELECT');

-- 2. Validar que policies estão nas tabelas corretas
DO $$
DECLARE
  v_unexpected INTEGER;
BEGIN
  -- Verificar policies inesperadas
  SELECT COUNT(*) INTO v_unexpected
  FROM pg_policies p
  WHERE NOT EXISTS (
    SELECT 1 FROM expected_policies e
    WHERE e.tablename = p.tablename
      AND e.policyname = p.policyname
  );

  IF v_unexpected > 0 THEN
    RAISE WARNING '% policies inesperadas encontradas', v_unexpected;

    -- Logar para análise
    INSERT INTO audit_logs (action, resource, details)
    SELECT
      'POLICY_UNEXPECTED',
      tablename,
      policyname || ' on ' || tablename
    FROM pg_policies p
    WHERE NOT EXISTS (
      SELECT 1 FROM expected_policies e
      WHERE e.tablename = p.tablename
        AND e.policyname = p.policyname
    );
  END IF;
END $$;

-- 3. Criar script de correção para migrations futuras
COMMENT ON FUNCTION current_user_cpf IS
  'Helper RLS - SEMPRE use DROP POLICY ... ON <correct_table>';

COMMIT;
```

#### Guideline para futuras migrations

```sql
-- ❌ ERRADO:
DROP POLICY IF EXISTS "avaliacoes_own_select" ON public.funcionarios;

-- ✅ CORRETO:
DROP POLICY IF EXISTS "avaliacoes_own_select" ON public.avaliacoes;

-- ✅ PATTERN:
-- DROP POLICY IF EXISTS "<table>_<perfil>_<cmd>" ON public.<table>;
--                       ^^^^^^^ deve bater
```

---

## 🚨 Situação 6: Ausência de BYPASSRLS (Impossibilita manutenções)

### Problema Identificado

**Nenhum usuário tem BYPASSRLS**, impedindo operações administrativas.

#### Evidências

```sql
-- Verificar usuários com BYPASSRLS:
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolbypassrls = true;
-- Resultado: 0 rows

-- Verificar usuário atual:
\du postgres
                                   Lista de roles
 Nome do role |                         Atributos                         | Membro de
--------------+----------------------------------------------------------+-----------
 postgres     | Superusuário, Criar role, Criar BD, Replicação, Contornar RLS | {}

-- postgres tem BYPASSRLS, mas app usa role diferente
```

#### Cenário Problemático

```sql
-- DBA precisa fazer manutenção:
-- 1. Migrar dados entre clínicas
-- 2. Corrigir inconsistências
-- 3. Backfill de dados

-- Com role normal (ex: app_user):
SET ROLE app_user;
UPDATE funcionarios SET clinica_id = 2 WHERE id = 100;
-- ERRO: RLS bloqueia (perfil não é 'rh' daquela clínica)

-- Workaround atual: Desabilitar RLS temporariamente
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
UPDATE funcionarios SET clinica_id = 2 WHERE id = 100;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- ⚠️ RISCO: Se script falhar, RLS fica desabilitado!
```

### Impacto

- 🔴 **Operações críticas impossíveis**: Correção de dados requer workarounds
- 🔴 **Risco em emergências**: DBA não consegue agir rapidamente
- 🔴 **Auditoria comprometida**: Desabilitar RLS oculta ações do log

### Casos de Uso Legítimos para BYPASSRLS

1. **Migrations de dados**: Mover funcionários entre clínicas
2. **Correção de bugs**: Dados corrompidos que violam RLS
3. **Relatórios globais**: Dashboards cross-clinica para direção
4. **Backup/Restore**: pg_dump precisa ler todos os dados
5. **Emergency hotfix**: Incidentes que requerem ação imediata

### Recomendações

#### Migration 209: Criar role com BYPASSRLS

```sql
-- Migration 209: Criar role administrativo

BEGIN;

-- 1. Criar role específico para DBA
CREATE ROLE dba_maintenance
  WITH LOGIN
  PASSWORD 'gerar-senha-forte-aqui'
  BYPASSRLS;

-- 2. Garantir que não herda permissões de PUBLIC
REVOKE ALL ON DATABASE neondb FROM dba_maintenance;
REVOKE ALL ON SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM dba_maintenance;

-- 3. Conceder apenas permissões necessárias (princípio least privilege)
GRANT CONNECT ON DATABASE neondb TO dba_maintenance;
GRANT USAGE ON SCHEMA public TO dba_maintenance;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dba_maintenance;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO dba_maintenance;

-- 4. Garantir que todas as ações são auditadas
ALTER ROLE dba_maintenance SET log_statement = 'all';
ALTER ROLE dba_maintenance SET log_min_duration_statement = 0;

-- 5. Criar função de auditoria específica
CREATE OR REPLACE FUNCTION audit_bypassrls_action()
RETURNS EVENT_TRIGGER AS $$
BEGIN
  IF current_user IN ('dba_maintenance', 'postgres') THEN
    INSERT INTO audit_logs (
      user_cpf,
      user_perfil,
      action,
      resource,
      details,
      ip_address
    ) VALUES (
      current_user,
      'dba_bypassrls',
      'BYPASS_RLS',
      TG_TAG,
      'Query: ' || current_query(),
      inet_client_addr()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar event trigger para capturar ações
CREATE EVENT TRIGGER audit_dba_actions
  ON ddl_command_end
  EXECUTE FUNCTION audit_bypassrls_action();

-- 6. Documentar uso
COMMENT ON ROLE dba_maintenance IS
  'Role administrativo com BYPASSRLS para manutenções críticas.
   USO RESTRITO: Apenas para migrations, correções de dados e emergências.
   TODAS as ações são auditadas em audit_logs com perfil dba_bypassrls.';

-- 7. Validação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'dba_maintenance'
      AND rolbypassrls = true
  ) THEN
    RAISE EXCEPTION 'Role dba_maintenance nao criado com BYPASSRLS';
  END IF;

  RAISE NOTICE 'OK - Role dba_maintenance criado com BYPASSRLS e auditoria';
END $$;

COMMIT;
```

#### Guideline de Uso

```sql
-- ✅ CORRETO: Usar apenas para operações que realmente precisam
psql -U dba_maintenance -d neondb -c "
  UPDATE funcionarios
  SET clinica_id = 2
  WHERE id = 100 AND clinica_id = 1;
"

-- ✅ CORRETO: Documentar no ticket/PR
-- Ticket #1234: Migrar funcionário X da clínica A para B
-- Justificativa: Funcionário transferido entre unidades
-- Comando executado com dba_maintenance (BYPASSRLS)

-- ❌ ERRADO: Usar para operações normais da aplicação
-- Role app_user NÃO deve ter BYPASSRLS
-- Aplicação deve respeitar RLS sempre
```

---

## 📊 Matriz de Risco

| Vulnerabilidade                                 | Severidade | Impacto              | Complexidade Fix | Prioridade |
| ----------------------------------------------- | ---------- | -------------------- | ---------------- | ---------- |
| 1. Dados duplicados (contratantes_funcionarios) | 🟡 MÉDIA   | Inconsistência, bugs | Média            | P2         |
| 2. Admin acessa avaliacoes                      | 🔴 CRÍTICA | LGPD, compliance     | Baixa            | **P0**     |
| 3. Falta policies para admin                    | 🔴 CRÍTICA | Auditoria, escalação | Média            | **P0**     |
| 4. Funções helper sem validação                 | 🔴 CRÍTICA | Bypass RLS           | Média            | **P0**     |
| 5. DROP POLICY em tabela errada                 | 🟡 MÉDIA   | Confusão, rollback   | Baixa            | P2         |
| 6. Ausência de BYPASSRLS                        | 🟠 ALTA    | Operações críticas   | Baixa            | **P1**     |

---

## 🎯 Plano de Ação Recomendado

### Fase 1: Crítico (Esta semana)

```bash
# 1. Bloquear admin de avaliacoes (P0)
pnpm migration:create 209_fix_admin_rls_avaliacoes
# Implementar RESTRICTIVE policy

# 2. Validar funções helper (P0)
pnpm migration:create 210_validate_rls_helpers
# Adicionar RAISE EXCEPTION em NULL

# 3. Definir policies admin (P0)
pnpm migration:create 211_explicit_admin_policies
# Criar policies ALLOW e RESTRICTIVE
```

### Fase 2: Importante (Próxima sprint)

```bash
# 4. Criar role BYPASSRLS (P1)
pnpm migration:create 212_create_dba_maintenance_role

# 5. Consolidar contratantes_funcionarios (P2)
pnpm migration:create 213_consolidate_contratante_relationship
```

### Fase 3: Limpeza (Backlog)

```bash
# 6. Limpar DROP POLICY errados (P2)
pnpm migration:create 214_cleanup_policy_drops

# 7. Adicionar testes RLS automatizados
pnpm test:create rls-security-comprehensive
```

---

## 🧪 Testes de Validação

Após aplicar migrations, executar:

```sql
-- Teste 1: Admin bloqueado de avaliacoes
SET LOCAL app.current_user_cpf = '12345678900';
SET LOCAL app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM avaliacoes;
-- Deve retornar 0 ou ERROR (policy RESTRICTIVE)

-- Teste 2: Funções helper com validação
RESET app.current_user_cpf;
SELECT current_user_cpf();
-- Deve retornar ERROR: app.current_user_cpf not set

-- Teste 3: Role BYPASSRLS funciona
\c - dba_maintenance
SELECT COUNT(*) FROM avaliacoes;
-- Deve retornar contagem total (sem RLS)

-- Teste 4: Auditoria captura ações DBA
SELECT * FROM audit_logs
WHERE user_perfil = 'dba_bypassrls'
ORDER BY created_at DESC LIMIT 10;
-- Deve mostrar ações do dba_maintenance
```

---

## 📚 Referências

1. [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
2. [OWASP - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
3. [LGPD - Art. 46 (Princípio da Necessidade)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
4. Migration 108: `add_contratante_id_to_funcionarios.sql`
5. Migration 201: `fix_gestor_entidade_as_funcionario.sql`
6. Migration 020: `remove_admin_operational_rls.sql`

---

**Preparado por**: GitHub Copilot  
**Revisão necessária**: DBA, Security Team, Compliance  
**Próximo passo**: Criar PR com migrations 209-214
