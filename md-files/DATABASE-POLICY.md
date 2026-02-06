# POLÍTICA DE BANCOS DE DADOS - NÃO ALTERAR

⚠️ **ATENÇÃO: Esta configuração é DEFINITIVA e NÃO deve ser alterada sem aprovação explícita**

## Segregação de Ambientes (OBRIGATÓRIA)

### 🔵 DESENVOLVIMENTO (localhost)

- **Banco**: `nr-bps_db`
- **URL**: `postgresql://postgres:123456@localhost:5432/nr-bps_db`
- **Variável**: `LOCAL_DATABASE_URL`
- **Comando**: `pnpm dev`
- **Arquivos**: `.env.local`, `.env.development`, `.env`

### 🔴 PRODUÇÃO (Vercel/Neon Cloud)

- **Banco**: `neondb` (Neon Cloud)
- **URL**: `postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb`
- **Variável**: `DATABASE_URL`
- **Deploy**: Vercel automático
- **Arquivo**: `.env` (variável de produção)

### 🟡 TESTES (localhost)

- **Banco**: `nr-bps_db_test`
- **URL**: `postgresql://postgres:123456@localhost:5432/nr-bps_db_test`
- **Variável**: `TEST_DATABASE_URL`
- **Comando**: `pnpm test`
- **Arquivo**: `.env.test`

---

## ❌ PROIBIÇÕES ABSOLUTAS

1. **NUNCA** usar Neon Cloud (neon.tech) em desenvolvimento local
2. **NUNCA** usar Neon Cloud (neon.tech) em testes automatizados
3. **NUNCA** usar `nr-bps_db` em testes (use `nr-bps_db_test`)
4. **NUNCA** usar `nr-bps_db_test` em desenvolvimento (use `nr-bps_db`)
5. **NUNCA** misturar bancos entre ambientes
6. **NUNCA** commitar `.env.local` com credenciais de produção no Git

---

## 🛡️ Proteções de Segurança Implementadas

### Validação em Código (`lib/db.ts`)

```typescript
// Bloqueia automaticamente tentativas de usar banco Neon em testes
if (url && url.includes('neon.tech') && !url.includes('_test')) {
  throw new Error(
    'ERRO CRÍTICO: Tentativa de usar banco de PRODUÇÃO em TESTES!'
  );
}
```

### Arquivo .env.local

- ⚠️ **SE EXISTIR**: Deve conter APENAS configurações locais temporárias
- ⚠️ **NUNCA COMMITAR** no Git (já está no `.gitignore`)
- ⚠️ **USO PERMITIDO**: Apenas para debug local consciente e temporário
- ⚠️ **REMOVER** após uso para evitar confusão

**Exemplo seguro de `.env.local` (apenas para debug temporário)**:

```env
# ⚠️ TEMPORÁRIO - Delete após debug
DATABASE_URL="postgresql://neondb_owner:***@***.neon.tech/neondb"
ALLOW_PROD_DB_LOCAL=true
NODE_ENV=development
```

---

## ✅ Validação Automática

Execute para verificar configuração:

```bash
pnpm test __tests__/system/database-environment.test.ts
```

---

## 📝 Arquivos de Configuração

### `.env.local` (Desenvolvimento)

```env
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
DATABASE_URL=postgresql://neondb_owner:***@neon.tech/neondb  # Produção (não usado localmente)
```

### `.env.test` (Testes)

```env
TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
```

### `.env` (Fallback)

```env
DATABASE_URL=postgresql://neondb_owner:***@neon.tech/neondb  # Produção
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db  # Desenvolvimento
```

---

## 🔒 Lógica de Seleção (lib/db.ts)

```typescript
if (isTest) {
  return process.env.TEST_DATABASE_URL; // nr-bps_db_test
}

if (isDevelopment) {
  return process.env.LOCAL_DATABASE_URL; // nr-bps_db
}

if (isProduction) {
  return process.env.DATABASE_URL; // Neon Cloud
}
```

---

## 📊 Verificação Manual

```bash
# Desenvolvimento
psql "postgresql://postgres:123456@localhost:5432/nr-bps_db" -c "SELECT current_database();"

# Testes
psql "postgresql://postgres:123456@localhost:5432/nr-bps_db_test" -c "SELECT current_database();"

# Produção (somente leitura)
psql "postgresql://neondb_owner:***@neon.tech/neondb?sslmode=require" -c "SELECT current_database();"
```

---

## 🚨 Em Caso de Regressão

1. Reverter arquivos `.env*` para esta configuração
2. Executar `pnpm test __tests__/system/database-environment.test.ts`
3. Reiniciar servidor com `pnpm dev`
4. Verificar logs: deve mostrar `nr-bps_db` em desenvolvimento

---

## 📅 Última Atualização

**Data**: 01/02/2026  
**Responsável**: Sistema de Configuração Automática  
**Status**: ✅ DEFINITIVO - NÃO ALTERAR

---

## 🔐 POLÍTICAS DE SEGURANÇA E ACESSO

### Modelo de Autenticação Dual-Source

O sistema utiliza duas fontes de autenticação dependendo do tipo de usuário:

```
┌─────────────────────────────────────────────────┐
│           FLUXO DE AUTENTICAÇÃO                 │
├─────────────────────────────────────────────────┤
│  1. Verifica entidades_senhas (gestores)     │
│     ↓ Encontrado? → Login como gestor           │
│  2. Verifica funcionarios (funcionários)        │
│     ↓ Encontrado? → Login como funcionário      │
│  3. Não encontrado → Erro de autenticação       │
└─────────────────────────────────────────────────┘
```

**Referência:** [app/api/auth/login/route.ts](app/api/auth/login/route.ts)

### Tipos de Usuários e Tabelas

| Tipo de Usuário            | Tabela de Autenticação | Validação                | RLS Aplicado |
| -------------------------- | ---------------------- | ------------------------ | ------------ |
| **gestor**                 | `entidades_senhas`     | `requireEntity()`        | ❌ Não       |
| **rh** (gestor de clínica) | `entidades_senhas`     | `requireClinica()`       | ❌ Não       |
| **funcionario**            | `funcionarios`         | `requireAuth()`          | ✅ Sim       |
| **admin**                  | `entidades_senhas`     | `requireRole('admin')`   | ❌ Não       |
| **emissor**                | `funcionarios`         | `requireRole('emissor')` | ❌ Não       |

### Separação Arquitetural: Gestores vs Funcionários

**⚠️ REGRA CRÍTICA:** Gestores NUNCA devem estar na tabela `funcionarios`.

**Justificativa:**

1. **Gestores** são contratantes com perfil administrativo (entidade ou clínica)
2. **Funcionários** são operacionais, vinculados a empresas dos contratantes
3. Gestores acessam dados de múltiplas empresas (sem RLS)
4. Funcionários acessam apenas dados da própria empresa (com RLS)

**Migrações Relacionadas:**

- [201_fix_gestor_as_funcionario.sql](database/migrations/201_fix_gestor_as_funcionario.sql) - Primeira separação
- [300_update_rls_exclude_gestores.sql](database/migrations/300_update_rls_exclude_gestores.sql) - ⭐ Atualização de RLS
- [301_cleanup_gestores_funcionarios.sql](database/migrations/301_cleanup_gestores_funcionarios.sql) - ⭐ Limpeza definitiva

### Row Level Security (RLS)

O PostgreSQL utiliza RLS para isolar dados de funcionários operacionais. **Gestores não utilizam RLS.**

#### Políticas Ativas

```sql
-- Função para detectar gestores
CREATE OR REPLACE FUNCTION current_user_is_gestor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM entidades_senhas
    WHERE cpf_cnpj = current_setting('app.current_user_cpf', true)
    AND perfil IN ('gestor', 'rh')
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
```

**Tabelas sem RLS (acesso por gestores):**

- `empresas_clientes` - Gestores acessam múltiplas empresas
- `laudos` - Gestores gerenciam laudos de várias empresas
- `lotes_avaliacao` - Gestores criam e liberam lotes
- `empresas` - Gestores gerenciam suas carteiras

### Query Functions por Tipo de Usuário

#### Para Gestores (sem RLS)

```typescript
import {
  queryAsGestor,
  queryAsGestorRH,
  queryAsGestorEntidade,
} from '@/lib/db-gestor';

// Gestor genérico
const result = await queryAsGestor(
  'SELECT * FROM empresas_clientes WHERE contratante_id = $1',
  [contratanteId]
);

// RH específico
const lotes = await queryAsGestorRH(
  'SELECT * FROM lotes_avaliacao WHERE clinica_id = $1',
  [clinicaId]
);
```

**Referência:** [lib/db-gestor.ts](lib/db-gestor.ts)

#### Para Funcionários (com RLS)

```typescript
import { queryWithContext } from '@/lib/db-security';

// RLS automático via session context
const avaliacoes = await queryWithContext(
  'SELECT * FROM avaliacoes WHERE lote_id = $1',
  [loteId]
);
// Retorna apenas avaliações do funcionário autenticado
```

**Referência:** [lib/db-security.ts](lib/db-security.ts)

#### Query Automática (Detecção de Tipo)

```typescript
import { queryWithSecurity } from '@/lib/db-security';

// Detecta automaticamente:
// - Gestor → usa queryAsGestor (sem RLS)
// - Funcionário → usa queryWithContext (com RLS)
const data = await queryWithSecurity('SELECT * FROM tabela WHERE ...', [
  params,
]);
```

### Validação de Contexto

#### Gestores

```typescript
import { validateGestorContext } from '@/lib/db-gestor';

// Valida via entidades_senhas
const gestor = await validateGestorContext(cpf);
if (!gestor) {
  throw new Error('Gestor não encontrado ou inativo');
}
```

#### Funcionários

```typescript
import { validateSessionContext } from '@/lib/db-security';

// Valida via funcionarios + configura RLS
const funcionario = await validateSessionContext(cpf);
if (!funcionario) {
  throw new Error('Funcionário não encontrado ou inativo');
}
```

### Fluxo de Segurança Completo

```
┌──────────────────────────────────────────────────┐
│  1. Login (app/api/auth/login/route.ts)         │
│     ↓                                            │
│  2. Verifica entidades_senhas OU funcionarios │
│     ↓                                            │
│  3. Cria sessão com CPF + perfil + contexto      │
│     ↓                                            │
│  4. Endpoint protegido:                          │
│     - requireAuth() / requireEntity() / etc      │
│     ↓                                            │
│  5. Query de dados:                              │
│     - Gestor → queryAsGestor (sem RLS)          │
│     - Funcionário → queryWithContext (com RLS)  │
│     ↓                                            │
│  6. Resposta filtrada por segurança              │
└──────────────────────────────────────────────────┘
```

### Auditoria e Monitoramento

Todas as ações de gestores são registradas via `logGestorAction()`:

```typescript
import { logGestorAction } from '@/lib/db-gestor';

await logGestorAction({
  gestorCpf: cpf,
  action: 'liberar_lote',
  entityType: 'lote',
  entityId: loteId,
  details: { empresaId, totalFuncionarios },
});
```

**Tabela:** `gestor_actions_log`

---

## ⚠️ AVISO FINAL

Qualquer alteração desta política deve:

1. Ter justificativa técnica documentada
2. Passar por revisão de código
3. Atualizar este documento
4. Atualizar testes automatizados
