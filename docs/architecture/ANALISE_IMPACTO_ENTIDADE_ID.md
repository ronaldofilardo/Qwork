# Análise de Impacto: Migração contratante_id → entidade_id em usuarios

## 🎯 Objetivo da Mudança

Padronizar a nomenclatura na tabela `usuarios` para usar `entidade_id` em vez de `contratante_id`, alinhando com a refatoração global que renomeou a tabela `contratantes` para `entidades`.

## ✅ Correções Implementadas

### 1. Migration 300 - Estrutura da Tabela `usuarios`

**Arquivo:** `database/migrations/300_reestruturacao_usuarios_funcionarios.sql`

**Mudanças:**

- ✅ Coluna `contratante_id` → `entidade_id`
- ✅ Constraint `usuarios_gestor_check` atualizada para usar `entidade_id`
- ✅ Foreign Key referenciando `entidades(id)` em vez de `contratantes(id)`
- ✅ Índice renomeado de `idx_usuarios_contratante_id` → `idx_usuarios_entidade_id`
- ✅ Comentário da coluna atualizado

**Estrutura Final:**

```sql
CREATE TABLE usuarios (
    -- ... outras colunas ...
    clinica_id INTEGER,          -- Para RH (obrigatório se tipo_usuario='rh')
    entidade_id INTEGER,         -- Para Gestor (obrigatório se tipo_usuario='gestor')
    -- ... constraints ...
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE RESTRICT,
    FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE RESTRICT
);
```

### 2. Função `criarContaResponsavel` em lib/db.ts

**Arquivo:** `lib/db.ts` (linhas 1620-1750)

**Mudanças:**

- ✅ Variável `usuarioContratanteId` → `usuarioEntidadeId`
- ✅ INSERT usa `entidade_id` em vez de `contratante_id`
- ✅ UPDATE usa `entidade_id` em vez de `contratante_id`

**Lógica:**

- Para `tipo_usuario = 'rh'`: popula `clinica_id`, deixa `entidade_id = NULL`
- Para `tipo_usuario = 'gestor'`: popula `entidade_id`, deixa `clinica_id = NULL`

## 📋 Áreas de Impacto Identificadas

### ✅ BAIXO RISCO - Já Alinhadas

1. **APIs de Cadastro RH/Gestor**
   - ✅ `/api/admin/gestores-rh` - usa apenas `clinica_id`
   - ✅ `/api/admin/cadastro/rh` - usa apenas `clinica_id`
   - ✅ `/api/admin/clinicas` - usa apenas `clinica_id`

   **Status:** Não impactadas (não usam contratante_id)

2. **Login em /api/auth/login/route.ts**
   - ✅ Query em `usuarios` usa apenas `role` (não filtra por entidade)
   - ✅ Sessão criada não depende de contratante_id no SELECT

   **Status:** Funcionará após migration ser aplicada

### ⚠️ MÉDIO RISCO - Requer Atenção

3. **Session Management (lib/session.ts)**

   **Situação Atual:**
   - Mantém `contratante_id?: number` como @deprecated
   - Usa `entidade_id` como campo principal
   - Funções `requireRHWithEmpresaAccess` e `requireEntity` usam fallback para `contratante_id`

   **Impacto:**

   ```typescript
   // LINHA 201-213: Mapeamento de clinica_id via contratante_id
   if (!session.clinica_id && session.contratante_id) {
     // Busca clinica usando contratante_id da sessão
     const fallback = await query(
       `SELECT cl.id FROM clinicas cl
        INNER JOIN contratantes c ON c.id = cl.contratante_id
        WHERE cl.contratante_id = $1 AND c.tipo = 'clinica'`,
       [session.contratante_id]
     );
   }
   ```

   **⚠️ AÇÃO NECESSÁRIA:**
   - Atualizar query para usar `entidades` em vez de `contratantes`
   - Atualizar FK `cl.contratante_id` → `cl.entidade_id`
   - Manter retrocompatibilidade durante período de transição

4. **Liberação de Lotes - /api/rh/liberar-lote**

   **Uso Atual:**
   - Chama `requireRHWithEmpresaAccess(empresaId)`
   - Depende indiretamente de `session.clinica_id`

   **Status:** Sem impacto direto, mas depende de lib/session.ts funcionar corretamente

5. **Solicitação de Emissão - /api/lotes/[loteId]/solicitar-emissao**

   **Código Atual:**

   ```typescript
   // LINHA 92-97: Validação de permissão para gestor
   if (lote.contratante_id && user.perfil === 'gestor') {
     if (user.contratante_id !== lote.contratante_id) {
       return NextResponse.json(
         { error: 'Sem permissão para este lote' },
         { status: 403 }
       );
     }
   }
   ```

   **⚠️ AÇÃO NECESSÁRIA:**
   - Session precisa popular `contratante_id` ou `entidade_id`
   - Código deve comparar com campo correto da tabela usuarios
   - Lote usa `contratante_id` (FK para entidades) - isso está correto

## 🔧 Ações Corretivas Necessárias

### 1. Atualizar lib/session.ts

**Arquivo:** `lib/session.ts`

**Locais a Corrigir:**

#### A. Função `requireRHWithEmpresaAccess` (linhas 200-213)

```typescript
// ANTES (usando contratantes)
const fallback = await query(
  `SELECT cl.id FROM clinicas cl
   INNER JOIN contratantes c ON c.id = cl.contratante_id
   WHERE cl.contratante_id = $1 AND c.tipo = 'clinica'`,
  [session.contratante_id]
);

// DEPOIS (usando entidades)
const fallback = await query(
  `SELECT cl.id FROM clinicas cl
   INNER JOIN entidades c ON c.id = cl.entidade_id
   WHERE cl.entidade_id = $1 AND c.tipo = 'clinica'`,
  [session.contratante_id || session.entidade_id]
);
```

#### B. Função `requireClinica` (linhas 334-345)

```typescript
// ANTES
const fallbackClinica = await query(
  `SELECT cl.id FROM clinicas cl
   INNER JOIN contratantes c ON c.id = cl.contratante_id
   WHERE cl.contratante_id = $1 AND c.tipo = 'clinica'`,
  [session.contratante_id]
);

// DEPOIS
const fallbackClinica = await query(
  `SELECT cl.id FROM clinicas cl
   INNER JOIN entidades c ON c.id = cl.entidade_id
   WHERE cl.entidade_id = $1 AND c.tipo = 'clinica'`,
  [session.contratante_id || session.entidade_id]
);
```

### 2. Atualizar Login para Popular Sessão Corretamente

**Arquivo:** `app/api/auth/login/route.ts`

**Problema Atual:**

- Quando login em `usuarios` branch (linhas 380-410), sessão não inclui `clinica_id` nem `entidade_id`
- Isso quebra `requireRHWithEmpresaAccess` e `requireEntity`

**Ação Necessária:**

```typescript
// LINHA 380-410: Após validar senha em usuarios
// Buscar clinica_id ou entidade_id do usuario
const usuarioComVinculos = await query(
  `SELECT cpf, nome, role, tipo_usuario, clinica_id, entidade_id 
   FROM usuarios 
   WHERE cpf = $1`,
  [cpf]
);

const user = usuarioComVinculos.rows[0];

createSession({
  cpf: user.cpf,
  nome: user.nome,
  perfil: mapRoleToPerf(user.role),
  clinica_id: user.clinica_id || undefined,
  entidade_id: user.entidade_id || undefined,
  // Retrocompat
  contratante_id: user.entidade_id || undefined,
});
```

### 3. Verificar Queries em Outros Endpoints

**Arquivos a Revisar:**

- `app/api/lotes/**/*.ts` - verificar uso de `user.contratante_id` vs `user.entidade_id`
- `app/api/entidade/**/*.ts` - verificar acesso a lotes/avaliações
- `app/api/rh/**/*.ts` - verificar queries que filtram por contratante_id

## 📊 Tabelas Relacionadas e Suas Colunas

### Mapeamento Atual (pós-refatoração)

| Tabela             | Coluna FK        | Referência      | Descrição                   |
| ------------------ | ---------------- | --------------- | --------------------------- |
| `usuarios`         | `entidade_id`    | `entidades(id)` | Gestor de entidade          |
| `usuarios`         | `clinica_id`     | `clinicas(id)`  | RH de clínica               |
| `clinicas`         | `entidade_id`    | `entidades(id)` | Clínica pertence a entidade |
| `lotes_avaliacao`  | `contratante_id` | `entidades(id)` | Lote pertence a entidade    |
| `lotes_avaliacao`  | `clinica_id`     | `clinicas(id)`  | Lote de clínica             |
| `entidades_senhas` | `entidade_id`    | `entidades(id)` | Senha de gestor             |
| `contratos`        | `contratante_id` | `entidades(id)` | Contrato com entidade       |
| `pagamentos`       | `contratante_id` | `entidades(id)` | Pagamento de entidade       |

**Nota:** `lotes_avaliacao`, `contratos`, `pagamentos` mantêm `contratante_id` porque referenciam entidades/clínicas como **contratantes do serviço** (conceito de negócio diferente de "usuário gestor").

## 🎯 Prioridade de Implementação

### P0 - CRÍTICO (Bloqueia Login de Gestores)

1. ✅ Corrigir migration 300
2. ✅ Atualizar `criarContaResponsavel` em lib/db.ts
3. ⚠️ Popular `clinica_id`/`entidade_id` na sessão durante login (usuarios branch)
4. ⚠️ Atualizar queries em lib/session.ts para usar `entidades`

### P1 - ALTO (Funcionalidades Core)

5. ⚠️ Revisar `/api/lotes/[loteId]/solicitar-emissao`
6. ⚠️ Revisar `/api/entidade/**` para uso consistente de entidade_id
7. ⚠️ Atualizar testes em `__tests__/lib/criarContaResponsavel.*.test.ts`

### P2 - MÉDIO (Cleanup)

8. ⏸️ Remover `contratante_id` deprecated de Session interface (após 100% migrado)
9. ⏸️ Remover fallbacks de `contratante_id` em lib/session.ts

## 🧪 Testes Necessários

### Cenários de Teste

1. ✅ Cadastro de novo gestor → verifica INSERT em usuarios com entidade_id
2. ✅ Cadastro de novo RH → verifica INSERT em usuarios com clinica_id
3. ⚠️ Login como gestor → sessão deve ter `entidade_id` e `perfil='gestor'`
4. ⚠️ Login como RH → sessão deve ter `clinica_id` e `perfil='rh'`
5. ⚠️ Gestor solicita emissão de lote → permissão validada via entidade_id
6. ⚠️ RH libera lote → permissão validada via clinica_id

## 📝 Notas de Migração

### Script de Aplicação da Migration 300

```bash
# 1. Fazer backup
pg_dump -U postgres -d nr-bps_db -t usuarios > backup_usuarios_pre_300.sql

# 2. Aplicar migration (se ainda não foi aplicada)
psql -U postgres -d nr-bps_db -f database/migrations/300_reestruturacao_usuarios_funcionarios.sql

# 3. Verificar estrutura
psql -U postgres -d nr-bps_db -c "\d usuarios"

# 4. Testar login de gestor
# (via interface ou curl)
```

### Rollback (se necessário)

```sql
-- Reverter para estrutura antiga (APENAS SE MIGRATION NÃO FOI APLICADA)
ALTER TABLE usuarios RENAME COLUMN entidade_id TO contratante_id;
ALTER TABLE usuarios DROP CONSTRAINT usuarios_fkey_entidade_id;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_fkey_contratante_id
  FOREIGN KEY (contratante_id) REFERENCES contratantes(id) ON DELETE RESTRICT;
```

## 🚀 Próximos Passos

1. **Revisar e aplicar correções em lib/session.ts** (queries com contratantes)
2. **Atualizar login route** para popular entidade_id/clinica_id na sessão
3. **Testar fluxo completo:**
   - Cadastro de entidade
   - Confirmação de pagamento (chama criarContaResponsavel)
   - Login do gestor
   - Solicitação de emissão de laudo
4. **Aplicar migration 300** no banco de dados de desenvolvimento
5. **Executar suite de testes** de integração
6. **Atualizar documentação** de onboarding

---

**Data:** 05/02/2026  
**Status:** ✅ Migration corrigida | ⚠️ Requer ajustes em session.ts e login
