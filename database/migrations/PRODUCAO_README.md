# 🔄 Sincronização do Banco de Produção - Confirmação de Identidade

> **Data:** 12/02/2026  
> **Objetivo:** Sincronizar banco de produção com funcionalidade de confirmação de identidade implementada em DEV  
> **Status:** ⏳ Pronto para execução

---

## 📚 Índice

- [Visão Geral](#visão-geral)
- [Arquivos Criados](#arquivos-criados)
- [Histórico de Migrações](#histórico-de-migrações)
- [Guia Rápido](#guia-rápido)
- [Execução Manual](#execução-manual)
- [Execução Automatizada](#execução-automatizada)
- [Verificação](#verificação)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Contexto

Durante a implementação da funcionalidade de **aceite de termos** e **confirmação de identidade** no ambiente DEV, foram criadas as seguintes migrações:

| Migração | Descrição                             | Status                  |
| -------- | ------------------------------------- | ----------------------- |
| **1012** | Criou tabela `confirmacao_identidade` | ❌ Trigger problemático |
| **1013** | Tornou `avaliacao_id` NULLABLE        | ✅ Correção aplicada    |
| **1014** | Removeu trigger de auditoria          | ✅ Correção aplicada    |

### Solução

Este pacote de sincronização **consolida as 3 migrações** em um único script otimizado que:

- ✅ Cria a tabela `confirmacao_identidade` já com as correções aplicadas
- ✅ Campo `avaliacao_id` já é NULLABLE desde o início
- ✅ **NÃO cria** o trigger problemático
- ✅ Inclui todas as políticas RLS e índices necessários
- ✅ É totalmente transacional (rollback automático em caso de erro)

---

## 📁 Arquivos Criados

### 1️⃣ Script Principal de Migração

**`PRODUCAO_sync_confirmacao_identidade.sql`**

- Script SQL consolidado para aplicação em produção
- Inclui validações pré e pós-execução
- Transacional (BEGIN/COMMIT)
- Saída verbosa com status de cada etapa

### 2️⃣ Guia de Execução

**`PRODUCAO_GUIA_EXECUCAO.md`**

- Documentação completa passo a passo
- Pré-requisitos e verificações
- Instruções de backup
- Checklist de validação
- Próximos passos pós-migração

### 3️⃣ Script de Verificação

**`PRODUCAO_verificacao.sql`**

- Valida estado do banco antes e depois da migração
- Verifica tabelas, índices, RLS, constraints
- Pode ser executado múltiplas vezes sem efeitos colaterais
- Útil para diagnóstico

### 4️⃣ Executor Automatizado (PowerShell)

**`PRODUCAO_executar_migracao.ps1`**

- Script PowerShell para execução automatizada
- Inclui backup automático
- Verificações pré e pós-migração
- Suporte a dry-run
- Tratamento de erros
- Output com cores e emojis

### 5️⃣ Rollback de Emergência

**`PRODUCAO_rollback_emergencia.sql`**

- Remove a tabela `confirmacao_identidade` em caso de problemas
- Cria backup automaticamente antes de remover
- Validações de segurança
- Instruções para restauração

---

## 📜 Histórico de Migrações

### Migrações Aplicadas em DEV

#### 1012_create_confirmacao_identidade.sql

```sql
-- PROBLEMA: Criou trigger com referência a colunas inexistentes
CREATE TABLE confirmacao_identidade (
  id SERIAL PRIMARY KEY,
  avaliacao_id INTEGER NOT NULL,  -- ❌ NOT NULL causou problemas
  ...
);

CREATE TRIGGER trigger_auditoria_confirmacao_identidade
  AFTER INSERT ON confirmacao_identidade
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria_confirmacao_identidade();
  -- ❌ Trigger fazia INSERT em colunas que não existem
```

#### 1013_make_confirmacao_identidade_avaliacao_id_nullable.sql

```sql
-- CORREÇÃO: Tornou avaliacao_id NULLABLE
ALTER TABLE confirmacao_identidade
  ALTER COLUMN avaliacao_id DROP NOT NULL;
```

#### 1014_remove_trigger_auditoria_confirmacao_identidade.sql

```sql
-- CORREÇÃO: Removeu trigger problemático
DROP TRIGGER IF EXISTS trigger_auditoria_confirmacao_identidade
  ON confirmacao_identidade;
DROP FUNCTION IF EXISTS registrar_auditoria_confirmacao_identidade();
```

### Migração Consolidada para PROD

A migração `PRODUCAO_sync_confirmacao_identidade.sql` cria a tabela **diretamente com todas as correções**, evitando os problemas encontrados em DEV:

```sql
CREATE TABLE confirmacao_identidade (
  id SERIAL PRIMARY KEY,
  avaliacao_id INTEGER,  -- ✅ Já é NULLABLE
  ...
);

-- ✅ NÃO cria o trigger problemático
```

---

## ⚡ Guia Rápido

### Opção 1: Execução Automatizada (Recomendado)

```powershell
# 1. Navegar até o diretório
cd c:\apps\QWork

# 2. Dry run (sem fazer alterações)
.\database\migrations\PRODUCAO_executar_migracao.ps1 -DryRun

# 3. Executar de verdade
.\database\migrations\PRODUCAO_executar_migracao.ps1
```

### Opção 2: Execução Manual

```bash
# 1. Conectar ao banco
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# 2. Executar verificação pré-migração
\i database/migrations/PRODUCAO_verificacao.sql

# 3. Executar migração
\i database/migrations/PRODUCAO_sync_confirmacao_identidade.sql

# 4. Executar verificação pós-migração
\i database/migrations/PRODUCAO_verificacao.sql
```

---

## 🔧 Execução Manual Detalhada

### Pré-requisitos

1. **PostgreSQL Client instalado**

   ```bash
   psql --version
   # Deve retornar: psql (PostgreSQL) 14.x ou superior
   ```

2. **Acesso ao banco de produção**
   ```bash
   psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c "SELECT current_database();"
   ```

### Passos

#### 1. Backup (Recomendado)

```bash
pg_dump \
  -h ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  --schema-only \
  -t avaliacoes \
  -t funcionarios \
  -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Verificação Pré-Migração

```bash
psql 'postgresql://neondb_owner:...' -f database/migrations/PRODUCAO_verificacao.sql
```

Deve mostrar:

- ✗ Tabela confirmacao_identidade: NÃO EXISTE

#### 3. Executar Migração

```bash
psql 'postgresql://neondb_owner:...' -f database/migrations/PRODUCAO_sync_confirmacao_identidade.sql
```

Aguarde as mensagens:

- ✓ Validação concluída com sucesso
- ✓ Tabela confirmacao_identidade criada
- ✓ RLS habilitado
- ✓ 5 políticas RLS criadas
- MIGRAÇÃO CONCLUÍDA COM SUCESSO!

#### 4. Verificação Pós-Migração

```bash
psql 'postgresql://neondb_owner:...' -f database/migrations/PRODUCAO_verificacao.sql
```

Deve mostrar:

- ✓ Tabela confirmacao_identidade: EXISTE
- ✓ RLS: HABILITADO
- ✓ Políticas RLS: 5
- ✓ Índices: 4

---

## 🤖 Execução Automatizada (PowerShell)

### Parâmetros Disponíveis

```powershell
.\PRODUCAO_executar_migracao.ps1 [opções]

Opções:
  -DryRun              # Simula execução sem fazer alterações
  -SkipBackup          # Pula criação de backup
  -SkipVerification    # Pula verificações pré/pós-migração
```

### Exemplos

```powershell
# Dry run (testar sem executar)
.\database\migrations\PRODUCAO_executar_migracao.ps1 -DryRun

# Execução normal (com backup e verificações)
.\database\migrations\PRODUCAO_executar_migracao.ps1

# Execução sem backup (não recomendado)
.\database\migrations\PRODUCAO_executar_migracao.ps1 -SkipBackup

# Execução rápida (sem verificações)
.\database\migrations\PRODUCAO_executar_migracao.ps1 -SkipVerification
```

### Output Esperado

```
╔════════════════════════════════════════════════════════════════╗
║  MIGRAÇÃO DE PRODUÇÃO - confirmacao_identidade                 ║
║  Data: 12/02/2026 14:30:45                                     ║
╚════════════════════════════════════════════════════════════════╝

1. VERIFICANDO PRÉ-REQUISITOS
══════════════════════════════════════════════════════════════════
✓ PostgreSQL client instalado
✓ Arquivo de migração encontrado

2. VERIFICAÇÃO PRÉ-MIGRAÇÃO
══════════════════════════════════════════════════════════════════
...

3. CRIANDO BACKUP
══════════════════════════════════════════════════════════════════
✓ Backup criado: database/backups/backup_pre_migration_20260212_143045.sql

4. VERIFICAÇÃO FINAL
══════════════════════════════════════════════════════════════════
✓ Tabela não existe - pronto para migração

5. EXECUTANDO MIGRAÇÃO
══════════════════════════════════════════════════════════════════
✓ Migração executada com sucesso!

6. VERIFICAÇÃO PÓS-MIGRAÇÃO
══════════════════════════════════════════════════════════════════
✓ Tabela confirmacao_identidade criada
✓ RLS habilitado
✓ 5 políticas RLS criadas
✓ 4 índices criados

╔════════════════════════════════════════════════════════════════╗
║  MIGRAÇÃO CONCLUÍDA COM SUCESSO!                               ║
╚════════════════════════════════════════════════════════════════╝
```

---

## ✅ Verificação

### Comando Rápido

```sql
-- Verificar se tabela existe e está configurada
SELECT
  'confirmacao_identidade' as tabela,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'confirmacao_identidade') as politicas_rls,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'confirmacao_identidade') as indices
FROM confirmacao_identidade;
```

### Script Completo de Verificação

```bash
psql 'postgresql://neondb_owner:...' -f database/migrations/PRODUCAO_verificacao.sql
```

Este script verifica:

- ✅ Existência da tabela
- ✅ Estrutura (colunas, tipos, nullable)
- ✅ Constraints (PK, FKs, CHECK)
- ✅ Índices (quantidade e definições)
- ✅ RLS habilitado
- ✅ Políticas RLS (5 esperadas)
- ✅ Roles necessárias
- ✅ Integridade dos dados

---

## 🔙 Rollback

### Quando Fazer Rollback?

Execute rollback SE:

- ❌ A migração causou erros na aplicação
- ❌ Há problemas de performance severos
- ❌ Foram descobertos bugs críticos na funcionalidade

⚠️ **NÃO** faça rollback SE:

- ✅ A migração foi executada com sucesso
- ✅ Os testes passaram
- ✅ Apenas para "limpar" - tabela vazia não causa problemas

### Como Fazer Rollback

```bash
# Conectar ao banco
psql 'postgresql://neondb_owner:...'

# Executar rollback
\i database/migrations/PRODUCAO_rollback_emergencia.sql

# O script irá:
# 1. Fazer backup dos dados existentes
# 2. Pedir confirmação (digite "CONFIRMAR ROLLBACK")
# 3. Remover políticas RLS
# 4. Remover tabela
# 5. Validar remoção
```

### Restaurar Após Rollback

Se você precisar restaurar os dados após um rollback:

```sql
-- 1. Recriar a tabela (executar migração novamente)
\i database/migrations/PRODUCAO_sync_confirmacao_identidade.sql

-- 2. Restaurar dados do backup
INSERT INTO confirmacao_identidade
SELECT * FROM confirmacao_identidade_backup_YYYYMMDD_HHMMSS;

-- 3. Verificar
SELECT COUNT(*) FROM confirmacao_identidade;

-- 4. Remover backup quando não precisar mais
DROP TABLE confirmacao_identidade_backup_YYYYMMDD_HHMMSS;
```

---

## 🐛 Troubleshooting

### Erro: "Tabela já existe"

**Causa:** Migração já foi executada anteriormente.

**Solução:**

```sql
-- Verificar se a tabela existe
SELECT * FROM pg_tables WHERE tablename = 'confirmacao_identidade';

-- Se existe e está correta, não precisa fazer nada
-- Se existe mas está incorreta, faça rollback e execute novamente
```

### Erro: "Role não existe"

**Causa:** Roles necessárias não foram criadas.

**Solução:**

```sql
-- Verificar roles
SELECT rolname FROM pg_roles
WHERE rolname IN ('funcionario_role', 'rh_role', 'gestor_entidade_role', 'admin_role', 'emissor_role');

-- Criar roles faltantes (ajustar conforme necessário)
CREATE ROLE funcionario_role;
CREATE ROLE rh_role;
-- ... etc
```

### Erro: "Tabela avaliacoes não existe"

**Causa:** Dependência não encontrada.

**Solução:**

```sql
-- Verificar se as tabelas de dependência existem
SELECT tablename FROM pg_tables
WHERE tablename IN ('avaliacoes', 'funcionarios');

-- Se não existirem, há um problema maior no banco
-- Não execute a migração até corrigir
```

### Migração Travou / Timeout

**Causa:** Possível lock em tabelas relacionadas.

**Solução:**

```sql
-- Ver locks ativos
SELECT * FROM pg_locks WHERE NOT granted;

-- Ver queries em execução
SELECT pid, query, state, wait_event
FROM pg_stat_activity
WHERE state != 'idle';

-- Se necessário, cancelar query específica
SELECT pg_cancel_backend(PID);

-- Ou terminar conexão (mais drástico)
SELECT pg_terminate_backend(PID);
```

### RLS Não Está Funcionando

**Causa:** RLS pode estar desabilitado ou políticas incorretas.

**Solução:**

```sql
-- Verificar se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'confirmacao_identidade';

-- Habilitar RLS se necessário
ALTER TABLE confirmacao_identidade ENABLE ROW LEVEL SECURITY;

-- Listar políticas
SELECT * FROM pg_policies WHERE tablename = 'confirmacao_identidade';

-- Recriar políticas se necessário
-- (copiar do arquivo PRODUCAO_sync_confirmacao_identidade.sql)
```

---

## 📊 Monitoramento Pós-Deploy

### Queries Úteis

```sql
-- Total de confirmações
SELECT COUNT(*) as total
FROM confirmacao_identidade;

-- Confirmações por dia
SELECT
  DATE(confirmado_em) as data,
  COUNT(*) as total
FROM confirmacao_identidade
GROUP BY DATE(confirmado_em)
ORDER BY data DESC;

-- Confirmações recentes
SELECT
  id,
  funcionario_cpf,
  avaliacao_id,
  confirmado_em,
  ip_address
FROM confirmacao_identidade
ORDER BY confirmado_em DESC
LIMIT 10;

-- Confirmações sem avaliação (contexto de login)
SELECT COUNT(*) as total_login
FROM confirmacao_identidade
WHERE avaliacao_id IS NULL;

-- Top IPs
SELECT
  ip_address,
  COUNT(*) as total
FROM confirmacao_identidade
GROUP BY ip_address
ORDER BY total DESC
LIMIT 10;
```

---

## 📞 Checklist Final

Antes de considerar a sincronização completa:

- [ ] Backup realizado
- [ ] Script de verificação executado (PRÉ-migração)
- [ ] Migração executada sem erros
- [ ] Mensagens de sucesso visualizadas
- [ ] Script de verificação executado (PÓS-migração)
- [ ] Tabela confirmacao_identidade existe
- [ ] RLS habilitado (5 políticas)
- [ ] 4 índices criados
- [ ] Deploy do código da aplicação planejado
- [ ] Monitoramento configurado
- [ ] Equipe notificada

---

## 📝 Registro de Execução

**Data de Execução:** **_/_**/**\_\_**  
**Executado por:** ********\_********  
**Método:** [ ] Manual [ ] Automatizado  
**Status:** [ ] Sucesso [ ] Falha [ ] Rollback

**Tempo de Execução:** **\_\_\_\_** segundos  
**Backup Criado:** [ ] Sim [ ] Não  
**Arquivo de Backup:** **********\_\_\_**********

**Observações:**

---

---

---

---

**Criado em:** 12/02/2026  
**Última atualização:** 12/02/2026  
**Versão:** 1.0
