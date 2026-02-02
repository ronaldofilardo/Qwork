# FASE 4: Atualização de Documentação

**Data:** 29 de janeiro de 2026  
**Status:** Implementado

---

## 📚 Sistema de Perfis e Vínculos - Documentação Atualizada

### Visão Geral

O sistema foi refatorado para usar `usuario_tipo` unificado, eliminando ambiguidades e duplicação de armazenamento.

---

## 🎭 Tipos de Usuário

### 1. Funcionário de Clínica (`funcionario_clinica`)

**Descrição:** Funcionário vinculado a empresa intermediária gerenciada por clínica

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, empresa_id, clinica_id, ...
) VALUES (
  '12345678901', 'João Silva', 'funcionario_clinica', 5, 2, ...
);
```

**Vínculos Obrigatórios:**

- ✅ `empresa_id` (NOT NULL)
- ✅ `clinica_id` (NOT NULL)
- ❌ `contratante_id` (MUST BE NULL)

**Visibilidade:**

- Gestor RH da clínica pode visualizar/gerenciar
- Próprio funcionário pode visualizar seus dados

**Uso no Sistema:**

```typescript
import { criarFuncionario } from '@/lib/funcionarios';

const funcionario = await criarFuncionario({
  tipo: 'funcionario_clinica',
  cpf: '12345678901',
  nome: 'João Silva',
  email: 'joao@empresa.com',
  empresa_id: 5,
  clinica_id: 2,
  setor: 'Produção',
  funcao: 'Operador',
});
```

---

### 2. Funcionário de Entidade (`funcionario_entidade`)

**Descrição:** Funcionário vinculado diretamente à entidade privada

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, contratante_id, ...
) VALUES (
  '98765432100', 'Maria Santos', 'funcionario_entidade', 10, ...
);
```

**Vínculos Obrigatórios:**

- ✅ `contratante_id` (NOT NULL)
- ❌ `empresa_id` (MUST BE NULL)
- ❌ `clinica_id` (MUST BE NULL)

**Visibilidade:**

- Gestor de Entidade pode visualizar/gerenciar
- Próprio funcionário pode visualizar seus dados

**Uso no Sistema:**

```typescript
import { criarFuncionario } from '@/lib/funcionarios';

const funcionario = await criarFuncionario({
  tipo: 'funcionario_entidade',
  cpf: '98765432100',
  nome: 'Maria Santos',
  email: 'maria@entidade.com',
  contratante_id: 10,
  setor: 'Administrativo',
  funcao: 'Analista',
});
```

---

### 3. Gestor RH (`gestor_rh`)

**Descrição:** Gestor de clínica (medicina ocupacional)

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, clinica_id, ...
) VALUES (
  '11122233344', 'Carlos Oliveira', 'gestor_rh', 2, ...
);
```

**Vínculos Obrigatórios:**

- ✅ `clinica_id` (NOT NULL)
- ❌ `contratante_id` (MUST BE NULL)
- ❌ `empresa_id` (MUST BE NULL)

**Permissões:**

- ✅ Criar/editar empresas clientes na sua clínica
- ✅ Criar/editar funcionários de clínica
- ✅ Gerenciar lotes de avaliação
- ❌ Não pode acessar dados de outras clínicas

**Uso no Sistema:**

```typescript
import { criarFuncionario } from '@/lib/funcionarios';

const gestor = await criarFuncionario({
  tipo: 'gestor_rh',
  cpf: '11122233344',
  nome: 'Carlos Oliveira',
  email: 'carlos@clinica.com',
  clinica_id: 2,
  senha: 'senha_segura',
});
```

---

### 4. Gestor de Entidade (`gestor_entidade`)

**Descrição:** Gestor de entidade privada

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, contratante_id, ...
) VALUES (
  '55566677788', 'Ana Costa', 'gestor_entidade', 10, ...
);
```

**Vínculos Obrigatórios:**

- ✅ `contratante_id` (NOT NULL)
- ❌ `clinica_id` (MUST BE NULL)
- ❌ `empresa_id` (MUST BE NULL)

**Permissões:**

- ✅ Criar/editar funcionários de entidade
- ✅ Gerenciar lotes de avaliação
- ❌ Não pode acessar funcionários de clínicas
- ❌ Não pode acessar dados de outras entidades

**Uso no Sistema:**

```typescript
import { criarFuncionario } from '@/lib/funcionarios';

const gestor = await criarFuncionario({
  tipo: 'gestor_entidade',
  cpf: '55566677788',
  nome: 'Ana Costa',
  email: 'ana@entidade.com',
  contratante_id: 10,
  senha: 'senha_segura',
});
```

---

### 5. Administrador (`admin`)

**Descrição:** Administrador global da plataforma

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, ...
) VALUES (
  '99988877766', 'Admin Sistema', 'admin', ...
);
```

**Vínculos:**

- ❌ `clinica_id` (MUST BE NULL)
- ❌ `contratante_id` (MUST BE NULL)
- ❌ `empresa_id` (MUST BE NULL)

**Permissões:**

- ✅ Visualizar todos os dados (auditoria)
- ✅ Criar clínicas e entidades
- ✅ Criar gestores RH e gestores de entidade
- ❌ Não gerencia operações do dia a dia

---

### 6. Emissor (`emissor`)

**Descrição:** Emissor de laudos (independente)

**Armazenamento:**

```sql
INSERT INTO funcionarios (
  cpf, nome, usuario_tipo, ...
) VALUES (
  '88877766655', 'Dr. Paulo Emissor', 'emissor', ...
);
```

**Vínculos:**

- ❌ `clinica_id` (MUST BE NULL)
- ❌ `contratante_id` (MUST BE NULL)
- ❌ `empresa_id` (MUST BE NULL)

**Permissões:**

- ✅ Visualizar lotes finalizados (qualquer clínica/entidade)
- ✅ Emitir laudos
- ❌ Não gerencia funcionários ou empresas

---

## 🔐 Row Level Security (RLS)

### Políticas Simplificadas

As políticas RLS foram unificadas usando `usuario_tipo`:

```sql
-- SELECT: Quem pode ver quais dados
CREATE POLICY funcionarios_unified_select ON funcionarios FOR SELECT USING (
  (current_user_tipo() = 'admin')  -- Admin vê tudo
  OR
  (current_user_tipo() = 'gestor_rh'
   AND clinica_id = current_user_clinica_id())  -- RH vê sua clínica
  OR
  (current_user_tipo() = 'gestor_entidade'
   AND contratante_id = current_user_contratante_id())  -- Gestor vê sua entidade
  OR
  (cpf = current_user_cpf())  -- Funcionário vê próprios dados
);

-- INSERT: Quem pode criar funcionários
CREATE POLICY funcionarios_unified_insert ON funcionarios FOR INSERT WITH CHECK (
  (current_user_tipo() = 'admin' AND usuario_tipo != 'admin')
  OR
  (current_user_tipo() = 'gestor_rh'
   AND usuario_tipo = 'funcionario_clinica'
   AND clinica_id = current_user_clinica_id())
  OR
  (current_user_tipo() = 'gestor_entidade'
   AND usuario_tipo = 'funcionario_entidade'
   AND contratante_id = current_user_contratante_id())
);
```

---

## 🔄 Migração de Dados Legados

### Mapeamento de `perfil` para `usuario_tipo`

```sql
UPDATE funcionarios SET usuario_tipo =
  CASE perfil
    WHEN 'funcionario' THEN
      CASE
        WHEN contratante_id IS NOT NULL AND empresa_id IS NULL
          THEN 'funcionario_entidade'
        ELSE 'funcionario_clinica'
      END
    WHEN 'rh' THEN 'gestor_rh'
    WHEN 'gestor_entidade' THEN 'gestor_entidade'
    WHEN 'admin' THEN 'admin'
    WHEN 'emissor' THEN 'emissor'
  END;
```

---

## 📊 Diagramas

### Relacionamento por Tipo

```
┌─────────────────────────────────────────────────────────────┐
│                      CONTRATANTES                            │
│  (Clínicas OU Entidades)                                    │
└────────┬────────────────────────────┬───────────────────────┘
         │                            │
         │ tipo='clinica'             │ tipo='entidade'
         │                            │
         ▼                            ▼
    ┌────────┐                   ┌─────────────────┐
    │CLINICAS│                   │ (entidade direta)│
    └────┬───┘                   └────────┬─────────┘
         │                                │
         │ clinica_id                     │ contratante_id
         │                                │
         ▼                                ▼
    ┌──────────────┐              ┌───────────────────┐
    │EMPRESAS      │              │FUNCIONARIOS       │
    │CLIENTES      │              │usuario_tipo=      │
    └─────┬────────┘              │funcionario_entid  │
          │                       └───────────────────┘
          │ empresa_id
          │
          ▼
    ┌──────────────┐
    │FUNCIONARIOS  │
    │usuario_tipo= │
    │funcionario_  │
    │clinica       │
    └──────────────┘
```

---

## ✅ Checklist de Implementação

### Banco de Dados

- [x] Migration 200: Criar enum e coluna usuario_tipo
- [x] Migration 200: Migrar dados existentes
- [x] Migration 200: Criar constraint unificada
- [x] Migration 201: Refatorar políticas RLS
- [x] Migration 201: Popular contratantes_funcionarios

### Backend

- [x] Criar `lib/funcionarios.ts` com função unificada
- [x] Atualizar `lib/db-security.ts` para usar usuario_tipo
- [ ] Refatorar `/api/rh/funcionarios` para usar `criarFuncionario()`
- [ ] Refatorar `/api/entidade/funcionarios` para usar `criarFuncionario()`
- [ ] Atualizar middleware de autenticação

### Frontend

- [ ] Atualizar formulários para usar usuario_tipo
- [ ] Adicionar validação de vínculos no cliente
- [ ] Atualizar mensagens de erro

### Testes

- [ ] Testes unitários para `criarFuncionario()`
- [ ] Testes de integração RLS
- [ ] Testes E2E de criação de funcionários
- [ ] Testes de isolamento de dados

### Documentação

- [x] Atualizar README.md
- [x] Documentar tipos e vínculos
- [x] Criar guia de migração
- [ ] Atualizar diagramas de arquitetura

---

## 🚀 Como Aplicar

### 1. Aplicar Migrations

```bash
# Conectar ao banco
psql -U postgres -d seu_banco

# Aplicar migration 200 (Normalização)
\i database/migrations/200_fase1_normalizacao_usuario_tipo.sql

# Aplicar migration 201 (RLS)
\i database/migrations/201_fase2_refatorar_rls.sql
```

### 2. Atualizar APIs

**Antes:**

```typescript
// app/api/rh/funcionarios/route.ts
await query(
  `INSERT INTO funcionarios (cpf, nome, ..., clinica_id, empresa_id)
   VALUES ($1, $2, ..., $9, $10)`,
  [cpf, nome, ..., session.clinica_id, empresa_id]
);
```

**Depois:**

```typescript
// app/api/rh/funcionarios/route.ts
import { criarFuncionario } from '@/lib/funcionarios';

const funcionario = await criarFuncionario({
  tipo: 'funcionario_clinica',
  cpf,
  nome,
  email,
  empresa_id: empresa_id,
  clinica_id: session.clinica_id,
  setor,
  funcao,
  // ... demais campos
});
```

### 3. Executar Testes

```bash
# Testes unitários
npm test lib/funcionarios.test.ts

# Testes de integração RLS
npm test __tests__/integration/rls-isolamento-rh-gestor.test.ts

# Testes E2E
npm run test:e2e
```

---

## 📞 Suporte

Para dúvidas ou problemas na migração:

1. Consultar [RELATORIO-ANALISE-PROFUNDA-INCONSISTENCIAS.md](./RELATORIO-ANALISE-PROFUNDA-INCONSISTENCIAS.md)
2. Verificar logs de migration em `/logs/migration-200-201.log`
3. Contatar equipe de desenvolvimento

---

**Última atualização:** 29 de janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Implementado
