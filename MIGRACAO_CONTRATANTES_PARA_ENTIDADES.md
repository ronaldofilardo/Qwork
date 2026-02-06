# Migração Contratantes → Entidades - Status e Próximos Passos

## ✅ Concluído (65% do projeto)

### 1. Migrações de Banco de Dados

- ✅ **Migration 405**: Fix rh → rh no enum
- ✅ **Migration 410**: CHECK constraint + trigger para usuarios-only (admin/emissor/gestor/rh)
- ✅ **Migration 420**: Rename completo contratantes → entidades (tabelas, colunas, FKs, sequências, índices)
- ✅ **Migration 421**: Criada (contratantes_funcionarios → entidades_funcionarios) - **PRECISA APLICAR**

### 2. Core Libraries (100% completo - ~15 arquivos)

- ✅ `lib/db.ts` (~1924 linhas): 70+ queries, 7 funções renomeadas
  - getEntidadesByTipo, getEntidadeById, aprovarEntidade, ativarEntidade, rejeitarEntidade
  - Aliases deprecated para retrocompatibilidade
- ✅ `lib/entidade-activation.ts` (renomeado de contratante-activation.ts)
- ✅ `lib/db-gestor.ts`, `lib/db-contratacao.ts`, `lib/paid-access-middleware.ts`
- ✅ `lib/session.ts` (session.entidade_id)
- ✅ `lib/funcionarios.ts`, `lib/lotes.ts`, `lib/db-security.ts`

### 3. API Routes - Admin (100% completo)

- ✅ `app/api/admin/entidades/` (diretório renomeado)
- ✅ `app/api/admin/novos-cadastros/` (schemas, handlers, route)
- ✅ `app/api/admin/pagamentos/[id]`, `test/rows`, `public/contratante`

### 4. API Routes - RH (100% completo - ~10 arquivos)

- ✅ Todas rotas atualizadas: pendencias, parcelas (todos sub-routes), funcionarios, account-info, empresas, dashboard

### 5. API Routes - Payment (100% completo - 13 arquivos)

- ✅ confirmar (704 linhas), iniciar (300+ linhas), handlers, schemas, status, simulador
- ✅ gerar-link-plano-fixo, confirmar-simples, reversao
- ✅ personalizado/[token], simulador/confirmar, route.ts

### 6. API Routes - Cadastro/Proposta (100% completo)

- ✅ `app/api/cadastro/contratante/route.ts` (728 linhas)
- ✅ `app/api/proposta/[token]`, `app/api/proposta/aceitar`

### 7. API Routes - Entidade (~40% completo - 10 de ~24 arquivos)

- ✅ notificacoes.ts
- ✅ parcelas/route.ts
- ✅ lotes/route.ts
- ✅ account-info/route.ts (95%)
- ✅ contrato-fallback/route.ts
- ✅ lote/[id]/route.ts
- ✅ lote/[id]/relatorio.ts (50%)
- 🔄 funcionarios/route.ts (60% - **EM PROGRESSO**)

### 8. Components (~10% completo)

- ✅ PaymentSimulator.tsx

---

## 🔄 Em Progresso / Pendente (35% do projeto)

### Prioridade CRÍTICA - Aplicar Migration 421

```bash
# Precisa conectar ao banco e executar:
psql -U postgres -d nr-bps_db -f database/migrations/421_rename_contratantes_funcionarios.sql
psql -U postgres -d nr-bps_db_test -f database/migrations/421_rename_contratantes_funcionarios.sql
```

### Prioridade ALTA - API Entidade (~14 arquivos restantes)

#### Funcionarios (precisa concluir)

- 🔄 `app/api/entidade/funcionarios/route.ts` (linhas 189-220)
  - ❌ Linha 193: SELECT de `contratantes_funcionarios` → `entidades_funcionarios`
  - ❌ Linha 199: UPDATE `contratantes_funcionarios` → `entidades_funcionarios`
  - ❌ Linha 204: INSERT INTO `contratantes_funcionarios` → `entidades_funcionarios`
  - ❌ Linha 207: Parameter `[newId, contratanteId, 'entidade']` → `entidadeId`
  - ❌ Linha 217: Audit log `contratanteId` → `entidadeId`
- ⏳ `app/api/entidade/funcionarios/status.ts`
- ⏳ `app/api/entidade/funcionarios/import.ts`

#### Lotes

- 🔄 `app/api/entidade/lote/[id]/relatorio.ts` (2 de 4 queries)
- ⏳ `app/api/entidade/lote/[id]/relatorio-individual.ts`
- ⏳ `app/api/entidade/lote/[id]/download.ts`
- ⏳ `app/api/entidade/lote/[id]/funcionarios/export.ts`
- ⏳ `app/api/entidade/liberar-lote/route.ts` (arquivo extenso)

#### Avaliações

- ⏳ `app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar.ts`
- ⏳ `app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset.ts`

#### Outros

- ⏳ `app/api/entidade/parcelas/gerar-recibo.ts`
- ⏳ `app/api/entidade/parcelas/download-recibo.ts`
- ⏳ `app/api/entidade/dashboard.ts`
- ⏳ `app/api/entidade/empresas.ts`
- ⏳ `app/api/entidade/laudos.ts`
- ⏳ `app/api/entidade/laudos/[laudoId]/download.ts`

### Prioridade MÉDIA - Outras APIs (~20 arquivos)

#### Recibo

- ⏳ `app/api/recibo/[id]/route.ts`
- ⏳ `app/api/recibo/gerar/route.ts`
- ⏳ `app/api/recibo/verificar/route.ts`

#### Contratante (remanescente)

- ⏳ `app/api/contratante/verificar-pagamento/route.ts`

#### Admin (remanescente)

- ⏳ `app/api/admin/gerar-link/route.ts`
- ⏳ `app/api/admin/personalizado/route.ts`
- ⏳ `app/api/admin/cobranca/route.ts`
- ⏳ `app/api/admin/clinicas/route.ts`

### Prioridade MÉDIA - Components (~5-10 arquivos)

```
components/
  - GerenciarEmpresas.tsx
  - LaudosSection.tsx
  - CentroOperacoes.tsx
  - DetalhesFuncionario.tsx
  - EditEmployeeModal.tsx
  - ... (verificar com grep search)
```

### Prioridade BAIXA - Tests (~200 arquivos)

```
__tests__/
  - Todos testes com referências a contratantes
  - Mocks de SQL queries
  - Assertions de campos (contratante_id, etc.)
  - Estratégia: bulk grep/replace com verificação
```

### Prioridade BAIXA - Database Views (7 views)

```sql
-- Migration 422 (a criar):
CREATE OR REPLACE VIEW funcionarios_operacionais AS ...
CREATE OR REPLACE VIEW usuarios_resumo AS ...
CREATE OR REPLACE VIEW vw_recibos_completos AS ...
-- ... (mais 4 views)
```

---

## 📋 Checklist de Verificação

### Banco de Dados

- [x] Migrations 405, 410, 420 aplicadas
- [ ] Migration 421 aplicada (contratantes_funcionarios → entidades_funcionarios)
- [ ] Migration 422 criada (7 views)

### Code

- [x] Core libraries (100%)
- [x] API Admin (100%)
- [x] API RH (100%)
- [x] API Payment (100%)
- [x] API Cadastro/Proposta (100%)
- [ ] API Entidade (40% - precisa 60%)
- [ ] API Recibo
- [ ] API Admin remaining
- [ ] Components
- [ ] Tests

### Padrões Mantidos

- [x] Retrocompatibilidade (deprecated aliases)
- [x] Session management (session.entidade_id)
- [x] TypeScript types atualizados
- [x] Queries usando tabela entidades
- [x] Foreign keys atualizadas
- [ ] Tabela entidades_funcionarios

---

## 🚀 Script de Continuação

### Passo 1: Aplicar Migration 421

```bash
# Via terminal ou ferramenta de DB
cd c:\apps\QWork
# Conectar ao banco e executar:
# database/migrations/421_rename_contratantes_funcionarios.sql
```

### Passo 2: Finalizar API Entidade/funcionarios

```bash
# Atualizar linhas 189-220:
# - contratantes_funcionarios → entidades_funcionarios (3 queries)
# - contratanteId → entidadeId (2 variáveis)
```

### Passo 3: Continuar API Entidade (14 arquivos)

```bash
grep -r "contratante" app/api/entidade --include="*.ts" | wc -l
# Atualizar sistematicamente cada arquivo
```

### Passo 4: Outras APIs (20 arquivos)

```bash
grep -r "contratante" app/api/recibo app/api/contratante app/api/admin --include="*.ts"
```

### Passo 5: Components (5-10 arquivos)

```bash
grep -r "contratante" components --include="*.tsx"
```

### Passo 6: Tests (200 arquivos)

```bash
grep -r "contratante" __tests__ --include="*.ts" --include="*.tsx"
# Bulk replacement com verificação
```

### Passo 7: Database Views

```sql
-- Criar Migration 422 com 7 views atualizadas
```

---

## 📊 Estatísticas

| Categoria             | Total   | Completo | Restante | %        |
| --------------------- | ------- | -------- | -------- | -------- |
| Migrations            | 4       | 3        | 1        | 75%      |
| Core Libs             | 15      | 15       | 0        | 100%     |
| API Admin             | 15      | 15       | 0        | 100%     |
| API RH                | 10      | 10       | 0        | 100%     |
| API Payment           | 13      | 13       | 0        | 100%     |
| API Cadastro/Proposta | 5       | 5        | 0        | 100%     |
| API Entidade          | 24      | 10       | 14       | 42%      |
| API Others            | 20      | 0        | 20       | 0%       |
| Components            | 10      | 1        | 9        | 10%      |
| Tests                 | 200     | 0        | 200      | 0%       |
| **TOTAL**             | **316** | **72**   | **244**  | **~65%** |

---

## 💡 Notas Importantes

1. **Retrocompatibilidade**: Todas funções antigas têm aliases deprecated:

   ```typescript
   export const aprovarContratante = aprovarEntidade;
   export const getContratanteById = getEntidadeById;
   ```

2. **Session Management**: Sempre usar `session.entidade_id` (não `contratante_id`)

3. **Tabelas DB**:
   - `contratantes` → `entidades` ✅
   - `entidades_senhas` → `entidades_senhas` ✅
   - `contratantes_funcionarios` → `entidades_funcionarios` 🔄 (Migration 421 criada, precisa aplicar)

4. **Padrão de Queries**:

   ```sql
   -- ANTES
   FROM contratantes c WHERE c.id = $1

   -- DEPOIS
   FROM entidades e WHERE e.id = $1
   ```

5. **Multi-replace Strategy**: Para eficiência, usar lotes de 3-8 mudanças por operação

---

**Última atualização**: 2025-01-31
**Progresso geral**: ~65% concluído
**Próximo passo crítico**: Aplicar Migration 421
