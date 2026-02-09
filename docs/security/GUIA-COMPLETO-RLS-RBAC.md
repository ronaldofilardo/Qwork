# Guia Completo - RLS e RBAC no Qwork

**Data de consolidação:** 30 de Janeiro de 2026  
**Status:** ⚠️ DOCUMENTAÇÃO LEGADA - Veja [CORRECOES-CRITICAS-SEGURANCA.md](../CORRECOES-CRITICAS-SEGURANCA.md) para implementação atual

---

## ⚠️ AVISO IMPORTANTE

Esta documentação contém **exemplos conceituais** que não refletem a implementação real do QWork.

**Diferenças principais:**

- ❌ QWork **NÃO usa tabela `profiles`** → Usa `funcionarios` com campo `usuario_tipo`
- ❌ Exemplos SQL usam `auth.uid()` (estilo Supabase) → QWork usa `current_setting('app.current_user_cpf')`
- ❌ Referências a UUID → QWork usa IDs inteiros

**Consulte a documentação atualizada:**

- [CORRECOES-CRITICAS-SEGURANCA.md](../CORRECOES-CRITICAS-SEGURANCA.md) - Implementação real de RLS
- [SECURITY-CHECKLIST.md](../SECURITY-CHECKLIST.md) - Checklist de segurança
- [AUDITORIA-RLS-RBAC-COMPLETA.md](../AUDITORIA-RLS-RBAC-COMPLETA.md) - Auditoria completa

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Sistema de Roles (RBAC)](#sistema-de-roles-rbac)
3. [Row-Level Security (RLS)](#row-level-security-rls)
4. [Matriz de Permissões](#matriz-de-permissões)
5. [Implementação Técnica](#implementação-técnica)
6. [Guia Rápido de Migração](#guia-rápido-de-migração)

---

## Visão Geral

O sistema Qwork implementa **segurança em duas camadas**:

1. **RBAC (Role-Based Access Control)**: Controle de acesso baseado em papéis/perfis
2. **RLS (Row-Level Security)**: Restrições ao nível de linha no PostgreSQL

Esta combinação garante:

- ✅ Isolamento completo entre clínicas/entidades
- ✅ Separação clara entre gestores e funcionários
- ✅ Proteção de dados sensíveis (avaliações, resultados)
- ✅ Imutabilidade de registros críticos

---

## Sistema de Roles (RBAC)

### Definições de Perfis

#### 1. Gestores (NÃO são funcionários)

##### Gestor RH (`perfil='rh'`)

- **Criação:** Via `criarContaResponsavel()` para tomadores tipo ≠ 'entidade'
- **Tabelas:** `funcionarios` (com perfil='rh') + `tomadores_funcionarios` (vínculo)
- **Autenticação:** `entidades_senhas` com bcrypt
- **Permissões:**
  - ✅ Cadastrar empresas clientes
  - ✅ Cadastrar funcionários nas empresas
  - ✅ Criar e liberar lotes de avaliação
  - ✅ Baixar laudos, listagens, recibos
  - ✅ Gerenciar funcionários vinculados
  - ❌ Responder avaliações (não é avaliado)

##### Gestor Entidade (`perfil='gestor'`)

- **Criação:** Via `criarContaResponsavel()` para tomadores tipo = 'entidade'
- **Tabelas:** Apenas `entidades_senhas` (SEM entrada em `funcionarios`)
- **Autenticação:** `entidades_senhas` com bcrypt
- **Permissões:**
  - ✅ Cadastrar empresas clientes
  - ✅ Cadastrar funcionários nas empresas
  - ✅ Criar e liberar lotes de avaliação
  - ✅ Baixar laudos, listagens, recibos
  - ⚠️ Emitir laudos apenas se tiver perfil `emissor`
  - ❌ Responder avaliações (não é avaliado)

#### 2. Funcionário Regular (`perfil='funcionario'`)

- **Criação:** Via cadastro RH/Entidade ou importação CSV
- **Tabelas:** `funcionarios` + vínculo em `tomadores_funcionarios`
- **Autenticação:** CPF + senha (se habilitado)
- **Permissões:**
  - ✅ Responder avaliações atribuídas
  - ✅ Visualizar próprios resultados (se permitido)
  - ❌ Cadastrar outros funcionários
  - ❌ Criar lotes
  - ❌ Baixar laudos

#### 3. Roles Especiais

##### Emissor (`perfil='emissor'`)

- Usuário independente para emissão de laudos
- **NÃO** deve ser combinado com `gestor` ou `rh`
- Sistema impede programaticamente que CPF vinculado a Gestor seja cadastrado como emissor

##### Admin (`perfil='admin'`)

- Acesso total ao sistema (com restrições RLS específicas)
- Gerenciamento de clínicas e entidades
- ❌ **Bloqueado** de acessar avaliações, respostas e resultados

---

## Row-Level Security (RLS)

### Princípios das Políticas RLS

1. **Isolamento por clínica:** Cada clínica/entidade só vê seus próprios dados
2. **Imutabilidade:** Avaliações concluídas não podem ser modificadas
3. **Restrições Admin:** Admin não acessa dados de avaliações/resultados
4. **Acesso limitado a funcionários:** Apenas RH e Emissor veem lista completa

### Políticas por Tabela

#### `empresas_clientes`

```sql
-- Admin: NÃO tem acesso direto (acesso administrativo apenas - tomadores, planos, emissores)
-- RH deve usar endpoint /api/rh/empresas para gerenciar empresas com RLS
CREATE POLICY admin_no_operational_access ON empresas_clientes
  FOR ALL USING (current_user_perfil() != 'admin');

-- RH/Entidade: Apenas da própria clínica
CREATE POLICY rh_own_clinic ON empresas_clientes
  FOR ALL USING (tomador_id = auth.uid());
```

#### `funcionarios`

```sql
-- Admin: NÃO tem acesso a funcionários operacionais (apenas RH pode gerenciar)
CREATE POLICY admin_no_access ON funcionarios
  FOR ALL USING (current_user_perfil() != 'admin');

-- RH: Vê funcionários de sua clínica
CREATE POLICY rh_own_clinic ON funcionarios
  FOR ALL USING (clinic_id = auth.uid());
```

FOR SELECT USING (
auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
AND perfil IN ('rh', 'emissor')
);

-- RH: Apenas da própria clínica
CREATE POLICY rh_own_employees ON funcionarios
FOR ALL USING (
EXISTS (
SELECT 1 FROM tomadores_funcionarios cf
WHERE cf.funcionario_id = funcionarios.id
AND cf.tomador_id = auth.uid()
)
);

-- Funcionário: Apenas próprios dados
CREATE POLICY employee_own_data ON funcionarios
FOR SELECT USING (cpf = auth.cpf());

````

#### `avaliacoes`, `respostas_avaliacao`, `resultados`

```sql
-- Admin: SEM ACESSO
CREATE POLICY admin_no_access ON avaliacoes
  FOR ALL USING (
    auth.uid() NOT IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RH: Apenas da própria clínica
CREATE POLICY rh_own_clinic ON avaliacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lotes_avaliacao l
      WHERE l.id = avaliacoes.lote_id
      AND l.tomador_id = auth.uid()
    )
  );

-- Funcionário: Apenas próprias avaliações
CREATE POLICY employee_own_evaluations ON avaliacoes
  FOR SELECT USING (funcionario_cpf = auth.cpf());

-- Imutabilidade: Não pode alterar avaliações concluídas
CREATE POLICY immutable_completed ON avaliacoes
  FOR UPDATE USING (status != 'concluido');
````

---

## Matriz de Permissões

| Ação                   | Funcionário | Gestor RH  | Gestor Entidade | Emissor | Admin |
| ---------------------- | ----------- | ---------- | --------------- | ------- | ----- |
| Responder avaliações   | ✅          | ❌         | ❌              | ❌      | ❌    |
| Ver resultados         | ✅ Próprios | ✅ Clínica | ✅ Clínica      | ❌      | ❌    |
| Cadastrar empresas     | ❌          | ✅         | ✅              | ❌      | ✅    |
| Cadastrar funcionários | ❌          | ✅         | ✅              | ❌      | ✅\*  |
| Criar lotes            | ❌          | ✅         | ✅              | ❌      | ✅    |
| Liberar lotes          | ❌          | ✅         | ✅              | ❌      | ✅    |
| Baixar laudos          | ❌          | ✅         | ✅              | ✅      | ✅    |
| Emitir laudos          | ❌          | ❌         | ⚠️              | ✅      | ✅    |
| Gerenciar clínicas     | ❌          | ❌         | ❌              | ❌      | ✅    |

**Legenda:**

- ✅ Permitido
- ❌ Bloqueado
- ⚠️ Condicional (requer perfil adicional)
- - Admin só vê funcionários com perfil RH/Emissor

---

## Implementação Técnica

### Estrutura de Tabelas

```sql
-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'rh', 'gestor', 'emissor', 'funcionario')),
  tomador_id UUID REFERENCES tomadores(id),
  cpf VARCHAR(11)
);

-- Tabela de funcionários
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) DEFAULT 'funcionario'
);

-- Tabela de senhas de gestores
CREATE TABLE entidades_senhas (
  tomador_id UUID PRIMARY KEY REFERENCES tomadores(id),
  senha_hash VARCHAR(255) NOT NULL
);
```

### Função de Criação de Conta Responsável

```typescript
// lib/db.ts - criarContaResponsavel()

async function criarContaResponsavel(tomadorData, responsavel) {
  // Para tipo !== 'entidade' (Gestores RH):
  if (tomadorData.tipo !== 'entidade') {
    // 1. Cria/atualiza registro em `funcionarios` com perfil='rh'
    await db('funcionarios')
      .insert({
        cpf: responsavel.cpf,
        nome: responsavel.nome,
        perfil: 'rh',
      })
      .onConflict('cpf')
      .merge();

    // 2. Insere vínculo em `tomadores_funcionarios`
    await db('tomadores_funcionarios').insert({
      tomador_id: tomadorId,
      funcionario_id: funcionarioId,
    });
  }

  // 3. Cria entrada em `entidades_senhas` com bcrypt (para todos)
  await db('entidades_senhas').insert({
    tomador_id: tomadorId,
    senha_hash: await bcrypt.hash(responsavel.senha, 10),
  });
}
```

### Verificação de Permissões no Código

```typescript
// Middleware de autenticação
export async function verificarPermissao(userId: string, action: string) {
  const profile = await db('profiles').where({ id: userId }).first();

  // Bloqueios específicos para Admin
  if (profile.role === 'admin') {
    const blockedActions = [
      'read:avaliacoes',
      'read:respostas',
      'read:resultados',
    ];
    if (blockedActions.includes(action)) {
      throw new Error('Acesso negado');
    }
  }

  // Verificar permissões do role
  const hasPermission = await db('role_permissions')
    .join('permissions', 'permissions.id', 'role_permissions.permission_id')
    .where({
      'role_permissions.role': profile.role,
      'permissions.name': action,
    })
    .first();

  return !!hasPermission;
}
```

---

## Guia Rápido de Migração

### 1. Backup do Banco de Dados

```powershell
# Windows PowerShell
pg_dump -U postgres -d qwork_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### 2. Aplicar Políticas RLS

```sql
-- Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE empresas_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

-- Aplicar políticas (ver arquivo database/rls-policies-revised.sql)
```

### 3. Testar Políticas

```sql
-- Executar suite de testes
\i database/test-rls-policies.sql
```

### 4. Ajustar API Routes

```typescript
// Exemplo: API que lista funcionários
// Antes (retornava todos):
const funcionarios = await db('funcionarios').select('*');

// Depois (RLS automático com set_config):
await db.raw(`SET LOCAL app.user_id = ?`, [userId]);
await db.raw(`SET LOCAL app.user_role = ?`, [userRole]);
const funcionarios = await db('funcionarios').select('*');
// RLS filtra automaticamente baseado nas políticas
```

---

## Referências

- **Script SQL completo:** `database/rls-policies-revised.sql`
- **Script de migração:** `database/migrate-rls-policies.sql`
- **Testes automatizados:** `database/test-rls-policies.sql`
- **Exemplos de código:** `docs/EXAMPLE-API-ROUTES-RLS.ts`

---

## Histórico de Mudanças

| Data       | Descrição                                             |
| ---------- | ----------------------------------------------------- |
| 11/12/2025 | Revisão completa das políticas RLS (V3)               |
| 22/01/2026 | Documentação de roles e auditoria RBAC                |
| 29/01/2026 | Consolidação de toda documentação RLS/RBAC neste guia |

---

## Suporte

Para dúvidas ou problemas:

1. Consultar testes automatizados (`database/test-rls-policies.sql`)
2. Verificar logs de auditoria (`app.user_id`, `app.user_role`)
3. Revisar matriz de permissões acima
