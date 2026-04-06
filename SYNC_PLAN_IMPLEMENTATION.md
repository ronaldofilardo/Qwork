# Sync Plan Implementation — Status Report

**Date**: 05/04/2026  
**Branch**: feature/v2  
**Objetivo**: Sincronizar PROD (neondb) com STAGING (neondb_staging) para colocar sistema em produção

---

## ✅ CONCLUÍDO

### 1. Scripts Criados

#### Etapa 1: DEV → STAGING (1137-1143 apply)

- **Arquivo**: `scripts/apply-migrations-staging-v6.ps1` ✅ CRIADO
- **Descrição**: Aplica 9 migrations (1137-1143) em STAGING
- **Features**:
  - Dry-run mode support (`-DryRun`)
  - 8 post-apply verification checks
  - Precisa de `NEON_STAGING_PASSWORD` env var
- **Execução**: `$env:NEON_STAGING_PASSWORD = '...'; .\scripts\apply-migrations-staging-v6.ps1`

#### Etapa 2: STAGING → PROD (DB novo com migrate data)

- **Arquivo**: `scripts/migrate-prod-to-v2.ps1` ✅ CRIADO
- **Descrição**: Opção B — cria neondb_v2, migra dados com transformações
- **Features**:
  - 7 fases completas:
    1. Backup do PROD atual
    2. Dump schema do STAGING
    3. Aplicar schema em neondb_v2
    4. Migrar dados (com exclusão de colunas legacy)
    5. Resetar sequences
    6. Popular schema_migrations
    7. Verificação final
  - Precisa de `NEON_PROD_PASSWORD` env var
  - Suporta `-DryRun`, `-SkipBackup`, `-SkipSchemaDump`
- **Column Filtering** (transformações aplicadas):
  - **clinicas**: Excluir `pagamento_confirmado`, `data_liberacao_login`, `plano_id`
  - **entidades**: Excluir `pagamento_confirmado`, `data_liberacao_login`, `plano_id`
  - **contratos**: Excluir `plano_id`, `valor_personalizado`
  - **lotes_avaliacao**: Excluir `contratante_id`
- **Execução**: `$env:NEON_PROD_PASSWORD = '...'; .\scripts\migrate-prod-to-v2.ps1`

#### Etapa 3: Verificação Pós-Migração

- **Arquivo**: `scripts/verify-prod-v2.sql` ✅ CRIADO
- **Descrição**: SQL script que verifica integridade do neondb_v2
- **Verifica**:
  - Contagens de tabelas críticas (devem igualar PROD)
  - Colunas legacy estão ausentes
  - Tabelas legacy foram removidas
  - schema_migrations está populado
  - Views e functions críticas existem
  - RLS policies estão ativas
  - FKs são válidas
  - Sequences sincronizadas
- **Execução**: `psql -h ... -U ... -d neondb_v2 -f scripts/verify-prod-v2.sql`

### 2. Código de Produção Corrigido

#### `lib/db/entidade-crud.ts` ✅ CORRIGIDO

- **Problema**: INSERT SQL incluía `pagamento_confirmado` (coluna dropada)
- **Linhas 208 e 255**: Removidas 2 referências de `pagamento_confirmado` em INSERTs
- **Status**: PRONTO PARA STAGING

### 3. Tests Corrigidos

#### Arquivos-chave corrigidos:

| Arquivo                                                                 | Problema                           | Status       |
| ----------------------------------------------------------------------- | ---------------------------------- | ------------ |
| `__tests__/helpers/test-data-factory.ts`                                | `plano_id` interface & SQL         | ✅ CORRIGIDO |
| `__tests__/api/verificar-pagamento.test.ts`                             | UPDATE SQL + assertions            | ✅ CORRIGIDO |
| `__tests__/database/gestor_emissor_constraint.test.ts`                  | INSERT SQL pagamento_confirmado    | ✅ CORRIGIDO |
| `__tests__/database/database-migrations-schema.test.ts`                 | data_liberacao_login test          | ✅ CORRIGIDO |
| `__tests__/integration/entidades-gestores.test.ts`                      | INSERT SQL pagamento_confirmado    | ✅ CORRIGIDO |
| `__tests__/integration/isolamento-entidade-clinica.test.ts`             | INSERT SQL pagamento_confirmado    | ✅ CORRIGIDO |
| `__tests__/integration/funcionario-entidade-create.integration.test.ts` | INSERT SQL pagamento_confirmado    | ✅ CORRIGIDO |
| `__tests__/integration/rls-isolamento-rh-gestor.test.ts`                | 2x INSERT SQL pagamento_confirmado | ✅ CORRIGIDO |
| `__tests__/api/auth/login-compat.test.ts`                               | Mock data pagamento_confirmado     | ✅ CORRIGIDO |
| `__tests__/api/admin/gerar-link-retomada.test.ts`                       | Mock pagamento_confirmado          | ✅ CORRIGIDO |
| `__tests__/integration/cadastro-endpoints-criticos.test.ts`             | Assertion pagamento_confirmado     | ✅ CORRIGIDO |

**Total de testes corrigidos**: ~20+ arquivos

---

## 🔄 PRÓXIMOS PASSOS

### 1. Validação de Build (NEXT)

```bash
cd c:\apps\QWork
pnpm build:prod
```

- Verificar se há erros de TypeScript/compilação
- Corrigir qualquer problema remanescente

### 2. Executar Testes

```bash
pnpm test:unit              # Vitest
pnpm test:e2e              # Cypress
```

### 3. Executar Scripts de Migração

**IMPORTANTE**: Executar em ordem!

#### 3a. Aplicar migrations 1137-1143 em STAGING

```powershell
$env:NEON_STAGING_PASSWORD = 'your-password-here'
.\scripts\apply-migrations-staging-v6.ps1 -DryRun   # Test first!
.\scripts\apply-migrations-staging-v6.ps1           # Execute
```

#### 3b. Migrar PROD → neondb_v2

```powershell
$env:NEON_PROD_PASSWORD = 'your-password-here'
.\scripts\migrate-prod-to-v2.ps1 -DryRun            # Test first!
.\scripts\migrate-prod-to-v2.ps1                    # Execute
```

#### 3c. Verificar Integridade do neondb_v2

```powershell
psql -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech \
     -U neondb_owner -d neondb_v2 \
     -f scripts/verify-prod-v2.sql
```

### 4. Trocar DATABASE_URL no Vercel

- **Vercel Dashboard** → Production environment
- `DATABASE_URL` deve apontar para `neondb_v2` (em vez de `neondb`)
- Formato: `postgresql://neondb_owner:PASSWORD@...:5432/neondb_v2?...`

### 5. Redeploy na Produção

- Accionar redeploy do branch `staging` no Vercel
- Aguardar conclusão do build

### 6. Smoke Tests (MANUAL)

- Login como admin
- Login como RH (clínica)
- Login como emissor
- Login como gestor entidade
- Criar lote de avaliação
- Emitir laudo
  -Verificar recibo

---

## 📊 Dados de Referência

### PROD Database Status

| Item              | Valor                                            |
| ----------------- | ------------------------------------------------ |
| Host              | `ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech` |
| Database          | `neondb`                                         |
| Current Migration | **1101**                                         |
| Total Tables      | 65                                               |
| Total Records     | ~3,600                                           |

### Gap Analysis

| Componente     | PROD | STAGING | Gap                   |
| -------------- | ---- | ------- | --------------------- |
| migrations_max | 1101 | 1143    | 42                    |
| tabelas        | 65   | 60      | -5 (legacy removidas) |

### Data Counts (PROD snapshot)

```
clinicas:           19
entidades:          14
empresas_clientes:  20
funcionarios:       124
avaliacoes:         148
respostas:          3173
lotes_avaliacao:    56
laudos:             45
contratos:          34
pagamentos:         36
usuarios:           32
```

---

## ⚠️ COLUNAS REMOVIDAS (Migration 1137b)

Estas colunas foram removidas e os scripts as **excluem** durante a migração de dados:

```
clinicas.pagamento_confirmado
clinicas.data_liberacao_login
clinicas.plano_id

entidades.pagamento_confirmado
entidades.data_liberacao_login
entidades.plano_id

contratos.plano_id
contratos.valor_personalizado

lotes_avaliacao.contratante_id  → (substituída por entidade_id)
```

---

## 🛡️ Rollback Planning

### Se algo der errado em STAGING:

1. Restaurar backup PostgreSQL Neon (última snapshot antes das migrations)
2. Re-executar `apply-migrations-staging-v6.ps1`
3. Debugar erro específico
4. Corrigir migration ou teste conforme necessário

### Se algo der errado em PROD:

1. **NÃO fazer nada precipitadamente**
2. `neondb` antigo fica intacto como fallback
3. Restaurar `DATABASE_URL` no Vercel apontando para `neondb`
4. Redeploy para voltar a usar banco antigo
5. Investigar erro em `neondb_v2` off-line
6. Repetir migração quando estiver confortável

---

## 📋 Checklist Pré-Produção

- [ ] `pnpm build:prod` passa sem erros
- [ ] `pnpm test:unit` passa (Vitest)
- [ ] `pnpm test:e2e` passa (Cypress smoke tests)
- [ ] apply-migrations-staging-v6.ps1 executa com sucesso
- [ ] migrate-prod-to-v2.ps1 executa com sucesso
- [ ] verify-prod-v2.sql mostra todas verificações OK
- [ ] DATABASE_URL alterada no Vercel (Production)
- [ ] Redeploy Vercel concluído
- [ ] Smoke tests manuais passam
- [ ] neondb antigo mantido 2 semanas (fallback)
- [ ] Monitorar logs Sentry em produção

---

## 📝 Resumo Técnico

### Migrações Aplicadas (1102-1143)

- **A**: Infra (sessions, audit)
- **B**: Elegibilidade (representantes, vinculos)
- **C**: Login flow (data_liberacao_login)
- **D**: Leads (leads_representante)
- **E**: Comissões (comissionamento)
- **F**: Cleanup/Planos (tabelas legacy)
- **G**: Final fixes (FKs, sequences)

### Schema Sync Guarantees

- Todas as 60+ tabelas do STAGING estarão em neondb_v2
- Dados replicados com integridade (FKs, sequences reset)
- Legacy columns excluídas (confirma remocção)
- RLS policies ativas (segurança)
- ENUMs sincronizados (status, perfis, etc.)

---

## ❓ FAQ

**P: E se a migração de dados for lenta?**  
R: Os INSERTs via COPY FROM são otimizados. Se muito lento, aumentar timeout em migrate-prod-to-v2.ps1.

**P: Quantas regiões Neon?**  
R: Uma (sa-east-1). PROD e STAGING no mesmo projeto.

**P: Preciso de downtime?**  
R: ~30-60min durante o redeploy. Scripts de migração rodam sem downtime (OFF-LINE).

**P: Como lidar com usuários conectados?**  
R: Usar session middleware para disconnect automático ao trocar DATABASE_URL.

---

## Contato/Suporte

Autor: AI Assistant (GitHub Copilot)  
Data implantação: 05/04/2026  
Branch: feature/v2  
Status: **PRONTO PARA TEESTING → STAGING → PRODUÇÃO**
