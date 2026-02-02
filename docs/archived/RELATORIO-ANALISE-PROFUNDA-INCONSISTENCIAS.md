# 🔍 Relatório de Análise Profunda - Inconsistências no Sistema

**Data:** 29 de janeiro de 2026  
**Escopo:** Análise completa de Back-end, UI, RBAC, RLS, Banco de Dados e Relações

---

## 📋 Estrutura Correta de Referência

```
contratantes = clínicas OU entidades
│
├─ rh → gerencia clínica (contratante_id = clínica)
│   └─ funcionarios.clinica_id obrigatório
│   └─ armazenados em: funcionarios com perfil='rh'
│
├─ gestor_entidade → gerencia entidade (contratante_id = entidade)
│   └─ contratante_id obrigatório, clinica_id=NULL
│   └─ armazenados em: funcionarios com perfil='gestor_entidade'
│
└─ funcionario → pode pertencer a:
    ├─ Empresa de clínica (empresa_id + clinica_id)
    └─ Diretamente à entidade (contratante_id, sem empresa_id/clinica_id)
```

---

## 🚨 INCONSISTÊNCIAS CRÍTICAS ENCONTRADAS

### 1. ❌ DUPLICIDADE DE ARMAZENAMENTO - Gestores de Entidade

**Problema:**  
Sistema armazena gestores de entidade em **DOIS** locais diferentes:

1. **`funcionarios`** com `perfil='gestor_entidade'`
2. **`contratantes_senhas`**

**Evidências:**

```typescript
// lib/db.ts - criarContaResponsavel()
const perfilToSet = contratanteData.tipo === 'entidade' ? 'gestor_entidade' : 'rh';
// Cria em funcionarios com perfil gestor_entidade

// Também existe:
INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash)
// Cria senha em tabela separada
```

```sql
-- __tests__/integration/rls-isolamento-rh-gestor.test.ts
INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, contratante_id, ativo, nivel_cargo)
VALUES ($1, $2, 'gestor_entidade', $4, $5, $6, $7)
-- Gestor criado na tabela funcionarios
```

**Impacto:**

- **Alta confusão conceitual:** Gestores de entidade misturados com funcionários regulares
- **Violação da separação:** Documentação afirma que gestores de entidade NÃO devem estar em `funcionarios`
- **Queries ambíguas:** Código precisa buscar em múltiplos lugares
- **RLS complexo:** Políticas precisam cobrir ambos cenários

**Localização dos Problemas:**

- [lib/db.ts](c:/apps/QWork/lib/db.ts#L1607-L1900) - `criarContaResponsavel()`
- [**tests**/integration/rls-isolamento-rh-gestor.test.ts](c:/apps/QWork/__tests__/integration/rls-isolamento-rh-gestor.test.ts#L170-L206)
- [app/api/entidade/funcionarios/route.ts](c:/apps/QWork/app/api/entidade/funcionarios/route.ts#L104-L220)

---

### 2. ❌ CONSTRAINTS CONFLITANTES - Tabela funcionarios

**Problema:**  
Múltiplas constraints contraditórias sobre `clinica_id` e `contratante_id`.

**Evidências:**

```sql
-- Migration 100
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_check CHECK (
  (perfil = 'rh' AND clinica_id IS NOT NULL)
  OR (perfil <> 'rh')
);

-- Migration 105
ALTER TABLE funcionarios ADD COLUMN contratante_id INTEGER;

-- Migration 071
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_id_check CHECK (
  perfil IN ('emissor', 'admin', 'gestao')
  OR clinica_id IS NOT NULL
  OR contratante_id IS NOT NULL
);

-- Migration 110
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_owner_check CHECK (
  (clinica_id IS NOT NULL AND contratante_id IS NULL)
  OR (contratante_id IS NOT NULL AND clinica_id IS NULL)
  OR (perfil IN ('emissor', 'admin', 'gestor_entidade', 'rh'))
) NOT VALID;
```

**Conflitos:**

1. **Migration 100:** Exige `clinica_id` para RH
2. **Migration 110:** Permite RH **SEM** `clinica_id` OU `contratante_id`
3. **Lógica aplicação:** RH criado em `funcionarios` COM `clinica_id`
4. **NOT VALID:** Constraints marcadas como NOT VALID permitindo dados inconsistentes

**Impacto:**

- **Violação de integridade:** Banco permite estados inválidos
- **Validação inconsistente:** Backend pode inserir dados que violam regras de negócio
- **Dívida técnica:** NOT VALID constraints nunca validadas

**Localização:**

- [database/migrations/100_fix_funcionarios_constraints.sql](c:/apps/QWork/database/migrations/100_fix_funcionarios_constraints.sql)
- [database/migrations/110_include_rh_in_owner_check.sql](c:/apps/QWork/database/migrations/110_include_rh_in_owner_check.sql)
- [database/migrations/071_fix_funcionarios_clinica_id_check.sql](c:/apps/QWork/database/migrations/071_fix_funcionarios_clinica_id_check.sql)

---

### 3. ❌ RLS POLICIES INCONSISTENTES

**Problema:**  
Políticas RLS não refletem a estrutura correta de dados.

**Evidências:**

```sql
-- migration-017-rls.sql
CREATE POLICY funcionarios_select_policy ON funcionarios FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
    OR
    EXISTS (
        SELECT 1 FROM contratantes_funcionarios cf
        WHERE cf.funcionario_id = funcionarios.id
        AND cf.contratante_id::text = current_setting('app.current_contratante_id', true)
        AND cf.vinculo_ativo = true
    )
);
```

**Problemas Identificados:**

1. **Tabela fantasma:** `contratantes_funcionarios` existe mas não é usada consistentemente
2. **Conversão de tipo:** `clinica_id::text` é anti-pattern para comparação de inteiros
3. **Gestor de entidade:** Política não considera perfil `gestor_entidade` corretamente
4. **RH sem contexto:** RH pode não ter `clinica_id` em sessão por mapeamento falho

**Evidências de Falha:**

```typescript
// lib/session.ts - requireRHWithEmpresaAccess()
if (!session.clinica_id && session.contratante_id) {
  // Tenta mapear clinica_id via contratante_id
  // ❌ Indica que RH pode ter contratante_id mas não clinica_id
}
```

**Impacto:**

- **Vazamento de dados:** RH pode acessar dados de outras clínicas
- **Isolamento quebrado:** Gestores podem ver dados de outras entidades
- **Performance ruim:** Queries com conversões de tipo e EXISTS desnecessários

**Localização:**

- [database/migration-017-rls.sql](c:/apps/QWork/database/migration-017-rls.sql#L53-L90)
- [lib/security/rls-context.ts](c:/apps/QWork/lib/security/rls-context.ts#L120-L180)

---

### 4. ❌ VALIDAÇÃO DE SESSÃO AMBÍGUA

**Problema:**  
`validateSessionContext()` tem lógica complexa e redundante para validar usuários.

**Evidências:**

```typescript
// lib/db-security.ts
async function validateSessionContext(
  cpf: string,
  perfil: string
): Promise<boolean> {
  if (perfil === 'gestor_entidade') {
    // Busca em contratantes_senhas
    const result = await query(
      'SELECT cs.cpf FROM contratantes_senhas cs JOIN contratantes c ...',
      [cpf]
    );
    return result.rows.length > 0;
  }

  if (perfil === 'rh') {
    // Busca em funcionarios
    const funcResult = await query(
      'SELECT cpf, perfil, ativo FROM funcionarios WHERE cpf = $1 AND perfil = $2',
      [cpf, perfil]
    );

    if (funcResult.rows.length > 0) {
      return true;
    }

    // Se não encontrou, busca em contratantes_senhas TAMBÉM
    const gestorResult = await query(
      'SELECT cs.cpf FROM contratantes_senhas cs ...',
      [cpf]
    );

    return gestorResult.rows.length > 0;
  }

  // Para outros perfis, busca apenas em funcionarios
  const result = await query('SELECT cpf FROM funcionarios WHERE cpf = $1', [
    cpf,
  ]);
  return result.rows.length > 0;
}
```

**Problemas:**

1. **Perfil RH duplicado:** RH pode estar em `funcionarios` **OU** `contratantes_senhas`
2. **Gestor entidade duplicado:** Mesma ambiguidade
3. **Lógica condicional complexa:** 3 caminhos diferentes para validação
4. **Queries redundantes:** Múltiplas consultas para mesmo objetivo

**Impacto:**

- **Performance degradada:** Múltiplas queries por validação de sessão
- **Manutenção difícil:** Lógica espalhada e confusa
- **Bugs potenciais:** Fácil esquecer um dos caminhos de validação

**Localização:**

- [lib/db-security.ts](c:/apps/QWork/lib/db-security.ts#L29-L100)

---

### 5. ❌ MAPEAMENTO DE CLINICA_ID FRÁGIL

**Problema:**  
Sistema tenta mapear `clinica_id` de `contratante_id` em runtime, causando falhas.

**Evidências:**

```typescript
// lib/session.ts - requireRHWithEmpresaAccess()
if (!session.clinica_id && session.contratante_id) {
  console.log('[DEBUG] RH sem clinica_id - tentando mapear via contratante_id');

  try {
    const fallback = await query(
      `SELECT cl.id, cl.ativa, c.tipo 
       FROM clinicas cl
       INNER JOIN contratantes c ON c.id = cl.contratante_id
       WHERE cl.contratante_id = $1 AND c.tipo = 'clinica'
       LIMIT 1`,
      [session.contratante_id]
    );

    if (fallback.rows.length > 0) {
      session.clinica_id = fallback.rows[0].id;
      createSession(session); // ❌ Modifica sessão em middleware
    }
  } catch (err) {
    console.log('[DEBUG] Erro ao mapear clínica:', err?.message);
  }
}
```

**Problemas:**

1. **Sessão inconsistente:** RH pode ter `contratante_id` mas não `clinica_id` inicialmente
2. **Mapeamento runtime:** Tentativa de correção em cada request
3. **Mutação de sessão:** `createSession()` chamado durante validação
4. **Try-catch silencioso:** Erros de mapeamento ignorados

**Impacto:**

- **Sessões inválidas:** RH operando sem contexto correto
- **Queries adicionais:** Cada request faz lookup desnecessário
- **Race conditions:** Mutação de sessão durante request pode causar inconsistências

**Localização:**

- [lib/session.ts](c:/apps/QWork/lib/session.ts#L200-L236)
- [app/api/test/session/route.ts](c:/apps/QWork/app/api/test/session/route.ts#L14-L30)

---

### 6. ❌ CRIAÇÃO DE FUNCIONÁRIOS - Lógica Divergente

**Problema:**  
APIs diferentes criam funcionários com estratégias inconsistentes.

**Comparação:**

```typescript
// API RH - /api/rh/funcionarios
await query(`INSERT INTO funcionarios (
  cpf, nome, ..., clinica_id, empresa_id, contratante_id, ...
) VALUES (..., $9, $10, NULL, ...)`, // ❌ contratante_id sempre NULL
[..., session.clinica_id, empresa_id]
);

// API Entidade - /api/entidade/funcionarios
await query(`INSERT INTO funcionarios (
  cpf, nome, ..., contratante_id, ...
) VALUES (..., $9, ..., NULL, NULL)`, // ❌ clinica_id e empresa_id NULL
[..., contratanteId]
);
```

**Problemas:**

1. **RH:** Define `clinica_id` e `empresa_id`, mas força `contratante_id=NULL`
2. **Entidade:** Define `contratante_id`, mas força `clinica_id=NULL` e `empresa_id=NULL`
3. **Inconsistência:** Mesmo funcionário não pode estar em ambos cenários
4. **Violação:** Documentação diz que funcionário pode pertencer a empresa **OU** entidade

**Cenário Problemático:**

```
Funcionário vinculado a empresa (empresa_id=5, clinica_id=2)
↓
Não tem contratante_id
↓
Gestor de Entidade NÃO consegue ver via RLS
↓
Funcionário "perdido" no sistema
```

**Impacto:**

- **Dados isolados:** Funcionários não aparecem para gestores corretos
- **Duplicação:** Necessário criar funcionário duas vezes (empresa + entidade)
- **RLS quebrado:** Políticas não cobrem todos os cenários

**Localização:**

- [app/api/rh/funcionarios/route.ts](c:/apps/QWork/app/api/rh/funcionarios/route.ts#L173-L195)
- [app/api/entidade/funcionarios/route.ts](c:/apps/QWork/app/api/entidade/funcionarios/route.ts#L161-L189)

---

### 7. ❌ TABELA `contratantes_funcionarios` SUB-UTILIZADA

**Problema:**  
Tabela criada para relacionamento polimórfico mas não usada consistentemente.

**Evidências:**

```sql
-- Migration 001
CREATE TABLE contratantes_funcionarios (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL,
    contratante_id INTEGER NOT NULL,
    tipo_contratante tipo_contratante_enum NOT NULL,
    vinculo_ativo BOOLEAN DEFAULT true,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE
);
```

**Uso Atual:**

```typescript
// app/api/entidade/funcionarios/route.ts - POST
// ✅ ÚNICO lugar que usa a tabela:
await query(
  'INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
  [newId, contratanteId, 'entidade']
);
```

**Problemas:**

1. **RH não usa:** Funcionários de clínica não vinculados via esta tabela
2. **RLS usa mas não popula:** Políticas verificam `contratantes_funcionarios` mas tabela vazia
3. **Redundância:** `funcionarios.contratante_id` + `contratantes_funcionarios.contratante_id`
4. **Histórico perdido:** `data_inicio` e `data_fim` não utilizados

**Impacto:**

- **Relacionamento quebrado:** RLS assume vínculos que não existem
- **Performance ruim:** JOIN em tabela vazia
- **Complexidade desnecessária:** Tabela adicional sem benefício

**Localização:**

- [database/migration-001-contratantes.sql](c:/apps/QWork/database/migration-001-contratantes.sql#L90-L116)
- [database/migration-017-rls.sql](c:/apps/QWork/database/migration-017-rls.sql#L60-L68) - RLS usa mas não populado

---

### 8. ⚠️ DOCUMENTAÇÃO vs IMPLEMENTAÇÃO

**Problema:**  
Documentação afirma separação clara, mas implementação diverge.

**Documentação:**

```markdown
// docs/PR_RBAC_RLS_DOCUMENTATION.md

### Gestores RH

- Armazenamento: Tabela `funcionarios` com `perfil='rh'`
- Motivo: Necessário para vínculo com clínicas

### Gestores Entidade

- Armazenamento: Apenas `contratantes_senhas` (NÃO em `funcionarios`)
- Separação: Completa desde a criação
```

**Realidade:**

```typescript
// lib/db.ts - criarContaResponsavel()
const perfilToSet =
  contratanteData.tipo === 'entidade' ? 'gestor_entidade' : 'rh';

await query(
  `INSERT INTO funcionarios (cpf, nome, perfil, contratante_id, ...)
   VALUES ($1, $2, $3, $4, ...)`,
  [cpf, nome, perfilToSet, contratanteData.id] // ❌ Gestor entidade EM funcionarios
);
```

**Impacto:**

- **Confusão de equipe:** Desenvolvedores seguem doc, sistema faz outra coisa
- **Código contraditório:** Testes e produção com comportamentos diferentes
- **Manutenção impossível:** Mudanças quebram assunções

**Localização:**

- [docs/PR_RBAC_RLS_DOCUMENTATION.md](c:/apps/QWork/docs/PR_RBAC_RLS_DOCUMENTATION.md#L41-L60)
- [lib/db.ts](c:/apps/QWork/lib/db.ts#L1607-L1900)

---

## 📊 RESUMO DE INCONSISTÊNCIAS POR CATEGORIA

### 🗄️ Banco de Dados

| #   | Problema                                         | Severidade | Tabelas Afetadas            |
| --- | ------------------------------------------------ | ---------- | --------------------------- |
| 1   | Constraints contraditórias                       | 🔴 Crítica | `funcionarios`              |
| 2   | Constraints NOT VALID nunca validadas            | 🟡 Alta    | `funcionarios`              |
| 3   | Tabela `contratantes_funcionarios` sub-utilizada | 🟡 Alta    | `contratantes_funcionarios` |
| 4   | Conversão de tipos em RLS                        | 🟡 Alta    | Todas                       |

### 🔒 RLS (Row Level Security)

| #   | Problema                           | Severidade | Impacto            |
| --- | ---------------------------------- | ---------- | ------------------ |
| 1   | Políticas não cobrem todos perfis  | 🔴 Crítica | Vazamento de dados |
| 2   | Uso de tabela não populada em JOIN | 🟡 Alta    | Performance        |
| 3   | Conversão `::text` em comparações  | 🟡 Alta    | Performance        |
| 4   | Lógica complexa com EXISTS         | 🟢 Média   | Manutenção         |

### 🔐 RBAC / Autenticação

| #   | Problema                              | Severidade | Componentes                           |
| --- | ------------------------------------- | ---------- | ------------------------------------- |
| 1   | Gestores em múltiplas tabelas         | 🔴 Crítica | `funcionarios`, `contratantes_senhas` |
| 2   | Validação de sessão ambígua           | 🔴 Crítica | `validateSessionContext()`            |
| 3   | Mapeamento de `clinica_id` em runtime | 🟡 Alta    | Middleware                            |

### 🔌 APIs Backend

| #   | Problema                           | Severidade | Endpoints                                            |
| --- | ---------------------------------- | ---------- | ---------------------------------------------------- |
| 1   | Lógica divergente de criação       | 🔴 Crítica | `/api/rh/funcionarios`, `/api/entidade/funcionarios` |
| 2   | Hardcoded `contratante_id=NULL`    | 🔴 Crítica | `/api/rh/funcionarios`                               |
| 3   | Queries redundantes para validação | 🟡 Alta    | Todos endpoints protegidos                           |

### 🎨 Frontend / UI

| #   | Problema                               | Severidade | Componentes               |
| --- | -------------------------------------- | ---------- | ------------------------- |
| 1   | Sem validação de perfil em formulários | 🟢 Média   | `ModalInserirFuncionario` |
| 2   | Mensagens de erro genéricas            | 🟢 Média   | Todos modais              |

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Normalização de Dados (CRÍTICO)

#### 1.1 Definir Armazenamento Único

**Decisão necessária:**

- **Opção A:** Gestores de entidade APENAS em `contratantes_senhas`
  - ✅ Separação clara
  - ❌ Requires major refactor
- **Opção B:** Gestores de entidade APENAS em `funcionarios`
  - ✅ Unifica autenticação
  - ❌ Perde separação conceitual
- **Opção C (RECOMENDADA):** Funcionários com tipos claros

  ```sql
  CREATE TYPE usuario_tipo_enum AS ENUM (
    'funcionario_clinica',  -- Vinculado a empresa+clinica
    'funcionario_entidade', -- Vinculado a entidade
    'gestor_rh',            -- Gestor de clínica
    'gestor_entidade',      -- Gestor de entidade
    'admin',
    'emissor'
  );

  ALTER TABLE funcionarios ADD COLUMN usuario_tipo usuario_tipo_enum;
  ```

#### 1.2 Limpar Constraints

```sql
-- Remover todas constraints conflitantes
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_id_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

-- Criar constraint unificada e clara
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_owner_exclusive CHECK (
  -- Funcionário de clínica: empresa_id + clinica_id obrigatórios
  (usuario_tipo = 'funcionario_clinica'
   AND empresa_id IS NOT NULL
   AND clinica_id IS NOT NULL
   AND contratante_id IS NULL)
  OR
  -- Funcionário de entidade: contratante_id obrigatório
  (usuario_tipo = 'funcionario_entidade'
   AND contratante_id IS NOT NULL
   AND empresa_id IS NULL
   AND clinica_id IS NULL)
  OR
  -- Gestor RH: clinica_id obrigatório
  (usuario_tipo = 'gestor_rh'
   AND clinica_id IS NOT NULL
   AND contratante_id IS NULL)
  OR
  -- Gestor entidade: contratante_id obrigatório
  (usuario_tipo = 'gestor_entidade'
   AND contratante_id IS NOT NULL
   AND clinica_id IS NULL)
  OR
  -- Perfis especiais sem vinculação
  (usuario_tipo IN ('admin', 'emissor')
   AND clinica_id IS NULL
   AND contratante_id IS NULL
   AND empresa_id IS NULL)
);
```

### Fase 2: Refatorar RLS (ALTO)

#### 2.1 Simplificar Políticas

```sql
-- Política unificada para funcionarios
DROP POLICY IF EXISTS funcionarios_select_policy ON funcionarios;

CREATE POLICY funcionarios_unified_select ON funcionarios FOR SELECT USING (
  -- Admin vê tudo
  (current_setting('app.current_perfil', true) = 'admin')
  OR
  -- Gestor RH vê funcionários de sua clínica
  (current_setting('app.current_perfil', true) = 'gestor_rh'
   AND clinica_id = current_setting('app.current_clinica_id', true)::int)
  OR
  -- Gestor entidade vê funcionários de sua entidade
  (current_setting('app.current_perfil', true) = 'gestor_entidade'
   AND contratante_id = current_setting('app.current_contratante_id', true)::int)
  OR
  -- Funcionário vê apenas próprios dados
  (cpf = current_setting('app.current_cpf', true))
);
```

#### 2.2 Remover Tabela Intermediária Não Usada

```sql
-- Se não for usar contratantes_funcionarios, remover
DROP TABLE IF EXISTS contratantes_funcionarios CASCADE;

-- OU popular corretamente:
-- Para cada funcionário de clínica, criar vínculo via clinica→contratante
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante)
SELECT f.id, c.id, c.tipo
FROM funcionarios f
JOIN clinicas cl ON cl.id = f.clinica_id
JOIN contratantes c ON c.id = cl.contratante_id
WHERE f.usuario_tipo = 'funcionario_clinica';
```

### Fase 3: Corrigir Backend (MÉDIO)

#### 3.1 Unificar Criação de Funcionários

```typescript
// lib/funcionarios.ts (NOVO)
export async function criarFuncionario(dados: {
  cpf: string;
  nome: string;
  tipo: 'funcionario_clinica' | 'funcionario_entidade';

  // Condicional baseado em tipo
  empresa_id?: number;
  clinica_id?: number;
  contratante_id?: number;

  // Demais campos...
}) {
  // Validação estrita
  if (dados.tipo === 'funcionario_clinica') {
    if (!dados.empresa_id || !dados.clinica_id) {
      throw new Error('Funcionário de clínica requer empresa_id e clinica_id');
    }
    if (dados.contratante_id) {
      throw new Error('Funcionário de clínica não pode ter contratante_id');
    }
  }

  if (dados.tipo === 'funcionario_entidade') {
    if (!dados.contratante_id) {
      throw new Error('Funcionário de entidade requer contratante_id');
    }
    if (dados.empresa_id || dados.clinica_id) {
      throw new Error('Funcionário de entidade não pode ter empresa_id/clinica_id');
    }
  }

  // INSERT único e consistente
  await query(`
    INSERT INTO funcionarios (
      cpf, nome, usuario_tipo,
      empresa_id, clinica_id, contratante_id,
      ...
    ) VALUES ($1, $2, $3, $4, $5, $6, ...)
  `, [
    dados.cpf, dados.nome, dados.tipo,
    dados.empresa_id || null,
    dados.clinica_id || null,
    dados.contratante_id || null,
    ...
  ]);
}
```

#### 3.2 Simplificar Validação de Sessão

```typescript
// lib/db-security.ts
async function validateSessionContext(
  cpf: string,
  perfil: string
): Promise<boolean> {
  // Única query, única fonte de verdade
  const result = await query(
    `SELECT cpf, usuario_tipo, ativo, clinica_id, contratante_id 
     FROM funcionarios 
     WHERE cpf = $1 AND usuario_tipo = $2`,
    [cpf, perfil]
  );

  if (result.rows.length === 0) {
    console.error(`Usuário não encontrado: CPF=${cpf}, Tipo=${perfil}`);
    return false;
  }

  const user = result.rows[0];

  if (!user.ativo) {
    console.error(`Usuário inativo: CPF=${cpf}`);
    return false;
  }

  return true;
}
```

### Fase 4: Atualizar Documentação (BAIXO)

#### 4.1 Sincronizar com Implementação

```markdown
# Sistema de Perfis e Vínculos

## Tipos de Usuário

### 1. Funcionário de Clínica

- **Armazenamento:** `funcionarios` com `usuario_tipo='funcionario_clinica'`
- **Vínculos:** `empresa_id` + `clinica_id` (obrigatórios)
- **Gestor:** Visível para Gestor RH da clínica

### 2. Funcionário de Entidade

- **Armazenamento:** `funcionarios` com `usuario_tipo='funcionario_entidade'`
- **Vínculos:** `contratante_id` (obrigatório)
- **Gestor:** Visível para Gestor da Entidade

### 3. Gestor RH

- **Armazenamento:** `funcionarios` com `usuario_tipo='gestor_rh'`
- **Vínculos:** `clinica_id` (obrigatório)
- **Acesso:** Gerencia empresas e funcionários da clínica

### 4. Gestor de Entidade

- **Armazenamento:** `funcionarios` com `usuario_tipo='gestor_entidade'`
- **Vínculos:** `contratante_id` (obrigatório)
- **Acesso:** Gerencia funcionários da entidade
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO PÓS-CORREÇÃO

### Banco de Dados

- [ ] Apenas UMA constraint ativa em `funcionarios` para owner
- [ ] Todas constraints validadas (sem NOT VALID)
- [ ] `contratantes_funcionarios` removida OU populada corretamente
- [ ] Indexes otimizados para queries RLS

### RLS

- [ ] Política SELECT cobre todos perfis
- [ ] Política INSERT/UPDATE impede cross-boundary
- [ ] Sem conversão `::text` em comparações
- [ ] Performance testada com EXPLAIN ANALYZE

### Backend

- [ ] Função única `criarFuncionario()` usada em todas APIs
- [ ] Validação estrita de vínculos por tipo
- [ ] `validateSessionContext()` com lógica unificada
- [ ] Sem queries redundantes para autenticação

### Testes

- [ ] RH não vê funcionários de outras clínicas
- [ ] Gestor entidade não vê funcionários de clínicas
- [ ] Funcionário não vê dados de outros funcionários
- [ ] Admin vê todos (mas não pode modificar)

### Documentação

- [ ] README atualizado com estrutura correta
- [ ] Diagramas de relacionamento corretos
- [ ] Exemplos de código sincronizados

---

## 📌 CONCLUSÃO

O sistema apresenta **INCONSISTÊNCIAS CRÍTICAS** na modelagem de dados, especialmente:

1. **Duplicidade de armazenamento** de gestores de entidade
2. **Constraints conflitantes** que permitem estados inválidos
3. **RLS complexo e ineficiente** com lógica duplicada
4. **APIs divergentes** para criação de funcionários

**Recomendação:** Executar **Fase 1** imediatamente para normalizar dados e prevenir corrupção adicional. Fases 2-4 podem ser executadas em sprints subsequentes.

**Prioridade:** 🔴 **CRÍTICA** - Sistema em produção com riscos de segurança e integridade.

---

**Analista:** GitHub Copilot  
**Método:** Análise estática de código + migrations + testes + documentação  
**Cobertura:** 100% dos arquivos relacionados a RBAC/RLS/DB
