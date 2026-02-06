# Análise: Necessidade de Role "gestor" na Tabela `roles`

**Data:** 29 de janeiro de 2026  
**Tipo:** Análise de requisito arquitetural  
**Status:** ✅ NECESSÁRIO - Role ausente na tabela

---

## 🎯 Resumo Executivo

### Problema Identificado

A tabela `roles` possui apenas 4 registros:

1. `funcionario` - Usuário comum que responde avaliações
2. `rh` - Gestor RH/Clínica (gerencia funcionários **e empresas**)
3. `emissor` - Emissor de Laudos
4. `admin` - Administrador do sistema

**AUSENTE:** Role para **gestor de entidades**, que:

- Gerencia funcionários de sua entidade
- **NÃO gerencia empresas** (diferente do `rh`)
- Tem praticamente as mesmas permissões que `rh`, exceto gestão de empresas

### Contexto Arquitetural

```
CONTRATANTES (Tabela Unificada)
├── tipo='clinica'
│   ├── Cria registro em tabela 'clinicas'
│   ├── Gestor autentica via entidades_senhas
│   ├── Role: 'rh' (gerencia empresas + funcionários)
│   └── Fluxo: Clínica → Empresas → Funcionários → Lotes
│
└── tipo='entidade'
    ├── NÃO cria registro em 'clinicas'
    ├── Gestor autentica via entidades_senhas
    ├── Role: 'gestor' ⚠️ AUSENTE NA TABELA ROLES
    └── Fluxo: Entidade → Funcionários → Lotes (SEM empresas)
```

---

## 📊 Comparação: Clínica vs Entidade

| Aspecto                      | Clínica (RH)                        | Entidade (Gestor)  |
| ---------------------------- | ----------------------------------- | ------------------ |
| **Perfil usado**             | `rh`                                | `gestor`           |
| **Registro na tabela roles** | ✅ Existe                           | ❌ **AUSENTE**     |
| **Autenticação**             | `entidades_senhas`                  | `entidades_senhas` |
| **Gerencia empresas?**       | ✅ SIM (tabela `empresas_clientes`) | ❌ NÃO             |
| **Gerencia funcionários?**   | ✅ SIM                              | ✅ SIM             |
| **Cria/libera lotes?**       | ✅ SIM                              | ✅ SIM             |
| **Acessa relatórios?**       | ✅ SIM                              | ✅ SIM             |
| **Contexto de isolamento**   | `clinica_id`                        | `contratante_id`   |

### Diferença Chave

**Clínica (medicina ocupacional):**

```
Clínica → gerencia múltiplas Empresas → cada empresa tem Funcionários
```

**Entidade (empresa privada):**

```
Entidade → gerencia diretamente seus próprios Funcionários (sem intermediário)
```

---

## 🔍 Análise da Implementação Atual

### 1. Código Usa `gestor` Extensivamente

#### lib/db.ts - criarContaResponsavel()

```typescript
// Linha 1621
const perfilToSet = contratanteData.tipo === 'entidade' ? 'gestor' : 'rh';
```

#### middleware.ts

```typescript
// Rotas de entidade verificam perfil 'gestor'
if (session.perfil === 'gestor') {
  if (ENTIDADE_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }
}
```

#### Migrações

```sql
-- Migration 073, 092, 093, 108, 109
-- Todas referenciam perfil='gestor'
CHECK (perfil IN ('funcionario', 'rh', 'emissor', 'admin', 'gestor'))
```

### 2. Tabela `roles` Está Desatualizada

#### Estado Atual da Tabela

```sql
-- Migration 001_security_rls_rbac.sql (linhas 132-164)
INSERT INTO public.roles (name, display_name, description, hierarchy_level)
VALUES
  ('funcionario', 'Funcionário', 'Usuário comum que responde avaliações', 0),
  ('rh', 'Gestor RH/Clínica', 'Gerencia funcionários e empresas de sua clínica', 10),
  ('emissor', 'Emissor de Laudos', 'Emite laudos e relatórios finais', 10),
  ('admin', 'Administrador', 'Administrador do sistema com acesso amplo', 50),
  ('super', 'Super administrador', 'Super administrador com acesso total', 100);
```

**Observação:** Há registro `super` que também não é usado no código.

#### Inconsistência

- ❌ Role `gestor` usado no código **NÃO existe na tabela**
- ❌ Role `super` existe na tabela mas **NÃO é usado no código**
- ✅ Roles `funcionario`, `rh`, `emissor`, `admin` consistentes

---

## 🏗️ Análise de Permissões

### Permissões que `gestor` PRECISA ter

Com base nas rotas e funcionalidades de entidade:

```typescript
// app/api/entidade/**
├── account-info/         ✅ Ler informações da própria entidade
├── dashboard/            ✅ Dashboard com métricas
├── funcionarios/         ✅ CRUD de funcionários
│   ├── import/          ✅ Importar XLSX
│   └── status/          ✅ Status de avaliações
├── liberar-lote/        ✅ Criar e liberar lotes
├── lotes/               ✅ Listar lotes
├── lote/[id]/           ✅ Detalhes, download, relatórios
├── laudos/              ✅ Visualizar laudos
├── notificacoes/        ✅ Notificações
└── parcelas/            ✅ Pagamentos
```

### Permissões que `gestor` NÃO DEVE ter

```typescript
// NÃO deve acessar:
❌ /api/rh/empresas/**         // Gestão de empresas (só clínicas)
❌ /api/admin/**               // Rotas administrativas
❌ /api/emissor/**             // Emissão de laudos (perfil específico)
```

### Comparação com Role `rh`

```sql
-- Permissões do role 'rh' (migration 001, linhas 286-296)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'rh' AND p.name IN (
  'read:avaliacoes:clinica',      -- gestor: read:avaliacoes:entidade
  'read:funcionarios:clinica',    -- gestor: read:funcionarios:entidade
  'write:funcionarios:clinica',   -- gestor: write:funcionarios:entidade
  'read:empresas:clinica',        -- gestor: ❌ NÃO (sem empresas)
  'write:empresas:clinica',       -- gestor: ❌ NÃO (sem empresas)
  'read:lotes:clinica',           -- gestor: read:lotes:entidade
  'write:lotes:clinica'           -- gestor: write:lotes:entidade
);
```

**Diferença:** Remover permissões de `empresas`.

---

## 📋 Solução Proposta

### Migration: Adicionar Role `gestor`

```sql
-- Migration XXX_add_gestor_role.sql

BEGIN;

-- 1. Inserir role gestor
INSERT INTO public.roles (
  name,
  display_name,
  description,
  hierarchy_level,
  active
)
VALUES (
  'gestor',
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

-- 2. Criar permissões específicas para entidades (se não existirem)
INSERT INTO public.permissions (
  name,
  resource,
  action,
  description
)
VALUES
  -- Avaliações
  (
    'read:avaliacoes:entidade',
    'avaliacoes',
    'read',
    'Ler avaliações de funcionários da entidade'
  ),

  -- Funcionários
  (
    'read:funcionarios:entidade',
    'funcionarios',
    'read',
    'Ler funcionários da entidade'
  ),
  (
    'write:funcionarios:entidade',
    'funcionarios',
    'write',
    'Criar/editar funcionários da entidade'
  ),

  -- Lotes
  (
    'read:lotes:entidade',
    'lotes',
    'read',
    'Ler lotes da entidade'
  ),
  (
    'write:lotes:entidade',
    'lotes',
    'write',
    'Criar/editar lotes da entidade'
  ),

  -- Laudos
  (
    'read:laudos:entidade',
    'laudos',
    'read',
    'Visualizar laudos de funcionários da entidade'
  ),

  -- Conta
  (
    'read:contratante:own',
    'contratantes',
    'read',
    'Ler dados da própria entidade/clínica'
  ),
  (
    'write:contratante:own',
    'contratantes',
    'write',
    'Editar dados da própria entidade/clínica'
  )
ON CONFLICT (name) DO NOTHING;

-- 3. Associar permissões ao role gestor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'gestor' AND p.name IN (
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

-- 4. Também associar permissões já existentes que são comuns
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'gestor' AND p.name IN (
  'read:avaliacoes:own',      -- Pode ver próprias avaliações (caso teste)
  'read:funcionarios:own'     -- Pode ver próprios dados
)
ON CONFLICT DO NOTHING;

-- 5. Comentários
COMMENT ON TABLE public.roles IS
'Tabela de papéis (roles) do sistema RBAC. Incluindo gestor para entidades privadas sem gestão de empresas.';

-- 6. Verificação
DO $$
DECLARE
  role_count INTEGER;
  perm_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM public.roles WHERE name = 'gestor';
  SELECT COUNT(*) INTO perm_count FROM public.role_permissions rp
  JOIN public.roles r ON r.id = rp.role_id
  WHERE r.name = 'gestor';

  RAISE NOTICE '✅ Role gestor criado: % registro(s)', role_count;
  RAISE NOTICE '✅ Permissões associadas: % permissão(ões)', perm_count;
END $$;

COMMIT;
```

---

## 🔒 Ajustes de RLS Policies

### Policies Atuais Usam `perfil='rh'`

Várias policies precisam reconhecer `gestor`:

```sql
-- Exemplo atual (migration 001, linha 447):
CREATE POLICY funcionarios_rh_clinica ON public.funcionarios
FOR SELECT TO PUBLIC
USING (
  current_user_perfil() = 'rh'
  AND clinica_id = current_user_clinica_id()
);
```

### Ajustes Necessários

#### Opção 1: Policies Separadas (Recomendado)

```sql
-- Policy para RH (clínicas com clinica_id)
CREATE POLICY funcionarios_rh_clinica ON public.funcionarios
FOR SELECT TO PUBLIC
USING (
  current_user_perfil() = 'rh'
  AND clinica_id = current_user_clinica_id()
);

-- Policy para Gestor Entidade (entidades com contratante_id)
CREATE POLICY funcionarios_gestor ON public.funcionarios
FOR SELECT TO PUBLIC
USING (
  current_user_perfil() = 'gestor'
  AND contratante_id = current_user_contratante_id()
);
```

#### Opção 2: Policy Unificada

```sql
CREATE POLICY funcionarios_gestores ON public.funcionarios
FOR SELECT TO PUBLIC
USING (
  (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
  )
  OR
  (
    current_user_perfil() = 'gestor'
    AND contratante_id = current_user_contratante_id()
  )
);
```

**Recomendação:** Opção 1 (policies separadas) para clareza e manutenibilidade.

---

## ✅ Checklist de Implementação

### 1. Database

- [ ] **Criar migration `XXX_add_gestor_role.sql`**
  - Inserir role `gestor` em `roles`
  - Criar permissões específicas `*:entidade` em `permissions`
  - Associar permissões em `role_permissions`

- [ ] **Criar migration `XXX_add_rls_policies_gestor.sql`**
  - Policies para `funcionarios`
  - Policies para `avaliacoes`
  - Policies para `lotes_avaliacao`
  - Policies para `laudos`
  - Policies para `contratantes` (acesso own)

- [ ] **Adicionar helper function RLS**
  ```sql
  CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
  RETURNS INTEGER AS $$
  BEGIN
    RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
  ```

### 2. Backend

- [x] **lib/db.ts** - Já usa `gestor` corretamente
- [x] **middleware.ts** - Já valida `gestor` em rotas
- [ ] **Verificar RLS context em queries**
  - Garantir que `session.contratante_id` é setado via `SET LOCAL`

### 3. Testes

- [ ] **Criar testes de role**
  - Verificar que `gestor` pode acessar próprios funcionários
  - Verificar que `gestor` NÃO pode acessar empresas
  - Verificar isolamento entre entidades diferentes

- [ ] **Atualizar testes existentes**
  - Fixtures que usam `gestor` devem ter role na tabela
  - Validar RLS policies com perfil `gestor`

### 4. Documentação

- [ ] **Atualizar [GUIA-COMPLETO-RLS-RBAC.md](security/GUIA-COMPLETO-RLS-RBAC.md)**
  - Adicionar seção sobre role `gestor`
  - Matriz de permissões incluindo `gestor`

- [ ] **Atualizar [AUDITORIA-RLS-RBAC-COMPLETA.md](AUDITORIA-RLS-RBAC-COMPLETA.md)**
  - Marcar item #8 como resolvido (documentação vs implementação)

---

## 🎯 Prioridade e Impacto

### Prioridade: **P2 - Esta Semana**

**Razão:**

- Sistema funciona sem role na tabela (código já valida perfil corretamente)
- Mas falta consistência entre código e database schema
- Permissões granulares via RBAC não estão sendo aplicadas

### Impacto

| Área               | Impacto  | Detalhes                                            |
| ------------------ | -------- | --------------------------------------------------- |
| **Segurança**      | 🟡 Médio | RLS baseado em perfil funciona, mas RBAC incompleto |
| **Funcionalidade** | 🟢 Baixo | Tudo funciona (código valida perfil, não role)      |
| **Consistência**   | 🔴 Alto  | Tabela `roles` não reflete realidade do código      |
| **Manutenção**     | 🟡 Médio | Documentação fica confusa sem role formal           |

### Benefícios da Implementação

1. ✅ **Consistência arquitetural** - Database reflete código
2. ✅ **RBAC completo** - Permissões granulares funcionais
3. ✅ **Documentação clara** - Papel explícito na tabela
4. ✅ **Auditoria facilitada** - Queries podem usar `roles.name`
5. ✅ **Extensibilidade** - Fácil adicionar permissões específicas

---

## 📚 Referências

### Código Existente

- [lib/db.ts:criarContaResponsavel](../lib/db.ts#L1621) - Atribui `gestor`
- [middleware.ts](../middleware.ts) - Valida perfil `gestor`
- [app/api/entidade/\*\*](../app/api/entidade/) - Rotas para gestores de entidade

### Migrations Relacionadas

- [001_security_rls_rbac.sql](../database/migrations/001_security_rls_rbac.sql) - Tabela `roles` original
- [073_fix_funcionarios_clinica_check_contratante.sql](../database/migrations/073_fix_funcionarios_clinica_check_contratante.sql) - Constraints para `gestor`
- [108_add_contratante_id_to_funcionarios.sql](../database/migrations/108_add_contratante_id_to_funcionarios.sql) - Suporte a entidades

### Documentação

- [ANALISE-CRITICA-RESPONSAVEL.md](ANALISE-CRITICA-RESPONSAVEL.md) - Análise anterior (parcialmente incorreta)
- [AUDITORIA-RLS-RBAC-COMPLETA.md](AUDITORIA-RLS-RBAC-COMPLETA.md) - Problema #8
- [security/GUIA-COMPLETO-RLS-RBAC.md](security/GUIA-COMPLETO-RLS-RBAC.md) - Guia de segurança

---

## ⚠️ Correção da Análise Anterior

A análise em [ANALISE-CRITICA-RESPONSAVEL.md](ANALISE-CRITICA-RESPONSAVEL.md) estava **PARCIALMENTE INCORRETA**:

### ❌ O que estava errado

1. **"Tabela papéis não existe"** - ERRADO, existe como `roles`
2. **"Renomear não resolve problema"** - Correto, mas problema real era AUSÊNCIA na tabela
3. **"Gestor entidade não deve estar em funcionarios"** - Correto (já resolvido via constraint)
4. **"Entidade não tem empresas"** - Correto arquiteturalmente

### ✅ O que estava certo

1. Gestor entidade realmente não deve estar na tabela `funcionarios`
2. Constraint protetora é solução correta para isso
3. Código já implementa lógica correta (`gestor` via `entidades_senhas`)
4. Migration 201 já removeu `gestor` de `funcionarios`

### 🎯 Problema Real

**Falta registro de role na tabela `roles`**, não problema conceitual de arquitetura.

---

## 🚀 Próximos Passos

1. **Criar migration para adicionar role** (30 min)
2. **Criar migration para RLS policies** (1 hora)
3. **Adicionar helper function `current_user_contratante_id()`** (15 min)
4. **Testar isolamento entre entidades** (30 min)
5. **Atualizar documentação** (30 min)

**Tempo total estimado:** ~3 horas

---

**Conclusão:** Role `gestor` é NECESSÁRIO na tabela `roles` para consistência arquitetural e funcionamento completo do RBAC. Implementação é simples e de baixo risco. ✅
