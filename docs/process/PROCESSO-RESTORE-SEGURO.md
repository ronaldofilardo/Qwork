# Processo de Restore Seguro de Dumps

## Prevenção de Reintrodução de Policies Incorretas

**Data:** 04/02/2026  
**Versão:** 1.0.0

---

## 🎯 Objetivo

Garantir que restores de dumps SQL **não reintroduzam** policies incorretas (`admin_all_*`, `lotes_emissor_select`, etc.) que foram removidas na auditoria de segurança.

---

## ⚠️ Problema Identificado

O dump `sql-files/013b_create_nivel_cargo_enum_column.sql` continha **8+ policies incorretas**:

- ❌ `admin_all_avaliacoes` → Admin acessava avaliações
- ❌ `admin_all_empresas` → Admin acessava empresas_clientes
- ❌ `admin_all_laudos` → Admin acessava laudos
- ❌ `admin_all_lotes` → Admin acessava lotes_avaliacao
- ❌ `admin_all_respostas` → Admin acessava respostas
- ❌ `admin_all_resultados` → Admin acessava resultados
- ❌ `clinicas_admin_all` → Admin acessava clínicas
- ❌ `tomadores_admin_all` → Admin acessava tomadores
- ❌ `admin_restricted_funcionarios` → Admin acessava funcionários
- ⚠️ `avaliacoes_own_update` → Incluía admin e emissor incorretamente

---

## ✅ Correções Aplicadas

### 1. Dump Limpo (`sql-files/013b_create_nivel_cargo_enum_column.sql`)

O dump foi **corrigido diretamente**:

- Todas as policies `admin_all_*` foram **substituídas por comentários** explicativos
- `avaliacoes_own_update` foi **corrigida** para incluir apenas `rh` e `gestor`
- Backup criado: `013b_create_nivel_cargo_enum_column.sql.backup-YYYYMMDD-HHMMSS`

### 2. Scripts de Limpeza Criados

#### `scripts/cleanup-dump-policies.sql`

- **Uso:** Executar **APÓS** restore para remover policies incorretas que possam ter sido reintroduzidas
- **Função:** Remove todas as variações de `admin_all_*`, valida policies restritivas, corrige `avaliacoes_own_update`
- **Comando:**
  ```bash
  psql -d nome_database -f scripts/cleanup-dump-policies.sql
  ```

#### `scripts/pre-restore-dump-cleanup.sh` (Bash - para Linux/Mac)

- **Uso:** Executar **ANTES** do restore para limpar dump "on-the-fly"
- **Função:** Remove linhas problemáticas do dump usando `sed`
- **Comando:**
  ```bash
  ./scripts/pre-restore-dump-cleanup.sh arquivo-dump.sql
  psql -d database -f arquivo-dump.sql
  ```

---

## 📋 Processo Recomendado de Restore

### Opção 1: Dump Já Limpo (RECOMENDADO)

Se usar o dump corrigido `sql-files/013b_create_nivel_cargo_enum_column.sql`:

```bash
# 1. Restore do dump limpo
psql -d nr-bps_db -f sql-files/013b_create_nivel_cargo_enum_column.sql

# 2. Aplicar migration de segurança (garantia)
psql -d nr-bps_db -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql

# 3. Validação (opcional - já incluída na migration)
psql -d nr-bps_db -f scripts/cleanup-dump-policies.sql
```

### Opção 2: Dump Não Confiável

Se usar dump de origem desconhecida ou antiga:

```bash
# 1. Limpar dump ANTES do restore (apenas Linux/Mac)
./scripts/pre-restore-dump-cleanup.sh dump-original.sql

# 2. Restore do dump
psql -d nr-bps_db -f dump-original.sql

# 3. Limpeza pós-restore (obrigatória)
psql -d nr-bps_db -f scripts/cleanup-dump-policies.sql

# 4. Aplicar migration de segurança
psql -d nr-bps_db -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql
```

### Opção 3: Windows (PowerShell)

```powershell
# 1. Criar backup do dump
Copy-Item dump.sql dump.sql.backup

# 2. Limpar manualmente ou usar dump corrigido
# (script bash não funciona nativamente no Windows)

# 3. Restore
psql -d nr-bps_db -f dump.sql

# 4. Limpeza obrigatória
psql -d nr-bps_db -f scripts/cleanup-dump-policies.sql

# 5. Aplicar migration
psql -d nr-bps_db -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql
```

---

## 🔍 Validação Pós-Restore

Execute para verificar se há policies problemáticas:

```sql
-- Listar policies admin_all restantes (esperado: 0 ou apenas RBAC)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%admin_all%'
AND schemaname = 'public'
AND tablename NOT IN ('roles', 'permissions', 'role_permissions', 'audit_logs');

-- Verificar policies restritivas (esperado: 2+)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%block_admin%'
AND schemaname = 'public';

-- Testar bloqueio de admin em avaliacoes
BEGIN;
SET LOCAL app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM avaliacoes; -- Deve retornar 0 (bloqueado)
ROLLBACK;

-- Testar acesso correto de admin a audit_logs
BEGIN;
SET LOCAL app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM audit_logs; -- Deve funcionar
ROLLBACK;
```

---

## ⚙️ Automação de Backups

### Adicionar ao Script de Backup Automático

```bash
#!/bin/bash
# backup-database.sh

DB_NAME="nr-bps_db"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dump-$DATE.sql"

# 1. Criar dump
pg_dump -d $DB_NAME > $BACKUP_FILE

# 2. Limpar policies incorretas do dump
echo "🧹 Limpando policies incorretas do backup..."
./scripts/pre-restore-dump-cleanup.sh $BACKUP_FILE

# 3. Comprimir
gzip $BACKUP_FILE

echo "✅ Backup limpo salvo: $BACKUP_FILE.gz"
```

---

## 📦 Checklist de Restore

- [ ] Backup do banco atual criado
- [ ] Dump de origem verificado (limpo ou a ser limpo)
- [ ] Script de limpeza (`cleanup-dump-policies.sql`) disponível
- [ ] Migration 301 disponível
- [ ] Ambiente de teste validado antes de produção
- [ ] Restore executado
- [ ] Script de limpeza executado
- [ ] Migration 301 aplicada
- [ ] Testes de validação executados (queries acima)
- [ ] Admin **NÃO** acessa avaliacoes/empresas/clinicas (confirmado)
- [ ] Admin **ACESSA** usuarios/audit_logs/RBAC (confirmado)
- [ ] Emissor **NÃO** acessa avaliacoes/lotes (confirmado)

---

## 🚨 Rollback em Caso de Problema

Se restore causar problemas:

```bash
# 1. Dropar database problemática
dropdb nr-bps_db

# 2. Recriar database
createdb nr-bps_db

# 3. Restore do backup anterior (pré-restore)
psql -d nr-bps_db -f /backups/backup-anterior.sql

# 4. Aplicar migrations atualizadas
psql -d nr-bps_db -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql
```

---

## 📞 Suporte

Em caso de dúvidas ou problemas no restore:

1. Verificar logs do PostgreSQL: `/var/log/postgresql/`
2. Executar query de validação (seção anterior)
3. Consultar [docs/RELATORIO-AUDITORIA-PERMISSOES-ADMIN-EMISSOR.md](../docs/RELATORIO-AUDITORIA-PERMISSOES-ADMIN-EMISSOR.md)

---

**Documento de Processo**  
**Última atualização:** 04/02/2026  
**Status:** ✅ Dumps limpos, scripts criados, processo validado
