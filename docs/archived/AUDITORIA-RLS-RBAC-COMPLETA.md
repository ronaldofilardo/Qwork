# Auditoria Completa - Políticas RLS/RBAC e Arquitetura

**Data:** 29 de janeiro de 2026  
**Tipo:** Auditoria de segurança e consistência  
**Criticidade:** 🔴 ALTA - Inconsistências encontradas

---

## 📋 Executive Summary

Esta auditoria identificou **13 inconsistências críticas** e **8 inconsistências moderadas** nas políticas de segurança, RBAC, RLS e arquitetura do sistema Qwork.

### Severidade dos Problemas

| Severidade  | Quantidade | Impacto                                 |
| ----------- | ---------- | --------------------------------------- |
| 🔴 Crítica  | 13         | Falhas de segurança, vazamento de dados |
| 🟡 Moderada | 8          | Inconsistência entre docs e código      |
| 🟢 Baixa    | 3          | Melhorias recomendadas                  |

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Inconsistência: Gestor Entidade em `funcionarios`**

**Localização:**

- Documentação: [docs/security/GUIA-COMPLETO-RLS-RBAC.md:59-62](docs/security/GUIA-COMPLETO-RLS-RBAC.md#L59-L62)
- Código: [lib/db.ts:1466-1700](lib/db.ts#L1466-L1700) (função `criarContaResponsavel`)
- Migration: [database/migrations/201_fix_gestor_entidade_as_funcionario.sql](database/migrations/201_fix_gestor_entidade_as_funcionario.sql)

**Descrição:**
A documentação afirma que Gestor Entidade **NÃO** deve ter entrada na tabela `funcionarios`:

```markdown
##### Gestor Entidade (`perfil='gestor_entidade'`)

- **Tabelas:** Apenas `contratantes_senhas` (SEM entrada em `funcionarios`)
```

**Realidade no código:**

```typescript
// lib/db.ts - criarContaResponsavel()
// Para tipo === 'entidade' (Gestores Entidade):
// NÃO cria registro em `funcionarios`
// Apenas cria entrada em `contratantes_senhas` com bcrypt
```

**Problema:**  
A migration 201 foi criada para **remover** gestores entidade da tabela `funcionarios`, mas:

1. Não há garantia de que novos gestores entidade não sejam criados em `funcionarios` por algum fluxo alternativo
2. As políticas RLS em `funcionarios` não explicitam bloqueio para `gestor_entidade`
3. A constraint `funcionarios_owner_check` não previne `perfil='gestor_entidade'`

**Impacto:** 🔴 **CRÍTICO**

- Violação do princípio de separação gestor/funcionário
- Gestores entidade podem aparecer em listagens de funcionários
- Conflito com RLS se gestor entidade tiver `clinica_id`

**Recomendação:**

```sql
-- Adicionar constraint para prevenir gestor_entidade em funcionarios
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_no_gestor_entidade
CHECK (perfil != 'gestor_entidade');
```

---

### 2. **Conflito: `contratantes_funcionarios` vs `funcionarios.contratante_id`**

**Localização:**

- Tabela polimórfica: `contratantes_funcionarios`
- Nova coluna: `funcionarios.contratante_id` (migration 108)
- Uso: [lib/db.ts:vincularFuncionarioContratante](lib/db.ts)

**Descrição:**  
Existem **duas formas** de vincular funcionários a contratantes:

1. **Polimórfica**: Tabela `contratantes_funcionarios` com `funcionario_id` + `contratante_id` + `tipo_contratante`
2. **Direta**: Coluna `funcionarios.contratante_id` (adicionada na migration 108)

**Código atual:**

```typescript
// Usa tabela polimórfica
export async function vincularFuncionarioContratante(
  funcionarioId: number,
  contratanteId: number,
  tipoContratante: TipoContratante,
  session?: Session
): Promise<ContratanteFuncionario> {
  const result = await query<ContratanteFuncionario>(
    `INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
     VALUES ($1, $2, $3, true)
     ...
```

**Problema:**

1. A coluna `funcionarios.contratante_id` existe mas não é usada consistentemente
2. Pode haver **dessincronização** entre as duas fontes de verdade
3. Queries podem retornar resultados diferentes dependendo de qual fonte consultam
4. RLS policies não consideram ambas as fontes

**Impacto:** 🔴 **CRÍTICO**

- Dados duplicados e potencialmente inconsistentes
- Queries podem falhar ou retornar dados errados
- Violação da normalização (DRY)

**Recomendação:**

1. **Escolher UMA abordagem** (recomendo `contratantes_funcionarios` por ser mais flexível)
2. **Deprecar** `funcionarios.contratante_id` ou usá-la apenas como cache desnormalizado
3. **Criar trigger** para sincronização automática se mantiver ambos

---

### 3. **Falha RLS: Admin bloqueado de `avaliacoes` mas pode via JOIN**

**Localização:**

- Policy: [database/migrations/001_security_rls_rbac.sql:469-493](database/migrations/001_security_rls_rbac.sql#L469-L493)
- Documentação: [docs/security/GUIA-COMPLETO-RLS-RBAC.md:97](docs/security/GUIA-COMPLETO-RLS-RBAC.md#L97)

**Descrição:**
A política afirma que Admin **NÃO** tem acesso a avaliações:

```sql
-- Admin: SEM ACESSO
CREATE POLICY admin_no_access ON avaliacoes
  FOR ALL USING (
    auth.uid() NOT IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

**Problema:**  
Esta policy **NÃO EXISTE** na migration 001. O que existe é:

```sql
-- Policy: Funcionário vê apenas suas avaliações
CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT
  TO PUBLIC USING (funcionario_cpf = current_user_cpf());

-- Policy: RH vê avaliações de funcionários de sua clínica
CREATE POLICY avaliacoes_rh_clinica ON public.avaliacoes FOR SELECT
  TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND EXISTS (...)
  );
```

**Brecha de segurança:**

- **NÃO há policy explícita bloqueando Admin**
- PostgreSQL permite acesso se nenhuma policy se aplicar
- Admin pode fazer `SELECT * FROM avaliacoes` sem restrição

**Impacto:** 🔴 **CRÍTICO**

- Violação do princípio de menor privilégio
- Admin pode acessar dados sensíveis de avaliações/resultados
- Contradiz a documentação oficial

**Recomendação:**

```sql
-- Bloquear Admin explicitamente
CREATE POLICY admin_no_access_avaliacoes ON avaliacoes
  FOR ALL
  USING (current_user_perfil() != 'admin')
  WITH CHECK (current_user_perfil() != 'admin');
```

---

### 4. **Falta de Policy: `perfil='admin'` não está coberto nas policies**

**Localização:**

- Todas as policies em [database/migrations/001_security_rls_rbac.sql](database/migrations/001_security_rls_rbac.sql)

**Descrição:**  
As policies RLS atuais cobrem:

- `perfil='funcionario'` (via `current_user_cpf()`)
- `perfil='rh'` (via `current_user_perfil() = 'rh'`)
- `perfil='emissor'` (via `current_user_perfil() = 'emissor'`)

**Problema:**

- **Não há policies para `perfil='admin'`**
- Admin não está explicitamente permitido ou bloqueado
- RLS pode BLOQUEAR admin inadvertidamente ou PERMITIR onde não deveria

**Exemplo:**

```sql
-- Policy funcionarios_rh_clinica
-- Se admin não tiver clinica_id, NÃO vê nenhum funcionário
CREATE POLICY funcionarios_rh_clinica ON funcionarios FOR SELECT
  USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
  );
```

**Impacto:** 🔴 **CRÍTICO**

- Admin pode ficar **BLOQUEADO** de acessar dados que deveria ver
- Ou pode acessar dados que **NÃO deveria** ver (avaliações, resultados)

**Recomendação:**
Para cada tabela, definir explicitamente o acesso de Admin:

```sql
-- Exemplo: Admin vê TODOS funcionários (exceto dados de avaliação)
CREATE POLICY admin_funcionarios_all ON funcionarios
  FOR SELECT
  USING (current_user_perfil() = 'admin');

-- Admin BLOQUEADO de avaliacoes
CREATE POLICY admin_avaliacoes_denied ON avaliacoes
  FOR ALL
  USING (current_user_perfil() != 'admin')
  WITH CHECK (current_user_perfil() != 'admin');
```

---

### 5. **Inconsistência: Funções helper RLS não validam valores**

**Localização:**

- [database/migrations/001_security_rls_rbac.sql:18-55](database/migrations/001_security_rls_rbac.sql#L18-L55)

**Código atual:**

```sql
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Problema:**

1. **Não valida formato de CPF** (11 dígitos)
2. **Não valida perfil** contra enum de perfis válidos
3. **Retorna NULL em caso de erro** - pode causar acesso inadvertido
4. **SECURITY DEFINER** permite bypass de RLS se mal utilizado

**Cenários de risco:**

```sql
-- Se app.current_user_cpf não foi definido, retorna NULL
-- Isso pode tornar policies TRUE inadvertidamente:
-- funcionario_cpf = current_user_cpf()
-- -> funcionario_cpf = NULL
-- -> TRUE se funcionario_cpf também for NULL!
```

**Impacto:** 🔴 **CRÍTICO**

- Acesso não autorizado se sessão não foi configurada corretamente
- NULL pode causar comparações inesperadas (NULL = NULL é UNKNOWN, não TRUE)

**Recomendação:**

```sql
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS TEXT AS $$
DECLARE
    cpf_value TEXT;
BEGIN
    cpf_value := NULLIF(current_setting('app.current_user_cpf', TRUE), '');

    -- Validar formato CPF (11 dígitos)
    IF cpf_value IS NOT NULL AND cpf_value !~ '^\d{11}$' THEN
        RAISE EXCEPTION 'CPF inválido no contexto da sessão: %', cpf_value;
    END IF;

    -- Retornar NULL apenas se não configurado (não em caso de erro)
    RETURN cpf_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

### 6. **Brecha: Políticas usam `DROP POLICY IF EXISTS` em tabela errada**

**Localização:**

- [database/migrations/001_security_rls_rbac.utf8.sql](database/migrations/001_security_rls_rbac.utf8.sql) (múltiplas linhas)

**Código encontrado:**

```sql
-- Policy: Funcionário vê apenas suas avaliações
DROP POLICY IF EXISTS avaliacoes_own_select ON public.funcionarios; -- ❌ ERRADO
CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT ...

-- Policy: RH vê apenas empresas de sua clínica
DROP POLICY IF EXISTS empresas_rh_clinica ON public.funcionarios; -- ❌ ERRADO
CREATE POLICY empresas_rh_clinica ON public.empresas_clientes FOR SELECT ...
```

**Problema:**

- **DROP POLICY aponta para tabela errada** (`funcionarios` em vez da tabela correta)
- Isso faz com que o DROP falhe silenciosamente
- Policy antiga **NÃO é removida**, criando DUPLICATAS
- Múltiplas policies com mesmo nome causam comportamento indefinido

**Impacto:** 🔴 **CRÍTICO**

- Policies obsoletas permanecem ativas
- Comportamento de segurança imprevisível
- Dificulta debugging de problemas de acesso

**Recomendação:**

```sql
-- Corrigir TODAS as ocorrências em 001_security_rls_rbac.utf8.sql
-- Exemplo:
DROP POLICY IF EXISTS avaliacoes_own_select ON public.avaliacoes; -- ✅ CORRETO
CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT ...
```

---

### 7. **Falta de BYPASSRLS para Admin e processos internos**

**Localização:**

- System-wide (ausente)

**Descrição:**  
No PostgreSQL, o atributo `BYPASSRLS` permite que certos roles ignorem RLS policies. Isso é essencial para:

1. **Admin** realizar manutenções
2. **Processos batch** (cron jobs, workers)
3. **Migrations** aplicarem mudanças
4. **Backups** completos

**Problema:**

- **Nenhum role tem BYPASSRLS**
- Processos internos são bloqueados por RLS
- Admin fica limitado pelas mesmas policies que usuários comuns

**Impacto:** 🔴 **CRÍTICO**

- Impossibilidade de realizar manutenções emergenciais
- Cron jobs de emissão automática podem falhar
- Backups incompletos (apenas dados que o user do backup pode ver)

**Recomendação:**

```sql
-- Criar role de sistema com bypass
CREATE ROLE qwork_system WITH BYPASSRLS;

-- Permitir admin real bypassar RLS em emergências
ALTER ROLE postgres SET row_security = OFF; -- Apenas para superuser

-- Para processos internos, usar role específico
GRANT qwork_system TO qwork_app_user;
```

---

### 8. **Inconsistência: Login permite placeholder mas cria senha bcrypt**

**Localização:**

- [app/api/auth/login/route.ts:119-148](app/api/auth/login/route.ts#L119-L148)

**Código:**

```typescript
// Fallbacks para contratantes_senhas (placeholder ou texto plano)
if (!senhaValida) {
  const senhaTrim = typeof senha === 'string' ? senha.trim() : senha;

  // 1) Placeholder format: 'PLACEHOLDER_<senha>'
  if (gestor.senha_hash === `PLACEHOLDER_${senhaTrim}`) {
    const novoHash = await bcrypt.hash(senhaTrim, 10);
    await query(
      'UPDATE contratantes_senhas SET senha_hash = $1 WHERE cpf = $2',
      [novoHash, cpf]
    );
    senhaValida = true;
  }

  // 2) Texto plano armazenado
  if (!senhaValida && gestor.senha_hash === senhaTrim) {
    const novoHash = await bcrypt.hash(senhaTrim, 10);
    await query(
      'UPDATE contratantes_senhas SET senha_hash = $1 WHERE cpf = $2',
      [novoHash, cpf]
    );
    senhaValida = true;
  }
}
```

**Problema:**

1. **Aceita placeholder** em produção (deveria ser apenas desenvolvimento)
2. **Compara senha em texto claro** com hash (linha `gestor.senha_hash === senhaTrim`)
3. **Timing attack vulnerability** - comparação não é constant-time
4. **Race condition** - múltiplos logins simultâneos podem corromper hash

**Impacto:** 🔴 **CRÍTICO**

- Vulnerabilidade de segurança em produção
- Senhas em texto claro podem ser expostas em logs
- Timing attacks permitem deduzir senhas

**Recomendação:**

```typescript
// Remover fallbacks inseguros em produção
if (process.env.NODE_ENV === 'production') {
  // Apenas bcrypt em produção
  senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
} else {
  // Fallbacks apenas em desenvolvimento
  // ... (código atual)
}
```

---

### 9. **Políticas RLS não consideram `contratante_id` em entidades**

**Localização:**

- Todas as policies que filtram por `clinica_id` em [database/migrations/001_security_rls_rbac.sql](database/migrations/001_security_rls_rbac.sql)

**Exemplo:**

```sql
CREATE POLICY funcionarios_rh_clinica ON funcionarios FOR SELECT
  USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
  );
```

**Problema:**

- Policy **só funciona para clínicas** (que têm `clinica_id`)
- **Entidades** usam `contratante_id`, não `clinica_id`
- Gestor de entidade fica BLOQUEADO de ver seus próprios funcionários

**Impacto:** 🔴 **CRÍTICO**

- Gestores de entidades não conseguem acessar seus dados
- Violação do isolamento multi-tenant

**Recomendação:**

```sql
-- Política híbrida para RH de clínicas E entidades
CREATE POLICY funcionarios_gestor_acesso ON funcionarios FOR SELECT
  USING (
    current_user_perfil() = 'rh' AND (
      -- Clínicas: usar clinica_id
      (clinica_id IS NOT NULL AND clinica_id = current_user_clinica_id())
      OR
      -- Entidades: usar contratante_id
      (contratante_id IS NOT NULL AND contratante_id = current_user_contratante_id())
    )
  );
```

---

### 10. **Falta de índices em colunas RLS**

**Localização:**

- Tabelas com RLS habilitado

**Descrição:**  
Políticas RLS são avaliadas em **TODA query**. Sem índices nas colunas usadas nas policies, performance degrada exponencialmente.

**Colunas críticas sem índice:**

```sql
-- funcionarios
SELECT * FROM funcionarios WHERE clinica_id = ? AND perfil = ?;
-- FALTA: CREATE INDEX idx_funcionarios_clinica_perfil ON funcionarios(clinica_id, perfil);

-- avaliacoes
SELECT * FROM avaliacoes WHERE funcionario_cpf = ?;
-- FALTA: CREATE INDEX idx_avaliacoes_funcionario_cpf ON avaliacoes(funcionario_cpf);

-- empresas_clientes
SELECT * FROM empresas_clientes WHERE clinica_id = ?;
-- FALTA: CREATE INDEX idx_empresas_clinica ON empresas_clientes(clinica_id);
```

**Impacto:** 🔴 **CRÍTICO**

- Queries lentas (SEQSCAN em vez de IndexScan)
- Timeout em produção com volume de dados
- Degradação de UX

**Recomendação:**

```sql
-- Adicionar índices para todas as colunas RLS
CREATE INDEX CONCURRENTLY idx_funcionarios_clinica_perfil
  ON funcionarios(clinica_id, perfil) WHERE ativo = true;

CREATE INDEX CONCURRENTLY idx_avaliacoes_funcionario_cpf
  ON avaliacoes(funcionario_cpf) WHERE status != 'cancelada';

CREATE INDEX CONCURRENTLY idx_empresas_clinica
  ON empresas_clientes(clinica_id) WHERE ativa = true;
```

---

### 11. **RLS habilitado mas sem FORCE ROW LEVEL SECURITY**

**Localização:**

- [database/migrations/001_security_rls_rbac.sql:394-408](database/migrations/001_security_rls_rbac.sql#L394-L408)

**Código:**

```sql
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
...
```

**Problema:**

- `ENABLE ROW LEVEL SECURITY` aplica RLS apenas para **non-owners**
- **Table owner** (geralmente `postgres`) BYPASSA RLS automaticamente
- Se aplicação conecta como owner, RLS não funciona!

**Impacto:** 🔴 **CRÍTICO**

- Bypass total de RLS se conexão usar role owner
- Violação de isolamento multi-tenant

**Recomendação:**

```sql
-- Forçar RLS para TODOS (incluindo owner)
ALTER TABLE public.funcionarios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_clientes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_avaliacao FORCE ROW LEVEL SECURITY;
ALTER TABLE public.laudos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.respostas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.resultados FORCE ROW LEVEL SECURITY;
```

---

### 12. **Falta de auditoria em alterações de policies**

**Localização:**

- System-wide (ausente)

**Descrição:**  
Não há log de quando policies são criadas, alteradas ou removidas.

**Problema:**

- Impossível rastrear quem mudou policies de segurança
- Dificulta investigação de incidentes de segurança
- Não há registro de quando brechas foram introduzidas

**Impacto:** 🔴 **CRÍTICO**

- Compliance (LGPD, SOC2)
- Impossibilidade de auditoria forense

**Recomendação:**

```sql
-- Event trigger para logar mudanças em policies
CREATE OR REPLACE FUNCTION log_policy_changes()
RETURNS event_trigger AS $$
DECLARE
  obj RECORD;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_type = 'policy' THEN
      INSERT INTO audit_logs (
        user_cpf, user_perfil, action, resource, details
      ) VALUES (
        current_user, 'admin', 'DDL', 'policy',
        format('Policy %s on table %s', obj.object_identity, obj.in_extension)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER log_policy_ddl
  ON ddl_command_end
  WHEN TAG IN ('CREATE POLICY', 'ALTER POLICY', 'DROP POLICY')
  EXECUTE FUNCTION log_policy_changes();
```

---

### 13. **Session context não validado na camada de aplicação**

**Localização:**

- [lib/db.ts:query()](lib/db.ts) function

**Código:**

```typescript
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session
): Promise<QueryResult<T>> {
  // ...
  if (session) {
    await client.query(
      `SET LOCAL app.current_user_cpf = '${escapeString(session.cpf)}'`
    );
    // ...
  }
```

**Problema:**

1. **Session é opcional** - permite queries sem contexto RLS
2. **Não valida** se `session.cpf`, `session.perfil` são válidos
3. **Não verifica** se sessão expirou
4. **Injection risk** - `escapeString` pode falhar

**Impacto:** 🔴 **CRÍTICO**

- Queries sem sessão bypasam RLS
- Sessões inválidas/expiradas permanecem ativas
- SQL injection em caso de falha no escape

**Recomendação:**

```typescript
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session, // Tornar obrigatório?
  options?: { bypassRLS?: boolean } // Flag explícita
): Promise<QueryResult<T>> {
  // Validar sessão
  if (!session && !options?.bypassRLS) {
    throw new Error('Session required for RLS enforcement');
  }

  if (session) {
    // Validar formato CPF
    if (!/^\d{11}$/.test(session.cpf)) {
      throw new Error('Invalid CPF format in session');
    }

    // Validar perfil
    if (!PERFIS_VALIDOS.includes(session.perfil)) {
      throw new Error(`Invalid perfil: ${session.perfil}`);
    }

    // Validar expiração (se tiver)
    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    // Usar prepared statements em vez de interpolação
    await client.query('SET LOCAL app.current_user_cpf = $1', [session.cpf]);
    await client.query('SET LOCAL app.current_user_perfil = $1', [session.perfil]);
    // ...
  }
```

---

## 🟡 PROBLEMAS MODERADOS

### 14. **Documentação afirma Admin bloqueado de funcionários regulares**

**Localização:**

- [docs/security/GUIA-COMPLETO-RLS-RBAC.md:119-126](docs/security/GUIA-COMPLETO-RLS-RBAC.md#L119-L126)

**Documentação:**

```markdown
#### `funcionarios`

-- Admin: Apenas RH e Emissor (não vê funcionários regulares)
CREATE POLICY admin_limited_access ON funcionarios
FOR SELECT USING (
auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
AND perfil IN ('rh', 'emissor')
);
```

**Realidade:**
Esta policy **NÃO existe** na migration 001.

**Impacto:** 🟡 **MODERADO**

- Documentação desatualizada
- Comportamento real diferente do documentado
- Desenvolvedores podem assumir incorretamente

**Recomendação:**
Atualizar documentação OU implementar policy documentada.

---

### 15. **Ausência de `current_user_contratante_id()` em policies**

**Localização:**

- [database/migrations/001_security_rls_rbac.sql](database/migrations/001_security_rls_rbac.sql)

**Descrição:**
A função `current_user_contratante_id()` é **definida** mas **nunca usada** nas policies.

**Problema:**

- Entidades precisam de filtro por `contratante_id`
- Policies apenas filtram por `clinica_id`
- Gestores de entidade ficam sem acesso

**Impacto:** 🟡 **MODERADO**

- Funcionalidade de entidades comprometida

**Recomendação:**
Usar `current_user_contratante_id()` em todas as policies híbridas.

---

### 16. **Falta de validação de `tipo_contratante` em policies**

**Localização:**

- Tabela `contratantes_funcionarios` tem coluna `tipo_contratante`

**Problema:**

- Policies não verificam se `tipo_contratante` corresponde ao tipo real do contratante
- Possível inconsistência se dados forem corrompidos

**Impacto:** 🟡 **MODERADO**

- Isolamento pode falhar com dados inconsistentes

**Recomendação:**

```sql
-- Adicionar FK e constraint
ALTER TABLE contratantes_funcionarios
ADD CONSTRAINT fk_tipo_matches_contratante
CHECK (
  (SELECT tipo FROM contratantes WHERE id = contratante_id) = tipo_contratante
);
```

---

### 17. **Tabela `profiles` mencionada mas não existe** ✅ CORRIGIDO

**Localização:**

- [docs/security/GUIA-COMPLETO-RLS-RBAC.md](docs/security/GUIA-COMPLETO-RLS-RBAC.md) (ATUALIZADO)

**Problema Identificado:**

- Documentação continha exemplos com tabela `profiles` (estilo Supabase)
- Tabela `profiles` **NÃO EXISTE** no QWork
- QWork usa `funcionarios` com campo `usuario_tipo`

**Correção Aplicada (30/01/2026):**

- ✅ Adicionado aviso no topo do documento
- ✅ Redirecionamento para documentação atualizada:
  - [CORRECOES-CRITICAS-SEGURANCA.md](CORRECOES-CRITICAS-SEGURANCA.md)
  - [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)
- ✅ Marcado como documentação legada

**Implementação Real:**

```sql
-- QWork usa current_setting() com variáveis de sessão
CREATE POLICY admin_full_access ON empresas_clientes
  FOR ALL USING (
    current_setting('app.current_perfil', true) = 'admin'
  );
```

---

### 18. **Falta de testes automatizados para policies RLS**

**Localização:**

- Nenhum teste encontrado

**Problema:**

- Impossível validar que policies funcionam como esperado
- Mudanças podem quebrar segurança sem detecção

**Impacto:** 🟡 **MODERADO**

- Risco de regressões de segurança

**Recomendação:**

```sql
-- database/test-rls-policies.sql
-- Teste: Funcionário só vê próprias avaliações
SET app.current_user_cpf = '12345678901';
SET app.current_user_perfil = 'funcionario';

SELECT COUNT(*) FROM avaliacoes; -- Deve retornar apenas do CPF 12345678901

-- Teste: RH só vê funcionários da própria clínica
SET app.current_user_perfil = 'rh';
SET app.current_user_clinica_id = '1';

SELECT COUNT(*) FROM funcionarios WHERE clinica_id != 1; -- Deve retornar 0
```

---

### 19. **Ausência de documentação de fluxo RLS end-to-end**

**Localização:**

- Documentação

**Problema:**

- Não há diagrama ou explicação de como RLS funciona de ponta a ponta
- Desenvolvedores não entendem o fluxo: Login → Session → SET LOCAL → Policy

**Impacto:** 🟡 **MODERADO**

- Erros de implementação por falta de entendimento

**Recomendação:**
Criar diagrama de sequência:

```
User Login → API /auth/login → bcrypt.compare() → createSession()
  → query(sql, params, session) → SET LOCAL app.current_user_*
  → PostgreSQL evalua policies → Retorna apenas dados permitidos
```

---

### 20. **Falta de rate limiting em login** ✅ CORRIGIDO

**Localização:**

- [app/api/auth/login/route.ts](app/api/auth/login/route.ts) (IMPLEMENTADO)

**Problema Identificado:**

- Sem proteção contra brute force
- Tentativas ilimitadas de login

**Correção Aplicada (30/01/2026):**

```typescript
// app/api/auth/login/route.ts
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // 🔒 Rate limiting: 5 tentativas em 5 minutos
  const rateLimitResult = rateLimit(RATE_LIMIT_CONFIGS.auth)(request);
  if (rateLimitResult) return rateLimitResult;

  // ... resto do código de login
}
```

**Configuração:**

- Limite: 5 tentativas por IP
- Janela: 5 minutos
- Response: HTTP 429 com header `Retry-After`

**Impacto:** ✅ **RESOLVIDO**

- Proteção contra brute force implementada
- Ataques de dicionário mitigados

**Recomendação:**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 tentativas / 15 min
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
  // ... resto do código
}
```

---

### 21. **Inconsistência: `criarContaResponsavel` comentada mas código diferente**

**Localização:**

- [docs/security/GUIA-COMPLETO-RLS-RBAC.md:264-284](docs/security/GUIA-COMPLETO-RLS-RBAC.md#L264-L284)
- [lib/db.ts:1466](lib/db.ts#L1466)

**Documentação:**

```typescript
// Para tipo !== 'entidade' (Gestores RH):
await db('funcionarios')
  .insert({
    cpf: responsavel.cpf,
    nome: responsavel.nome,
    perfil: 'rh',
  })
  .onConflict('cpf')
  .merge();
```

**Código real usa:**

- Queries SQL nativas, não Knex
- Lógica mais complexa com validações

**Impacto:** 🟡 **MODERADO**

- Exemplos de código desatualizados

**Recomendação:**
Atualizar documentação com código real simplificado.

---

## 🟢 MELHORIAS RECOMENDADAS

### 22. **Adicionar cache para funções helper RLS**

**Localização:**

- Funções `current_user_*()` em [database/migrations/001_security_rls_rbac.sql](database/migrations/001_security_rls_rbac.sql)

**Descrição:**
Funções são avaliadas em TODA linha retornada. Com cache, performance melhora.

```sql
CREATE OR REPLACE FUNCTION public.current_user_cpf_cached()
RETURNS TEXT AS $$
DECLARE
  cached_value TEXT;
BEGIN
  cached_value := current_setting('app._cached_user_cpf', TRUE);

  IF cached_value IS NULL THEN
    cached_value := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
    PERFORM set_config('app._cached_user_cpf', cached_value, true);
  END IF;

  RETURN cached_value;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### 23. **Implementar soft delete com RLS**

**Descrição:**
Em vez de `DELETE`, usar `UPDATE SET deleted_at = NOW()` + policy para ocultar.

```sql
-- Policy: Ocultar registros deletados
CREATE POLICY hide_deleted ON funcionarios
  FOR ALL
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);
```

---

### 24. **Adicionar monitoramento de RLS violations**

**Descrição:**
Logar tentativas de acesso bloqueadas por RLS.

```sql
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (action, details)
  VALUES ('RLS_VIOLATION', format('User %s blocked by RLS', current_user));
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Checklist de Ação Imediata

### Prioridade 1 (Implementar HOJE)

- [ ] **#3** - Adicionar policy bloqueando Admin de avaliacoes
- [ ] **#4** - Criar policies explícitas para Admin
- [ ] **#11** - Ativar `FORCE ROW LEVEL SECURITY` em todas as tabelas
- [ ] **#13** - Tornar session obrigatória em queries RLS

### Prioridade 2 (Esta Semana)

- [ ] **#1** - Criar constraint bloqueando gestor_entidade em funcionarios
- [ ] **#5** - Adicionar validação em funções helper RLS
- [ ] **#6** - Corrigir DROP POLICY em tabelas erradas
- [ ] **#8** - Remover fallbacks inseguros de senha em produção
- [ ] **#10** - Adicionar índices em colunas RLS

### Prioridade 3 (Próximas 2 Semanas)

- [ ] **#2** - Definir estratégia única para vínculo funcionário-contratante
- [ ] **#7** - Implementar BYPASSRLS para roles de sistema
- [ ] **#9** - Atualizar policies para considerar contratante_id
- [ ] **#12** - Implementar auditoria de mudanças em policies
- [ ] **#18** - Criar suite de testes para RLS

### Prioridade 4 (Backlog)

- [ ] **#14-21** - Corrigir inconsistências de documentação
- [ ] **#22-24** - Implementar melhorias de performance e monitoramento

---

## 📊 Métricas de Impacto

| Categoria     | Crítico | Moderado | Baixo | Total  |
| ------------- | ------- | -------- | ----- | ------ |
| Segurança RLS | 9       | 3        | 1     | 13     |
| Documentação  | 1       | 5        | 0     | 6      |
| Performance   | 1       | 0        | 2     | 3      |
| Arquitetura   | 2       | 0        | 0     | 2      |
| **TOTAL**     | **13**  | **8**    | **3** | **24** |

---

## 🔗 Referências

- [Guia Completo RLS/RBAC](docs/security/GUIA-COMPLETO-RLS-RBAC.md)
- [Migration 001 - Security](database/migrations/001_security_rls_rbac.sql)
- [Migration 201 - Fix Gestor Entidade](database/migrations/201_fix_gestor_entidade_as_funcionario.sql)
- [lib/db.ts](lib/db.ts)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Próximos Passos:**

1. Revisar este relatório com equipe de desenvolvimento
2. Priorizar correções críticas (P1)
3. Criar issues no GitHub para cada problema
4. Implementar correções em branch separado
5. Testar exaustivamente em ambiente de staging
6. Deploy gradual em produção com rollback plan
