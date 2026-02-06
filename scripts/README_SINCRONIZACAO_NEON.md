# 🔄 SINCRONIZAÇÃO COMPLETA: DEV → NEON (PRODUÇÃO)

## ⚠️ ATENÇÃO

Este processo sincroniza **completamente** o banco de produção (Neon) com o banco de desenvolvimento (nr-bps_db), aplicando **todas** as mudanças arquiteturais, incluindo:

- ✅ Novas tabelas (entidades_senhas, clinicas_senhas, funcionarios_entidades, funcionarios_clinicas, etc.)
- ✅ Modificações em tabelas existentes
- ✅ Novos triggers e funções
- ✅ Novas constraints e índices
- ✅ Views atualizadas
- ✅ RLS policies
- ✅ Sequences
- ✅ **TUDO** que está no banco de desenvolvimento

---

## 📋 MUDANÇAS ARQUITETURAIS PRINCIPAIS

### Arquitetura Antiga ❌

```
contratantes (tipo: 'clinica' ou 'entidade')
├─ contratantes_senhas (UMA tabela para AMBOS) ❌
│
funcionarios
├─ clinica_id (FK direta) ❌
├─ empresa_id (FK direta) ❌
├─ contratante_id (FK direta) ❌
```

### Arquitetura Nova ✅

```
contratantes (tipo: 'clinica' ou 'entidade')
├─ entidades_senhas (APENAS gestores de entidade) ✓
├─ clinicas_senhas (APENAS RH de clínica) ✓
│
funcionarios (SEM FKs diretas) ✓
├─ funcionarios_entidades (tabela de relacionamento) ✓
│  └─ funcionario_id -> entidade_id
│
├─ funcionarios_clinicas (tabela de relacionamento) ✓
   └─ funcionario_id -> empresa_id -> clinica_id
```

---

## 🚀 EXECUÇÃO

### Opção 1: Script Master (RECOMENDADO)

Executa todo o processo automaticamente: backup + análise + migração + validação

```powershell
# Dry run (sem modificar o banco)
.\scripts\sincronizar-neon-master.ps1 -DryRun

# Execução real
.\scripts\sincronizar-neon-master.ps1

# Pular backup (NÃO RECOMENDADO)
.\scripts\sincronizar-neon-master.ps1 -SkipBackup

# Pular confirmação (para automação)
.\scripts\sincronizar-neon-master.ps1 -SkipConfirmation
```

### Opção 2: Scripts Individuais

Caso prefira controle manual:

```powershell
# 1. Backup
.\scripts\backup-neon.ps1

# 2. Análise (opcional)
.\scripts\sincronizar-neon-completo.ps1

# 3. Aplicar migrações
.\scripts\aplicar-todas-migracoes-neon.ps1
```

---

## 📊 O QUE OS SCRIPTS FAZEM

### 1. `backup-neon.ps1`

- Cria backup completo do Neon (formato custom)
- Exporta schema separadamente
- Exporta dados separadamente
- Salva em: `.\backups\neon\`

### 2. `sincronizar-neon-completo.ps1`

- Compara schemas (dev vs prod)
- Identifica tabelas novas
- Identifica tabelas obsoletas
- Gera relatório de diferenças
- Gera script de migração base

### 3. `aplicar-todas-migracoes-neon.ps1`

- Aplica TODAS as migrações de `.\database\migrations\`
- Em ordem sequencial
- Com log detalhado
- Pergunta confirmação em caso de erros

### 4. `sincronizar-neon-master.ps1` (ORQUESTRADOR)

- Executa todos os scripts acima
- Valida tabelas críticas
- Conta objetos do banco
- Gera relatório final completo

---

## 📦 ESTRUTURA DE MIGRAÇÕES

O sistema possui **300+ migrações** no diretório `database/migrations/`, incluindo:

- `001_*.sql` - `100_*.sql`: Migrações iniciais
- `200_*.sql` - `300_*.sql`: Refatorações estruturais
- `400_*.sql` - `422_*.sql`: Migração entidades/clínicas
- `CRITICAL_500_fix_architecture.sql`: **MIGRAÇÃO CRÍTICA** de arquitetura
- `501_*.sql` - `999_*.sql`: Correções e otimizações

**TODAS** serão aplicadas em ordem.

---

## ✅ PRÉ-REQUISITOS

1. ✓ PostgreSQL client tools instalados (`pg_dump`, `psql`)
2. ✓ Acesso ao banco Neon (credenciais configuradas)
3. ✓ Espaço em disco para backups (~50-100MB)
4. ✓ Permissões de escrita em `.\backups\` e `.\logs\`
5. ✓ **HORÁRIO DE BAIXO TRÁFEGO** ⚠️

---

## ⚠️ CHECKLIST PRÉ-EXECUÇÃO

Antes de executar em produção:

- [ ] **Backup manual adicional** (via console Neon)
- [ ] **Notificar equipe** sobre manutenção
- [ ] **Horário de baixo tráfego** confirmado
- [ ] **Staging testado** (se disponível)
- [ ] **Código atualizado pronto** para deploy
- [ ] **Rollback plan** definido
- [ ] **Monitoramento ativo** durante execução

---

## 🔧 TROUBLESHOOTING

### Erro: "autenticação falhou"

Verifique as credenciais no início de cada script:

```powershell
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "npg_J2QYqn5oxCzp"
```

### Erro: "pg_dump não encontrado"

Instale PostgreSQL client tools:

```powershell
# Windows (via Chocolatey)
choco install postgresql --version=16.0.0

# Ou baixe em: https://www.postgresql.org/download/windows/
```

### Erro: "tabela já existe"

Normal! As migrações usam `IF NOT EXISTS`. O script continua.

### Erro: "constraint já existe"

Normal! O script tenta dropar antes de criar.

### Erro crítico durante migração

1. **NÃO ENTRE EM PÂNICO**
2. Verifique o log: `.\logs\sync_neon_*.log`
3. Se necessário, restaure o backup:
   ```powershell
   $env:PGPASSWORD="npg_J2QYqn5oxCzp"
   pg_restore -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech -U neondb_owner -d neondb -c .\backups\neon\neon_backup_*.dump
   ```

---

## 📝 LOGS

Todos os processos geram logs detalhados:

- **Sync Master**: `.\logs\sync_neon_YYYYMMDD_HHMMSS.log`
- **Migrações**: `.\tmp\migration_neon_log_YYYYMMDD_HHMMSS.txt`
- **Análise**: Output direto no console

---

## 🎯 VALIDAÇÃO PÓS-MIGRAÇÃO

Após a execução bem-sucedida:

```powershell
# Conectar ao Neon
psql "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Validar tabelas críticas
\dt

# Verificar entidades_senhas
SELECT COUNT(*) FROM entidades_senhas;

# Verificar clinicas_senhas
SELECT COUNT(*) FROM clinicas_senhas;

# Verificar funcionarios_entidades
SELECT COUNT(*) FROM funcionarios_entidades;

# Verificar funcionarios_clinicas
SELECT COUNT(*) FROM funcionarios_clinicas;

# Verificar view
SELECT * FROM vw_funcionarios_completo LIMIT 5;

# Verificar se funcionarios NÃO tem mais as colunas antigas
\d funcionarios
-- NÃO deve ter: clinica_id, empresa_id, contratante_id
```

---

## 🚀 DEPLOYMENT

Após sincronização bem-sucedida:

1. ✅ Validar estrutura do banco (queries acima)
2. ✅ Fazer deploy do código atualizado
3. ✅ Executar testes de integração
4. ✅ Monitorar logs de erro
5. ✅ Validar endpoints críticos:
   - `/api/entidade/*`
   - `/api/clinica/*`
   - `/api/rh/*`
   - `/api/gestor/*`
   - Autenticação (login RH/Gestor)

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas:

1. Revisar logs detalhados
2. Consultar documentação de arquitetura:
   - `CORRECOES_CRITICAS_ARQUITETURA_2026-02-06.md`
   - `MIGRACAO_CONTRATANTES_PARA_ENTIDADES.md`
   - `RELATORIO_FINAL_ESTRUTURA_ORGANIZACIONAL.md`
3. Verificar migrações aplicadas vs. não aplicadas

---

## 📅 HISTÓRICO

- **2026-02-06**: Scripts de sincronização criados
- **2026-02-06**: Migração 500 (CRÍTICA) implementada
- **2026-02-05**: Refatoração completa entidades/clínicas

---

## ✅ CONCLUSÃO

**Este é um processo seguro SE:**

- ✓ Backup foi criado antes
- ✓ Horário adequado foi escolhido
- ✓ Logs são monitorados
- ✓ Rollback plan está pronto

**BOA SORTE! 🚀**
