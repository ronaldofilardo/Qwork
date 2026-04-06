# SYNC PLAN v5 — STATUS DE IMPLEMENTAÇÃO

**Data**: 05/04/2026  
**Status**: ✅ **100% Implementado - Aguardando Execução Manual**

---

## ✅ IMPLEMENTAÇÃO AUTOMÁTICA COMPLETA

### Scripts Criados

- ✅ `scripts/apply-migrations-staging-v6.ps1` — STAGING migrations (1137-1143)
- ✅ `scripts/migrate-prod-to-v2.ps1` — PROD migration (→ neondb_v2)
- ✅ `scripts/verify-prod-v2.sql` — Verificação pós-migração

### Código Corrigido

- ✅ `lib/db/entidade-crud.ts` — Removidas colunas legacy
- ✅ ~20+ test files — Removidas referências a colunas dropadas
- ✅ Documentação completa criada

---

## ❌ EXECUÇÃO DE MIGRAÇÕES

**Status**: Não foi possível executar automaticamente (credenciais Neon não acessíveis via CLI)

**Próximas Ações**: O usuário deve executar manualmente os scripts PowerShell

---

## 🚀 INSTRUÇÕES PARA EXECUÇÃO MANUAL

### ETAPA 1: Aplicar Migrations em STAGING (1137-1143)

```powershell
# Abrir PowerShell (como admin)
cd c:\apps\QWork

# 1. Definir senha STAGING
$env:NEON_STAGING_PASSWORD = 'sua_senha_staging'

# 2. Dry-run FIRST (nenhuma alteração)
.\scripts\apply-migrations-staging-v6.ps1 -DryRun

# 3. Se OK, executar PARA VALER
.\scripts\apply-migrations-staging-v6.ps1
```

**Esperado**:

- ✅ 8 verification checks passam
- ✅ schema_migrations atualizada até 1143
- ✅ Nenhum erro crítico

---

### ETAPA 2: Migrar Dados PROD → neondb_v2

**PRÉ-REQUISITO**: Etapa 1 concluída com sucesso ✓

```powershell
# 1. Criar banco neondb_v2 no Neon Dashboard (antes de rodar)
#    Settings → Databases → Add Database → neondb_v2

# 2. Definir senha PROD
$env:NEON_PROD_PASSWORD = 'sua_senha_prod'

# 3. Dry-run FIRST
.\scripts\migrate-prod-to-v2.ps1 -DryRun

# 4. Se OK, executar
.\scripts\migrate-prod-to-v2.ps1
```

**O que acontece** (7 fases):

1. Backup completo PROD
2. Dump schema STAGING
3. Criar estrutura neondb_v2
4. Migrar ~3,600 registros (com transformações)
5. Resetar sequences
6. Popular schema_migrations 0-1143
7. Verificação final

**Esperado**:

```
Sucesso: 55+
Skip: 10-15
Erro: 0
```

---

### ETAPA 3: Verificar Integridade (Pós-Migration)

```powershell
$env:PGPASSWORD = 'sua_senha_prod'

psql -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech `
     -U neondb_owner `
     -d neondb_v2 `
     -f scripts\verify-prod-v2.sql
```

**Esperado**:

- Todas contagens OK (clinicas=19, entidades=14, etc.)
- Colunas legacy ausentes
- Tabelas legacy ausentes
- Views e functions OK

---

### ETAPA 4: Configurar Vercel (Production Change)

1. Vercel Dashboard → Settings → Environment Variables
2. Edit `DATABASE_URL` (Production)
3. Mudar de `…/neondb?…` para `…/neondb_v2?…`
4. Save → Redeploy

---

## 📊 DADOS DE REFERÊNCIA

| Item                    | Valor                                  |
| ----------------------- | -------------------------------------- |
| PROD Current Version    | 1101                                   |
| STAGING Current Version | 1136 →需要升级到→ 1143                 |
| PROD Table Count        | 65                                     |
| PROD Records            | ~3,600                                 |
| Migrations to Apply     | 1137-1143 (7 migrations)               |
| Data Gap                | 42 complete migrations already in code |

---

## ⚠️ CHECKLIST PRÉ-EXECUÇÃO

- [ ] Senhas Neon disponíveis (staging + prod)
- [ ] psql (PostgreSQL CLI) instalado → `psql --version`
- [ ] pg_dump disponível → `pg_dump --version`
- [ ] Acesso direto aos bancos Neon confirmado
- [ ] neondb_v2 criado no Neon Dashboard (antes de Etapa 2)
- [ ] Backup atual PROD em lugar seguro (scripts criam também)
- [ ] Pronto para downtime ~1-2 horas (migrations + Vercel redeploy)

---

## 🆘 TROUBLESHOOTING

| Erro                                    | Solução                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `psql: command not found`               | Instalar PostgreSQL → https://www.postgresql.org/download/ |
| `FATAL: password authentication failed` | Verificar senha NEON_STAGING_PASSWORD / NEON_PROD_PASSWORD |
| `could not translate host name …`       | Verificar conexão internet, URL Neon hosts                 |
| `column "…" does not exist`             | Script tentando dropar coluna já removida — é OK, rerun    |
| `Error: neondb_v2 doesn't exist`        | Criar em Neon Dashboard antes de rodar migrate-prod-to-v2  |

---

## 📝 PRÓXIMAS ETAPAS

**IMEDIATO** (5 min): Você executa Etapa 1 (STAGING)

```powershell
$env:NEON_STAGING_PASSWORD = 'xyz'
.\scripts\apply-migrations-staging-v6.ps1
```

**+15 min**: Você executa Etapa 2 (PROD)

```powershell
$env:NEON_PROD_PASSWORD = 'xyz'
.\scripts\migrate-prod-to-v2.ps1
```

**+5 min**: Você executa Etapa 3 (Verify)

```powershell
psql ... -f scripts\verify-prod-v2.sql
```

**+10 min**: Você atualiza Vercel DATABASE_URL + Redeploy

**Total**: ~40 minutos até go-live

---

## ✨ RESUMO FINAL

| Componente                | Status                            |
| ------------------------- | --------------------------------- |
| Plano v5 Implementação    | ✅ 100% COMPLETO                  |
| Scripts criados           | ✅ 3 arquivos                     |
| Código corrigido          | ✅ 21+ arquivos                   |
| Documentação              | ✅ COMPLETA                       |
| **Execução de Migrações** | ⏳ **AGUARDANDO AÇÃO DO USUÁRIO** |

**Tudo pronto. Você só precisa rodar os scripts PowerShell na sequência.**

Sucesso! 🚀
