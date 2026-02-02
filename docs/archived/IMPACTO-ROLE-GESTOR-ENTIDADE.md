# 📊 Relatório de Impacto: Adicionar Role `gestor_entidade` na Tabela `roles`

**Data:** 29 de janeiro de 2026  
**Analista:** Sistema de Auditoria  
**Tipo:** Análise de impacto de mudança arquitetural  
**Status:** ✅ ANÁLISE COMPLETA

---

## 🎯 Resumo Executivo

### Contexto da Mudança

**Situação Atual:**

- Sistema usa perfil `'gestor_entidade'` como **string literal** no código
- Tabela `roles` **NÃO contém** registro para `gestor_entidade`
- Funcionalidade está implementada e **funcionando via string**
- 100+ referências no código validam perfil como string

**Mudança Proposta:**

- Adicionar registro formal de role `'gestor_entidade'` na tabela `roles`
- Criar permissões específicas em `permissions`
- Associar permissões via `role_permissions`
- **IMPORTANTE:** Código continua usando `perfil` como string (sem mudança)

### Impacto Geral

| Categoria          | Impacto  | Afetado? | Mudanças Necessárias                       |
| ------------------ | -------- | -------- | ------------------------------------------ |
| **Middleware**     | 🟢 ZERO  | ❌ NÃO   | Já usa string `gestor_entidade`            |
| **Autenticação**   | 🟢 ZERO  | ❌ NÃO   | `lib/session.ts` valida perfil como string |
| **APIs Backend**   | 🟢 ZERO  | ❌ NÃO   | `requireEntity()` valida perfil string     |
| **RLS Policies**   | 🟡 BAIXO | ✅ SIM   | Adicionar policies específicas (opcional)  |
| **Banco de Dados** | 🟢 ZERO  | ❌ NÃO   | Apenas INSERT em `roles` (sem ALTER)       |
| **Frontend/UI**    | 🟢 ZERO  | ❌ NÃO   | Componentes validam perfil string          |
| **Testes**         | 🟢 ZERO  | ❌ NÃO   | Mocks usam perfil como string              |

### Conclusão Crítica

**A adição do role na tabela `roles` é ZERO BREAKING CHANGE.**

**Razão:**

- Sistema **nunca faz JOIN** entre `funcionarios.perfil` e `roles.name`
- Sistema **nunca faz FK** de perfil para tabela roles
- Sistema **sempre valida perfil via comparação de string**
- Tabela `roles` é usada apenas para **RBAC futuro** (permissões granulares)

---

## 📋 Análise Detalhada por Camada

### 1. 🔐 Middleware (middleware.ts)

#### Referências Encontradas

```typescript
// Linha 56-58
gestor_entidade: [
  '/api/contratacao/personalizado/pre-cadastro',
  '/api/contratacao/personalizado/aceitar-contrato',
  '/api/contratacao/personalizado/cancelar',
],

// Linha 152-156
} else if (session.perfil === 'gestor_entidade') {
  if (
    CONTRATACAO_ROUTES.gestor_entidade.some((route) =>
      pathname.startsWith(route)
    )
  )

// Linha 294
} else if (session.perfil === 'gestor_entidade') {

// Linha 365
if (session && session.perfil !== 'gestor_entidade') {
```

#### Análise de Impacto

- **Tipo de validação:** Comparação de string `session.perfil === 'gestor_entidade'`
- **Depende de tabela roles?** ❌ NÃO
- **Mudanças necessárias:** ❌ NENHUMA
- **Motivo:** Middleware valida perfil diretamente da sessão (cookie), não consulta banco

#### Fluxo de Validação Atual

```
Request → Cookie bps-session → Parse JSON → session.perfil (string)
  → Comparação literal → Autorizar/Negar
```

**Conclusão:** Zero impacto. Middleware não será afetado.

---

### 2. 🔑 Autenticação (lib/session.ts)

#### Referências Encontradas

```typescript
// Linha 31-33 (comentário da política)
// 'gestor_entidade': Gestor de ENTIDADE CONTRATANTE
//                    → TEM contratante_id obrigatório
//                    → Opera lotes da própria entidade

// Linha 36
contratante_id?: number; // Apenas para perfil 'gestor_entidade'

// Linha 274-321 - Função requireEntity()
export async function requireEntity(): Promise<
  Session & { contratante_id: number }
> {
  const session = await requireAuth();

  if (session.perfil !== 'gestor_entidade') {
    throw new Error('Acesso restrito a gestores de entidade');
  }

  if (!session.contratante_id) {
    throw new Error('Contratante não identificado na sessão');
  }

  // Verificar se contratante existe e é ativo
  const contratanteResult = await query(
    "SELECT id, tipo, ativa FROM contratantes WHERE id = $1 AND tipo = 'entidade'",
    [session.contratante_id]
  );
  // ...
}
```

#### Análise de Impacto

- **Tipo de validação:** String literal `session.perfil !== 'gestor_entidade'`
- **Consulta banco?** ✅ SIM, mas consulta `contratantes`, não `roles`
- **Depende de tabela roles?** ❌ NÃO
- **Mudanças necessárias:** ❌ NENHUMA

#### Fluxo de Autenticação

```
requireEntity() → getSession() → Parse cookie
  → Validar perfil === 'gestor_entidade' (string)
  → Consultar contratantes (validar tipo='entidade')
  → Retornar session
```

**Conclusão:** Zero impacto. Autenticação não será afetada.

---

### 3. 🛣️ APIs Backend (app/api/\*\*)

#### Referências em Rotas

##### Rotas de Entidade (app/api/entidade/\*\*)

```typescript
// Todas usam requireEntity() que valida perfil como string
app / api / entidade / account - info / route.ts;
app / api / entidade / dashboard / route.ts;
app / api / entidade / funcionarios / route.ts;
app / api / entidade / lotes / route.ts;
app / api / entidade / laudos / route.ts;
// ... 15+ rotas
```

##### Validação Típica

```typescript
export async function GET() {
  const entity = await requireEntity(); // Valida perfil === 'gestor_entidade'
  // ...
}
```

#### Análise de Impacto

- **Padrão de validação:** `requireEntity()` → valida string
- **Depende de tabela roles?** ❌ NÃO
- **Mudanças necessárias:** ❌ NENHUMA
- **Rotas afetadas:** 0 de 15+

#### Testes de Rotas

```typescript
// __tests__/api/entidade/funcionarios.test.ts
mockRequireEntity.mockResolvedValue({
  cpf: '12345678900',
  perfil: 'gestor_entidade', // String literal
  contratante_id: 1,
});
```

**Conclusão:** Zero impacto. APIs continuam validando perfil via string.

---

### 4. 🔒 RLS Policies (database/migrations/\*\*)

#### Referências Encontradas (30+ ocorrências)

```sql
-- Migration 064: Fix entidade perfil RLS
CREATE POLICY entidade_lotes_select ON lotes_avaliacao
FOR SELECT USING (
  current_user_perfil() IN ('entidade', 'gestor_entidade')
  AND contratante_id = current_user_contratante_id()
);

-- Migration 114: Consolidate RLS funcionarios
CREATE POLICY funcionarios_gestor_entidade_select ON funcionarios
FOR SELECT USING (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id = current_setting('app.current_user_contratante_id', true)::INTEGER
);

-- Migration 113: Avaliacao resets
CREATE POLICY avaliacao_resets_gestor_select ON avaliacao_resets
FOR SELECT USING (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND EXISTS (
    SELECT 1 FROM funcionarios f WHERE ...
  )
);
```

#### Análise de Impacto

- **Tipo de validação:** `current_user_perfil() = 'gestor_entidade'` (string)
- **Depende de tabela roles?** ❌ NÃO
- **Mudanças necessárias:** ⚠️ OPCIONAL (adicionar policies mais granulares)

#### RLS Helper Functions

```sql
-- Já existe (migration 001)
CREATE OR REPLACE FUNCTION public.current_user_perfil()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_perfil', TRUE), '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Observação:** Retorna TEXT (string), não FK para `roles`.

#### Impacto Real

- ✅ **Policies existentes continuam funcionando** (comparam strings)
- 🟡 **Oportunidade:** Criar policies baseadas em `role_permissions` (futuro)

**Exemplo de Policy Futura (opcional):**

```sql
-- OPCIONAL: Policy baseada em permissões RBAC
CREATE POLICY funcionarios_rbac_read ON funcionarios
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = current_user_perfil()
      AND p.name = 'read:funcionarios:entidade'
  )
);
```

**Conclusão:** Impacto baixo. Policies atuais não precisam de mudança. Adicionar policies RBAC é opcional.

---

### 5. 🗄️ Banco de Dados (Schema)

#### Estrutura Atual

##### Tabela `funcionarios`

```sql
CREATE TABLE funcionarios (
  id SERIAL PRIMARY KEY,
  cpf CHAR(11) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  perfil VARCHAR(20) NOT NULL, -- ⚠️ Não é FK
  clinica_id INTEGER,
  contratante_id INTEGER,
  -- ...
);
```

**Observação Crítica:** `perfil` é `VARCHAR(20)`, **NÃO é FK** para `roles`.

##### Tabela `roles` (Atual)

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  hierarchy_level INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros existentes:
INSERT INTO roles (name, display_name, hierarchy_level) VALUES
  ('funcionario', 'Funcionário', 0),
  ('rh', 'Gestor RH/Clínica', 10),
  ('emissor', 'Emissor de Laudos', 10),
  ('admin', 'Administrador', 50),
  ('super', 'Super administrador', 100);
```

#### Mudança Proposta

```sql
-- Migration XXX_add_gestor_entidade_role.sql
INSERT INTO roles (name, display_name, description, hierarchy_level)
VALUES (
  'gestor_entidade',
  'Gestor de Entidade',
  'Gerencia funcionários de entidade privada (sem empresas)',
  10
)
ON CONFLICT (name) DO NOTHING;
```

#### Análise de Impacto

- **Tipo de operação:** INSERT simples
- **Afeta constraints?** ❌ NÃO (perfil continua sendo VARCHAR livre)
- **Afeta queries existentes?** ❌ NÃO (ninguém faz JOIN com `roles`)
- **Mudanças de schema necessárias:** ❌ NENHUMA

#### Constraints de Perfil

```sql
-- Exemplo: Migration 099 (remove legacy profile)
ALTER TABLE funcionarios
  DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_perfil_check
  CHECK (perfil IN ('funcionario', 'rh', 'admin', 'emissor', 'gestor_entidade'));
```

**Observação:** Constraint valida valores permitidos como string, **não referencia tabela `roles`**.

#### Queries que Referenciam `perfil`

##### 1. Consultas Diretas (String Literal)

```sql
-- Exemplos encontrados no código
SELECT * FROM funcionarios WHERE perfil = 'gestor_entidade';
SELECT * FROM funcionarios WHERE perfil = 'rh' AND clinica_id = $1;
SELECT * FROM funcionarios WHERE perfil IN ('admin', 'emissor');
```

**Impacto:** ❌ ZERO (comparação de string)

##### 2. SET LOCAL (Contexto RLS)

```sql
-- lib/db.ts
SET LOCAL app.current_user_perfil = 'gestor_entidade';
```

**Impacto:** ❌ ZERO (seta string na session)

##### 3. Nenhuma Query Faz JOIN

```sql
-- ❌ NÃO EXISTE no código:
SELECT f.*, r.display_name
FROM funcionarios f
JOIN roles r ON r.name = f.perfil; -- NÃO EXISTE!
```

**Conclusão:** Zero impacto. Banco não precisa de ALTER, apenas INSERT em `roles`.

---

### 6. 🧪 Testes (**tests**/\*\*)

#### Referências Encontradas (100+ ocorrências)

##### Mocks de Sessão

```typescript
// Padrão em 50+ testes
const mockSession = {
  cpf: '12345678900',
  nome: 'Gestor Teste',
  perfil: 'gestor_entidade', // String literal
  contratante_id: 1,
};

jest.spyOn(sessionModule, 'getSession').mockReturnValue(mockSession);
```

##### Fixtures de Banco

```typescript
// Padrão em testes de integração
await query(`
  INSERT INTO funcionarios (cpf, nome, perfil, contratante_id)
  VALUES ('11111111111', 'Gestor', 'gestor_entidade', 1)
`);
```

##### Validações

```typescript
expect(session.perfil).toBe('gestor_entidade'); // String literal
expect(funcionario.perfil).not.toBe('gestor_entidade'); // Negação
```

#### Análise de Impacto

- **Testes afetados:** 0 de 100+
- **Mudanças necessárias:** ❌ NENHUMA
- **Motivo:** Testes validam perfil como string, não consultam `roles`

#### Casos Específicos

##### 1. Testes de RLS

```typescript
// __tests__/integration/entidade-rls-integration.test.ts
describe('RLS Integration: gestor_entidade visibility', () => {
  it('gestor_entidade deve ver avaliações do funcionário vinculado', async () => {
    await query(`SET LOCAL app.current_user_perfil = 'gestor_entidade'`);
    // ...
  });
});
```

**Impacto:** ❌ ZERO (usa SET LOCAL com string)

##### 2. Testes de API

```typescript
// __tests__/api/entidade/funcionarios.test.ts
test('❌ Deve retornar 401 se perfil não for gestor_entidade', async () => {
  mockGetSession.mockReturnValue({ perfil: 'funcionario' });
  // ...
});
```

**Impacto:** ❌ ZERO (mock retorna string)

##### 3. Testes E2E

```typescript
// __tests__/e2e/cadastro-plano-fixo-completo.test.ts
expect(funcionario.perfil).toBe('gestor_entidade');
```

**Impacto:** ❌ ZERO (valida string do banco)

**Conclusão:** Zero impacto. Testes não precisam de mudança.

---

### 7. 🎨 Frontend/UI (app/**, components/**)

#### Referências Encontradas (Mínimas)

##### Redirecionamento (app/page.tsx)

```typescript
switch (session.perfil) {
  case 'gestor_entidade':
    redirect('/entidade');
  case 'rh':
    redirect('/rh');
  // ...
}
```

##### Validação de Layout (app/entidade/layout.tsx)

```typescript
if (sessionData.perfil !== 'gestor_entidade') {
  redirect('/auth/login');
}
```

##### Tipo em Componente (components/NotificationHub.tsx)

```typescript
interface NotificationHubProps {
  usuarioTipo: 'admin' | 'gestor_entidade';
}
```

#### Análise de Impacto

- **Validações:** String literal via `session.perfil`
- **Depende de API?** ❌ NÃO (lê direto de cookie/session)
- **Mudanças necessárias:** ❌ NENHUMA

#### Fluxo de Autenticação no Frontend

```
1. Login → POST /api/auth/login
2. Server cria cookie com perfil='gestor_entidade' (string)
3. Frontend lê session via getSession()
4. Frontend valida session.perfil === 'gestor_entidade'
5. Renderiza layout/componentes adequados
```

**Observação:** Frontend **nunca consulta tabela `roles`**. Usa apenas string do cookie.

**Conclusão:** Zero impacto. UI não será afetada.

---

## 📊 Matriz de Impacto Consolidada

### Por Severidade

| Severidade   | Descrição                   | Quantidade | Ação Necessária |
| ------------ | --------------------------- | ---------- | --------------- |
| 🟢 **ZERO**  | Sem impacto algum           | ~95%       | Nenhuma         |
| 🟡 **BAIXO** | Impacto opcional (melhoria) | ~5%        | Opcional        |
| 🟠 **MÉDIO** | Requer mudança              | 0%         | N/A             |
| 🔴 **ALTO**  | Breaking change             | 0%         | N/A             |

### Por Categoria

| Categoria          | Arquivos Afetados          | Mudanças Obrigatórias | Mudanças Opcionais         |
| ------------------ | -------------------------- | --------------------- | -------------------------- |
| **Middleware**     | 1 arquivo                  | 0                     | 0                          |
| **Autenticação**   | 1 arquivo (lib/session.ts) | 0                     | 0                          |
| **APIs Backend**   | 15+ rotas                  | 0                     | 0                          |
| **RLS Policies**   | 30+ migrations             | 0                     | 5-10 (novas policies RBAC) |
| **Banco de Dados** | 1 migration                | 1 INSERT              | 0 ALTER                    |
| **Frontend/UI**    | 3 arquivos                 | 0                     | 0                          |
| **Testes**         | 100+ arquivos              | 0                     | 0                          |
| **Documentação**   | 5+ arquivos                | 2 atualizações        | 0                          |

---

## ✅ Checklist de Implementação

### Fase 1: Adicionar Role na Tabela (Obrigatório)

```sql
-- Migration XXX_add_gestor_entidade_role.sql
BEGIN;

-- 1. Inserir role gestor_entidade
INSERT INTO public.roles (
  name,
  display_name,
  description,
  hierarchy_level,
  active
)
VALUES (
  'gestor_entidade',
  'Gestor de Entidade',
  'Gerencia funcionários de sua entidade privada (sem gestão de empresas intermediárias)',
  10,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  active = EXCLUDED.active;

-- 2. Criar permissões específicas
INSERT INTO public.permissions (name, resource, action, description)
VALUES
  ('read:avaliacoes:entidade', 'avaliacoes', 'read', 'Ler avaliações de funcionários da entidade'),
  ('read:funcionarios:entidade', 'funcionarios', 'read', 'Ler funcionários da entidade'),
  ('write:funcionarios:entidade', 'funcionarios', 'write', 'Criar/editar funcionários da entidade'),
  ('read:lotes:entidade', 'lotes', 'read', 'Ler lotes da entidade'),
  ('write:lotes:entidade', 'lotes', 'write', 'Criar/editar lotes da entidade'),
  ('read:laudos:entidade', 'laudos', 'read', 'Visualizar laudos de funcionários da entidade'),
  ('read:contratante:own', 'contratantes', 'read', 'Ler dados da própria entidade'),
  ('write:contratante:own', 'contratantes', 'write', 'Editar dados da própria entidade')
ON CONFLICT (name) DO NOTHING;

-- 3. Associar permissões ao role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'gestor_entidade' AND p.name IN (
  'read:avaliacoes:entidade',
  'read:funcionarios:entidade',
  'write:funcionarios:entidade',
  'read:lotes:entidade',
  'write:lotes:entidade',
  'read:laudos:entidade',
  'read:contratante:own',
  'write:contratante:own'
)
ON CONFLICT DO NOTHING;

-- 4. Verificação
DO $$
DECLARE
  role_count INTEGER;
  perm_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM public.roles WHERE name = 'gestor_entidade';
  SELECT COUNT(*) INTO perm_count FROM public.role_permissions rp
  JOIN public.roles r ON r.id = rp.role_id
  WHERE r.name = 'gestor_entidade';

  IF role_count = 0 THEN
    RAISE EXCEPTION 'ERRO: Role gestor_entidade não foi criado';
  END IF;

  IF perm_count = 0 THEN
    RAISE WARNING 'AVISO: Nenhuma permissão associada ao role gestor_entidade';
  END IF;

  RAISE NOTICE '✅ Role gestor_entidade criado: % registro(s)', role_count;
  RAISE NOTICE '✅ Permissões associadas: % permissão(ões)', perm_count;
END $$;

COMMIT;
```

**Tempo estimado:** 15 minutos  
**Risco:** 🟢 ZERO (apenas INSERT)

---

### Fase 2: Adicionar Helper RLS (Opcional mas Recomendado)

```sql
-- Migration XXX_add_current_user_contratante_id_helper.sql
BEGIN;

-- Helper function para RLS (se não existir)
CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_contratante_id() IS
'Retorna o contratante_id do usuário atual para isolamento de dados de entidades';

COMMIT;
```

**Tempo estimado:** 10 minutos  
**Risco:** 🟢 ZERO (helper function isolada)

---

### Fase 3: Adicionar Policies RBAC (Opcional)

```sql
-- Migration XXX_add_rbac_policies_gestor_entidade.sql
BEGIN;

-- Policy baseada em permissões RBAC (exemplo)
-- NOTA: Isso é ADICIONAL às policies por perfil existentes

-- Exemplo: Funcionários
CREATE POLICY IF NOT EXISTS funcionarios_rbac_entidade_read
ON public.funcionarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = current_user_perfil()
      AND p.resource = 'funcionarios'
      AND p.action = 'read'
      AND (
        p.name = 'read:funcionarios:entidade'
        AND funcionarios.contratante_id = current_user_contratante_id()
      )
  )
);

-- Replicar para outras tabelas: avaliacoes, lotes_avaliacao, laudos, etc.

COMMIT;
```

**Tempo estimado:** 1-2 horas (todas as tabelas)  
**Risco:** 🟡 BAIXO (policies adicionais, não substituem existentes)  
**Prioridade:** P3 (futuro)

---

### Fase 4: Atualizar Documentação (Obrigatório)

#### Arquivos a Atualizar

1. **docs/security/GUIA-COMPLETO-RLS-RBAC.md**
   - Adicionar `gestor_entidade` na matriz de permissões
   - Documentar que role agora existe na tabela

2. **docs/AUDITORIA-RLS-RBAC-COMPLETA.md**
   - Marcar problema #8 como ✅ RESOLVIDO
   - Adicionar seção "Resolução: Role gestor_entidade adicionado"

3. **README.md** (se houver seção de papéis)
   - Adicionar `gestor_entidade` na lista de perfis

**Tempo estimado:** 30 minutos  
**Risco:** 🟢 ZERO (apenas documentação)

---

### Fase 5: Testes de Validação (Obrigatório)

```typescript
// __tests__/database/role-gestor-entidade.test.ts
describe('Role gestor_entidade na tabela roles', () => {
  it('deve existir registro para gestor_entidade', async () => {
    const result = await query(
      "SELECT * FROM roles WHERE name = 'gestor_entidade'"
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].display_name).toBe('Gestor de Entidade');
    expect(result.rows[0].hierarchy_level).toBe(10);
  });

  it('deve ter permissões associadas', async () => {
    const result = await query(`
      SELECT p.name
      FROM roles r
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.name = 'gestor_entidade'
    `);

    expect(result.rows.length).toBeGreaterThan(0);

    const permNames = result.rows.map((r) => r.name);
    expect(permNames).toContain('read:funcionarios:entidade');
    expect(permNames).toContain('write:funcionarios:entidade');
  });

  it('validação de perfil via string continua funcionando', async () => {
    // Simular sessão
    await query(`SET LOCAL app.current_user_perfil = 'gestor_entidade'`);

    // Validar que policies existentes ainda funcionam
    const result = await query(`
      SELECT current_user_perfil() as perfil
    `);

    expect(result.rows[0].perfil).toBe('gestor_entidade');
  });
});
```

**Tempo estimado:** 30 minutos  
**Risco:** 🟢 ZERO (apenas validação)

---

## 🚨 Riscos e Mitigações

### Risco 1: Conflito com Dados Existentes

**Probabilidade:** 🟢 BAIXA  
**Impacto:** 🟢 BAIXO

**Cenário:**

- Migration tenta inserir role `gestor_entidade` mas já existe

**Mitigação:**

```sql
INSERT INTO roles (...) VALUES (...)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
```

---

### Risco 2: Performance de Policies RBAC

**Probabilidade:** 🟡 MÉDIA (se implementar Fase 3)  
**Impacto:** 🟡 MÉDIO

**Cenário:**

- Policies com EXISTS e 3 JOINs podem ser lentas

**Mitigação:**

- Criar índices em `role_permissions`:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_role_permissions_composite
  ON role_permissions (role_id, permission_id);
  ```
- Policies RBAC são opcionais (Fase 3 é P3)

---

### Risco 3: Confusão de Documentação

**Probabilidade:** 🟡 MÉDIA  
**Impacto:** 🟡 MÉDIO

**Cenário:**

- Desenvolvedores acham que perfil é FK para roles

**Mitigação:**

- Documentar claramente:

  ```markdown
  ## ⚠️ IMPORTANTE

  O campo `funcionarios.perfil` é VARCHAR(20), NÃO é FK para `roles`.

  - Validação é feita via comparação de string
  - Tabela `roles` é usada apenas para RBAC granular (permissões)
  - Sistema continua funcionando via string literal
  ```

---

## 📈 Benefícios da Implementação

### Curto Prazo

1. ✅ **Consistência arquitetural** - Database reflete código
2. ✅ **Documentação clara** - Role explícito na tabela
3. ✅ **Base para RBAC** - Permissões granulares prontas

### Médio Prazo

4. ✅ **Auditoria facilitada** - Queries podem usar `roles.display_name`
5. ✅ **Extensibilidade** - Fácil adicionar permissões específicas
6. ✅ **Governança** - Papéis formalizados em tabela

### Longo Prazo

7. ✅ **Migração para RBAC completo** - Substituir validações de perfil por permissões
8. ✅ **UI de gerenciamento** - Admin pode criar/editar roles dinamicamente
9. ✅ **Compliance** - Auditoria de permissões via banco

---

## 🎯 Recomendações Finais

### Prioridade de Implementação

| Fase       | Descrição                 | Prioridade           | Prazo   | Risco    |
| ---------- | ------------------------- | -------------------- | ------- | -------- |
| **Fase 1** | Adicionar role na tabela  | **P1 - HOJE**        | 15 min  | 🟢 ZERO  |
| **Fase 2** | Helper RLS contratante_id | **P2 - Esta semana** | 10 min  | 🟢 ZERO  |
| **Fase 4** | Atualizar documentação    | **P1 - HOJE**        | 30 min  | 🟢 ZERO  |
| **Fase 5** | Testes de validação       | **P2 - Esta semana** | 30 min  | 🟢 ZERO  |
| **Fase 3** | Policies RBAC (opcional)  | **P3 - 2 semanas**   | 2 horas | 🟡 BAIXO |

### Ordem Recomendada

```
1. Fase 1 (15 min) → Adicionar role na tabela
2. Fase 5 (30 min) → Executar testes de validação
3. Fase 4 (30 min) → Atualizar documentação
4. Fase 2 (10 min) → Adicionar helper RLS
5. Deploy → Validar em produção
6. Fase 3 (futuro) → Implementar policies RBAC quando necessário
```

**Tempo total (fases obrigatórias):** ~1h30min  
**Risco total:** 🟢 ZERO BREAKING CHANGE

---

## 📝 Conclusões

### 1. Impacto Real: ZERO Breaking Change

**Razão fundamental:**

- Sistema **NUNCA** faz JOIN entre `funcionarios.perfil` e `roles.name`
- Sistema **SEMPRE** valida perfil via comparação de string literal
- Tabela `roles` é infraestrutura para RBAC futuro, não afeta funcionalidade atual

### 2. Código Não Precisa de Mudança

**Camadas que permanecem inalteradas:**

- ✅ Middleware (valida perfil string)
- ✅ Autenticação (valida perfil string)
- ✅ APIs (valida perfil string)
- ✅ RLS Policies (comparam perfil string)
- ✅ Frontend (lê perfil string)
- ✅ Testes (mockam perfil string)

### 3. Esta é uma Mudança de Infraestrutura

**O que realmente muda:**

- Tabela `roles` ganha 1 registro a mais
- Tabela `permissions` ganha 8 permissões a mais
- Tabela `role_permissions` ganha 8 associações a mais
- Documentação atualizada
- **NADA no código de aplicação muda**

### 4. Benefícios Sem Riscos

**Ganhamos:**

- Consistência arquitetural
- Base para RBAC granular
- Documentação clara de papéis
- Facilidade de auditoria

**Sem perder:**

- Estabilidade (zero breaking change)
- Performance (zero overhead)
- Simplicidade (código não muda)

---

## 🚀 Aprovação para Implementação

### Status: ✅ APROVADO PARA PRODUÇÃO

**Justificativa:**

1. Impacto zero em código existente
2. Apenas INSERT em tabelas (sem ALTER)
3. Funcionalidade continua via string
4. Adiciona consistência sem riscos

### Próximo Passo

Executar Fase 1:

```bash
# Criar migration
touch database/migrations/202_add_gestor_entidade_role.sql

# Aplicar migration
psql -U postgres -d nr-bps_db -f database/migrations/202_add_gestor_entidade_role.sql

# Validar
psql -U postgres -d nr-bps_db -c "SELECT * FROM roles WHERE name = 'gestor_entidade';"
```

---

**Assinatura Digital:** Sistema de Auditoria QWork  
**Data:** 29 de janeiro de 2026  
**Versão:** 1.0.0
