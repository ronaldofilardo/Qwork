# 🚀 Migração Contratantes → Entidades - Guia de Conclusão

**Status Atual**: ~70% concluído
**Última Atualização**: 2025-01-31

---

## ✅ O que JÁ FOI FEITO

### 1. ✅ Banco de Dados (100%)

- **Migration 405**: Fix rh → rh
- **Migration 410**: CHECK constraint + trigger (usuarios-only para admin/emissor/gestor/rh)
- **Migration 420**: Rename completo contratantes → entidades (aplicada com sucesso)
- **Migration 421**: Criada para contratantes_funcionarios → entidades_funcionarios (**PRECISA APLICAR**)

### 2. ✅ Core Libraries (100%)

- ✅ `lib/db.ts` (~1924 linhas, 70+ queries)
- ✅ `lib/entidade-activation.ts`
- ✅ `lib/db-gestor.ts`, `lib/db-contratacao.ts`, `lib/paid-access-middleware.ts`
- ✅ `lib/session.ts`
- ✅ `lib/funcionarios.ts`, `lib/lotes.ts`, `lib/db-security.ts`

### 3. ✅ API Routes (70%)

- ✅ **Admin** (100%): entidades/, novos-cadastros/, pagamentos/
- ✅ **RH** (100%): pendencias, parcelas, funcionarios, account-info, empresas, dashboard
- ✅ **Payment** (100%): confirmar, iniciar, handlers, schemas, status, simulador, etc.
- ✅ **Cadastro/Proposta** (100%): cadastro/contratante/, proposta/[token], proposta/aceitar
- ✅ **Entidade** (50%):
  - ✅ notificacoes.ts
  - ✅ parcelas/route.ts
  - ✅ lotes/route.ts
  - ✅ account-info/route.ts
  - ✅ contrato-fallback/route.ts
  - ✅ lote/[id]/route.ts
  - ✅ funcionarios/route.ts (**RECÉM CONCLUÍDO**)
  - ✅ funcionarios/status.ts (**RECÉM CONCLUÍDO**)
  - ✅ funcionarios/import.ts (**RECÉM CONCLUÍDO**)

---

## 🔴 O que FALTA FAZER

### Prioridade CRÍTICA 🔴

#### 1. Aplicar Migration 421 ao Banco

```sql
-- Executar no PostgreSQL (ambos bancos: nr-bps_db e nr-bps_db_test)
-- Arquivo: database/migrations/421_rename_contratantes_funcionarios.sql

-- Opção 1: Via psql
psql -U postgres -d nr-bps_db -f database/migrations/421_rename_contratantes_funcionarios.sql
psql -U postgres -d nr-bps_db_test -f database/migrations/421_rename_contratantes_funcionarios.sql

-- Opção 2: Via ferramenta de DB (DBeaver, pgAdmin, etc.)
-- Copiar e executar o conteúdo do arquivo SQL
```

**O que a migração faz:**

- Renomeia tabela: `contratantes_funcionarios` → `entidades_funcionarios`
- Renomeia coluna: `contratante_id` → `entidade_id`
- Renomeia coluna: `tipo_contratante` → `tipo_entidade`
- Atualiza constraints, indexes, FK, PK
- Recria função `sync_entidades_funcionarios()`
- Recria trigger `trg_sync_entidades_funcionarios`

### Prioridade ALTA 🟠

#### 2. API Entidade - Arquivos Restantes (~10 arquivos)

**Usar script automatizado:**

```powershell
cd C:\apps\QWork
.\scripts\migrate-contratantes-to-entidades.ps1
```

**Ou atualizar manualmente:**

📁 **liberar-lote/** (arquivo grande, ~449 linhas)

- `app/api/entidade/liberar-lote/route.ts`
- Substituições: session.contratante_id → session.entidade_id (7x)
- Queries: WHERE contratante_id → WHERE entidade_id (6x)
- INSERT: contratante_id → entidade_id (2x)
- Variável: contratanteId → entidadeId
- Tabela: FROM contratantes → FROM entidades

📁 **parcelas/**

- `app/api/entidade/parcelas/gerar-recibo/route.ts` (~400 linhas)
  - session.contratante_id → session.entidade_id
  - contratanteId → entidadeId
  - Queries: JOIN contratantes ct → JOIN entidades e
  - Aliases: ct.nome/cnpj/email → e.nome/cnpj/email
  - contratante_nome/cnpj/email → entidade_nome/cnpj/email
  - dados.contratante*\* → dados.entidade*\*
- `app/api/entidade/parcelas/download-recibo/route.ts`
  - session.contratante_id → session.entidade_id
  - r.contratante_id → r.entidade_id

📁 **lote/[id]/**

- `app/api/entidade/lote/[id]/relatorio.ts` (50% feito, 2 queries restantes)
- `app/api/entidade/lote/[id]/relatorio-individual.ts`
  - session.contratante_id → session.entidade_id
  - la.contratante_id → la.entidade_id

📁 **Outros**

- `app/api/entidade/empresas/route.ts`
  - session.contratante_id → session.entidade_id
- `app/api/entidade/laudos.ts` (se existir)
- `app/api/entidade/dashboard.ts` (se existir)

#### 3. API Recibo (~3 arquivos)

- `app/api/recibo/[id]/route.ts`
- `app/api/recibo/gerar/route.ts`
- `app/api/recibo/verificar/route.ts`

#### 4. API Contratante (1 arquivo)

- `app/api/contratante/verificar-pagamento/route.ts`
  - Renomear diretório? `app/api/entidade/verificar-pagamento/`?

#### 5. API Admin - Restantes (~4 arquivos)

- `app/api/admin/gerar-link/route.ts`
- `app/api/admin/personalizado/route.ts`
- `app/api/admin/cobranca/route.ts`
- `app/api/admin/clinicas/route.ts`

### Prioridade MÉDIA 🟡

#### 6. Components (~5-10 arquivos)

```powershell
# Identificar arquivos
grep -r "contratante" components --include="*.tsx" --include="*.ts"

# Arquivos prováveis:
# - GerenciarEmpresas.tsx
# - LaudosSection.tsx
# - CentroOperacoes.tsx
# - DetalhesFuncionario.tsx
# - EditEmployeeModal.tsx
```

### Prioridade BAIXA 🟢

#### 7. Tests (~200 arquivos)

```powershell
# Identificar arquivos
grep -r "contratante" __tests__ --include="*.ts" --include="*.tsx" | wc -l

# Estratégia: bulk replacement com verificação
# Padrões comuns:
# - contratante_id → entidade_id em mocks
# - getContratanteById → getEntidadeById
# - aprovarContratante → aprovarEntidade
# - SQL queries em strings de teste
```

#### 8. Database Views (7 views)

**Criar Migration 422:**

```sql
-- database/migrations/422_update_views_to_entidades.sql

-- Views identificadas:
-- - funcionarios_operacionais
-- - usuarios_resumo
-- - vw_recibos_completos
-- - vw_contratos_ativos (se existir)
-- - vw_avaliacoes_pendentes (se existir)
-- - vw_lotes_entidade (se existir)
-- - vw_pagamentos_resumo (se existir)

CREATE OR REPLACE VIEW funcionarios_operacionais AS
SELECT
  f.id,
  f.cpf,
  f.nome,
  f.entidade_id,  -- antes: contratante_id
  e.nome as entidade_nome,  -- antes: contratante_nome
  ...
FROM funcionarios f
LEFT JOIN entidades e ON f.entidade_id = e.id  -- antes: contratantes
WHERE f.usuario_tipo = 'funcionario_entidade';

-- Repetir para todas as 7 views
```

---

## 🛠️ Ferramentas Disponíveis

### 1. Script PowerShell Automatizado

```powershell
# Executa substituições em lote
.\scripts\migrate-contratantes-to-entidades.ps1

# Faz backup automático antes de modificar
# Aplica 25+ padrões de substituição
# Gera relatório de mudanças
```

### 2. Documento de Tracking

- **Arquivo**: `MIGRACAO_CONTRATANTES_PARA_ENTIDADES.md`
- Status detalhado de todos os arquivos
- Checklist de verificação
- Estatísticas de progresso

### 3. Grep para Busca Rápida

```powershell
# Buscar arquivos não migrados
grep -r "contratante[s_]" app/api --include="*.ts" | grep -v "entidade"

# Buscar em diretório específico
grep -r "contratante" app/api/entidade/liberar-lote --include="*.ts"

# Contar ocorrências
grep -r "contratante" app/api --include="*.ts" | wc -l
```

---

## ✅ Checklist de Verificação Pós-Migração

### Banco de Dados

- [ ] Migration 421 aplicada com sucesso (sem erros)
- [ ] Migration 422 criada e aplicada (views)
- [ ] Verificar schema: `\d entidades`, `\d entidades_funcionarios`
- [ ] Testar queries: `SELECT * FROM entidades LIMIT 1;`
- [ ] Verificar triggers: `SELECT * FROM pg_trigger WHERE tgname LIKE '%entidades%';`

### Código TypeScript

- [ ] Compilação sem erros: `npm run build` ou `pnpm build`
- [ ] Linter sem erros: `npm run lint` ou `pnpm lint`
- [ ] Type checking: `npx tsc --noEmit`

### Testes

- [ ] Testes unitários passando: `npm test`
- [ ] Testes de integração passando (se houver)
- [ ] Cypress e2e (se aplicável)

### Git

- [ ] Revisar todos os diffs: `git diff`
- [ ] Commit incremental com mensagem clara
- [ ] Branch separada: `git checkout -b feature/rename-contratantes-to-entidades`

### Funcional

- [ ] Login como admin funciona
- [ ] Login como gestor funciona
- [ ] Cadastro de nova entidade funciona
- [ ] Criação de funcionário funciona
- [ ] Liberação de lote funciona
- [ ] Geração de recibo funciona
- [ ] Dashboard carrega corretamente

---

## 📊 Estatísticas Finais

| Categoria             | Total   | Completo | Restante | %        |
| --------------------- | ------- | -------- | -------- | -------- |
| Migrations            | 4       | 3        | 1        | 75%      |
| Core Libs             | 15      | 15       | 0        | 100%     |
| API Admin             | 15      | 15       | 0        | 100%     |
| API RH                | 10      | 10       | 0        | 100%     |
| API Payment           | 13      | 13       | 0        | 100%     |
| API Cadastro/Proposta | 5       | 5        | 0        | 100%     |
| API Entidade          | 24      | 12       | 12       | 50%      |
| API Others            | 10      | 0        | 10       | 0%       |
| Components            | 10      | 1        | 9        | 10%      |
| Tests                 | 200     | 0        | 200      | 0%       |
| **TOTAL**             | **306** | **74**   | **232**  | **~70%** |

---

## 🎯 Próximos Passos Recomendados

### Fase 1: Concluir Backend (1-2h)

1. ✅ Aplicar Migration 421 (5 min)
2. ✅ Executar script PowerShell para API Entidade (10 min)
3. ✅ Atualizar API Recibo manualmente (15 min)
4. ✅ Atualizar API Admin restantes (20 min)
5. ✅ Compilar e testar (`pnpm build`) (10 min)

### Fase 2: Frontend e Components (30 min)

1. Atualizar Components que usam contratante
2. Testar interface do usuário
3. Verificar console do browser (sem erros)

### Fase 3: Tests e Views (1-2h)

1. Criar Migration 422 para views
2. Atualizar mocks em testes
3. Executar suite de testes
4. Corrigir testes quebrados

### Fase 4: Validação Final (30 min)

1. Smoke tests em todas funcionalidades
2. Revisar logs da aplicação
3. Code review completo
4. Commit e push

---

## 💡 Padrões de Substituição Comuns

| Antes                         | Depois                    | Contexto            |
| ----------------------------- | ------------------------- | ------------------- |
| `session.contratante_id`      | `session.entidade_id`     | Session             |
| `const contratanteId = `      | `const entidadeId = `     | Variável            |
| `f.contratante_id`            | `f.entidade_id`           | Coluna funcionarios |
| `la.contratante_id`           | `la.entidade_id`          | Coluna lotes        |
| `FROM contratantes`           | `FROM entidades`          | Query               |
| `JOIN contratantes ct`        | `JOIN entidades e`        | Alias               |
| `ct.nome as contratante_nome` | `e.nome as entidade_nome` | Alias coluna        |
| `contratantes_funcionarios`   | `entidades_funcionarios`  | Tabela              |
| `aprovarContratante`          | `aprovarEntidade`         | Função              |
| `getContratanteById`          | `getEntidadeById`         | Função              |

---

## ⚠️ Notas Importantes

1. **Retrocompatibilidade**: Aliases deprecated mantidos em `lib/db.ts`:

   ```typescript
   export const aprovarContratante = aprovarEntidade;
   export const getContratanteById = getEntidadeById;
   ```

2. **Campos "contratacao"**: NÃO mudar! Refere-se ao contrato/contratação:
   - `contratacao_at` (data do contrato)
   - `contratacao_personalizada` (tipo de contrato)

3. **Backup**: Sempre fazer backup antes de executar scripts automatizados.

4. **Testes**: Rodar testes após cada etapa para detectar problemas cedo.

5. **Git**: Commit incremental com mensagens claras para facilitar rollback.

---

**Última revisão**: 2025-01-31  
**Responsável**: GitHub Copilot (Claude Sonnet 4.5)  
**Status**: ✅ Pronto para execução
