# Guia de Arquitetura: Separação de Papéis no QWork

## 📋 Visão Geral

O sistema QWork usa a tabela `funcionarios` para armazenar **todos os tipos de usuários**, mas com **separação lógica** através do campo `usuario_tipo`. Esta abordagem evita duplicação de código mantendo clareza semântica.

## 🎯 Por que `funcionarios` contém gestores?

### Contexto Histórico

Inicialmente, o sistema armazenava apenas funcionários operacionais. Com a evolução, gestores de RH e entidade foram adicionados à mesma tabela para:

- ✅ Manter CPF único global
- ✅ Centralizar autenticação
- ✅ Simplificar auditoria
- ✅ Reduzir duplicação de código

### Solução Implementada: `usuario_tipo_enum`

```sql
CREATE TYPE usuario_tipo_enum AS ENUM (
  'funcionario_clinica',   -- Funcionário operacional (empresa)
  'funcionario_entidade',  -- Funcionário operacional (entidade)
  'gestor_rh',             -- Gestor administrativo (clínica)
  'gestor_entidade',       -- Gestor administrativo (entidade)
  'admin',                 -- Administrador da plataforma
  'emissor'                -- Emissor de laudos
);
```

## 📊 Tipos de Usuário

### 1. FUNCIONÁRIO OPERACIONAL (`funcionario_clinica` / `funcionario_entidade`)

**Papel:** Colaborador que realiza avaliações  
**Tabela:** `funcionarios`  
**Campos obrigatórios:**

- `funcionario_clinica`: `empresa_id` + `clinica_id`
- `funcionario_entidade`: `contratante_id`

**Criado por:** RH ou gestor_entidade via `/api/rh/funcionarios/import`

**Características:**

- Realiza avaliações
- Tem `nivel_cargo` (operacional/gestao)
- Vinculado a empresa ou entidade
- Perfil: `'funcionario'`

---

### 2. GESTOR RH (`gestor_rh`)

**Papel:** Administrador de clínica (empresa intermediária)  
**Tabela:** `funcionarios`  
**Campos obrigatórios:** `clinica_id`  
**Campos proibidos:** `contratante_id`, `empresa_id`

**Criado por:** Admin via `/api/admin/cadastro/rh`

**Características:**

- Gerencia empresas da clínica
- Gerencia funcionários das empresas
- Cria e gerencia lotes de avaliação
- Solicita emissão de laudos
- Perfil: `'rh'`

**Login:** Via tabela `funcionarios` (campo `senha_hash`)

---

### 3. GESTOR ENTIDADE (`gestor_entidade`)

**Papel:** Administrador de entidade contratante  
**Tabelas:** `contratantes` (dados) + `contratantes_senhas` (autenticação)  
**Campos obrigatórios em funcionarios:** `contratante_id`  
**Campos proibidos:** `clinica_id`, `empresa_id`

**Criado por:** Auto-cadastro via `/api/cadastro/contratante` + aprovação admin

**Características:**

- Gerencia seus próprios funcionários
- Cria lotes de avaliação diretos
- Solicita emissão de laudos
- Perfil dinâmico: `'gestor_entidade'` (no login)

**Login:** Via tabela `contratantes_senhas` → mapeado para perfil `gestor_entidade`

---

### 4. ADMINISTRADOR (`admin`)

**Papel:** Administrador global da plataforma  
**Tabela:** `funcionarios`  
**Campos obrigatórios:** Nenhum  
**Campos proibidos:** `clinica_id`, `contratante_id`, `empresa_id`

**Criado por:** Outro admin via `/api/admin/cadastro/admin`

**Características:**

- Acesso total ao sistema
- Cria RH, emissores, outros admins
- Aprova cadastros de entidades
- Gerencia planos e pagamentos
- Perfil: `'admin'`

---

### 5. EMISSOR (`emissor`)

**Papel:** Profissional que emite laudos  
**Tabela:** `funcionarios`  
**Campos opcionais:** `clinica_id` (pode ser independente)  
**Campos proibidos:** `contratante_id`, `empresa_id`

**Criado por:** Admin via `/api/admin/emissores/create`

**Características:**

- Gera laudos de lotes concluídos
- Pode ser vinculado a clínica ou independente
- Perfil: `'emissor'`

---

## 🗂️ Views Semânticas (Migration 132)

Para facilitar queries e deixar clara a separação, foram criadas views:

### `gestores`

```sql
SELECT * FROM gestores WHERE clinica_id = 123;
```

Retorna apenas gestores de RH e entidade (administrativos).

### `funcionarios_operacionais`

```sql
SELECT * FROM funcionarios_operacionais WHERE empresa_id = 456;
```

Retorna apenas funcionários que realizam avaliações (operacionais).

### `equipe_administrativa`

```sql
SELECT * FROM equipe_administrativa WHERE ativo = true;
```

Retorna admins e emissores da plataforma.

### `usuarios_resumo`

```sql
SELECT * FROM usuarios_resumo;
```

Estatísticas por tipo de usuário (dashboard).

---

## 🔐 Fluxo de Autenticação

### Login de Gestores (`/api/auth/login`)

```
1. Verificar contratantes_senhas
   ├─ Se encontrado E tipo='entidade' → perfil='gestor_entidade'
   ├─ Se encontrado E tipo='clinica' → perfil='rh'
   └─ Verificar pagamento_confirmado

2. Se não encontrado → Verificar funcionarios
   ├─ usuario_tipo='gestor_rh' → perfil='rh'
   ├─ usuario_tipo='funcionario_*' → perfil='funcionario'
   ├─ usuario_tipo='admin' → perfil='admin'
   └─ usuario_tipo='emissor' → perfil='emissor'
```

---

## 📝 Boas Práticas no Código

### ✅ SEMPRE usar `usuario_tipo` em queries

**Correto:**

```typescript
const gestores = await query(
  `SELECT * FROM funcionarios 
   WHERE usuario_tipo IN ('gestor_rh', 'gestor_entidade') 
   AND ativo = true`
);
```

**Incorreto:**

```typescript
const gestores = await query(
  `SELECT * FROM funcionarios 
   WHERE perfil IN ('rh', 'gestor_entidade')` // ❌ perfil é legado
);
```

### ✅ Usar views quando apropriado

**Correto:**

```typescript
const gestores = await query(`SELECT * FROM gestores WHERE clinica_id = $1`, [
  clinicaId,
]);
```

**Também correto (quando precisa de campos específicos):**

```typescript
const gestores = await query(
  `SELECT cpf, nome, email FROM funcionarios 
   WHERE usuario_tipo = 'gestor_rh' AND clinica_id = $1`,
  [clinicaId]
);
```

### ✅ Documentar quando gestores são retornados

```typescript
/**
 * GET /api/admin/gestores
 *
 * Retorna gestores de RH e entidade.
 * NOTA: Gestores são armazenados em `funcionarios` com
 * `usuario_tipo` = 'gestor_rh' ou 'gestor_entidade'
 */
export async function GET(request: NextRequest) {
  const gestores = await query(`SELECT * FROM gestores WHERE ativo = true`);
  // ...
}
```

---

## 🚨 Constraint de Segregação

A Migration 200 impõe constraint para garantir vínculos corretos:

```sql
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_usuario_tipo_exclusivo CHECK (
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
   AND clinica_id IS NULL
   AND empresa_id IS NULL)
  OR
  -- Admin/Emissor: sem vínculos
  (usuario_tipo IN ('admin', 'emissor')
   AND clinica_id IS NULL
   AND contratante_id IS NULL
   AND empresa_id IS NULL)
);
```

---

## 🎓 Por que não separar em tabelas diferentes?

### Abordagem Rejeitada: `gestores` + `funcionarios` (tabelas separadas)

**Problemas:**

- ❌ CPF pode existir em 2 lugares (violação de unicidade global)
- ❌ Autenticação duplicada (2 lógicas diferentes)
- ❌ Auditoria fragmentada
- ❌ RLS policies duplicadas
- ❌ Migração massiva complexa
- ❌ JOIN pesado para "todos os usuários"

### Abordagem Escolhida: Single Table + `usuario_tipo`

**Vantagens:**

- ✅ CPF único global
- ✅ Autenticação unificada
- ✅ Auditoria consistente
- ✅ RLS centralizado
- ✅ Separação lógica sem duplicação física
- ✅ Pattern consolidado (Rails, Django, Laravel)

---

## 📚 Referências

- Migration 200: `database/migrations/200_fase1_normalizacao_usuario_tipo.sql`
- Migration 132: `database/migrations/132_create_semantic_views.sql`
- Views: `gestores`, `funcionarios_operacionais`, `equipe_administrativa`
- Constraint: `funcionarios_usuario_tipo_exclusivo`

---

## 🔄 Checklist de Desenvolvimento

Ao criar endpoints que lidam com usuários:

- [ ] Usar `usuario_tipo` para filtrar (não apenas `perfil`)
- [ ] Verificar constraint de vínculos (clinica_id, contratante_id, empresa_id)
- [ ] Considerar usar views semânticas quando apropriado
- [ ] Documentar claramente quando gestores são incluídos
- [ ] Testar com diferentes tipos de usuário
- [ ] Validar RLS policies para cada `usuario_tipo`

---

**Data:** 31/01/2026  
**Versão:** 1.0  
**Autor:** Sistema QWork
