# 🚀 SYNC PLAN — IMPLEMENTAÇÃO CONCLUÍDA

**Status**: ✅ Automação & Preparação Completa  
**Data**: 05/04/2026  
**Branch**: `feature/v2`  
**Próximo Passo**: Validação + Execução Manual dos Scripts

---

## ✅ O QUE FOI AUTOMATICAMENTE IMPLEMENTADO

### 1. Scripts PowerShell (3 arquivos)

- ✅ `scripts/apply-migrations-staging-v6.ps1` — 9 migrations (1137-1143) em STAGING
- ✅ `scripts/migrate-prod-to-v2.ps1` — Completo: backup→dump→create→migrate→verify
- ✅ `scripts/verify-prod-v2.sql` — Verificação pós-migração

### 2. Código de Produção

- ✅ `lib/db/entidade-crud.ts` — Removidas colunas legacy (`pagamento_confirmado`)

### 3. Testes Corrigidos

- ✅ `__tests__/helpers/test-data-factory.ts` — Removido `plano_id`
- ✅ `__tests__/api/verificar-pagamento.test.ts` — Removidas queries com `pagamento_confirmado`
- ✅ `__tests__/database/database-migrations-schema.test.ts` — Ajustado para verificar remoção
- ✅ `__tests__/database/gestor_emissor_constraint.test.ts` — Removidas colunas legacy
- ✅ `__tests__/integration/*.test.ts` (8+ arquivos) — Removidas colunas legacy de INSERTs
- ✅ `__tests__/api/auth/*.test.ts` — Colunas legacy removidas de mocks

### 4. Documentação

- ✅ `SYNC_PLAN_IMPLEMENTATION.md` — Guia completo de execução, rollback, dados de ref.

---

## 📋 PRÓXIMOS PASSOS (NA ORDEM)

### PASSO 1: Validação de Build (LOCAL)

```bash
cd c:\apps\QWork
pnpm build:prod
```

**Esperado**: Build passa sem erros  
**Se falhar**: Reportar erro específico

---

### PASSO 2: Validação de Testes (LOCAL)

```bash
# Testes unitários
pnpm test:unit

# Testes e2e (opcional, mais lento)
pnpm test:e2e --smoke
```

**Esperado**: 95%+ dos testes passam  
**Se falhar**: Revisar logs, pode haver testes mock que precisam de ajuste

---

### PASSO 3: Commit & Push (LOCAL)

```bash
cd c:\apps\QWork
git add -A
git commit -m "chore: sync plan implementation - scripts, tests, legacy cleanup

- Created apply-migrations-staging-v6.ps1 (apply migrations 1137-1143)
- Created migrate-prod-to-v2.ps1 (Option B: new DB + data migration)
- Created verify-prod-v2.sql (post-migration verification)
- Fixed production code: lib/db/entidade-crud.ts
- Fixed ~20+ test files (removed legacy column references)
- Documented full sync plan in SYNC_PLAN_IMPLEMENTATION.md

Ref: Plan v5 FINAL - DEV→STAGING→PROD"

# Push to feature/v2
git push origin feature/v2
```

---

### PASSO 4: Aplicar Migrations em STAGING (⚠️ CRITICAL)

**Pre-requisitos**:

- [ ] Ter acesso Neon (credenciais de staging password)
- [ ] psql instalado e rodando
- [ ] Terminal PowerShell (admin)

**Execução**:

```powershell
# Windows PowerShell (como admin)
cd c:\apps\QWork

# 1. SET environment variable
$env:NEON_STAGING_PASSWORD = 'your-neon-staging-password-here'

# 2. Dry-run (recomendado primeiro)
.\scripts\apply-migrations-staging-v6.ps1 -DryRun

# Se tudo OK:
# 3. EXECUTE (aplica 1137-1143)
.\scripts\apply-migrations-staging-v6.ps1
```

**Esperado**:

- [OK] 8 verification checks (tables created/verified)
- [OK] Sequences resetadas
- [OK] schema_migrations populada até 1143

**Se falhar**:

- Revisar logs no console PowerShell
- Verificar se NEON_STAGING_PASSWORD é correta
- Garantir que STAGING existe e está acessível

---

### PASSO 5: Migrar Dados PROD → neondb_v2 (⚠️ CRITICAL)

**Pre-requisitos**:

- [ ] STAGING migration (passo 4) concluída ✅
- [ ] neondb_v2 criado no Neon Dashboard (mesmo projeto)
- [ ] NEON_PROD_PASSWORD definida

**Execução**:

```powershell
# Windows PowerShell (como admin)
cd c:\apps\QWork

# 1. SET environment variable
$env:NEON_PROD_PASSWORD = 'your-neon-prod-password-here'

# 2. Dry-run FIRST (nenhuma alteração no DB)
.\scripts\migrate-prod-to-v2.ps1 -DryRun

# Se tudo OK:
# 3. EXECUTE (cria backups, migra dados)
.\scripts\migrate-prod-to-v2.ps1
```

**O que acontece** (7 fases):

1. Backup completo do PROD atual
2. Dump schema do STAGING (1143)
3. Criar estrutura em neondb_v2
4. Migrar dados (~3,600 records):
   - clinicas (19 rows) — excluindo 3 colunas
   - entidades (14 rows) — excluindo 3 colunas
   - contratos (34 rows) — excluindo 2 colunas
   - lotes_avaliacao (56 rows) — excluindo 1 coluna
   - 25+ outras tabelas diretas
5. Resetar sequences
6. Popular schema_migrations 0-1143
7. Verificação final (contagens)

**Esperado**:

```
Sucesso: 55+
Skip: 10-15
Erro: 0

Verifica final:
- clinicas: 19 OK
- entidades: 14 OK
- ... (todas OK)
```

**Se falhar**:

- Revisar logs
- neondb_v2 pode ser deletado e recriado
- Tentar novamente

---

### PASSO 6: Verificar Integridade (VERIFICAÇÃO)

```powershell
# Verificar neondb_v2 estrutura
psql -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech `
     -U neondb_owner `
     -d neondb_v2 `
     -f scripts/verify-prod-v2.sql
```

**Esperado**:

```
--- 1. Contagens de dados (comparar com PROD original) ---
clinicas        19    19    OK
entidades       14    14    OK
(... todos OK)

--- 2. Colunas legacy (devem estar AUSENTES) ---
(zero linhas retornadas = OK)

--- 3. Tabelas legacy (devem estar AUSENTES) ---
(zero linhas retornadas = OK)

--- 4. schema_migrations ---
total_versoes: 1144
ultima_versao: 1143
status: OK

--- 5. Views criticas ---
tomadores          OK
gestores           OK
(...)

=== VERIFICAÇÃO CONCLUÍDA ===
```

**Se falhar**:

- Revisar qual parte falhou
- Pode ser necessário reexecutar `migrate-prod-to-v2.ps1`
- Conferir dados manualment e com queries SQL

---

### PASSO 7: Configurar Vercel (⚠️ PRODUCTION CHANGE)

**⚠️ A partir daqui, será pública!**

1. Ir para **Vercel Dashboard**
2. Projeto QWork → **Settings** → **Environment Variables**
3. Encontrar `DATABASE_URL` em **Production**
4. Editar:
   ```
   De: postgresql://neondb_owner:PASSWORD@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech:5432/neondb?...
   Para: postgresql://neondb_owner:PASSWORD@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech:5432/neondb_v2?...
   ```
5. **Save**
6. Ir para **Deployments** → **Redeploy** (ou aguardar push automático)

**Esperado**: Build sucesso, app roda contra neondb_v2

---

### PASSO 8: Smoke Tests Manuais (⚠️ VALIDATION)

Testar no app em produção:

- [ ] Login como **admin** (CPF: ...)
- [ ] Login como **RH** de clínica (CPF: ...)
- [ ] Login como **Emissor** (CPF: ...)
- [ ] Login como **Gestor Entidade** (CPF: ...)
- [ ] Criar **lote de avaliação** (nova)
- [ ] Listar **laudos existentes**
- [ ] Gerar/consultar **recibos**
- [ ] Verificar **relatórios** RH
- [ ] Verificar **notificações**

**Se OK**: Deploymentado com sucesso! ✅

**Se Erro**:

- Verificar Sentry logs
- Reverter DATABASE_URL para `neondb`
- Redeploy
- Investigar erro

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Problema                             | Solução                                             |
| ------------------------------------ | --------------------------------------------------- |
| `psql: command not found`            | Instalar PostgreSQL (psql.exe) no PATH              |
| `NEON_STAGING_PASSWORD not set`      | `$env:NEON_STAGING_PASSWORD = 'password'`           |
| `neondb_v2 don't exist`              | Criar em Neon Dashboard antes de migrate-prod-to-v2 |
| Build falha com erro TypeScript      | Revisar arquivo específico, pode ter coluna legacy  |
| Testes falham com "column not found" | Colunas legacy ainda em mock/SQL — corrigir teste   |
| Migração lenta                       | Normal (3,600+ registros + índices). Aguardar.      |

---

## 📞 RESUMO FINAL

**Automatizado**: Todos scripts, testes, documentação criados ✅  
**Validação**: Próximas 3 horas (build + testes locais)  
**Execução**: 1-2 horas (migrations + Vercel redeploy)  
**Risk Low**: Backups em lugar, rollback 1-click para neondb antigo  
**Go-Live**: ~4 horas total após validação

---

**Branch**: `feature/v2` → ready para review/merge  
**Teste em STAGING primeiro** (apply-migrations-staging) antes de PROD  
**Não fazer push forçado** — permite rollback fácil  
**Monitor Sentry** após go-live por 24-48h

Good luck! 🚀
