# 🎯 Guia de Implementação - Reestruturação Usuários e Funcionários

## 📋 Sumário Executivo

Esta documentação técnica detalha o processo de separação das tabelas `usuarios` e `funcionarios` no sistema QWork, estabelecendo uma clara distinção entre:

- **Usuários:** Pessoas com acesso ao sistema (admin, emissor, gestor, rh)
- **Funcionários:** Pessoas avaliadas pelo sistema (sem acesso de login)

---

## 🗂️ Estrutura de Dados

### 1. Tabela `usuarios` (Nova)

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario usuario_tipo_enum NOT NULL, -- 'admin', 'emissor', 'gestor', 'rh'
    clinica_id INTEGER,
    tomador_id INTEGER,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Regras de Negócio:

| tipo_usuario | clinica_id  | tomador_id  | Descrição                  |
| ------------ | ----------- | ----------- | -------------------------- |
| `admin`      | NULL        | NULL        | Administrador do sistema   |
| `emissor`    | NULL        | NULL        | Emissor de laudos          |
| `rh`         | OBRIGATÓRIO | NULL        | Gestor de clínica          |
| `gestor`     | NULL        | OBRIGATÓRIO | Gestor de empresa/entidade |

### 2. Tabela `funcionarios` (Modificada)

```sql
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    usuario_tipo usuario_tipo_enum NOT NULL, -- 'funcionario_clinica' ou 'funcionario_entidade'
    empresa_id INTEGER, -- Para funcionários de empresas clientes
    tomador_id INTEGER, -- Para funcionários de entidades
    clinica_id INTEGER,
    setor VARCHAR(50),
    funcao VARCHAR(50),
    matricula VARCHAR(20),
    nivel_cargo nivel_cargo_enum, -- 'operacional' ou 'gestao'
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: deve ter OU empresa_id OU tomador_id (nunca ambos)
    CONSTRAINT funcionarios_vinculo_check CHECK (
        (empresa_id IS NOT NULL AND tomador_id IS NULL) OR
        (empresa_id IS NULL AND tomador_id IS NOT NULL)
    )
);
```

**Mudanças principais:**

- ❌ Removido: `senha_hash` (funcionários não fazem login)
- ❌ Removido: `perfil` (substituído por usuario_tipo)
- ✅ Mantido: Apenas `usuario_tipo` = 'funcionario_clinica' ou 'funcionario_entidade'

---

## 🔄 Processo de Migração

### Passo 1: Backup

```bash
# Backup completo do banco
pg_dump -h HOST -U USER -d DATABASE > backup_pre_migration_300.sql

# Verificar backup
ls -lh backup_pre_migration_300.sql
```

### Passo 2: Executar Migration

```bash
# Conectar ao banco
psql -h HOST -U USER -d DATABASE

# Executar migration
\i database/migrations/300_reestruturacao_usuarios_funcionarios.sql

# Verificar logs
\echo 'Migração concluída'
```

### Passo 3: Validação Pós-Migração

```sql
-- Verificar contagens
SELECT 'usuarios' as tabela, COUNT(*) FROM usuarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios;

-- Verificar tipos de usuário
SELECT tipo_usuario, COUNT(*) FROM usuarios GROUP BY tipo_usuario;

-- Verificar tipos de funcionário
SELECT usuario_tipo, COUNT(*) FROM funcionarios GROUP BY usuario_tipo;

-- Verificar integridade
SELECT COUNT(*) FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');
-- Deve retornar 0
```

---

## 💻 Atualizações de Código

### 1. Types/Interfaces (TypeScript)

**Antes:**

```typescript
interface Funcionario {
  id: number;
  cpf: string;
  nome: string;
  email?: string;
  senha_hash: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'emissor';
  usuario_tipo: UsuarioTipo;
  clinica_id?: number;
  empresa_id?: number;
  // ...
}
```

**Depois:**

```typescript
// types/usuario.ts
interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  senha_hash: string;
  tipo_usuario: 'admin' | 'emissor' | 'gestor' | 'rh';
  clinica_id?: number;
  tomador_id?: number;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

// types/funcionario.ts
interface Funcionario {
  id: number;
  cpf: string;
  nome: string;
  email?: string;
  // senha_hash removido
  usuario_tipo: 'funcionario_clinica' | 'funcionario_entidade';
  empresa_id?: number;
  tomador_id?: number;
  clinica_id?: number;
  setor?: string;
  funcao?: string;
  matricula?: string;
  nivel_cargo?: 'operacional' | 'gestao';
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}
```

### 2. Autenticação (lib/auth.ts)

**Antes:**

```typescript
async function login(cpf: string, senha: string) {
  const user = await db.query('SELECT * FROM funcionarios WHERE cpf = $1', [
    cpf,
  ]);
  // ...
}
```

**Depois:**

```typescript
async function login(cpf: string, senha: string) {
  const user = await db.query(
    'SELECT * FROM usuarios WHERE cpf = $1 AND ativo = true',
    [cpf]
  );

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const senhaValida = await bcrypt.compare(senha, user.senha_hash);

  if (!senhaValida) {
    throw new Error('Senha inválida');
  }

  return {
    id: user.id,
    cpf: user.cpf,
    nome: user.nome,
    email: user.email,
    tipo_usuario: user.tipo_usuario,
    clinica_id: user.clinica_id,
    tomador_id: user.tomador_id,
  };
}
```

### 3. Queries da API

**Endpoint: GET /api/usuarios (novo)**

```typescript
// app/api/usuarios/route.ts
export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let query =
    'SELECT id, cpf, nome, email, tipo_usuario, clinica_id, tomador_id, ativo FROM usuarios';
  let params: any[] = [];

  // RH vê apenas usuários da sua clínica
  if (session.tipo_usuario === 'rh') {
    query += ' WHERE clinica_id = $1';
    params.push(session.clinica_id);
  }

  // Gestor entidade vê apenas usuários da sua entidade
  if (session.tipo_usuario === 'gestor') {
    query += ' WHERE tomador_id = $1';
    params.push(session.tomador_id);
  }

  const usuarios = await db.query(query, params);
  return NextResponse.json(usuarios);
}
```

**Endpoint: GET /api/funcionarios (atualizado)**

```typescript
// app/api/funcionarios/route.ts
export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let query = `
    SELECT 
      id, cpf, nome, email, usuario_tipo, 
      empresa_id, tomador_id, clinica_id,
      setor, funcao, matricula, nivel_cargo, ativo
    FROM funcionarios
    WHERE usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')
  `;

  let params: any[] = [];

  // RH vê funcionários da sua clínica
  if (session.tipo_usuario === 'rh') {
    query += ' AND clinica_id = $1';
    params.push(session.clinica_id);
  }

  // Gestor entidade vê apenas funcionários da sua entidade
  if (session.tipo_usuario === 'gestor') {
    query += ' AND tomador_id = $1';
    params.push(session.tomador_id);
  }

  const funcionarios = await db.query(query, params);
  return NextResponse.json(funcionarios);
}
```

### 4. Componentes React

**Header.tsx (atualizado)**

```typescript
'use client';

import { useSession } from '@/hooks/useSession';

export default function Header() {
  const { usuario } = useSession();

  if (!usuario) return null;

  const getTipoUsuarioLabel = (tipo: string) => {
    const labels = {
      admin: 'Administrador',
      emissor: 'Emissor de Laudos',
      rh: 'Gestor RH',
      gestor: 'Gestor de Entidade'
    };
    return labels[tipo] || tipo;
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="flex justify-between items-center">
        <h1>QWork</h1>
        <div>
          <span>{usuario.nome}</span>
          <span className="ml-2 text-sm">
            ({getTipoUsuarioLabel(usuario.tipo_usuario)})
          </span>
        </div>
      </div>
    </header>
  );
}
```

---

## 🔒 Permissões e RLS

**⚠️ IMPORTANTE:** Admin NÃO tem acesso a:

- Clínicas (tabela `clinicas`)
- tomadores/Entidades (tabela `tomadores`)
- Empresas clientes (tabela `empresas_clientes`)
- Funcionários (tabela `funcionarios`)

Admin tem acesso restrito apenas a:

- RBAC: `roles`, `permissions`, `role_permissions`
- Auditoria: `audit_logs`
- Tabela `usuarios` (para gerenciar usuários do sistema)

### Policies para tabela `usuarios`

```sql
-- Admin vê apenas tabela usuarios (para gerenciar usuários do sistema)
-- NÃO tem acesso a clínicas, empresas, funcionários
CREATE POLICY admin_usuarios_only ON usuarios
FOR SELECT TO authenticated
USING (current_setting('app.tipo_usuario') = 'admin');

-- RH vê usuários da sua clínica
CREATE POLICY rh_own_clinica_usuarios ON usuarios
FOR SELECT TO authenticated
USING (
  current_setting('app.tipo_usuario') = 'rh' AND
  clinica_id = current_setting('app.clinica_id')::integer
);

-- Gestor entidade vê usuários da sua entidade
CREATE POLICY gestor_own_entidade_usuarios ON usuarios
FOR SELECT TO authenticated
USING (
  current_setting('app.tipo_usuario') = 'gestor' AND
  tomador_id = current_setting('app.tomador_id')::integer
);

-- Usuário vê apenas seus próprios dados
CREATE POLICY usuario_own_data ON usuarios
FOR SELECT TO authenticated
USING (cpf = current_setting('app.cpf'));
```

````

### Policies para tabela `funcionarios` (atualizada)

```sql
-- RH vê funcionários da sua clínica
CREATE POLICY rh_own_clinica_funcionarios ON funcionarios
FOR ALL TO authenticated
USING (
  current_setting('app.tipo_usuario') = 'rh' AND
  clinica_id = current_setting('app.clinica_id')::integer
);

-- Gestor entidade vê funcionários da sua entidade
CREATE POLICY gestor_own_entidade_funcionarios ON funcionarios
FOR ALL TO authenticated
USING (
  current_setting('app.tipo_usuario') = 'gestor' AND
  tomador_id = current_setting('app.tomador_id')::integer
);
````

---

## 🧪 Testes

### Teste de Migração

```typescript
// __tests__/migration-300.test.ts
describe('Migration 300: Separação usuarios e funcionarios', () => {
  it('deve ter criado tabela usuarios', async () => {
    const result = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'usuarios'
    `);
    expect(result.rows).toHaveLength(1);
  });

  it('não deve ter usuários do sistema em funcionarios', async () => {
    const result = await db.query(`
      SELECT COUNT(*) as count FROM funcionarios 
      WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh')
    `);
    expect(result.rows[0].count).toBe('0');
  });

  it('deve ter migrado todos os usuários', async () => {
    const backup = await db.query(
      'SELECT COUNT(*) FROM funcionarios_backup_pre_300'
    );
    const usuarios = await db.query('SELECT COUNT(*) FROM usuarios');
    expect(usuarios.rows[0].count).toBe(backup.rows[0].count);
  });
});
```

### Teste de Autenticação

```typescript
// __tests__/auth-usuarios.test.ts
describe('Autenticação com nova estrutura', () => {
  it('deve autenticar usuário RH corretamente', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cpf: '12345678901', senha: 'senha123' }),
    });

    const data = await response.json();
    expect(data.tipo_usuario).toBe('rh');
    expect(data.clinica_id).toBeDefined();
  });

  it('não deve autenticar funcionário (sem acesso)', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cpf: '98765432100', senha: 'senha123' }),
    });

    expect(response.status).toBe(401);
  });
});
```

---

## 📊 Monitoramento

### Queries de Monitoramento

```sql
-- Verificar distribuição de usuários
SELECT tipo_usuario, COUNT(*),
       COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM usuarios
GROUP BY tipo_usuario;

-- Verificar distribuição de funcionários
SELECT usuario_tipo, COUNT(*),
       COUNT(*) FILTER (WHERE ativo = true) as ativos
FROM funcionarios
GROUP BY usuario_tipo;

-- Verificar integridade de vinculações
SELECT
  tipo_usuario,
  COUNT(*) FILTER (WHERE clinica_id IS NOT NULL) as com_clinica,
  COUNT(*) FILTER (WHERE tomador_id IS NOT NULL) as com_tomador,
  COUNT(*) FILTER (WHERE clinica_id IS NULL AND tomador_id IS NULL) as sem_vinculo
FROM usuarios
GROUP BY tipo_usuario;
```

---

## 🚨 Troubleshooting

### Problema 1: Usuários não conseguem fazer login

**Sintoma:** Erro 401 ao tentar autenticar

**Solução:**

```sql
-- Verificar se usuário está na tabela usuarios
SELECT * FROM usuarios WHERE cpf = 'XXX';

-- Se não estiver, verificar se ainda está em funcionarios
SELECT * FROM funcionarios WHERE cpf = 'XXX';

-- Migrar manualmente se necessário
INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo)
SELECT cpf, nome, email, senha_hash, usuario_tipo, clinica_id, ativo
FROM funcionarios
WHERE cpf = 'XXX' AND usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

DELETE FROM funcionarios WHERE cpf = 'XXX';
```

### Problema 2: Funcionários aparecem duplicados

**Sintoma:** Mesmo CPF em usuarios e funcionarios

**Solução:**

```sql
-- Identificar duplicados
SELECT cpf, COUNT(*)
FROM (
  SELECT cpf FROM usuarios
  UNION ALL
  SELECT cpf FROM funcionarios
) AS todos
GROUP BY cpf
HAVING COUNT(*) > 1;

-- Remover da tabela incorreta
-- Se é usuário do sistema, remover de funcionarios
DELETE FROM funcionarios
WHERE cpf IN (SELECT cpf FROM usuarios);
```

### Problema 3: Views retornando dados incorretos

**Sintoma:** Views antigas ainda referenciam estrutura antiga

**Solução:**

```sql
-- Reexecutar parte das views da migration
\i database/migrations/300_reestruturacao_usuarios_funcionarios.sql
-- (apenas a FASE 7: ATUALIZAR VIEWS SEMÂNTICAS)
```

---

## 📚 Referências

- [REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md](./REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md) - Documentação conceitual
- [Migration 300](../database/migrations/300_reestruturacao_usuarios_funcionarios.sql) - Script SQL
- [GUIA-COMPLETO-RLS-RBAC.md](./security/GUIA-COMPLETO-RLS-RBAC.md) - Segurança e permissões

---

**Última atualização:** 04 de Fevereiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para implementação
