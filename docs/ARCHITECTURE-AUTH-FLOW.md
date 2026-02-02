# Arquitetura de Autenticação e Fluxos de Query

## Visão Geral

Este documento descreve a arquitetura de autenticação dual-source do sistema e os fluxos de query baseados em tipo de usuário.

## Tabela de Conteúdos

1. [Modelo de Dados](#modelo-de-dados)
2. [Fluxo de Autenticação](#fluxo-de-autenticação)
3. [Validação de Contexto](#validação-de-contexto)
4. [Query Routing](#query-routing)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Exemplos Práticos](#exemplos-práticos)

---

## Modelo de Dados

### Tabelas de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                  TABELAS DE AUTENTICAÇÃO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  contratantes_senhas (gestores)                             │
│  ├── cpf_cnpj (PK)                                          │
│  ├── senha_hash                                             │
│  ├── perfil: 'gestor_entidade' | 'rh' | 'admin'            │
│  ├── contratante_id (FK → entidades)                        │
│  ├── clinica_id (FK → clinicas)                             │
│  └── ativo                                                  │
│                                                             │
│  funcionarios (funcionários operacionais)                   │
│  ├── id (PK)                                                │
│  ├── cpf (UNIQUE)                                           │
│  ├── nome                                                   │
│  ├── empresa_id (FK → empresas_clientes)                    │
│  ├── perfil: 'funcionario' | 'emissor'                      │
│  └── ativo                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Regra de Ouro

**⚠️ GESTORES NUNCA ESTÃO EM `funcionarios`**

- Gestores são contratantes com perfil administrativo
- Funcionários são operacionais, vinculados a empresas
- Cada tipo tem sua própria tabela de autenticação

---

## Fluxo de Autenticação

### Endpoint: `/api/auth/login`

```typescript
// 1. Verifica contratantes_senhas primeiro
const contratante = await query(
  `
  SELECT cpf_cnpj, senha_hash, perfil, contratante_id, clinica_id
  FROM contratantes_senhas
  WHERE cpf_cnpj = $1 AND ativo = true
`,
  [cpf]
);

if (contratante) {
  // Verificar senha
  const valid = await bcrypt.compare(senha, contratante.senha_hash);

  if (valid) {
    // Criar sessão de gestor
    await setSession({
      cpf: contratante.cpf_cnpj,
      perfil: contratante.perfil,
      contratanteId: contratante.contratante_id,
      clinicaId: contratante.clinica_id,
    });

    return { success: true, perfil: contratante.perfil };
  }
}

// 2. Fallback: verificar funcionarios
const funcionario = await query(
  `
  SELECT cpf, nome, empresa_id, perfil
  FROM funcionarios
  WHERE cpf = $1 AND ativo = true
`,
  [cpf]
);

if (funcionario) {
  // Verificar senha (hash em outra tabela ou lógica diferente)
  // Criar sessão de funcionário
  await setSession({
    cpf: funcionario.cpf,
    perfil: funcionario.perfil,
    empresaId: funcionario.empresa_id,
  });

  return { success: true, perfil: funcionario.perfil };
}

// 3. Não encontrado
return { success: false, error: 'Credenciais inválidas' };
```

### Diagrama de Fluxo

```
┌──────────────────────────────────────────────────────────┐
│                    LOGIN REQUEST                         │
│                    { cpf, senha }                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Buscar em             │
         │ contratantes_senhas   │
         └───────────┬───────────┘
                     │
            ┌────────┴────────┐
            │ Encontrado?     │
            └─────┬──────┬────┘
                  │ SIM  │ NÃO
                  ▼      ▼
         ┌────────────┐  ┌────────────────┐
         │ Validar    │  │ Buscar em      │
         │ senha      │  │ funcionarios   │
         └──────┬─────┘  └────────┬───────┘
                │                 │
         ┌──────┴──────┐   ┌─────┴──────┐
         │ Senha OK?   │   │ Encontrado?│
         └──┬──────┬───┘   └──┬─────┬───┘
            │ SIM  │ NÃO      │ SIM │ NÃO
            ▼      │          ▼     │
    ┌───────────┐ │  ┌───────────┐ │
    │ Sessão    │ │  │ Sessão    │ │
    │ GESTOR    │ │  │ FUNCIO-   │ │
    │           │ │  │ NÁRIO     │ │
    └─────┬─────┘ │  └─────┬─────┘ │
          │       │        │       │
          ▼       ▼        ▼       ▼
    ┌──────────────────────────────────┐
    │ ✅ LOGIN          ❌ ERRO        │
    │    SUCESSO           401         │
    └──────────────────────────────────┘
```

---

## Validação de Contexto

### Para Gestores

```typescript
// lib/db-gestor.ts
export async function validateGestorContext(cpf: string) {
  const result = await query(
    `
    SELECT 
      cpf_cnpj,
      perfil,
      contratante_id,
      clinica_id,
      ativo
    FROM contratantes_senhas
    WHERE cpf_cnpj = $1
  `,
    [cpf]
  );

  if (!result.rows[0]) {
    throw new Error('SEGURANÇA: Gestor não encontrado');
  }

  if (!result.rows[0].ativo) {
    throw new Error('SEGURANÇA: Gestor inativo');
  }

  return result.rows[0];
}
```

**Características:**

- ✅ Valida apenas existência e status ativo
- ❌ Não configura RLS (gestores não usam RLS)
- ✅ Retorna contratante_id ou clinica_id para filtros manuais

### Para Funcionários

```typescript
// lib/db-security.ts
export async function validateSessionContext(cpf: string) {
  const result = await query(
    `
    SELECT 
      cpf,
      nome,
      empresa_id,
      perfil,
      ativo
    FROM funcionarios
    WHERE cpf = $1
  `,
    [cpf]
  );

  if (!result.rows[0]) {
    throw new Error('SEGURANÇA: Usuário não encontrado ou inativo');
  }

  if (!result.rows[0].ativo) {
    throw new Error('SEGURANÇA: Usuário inativo');
  }

  // ⭐ Configura RLS para isolar dados
  await query(`SET LOCAL app.current_user_cpf = $1`, [cpf]);
  await query(`SET LOCAL app.current_user_empresa = $1`, [
    result.rows[0].empresa_id,
  ]);

  return result.rows[0];
}
```

**Características:**

- ✅ Valida existência e status ativo
- ✅ Configura variáveis de sessão PostgreSQL para RLS
- ✅ Isola dados automaticamente por empresa

---

## Query Routing

### Arquitetura de Decisão

```typescript
// lib/db-security.ts
export async function queryWithSecurity<T = any>(
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const session = await getSession();

  if (!session?.cpf) {
    throw new Error('SEGURANÇA: Sessão inválida');
  }

  // Detectar tipo de usuário
  const isGestorUser = await isGestor(session.cpf);

  if (isGestorUser) {
    // Gestores: sem RLS
    return queryAsGestor(sql, params);
  } else {
    // Funcionários: com RLS
    return queryWithContext(sql, params);
  }
}
```

### Funções Disponíveis

| Função                    | Usuários     | RLS  | Validação               | Uso                   |
| ------------------------- | ------------ | ---- | ----------------------- | --------------------- |
| `queryWithSecurity()`     | Todos        | Auto | Auto                    | ⭐ Recomendado        |
| `queryAsGestor()`         | Gestores     | ❌   | Via contratantes_senhas | Quando tipo conhecido |
| `queryAsGestorRH()`       | RH           | ❌   | Via requireClinica()    | Endpoints de RH       |
| `queryAsGestorEntidade()` | Entidade     | ❌   | Via requireEntity()     | Endpoints de entidade |
| `queryWithContext()`      | Funcionários | ✅   | Via funcionarios        | Quando tipo conhecido |
| `query()`                 | Sistema      | ❌   | Nenhuma                 | Apenas admin/setup    |

### Exemplo de Uso

```typescript
// ✅ RECOMENDADO: Detecção automática
import { queryWithSecurity } from '@/lib/db-security';

export async function GET(request: Request) {
  await requireAuth();

  const lotes = await queryWithSecurity(`
    SELECT * FROM lotes_avaliacao
    WHERE status = 'aguardando_envio'
  `);

  return Response.json(lotes.rows);
}

// ✅ ALTERNATIVA: Tipo específico (mais eficiente)
import { queryAsGestorRH } from '@/lib/db-gestor';

export async function POST(request: Request) {
  await requireClinica(); // Garante que é RH

  const newLote = await queryAsGestorRH(`
    INSERT INTO lotes_avaliacao (clinica_id, ...)
    VALUES ($1, ...)
    RETURNING *
  `, [clinicaId, ...]);

  return Response.json(newLote.rows[0]);
}
```

---

## Row Level Security (RLS)

### Políticas Ativas

```sql
-- Função para detectar gestores
CREATE OR REPLACE FUNCTION current_user_is_gestor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM contratantes_senhas
    WHERE cpf_cnpj = current_setting('app.current_user_cpf', true)
    AND perfil IN ('gestor_entidade', 'rh')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para funcionários
CREATE POLICY funcionarios_own_select ON funcionarios
  FOR SELECT
  USING (
    cpf = current_setting('app.current_user_cpf', true)
    AND NOT current_user_is_gestor()
  );

-- Avaliações (funcionário vê apenas as suas)
CREATE POLICY avaliacoes_own_select ON avaliacoes
  FOR SELECT
  USING (
    funcionario_cpf = current_setting('app.current_user_cpf', true)
    AND NOT current_user_is_gestor()
  );
```

### Tabelas por Status RLS

| Tabela                | RLS Ativo | Motivo                                       |
| --------------------- | --------- | -------------------------------------------- |
| `funcionarios`        | ✅ Sim    | Funcionário vê apenas próprio registro       |
| `avaliacoes`          | ✅ Sim    | Funcionário vê apenas suas avaliações        |
| `respostas_avaliacao` | ✅ Sim    | Funcionário vê apenas suas respostas         |
| `empresas_clientes`   | ❌ Não    | Gestores acessam múltiplas empresas          |
| `laudos`              | ❌ Não    | Gestores gerenciam laudos de todas empresas  |
| `lotes_avaliacao`     | ❌ Não    | Gestores criam lotes para múltiplas empresas |
| `contratantes_senhas` | ❌ Não    | Tabela de autenticação, sem RLS              |

### Desabilitando RLS (quando necessário)

```sql
-- Para tabelas de gestores
ALTER TABLE empresas_clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE laudos DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_avaliacao DISABLE ROW LEVEL SECURITY;
```

---

## Exemplos Práticos

### Caso 1: Endpoint para Gestores e Funcionários

```typescript
// app/api/lotes/[id]/route.ts
import { queryWithSecurity } from '@/lib/db-security';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireAuth(); // Valida qualquer tipo

  // Detecta automaticamente:
  // - Gestor: retorna lote sem RLS
  // - Funcionário: retorna apenas se estiver vinculado
  const lote = await queryWithSecurity(
    `
    SELECT * FROM lotes_avaliacao WHERE id = $1
  `,
    [params.id]
  );

  if (!lote.rows[0]) {
    return Response.json({ error: 'Lote não encontrado' }, { status: 404 });
  }

  return Response.json(lote.rows[0]);
}
```

### Caso 2: Endpoint Exclusivo para RH

```typescript
// app/api/rh/liberar-lote/route.ts
import { queryAsGestorRH } from '@/lib/db-gestor';
import { requireClinica } from '@/lib/session';

export async function POST(request: Request) {
  const session = await requireClinica(); // Garante RH

  const body = await request.json();
  const { empresaId, periodo } = body;

  // Valida acesso à empresa
  const empresa = await queryAsGestorRH(
    `
    SELECT * FROM empresas_clientes
    WHERE id = $1 AND clinica_id = $2
  `,
    [empresaId, session.clinicaId]
  );

  if (!empresa.rows[0]) {
    return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  }

  // Cria lote (sem RLS)
  const lote = await queryAsGestorRH(
    `
    INSERT INTO lotes_avaliacao (
      clinica_id,
      empresa_id,
      periodo,
      status
    ) VALUES ($1, $2, $3, 'rascunho')
    RETURNING *
  `,
    [session.clinicaId, empresaId, periodo]
  );

  return Response.json(lote.rows[0], { status: 201 });
}
```

### Caso 3: Endpoint Exclusivo para Funcionários

```typescript
// app/api/avaliacao/responder/route.ts
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  const session = await requireAuth(); // Pode ser qualquer tipo

  // Mas validamos que é funcionário
  if (session.perfil !== 'funcionario') {
    return Response.json(
      {
        error: 'Apenas funcionários podem responder avaliações',
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { avaliacaoId, respostas } = body;

  // RLS automático: retorna apenas se avaliação pertence ao funcionário
  const avaliacao = await queryWithContext(
    `
    SELECT * FROM avaliacoes WHERE id = $1
  `,
    [avaliacaoId]
  );

  if (!avaliacao.rows[0]) {
    return Response.json(
      {
        error: 'Avaliação não encontrada ou sem acesso',
      },
      { status: 404 }
    );
  }

  // Salvar respostas (com RLS ativo)
  for (const resposta of respostas) {
    await queryWithContext(
      `
      INSERT INTO respostas_avaliacao (
        avaliacao_id,
        pergunta_id,
        resposta
      ) VALUES ($1, $2, $3)
    `,
      [avaliacaoId, resposta.perguntaId, resposta.valor]
    );
  }

  return Response.json({ success: true });
}
```

---

## Referências

- [lib/db-gestor.ts](../lib/db-gestor.ts) - Query functions para gestores
- [lib/db-security.ts](../lib/db-security.ts) - Query functions com RLS
- [lib/session.ts](../lib/session.ts) - Gerenciamento de sessão
- [app/api/auth/login/route.ts](../app/api/auth/login/route.ts) - Autenticação dual-source
- [database/migrations/300_update_rls_exclude_gestores.sql](../database/migrations/300_update_rls_exclude_gestores.sql) - RLS policies
- [database/migrations/301_cleanup_gestores_funcionarios.sql](../database/migrations/301_cleanup_gestores_funcionarios.sql) - Limpeza de dados

---

**Última Atualização:** 01/02/2026  
**Responsável:** Documentação Técnica  
**Status:** ✅ Arquitetura implementada e validada
