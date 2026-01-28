# Guia Rápido de Aplicação - Correções RBAC/RLS

## ⚡ Aplicação Rápida (5 minutos)

### Pré-requisitos

- PostgreSQL 17.5+ rodando
- Banco `nr-bps_db` existente
- Permissões de superuser no PostgreSQL

### Passo a Passo

#### 1. Backup (OBRIGATÓRIO) ⚠️

```powershell
# Windows PowerShell (Execute como Administrador)
cd C:\apps\QWork

# Criar diretório de backups se não existir
New-Item -ItemType Directory -Force -Path ".\backups"

# Fazer backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -U postgres -d nr-bps_db -f ".\backups\backup_antes_fixes_$timestamp.sql"

Write-Host "✅ Backup criado: .\backups\backup_antes_fixes_$timestamp.sql" -ForegroundColor Green
```

#### 2. Aplicar Correções

```powershell
# Executar script de correções
psql -U postgres -d nr-bps_db -f ".\database\migrations\004_rls_rbac_fixes.sql"

# Verificar se executou sem erros
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Correções aplicadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO ao aplicar correções! Verifique os logs." -ForegroundColor Red
    Write-Host "Para reverter, execute: psql -U postgres -d nr-bps_db -f .\backups\backup_antes_fixes_$timestamp.sql" -ForegroundColor Yellow
    exit 1
}
```

#### 3. Executar Testes

```powershell
# Executar testes de validação
psql -U postgres -d nr-bps_db -f ".\database\migrations\tests\004_test_rls_rbac_fixes.sql" | Out-File -FilePath ".\logs\test_results_$timestamp.log"

# Verificar resultados
$testResults = Get-Content ".\logs\test_results_$timestamp.log"
$failures = $testResults | Select-String "✗ FALHOU"

if ($failures.Count -eq 0) {
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Alguns testes falharam. Verifique: .\logs\test_results_$timestamp.log" -ForegroundColor Yellow
    Write-Host "Testes com falha:" -ForegroundColor Yellow
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
```

#### 4. Reiniciar Aplicação

```powershell
# Parar servidor se estiver rodando
$process = Get-Process -Name node -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Name node -Force
    Write-Host "✅ Servidor Node parado" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Rebuild e iniciar
pnpm build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green

    # Iniciar servidor em background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\apps\QWork; pnpm start"
    Write-Host "✅ Servidor iniciado!" -ForegroundColor Green
    Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}
```

#### 5. Validação Manual

```powershell
# Aguardar servidor iniciar
Write-Host "`nAguardando servidor iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Testar endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor respondendo corretamente!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Servidor pode não estar pronto ainda. Teste manualmente." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "APLICAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nPróximos passos:"
Write-Host "1. Testar login com cada perfil (funcionario, rh, emissor, admin)"
Write-Host "2. Validar operações CRUD"
Write-Host "3. Verificar logs em: .\logs\test_results_$timestamp.log"
Write-Host "4. Monitorar performance nas próximas 24h"
Write-Host "`nEm caso de problemas:"
Write-Host "- Consulte: .\docs\RLS-RBAC-FIXES-README.md"
Write-Host "- Backup em: .\backups\backup_antes_fixes_$timestamp.sql"
```

---

## 🔄 Script Completo (Copiar e Executar)

```powershell
# ==========================================
# Script de Aplicação - Correções RBAC/RLS
# Execute como Administrador
# ==========================================

$ErrorActionPreference = "Stop"
cd C:\apps\QWork

# Timestamp para arquivos
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "INICIANDO APLICAÇÃO DE CORREÇÕES RBAC/RLS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. BACKUP
Write-Host "[1/5] Criando backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\backups" | Out-Null
New-Item -ItemType Directory -Force -Path ".\logs" | Out-Null
pg_dump -U postgres -d nr-bps_db -f ".\backups\backup_antes_fixes_$timestamp.sql"
Write-Host "✅ Backup criado`n" -ForegroundColor Green

# 2. APLICAR CORREÇÕES
Write-Host "[2/5] Aplicando correções..." -ForegroundColor Yellow
psql -U postgres -d nr-bps_db -f ".\database\migrations\004_rls_rbac_fixes.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO! Restaurando backup..." -ForegroundColor Red
    psql -U postgres -d nr-bps_db -f ".\backups\backup_antes_fixes_$timestamp.sql"
    exit 1
}
Write-Host "✅ Correções aplicadas`n" -ForegroundColor Green

# 3. EXECUTAR TESTES
Write-Host "[3/5] Executando testes..." -ForegroundColor Yellow
psql -U postgres -d nr-bps_db -f ".\database\migrations\tests\004_test_rls_rbac_fixes.sql" | Out-File -FilePath ".\logs\test_results_$timestamp.log"
$failures = Get-Content ".\logs\test_results_$timestamp.log" | Select-String "✗ FALHOU"
if ($failures.Count -eq 0) {
    Write-Host "✅ Todos os testes passaram`n" -ForegroundColor Green
} else {
    Write-Host "⚠️ $($failures.Count) teste(s) falharam. Verifique logs.`n" -ForegroundColor Yellow
}

# 4. REBUILD
Write-Host "[4/5] Rebuilding aplicação..." -ForegroundColor Yellow
$process = Get-Process -Name node -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Name node -Force; Start-Sleep -Seconds 2 }
pnpm build | Out-Null
Write-Host "✅ Build concluído`n" -ForegroundColor Green

# 5. INICIAR
Write-Host "[5/5] Iniciando servidor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\apps\QWork; pnpm start"
Start-Sleep -Seconds 5
Write-Host "✅ Servidor iniciado`n" -ForegroundColor Green

# RESUMO
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APLICAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Arquivos gerados:"
Write-Host "  - Backup: .\backups\backup_antes_fixes_$timestamp.sql"
Write-Host "  - Testes: .\logs\test_results_$timestamp.log"
Write-Host "`nServidor: http://localhost:3000"
Write-Host "Docs: .\docs\RLS-RBAC-FIXES-README.md`n"
```

---

## 🧪 Testes Manuais Rápidos

### Teste 1: Login e Acesso (2 min)

```powershell
# Abrir navegador
Start-Process "http://localhost:3000/login"

# Testar cada perfil:
# 1. Login como funcionário → Deve ver apenas próprios dados
# 2. Login como RH → Deve ver funcionários da clínica
# 3. Login como emissor → Deve ver laudos
# 4. Login como admin → Deve ver clínicas e empresas, mas NÃO avaliações
```

### Teste 2: Isolamento entre Clínicas (1 min)

```sql
-- Executar no psql
psql -U postgres -d nr-bps_db

-- Configurar contexto RH da Clínica 1
SET LOCAL app.current_user_cpf = '[CPF_RH_CLINICA_1]';
SET LOCAL app.current_user_perfil = 'rh';
SET LOCAL app.current_user_clinica_id = '1';

-- Tentar ver funcionários de outra clínica
SELECT COUNT(*) FROM funcionarios WHERE clinica_id = 2;
-- Resultado esperado: 0
```

### Teste 3: Imutabilidade (1 min)

```sql
-- Criar e emitir laudo
INSERT INTO lotes_avaliacao (clinica_id, empresa_id, nome, status)
VALUES (1, 1, 'Teste', 'concluido') RETURNING id;

INSERT INTO laudos (lote_id, titulo, emissor_cpf, emitido_em, status)
VALUES ([ID_LOTE], 'Teste', '[CPF_EMISSOR]', NOW(), 'emitido');

-- Tentar modificar (deve falhar)
UPDATE laudos SET titulo = 'Modificado' WHERE titulo = 'Teste';
-- Resultado esperado: ERRO "Não é permitido modificar laudos já emitidos"
```

---

## 🔧 Solução de Problemas

### Erro: "relation does not exist"

```powershell
# Verificar se todas as tabelas existem
psql -U postgres -d nr-bps_db -c "\dt"

# Se faltar alguma, restaurar schema completo
psql -U postgres -d nr-bps_db -f ".\database\schema-complete.sql"
```

### Erro: "permission denied"

```powershell
# Executar PowerShell como Administrador
# Ou ajustar permissões do usuário postgres
psql -U postgres -d nr-bps_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
```

### Testes Falhando

```powershell
# Ver detalhes dos testes
Get-Content ".\logs\test_results_$timestamp.log" | Select-String -Context 2,2 "✗ FALHOU"

# Executar teste específico manualmente
psql -U postgres -d nr-bps_db
# Depois copiar e colar o teste que falhou
```

### Performance Lenta

```sql
-- Verificar se índices foram criados
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Deve retornar pelo menos 15 índices novos

-- Analisar tabelas
ANALYZE funcionarios;
ANALYZE avaliacoes;
ANALYZE empresas_clientes;
ANALYZE lotes_avaliacao;
ANALYZE laudos;
```

---

## 📞 Suporte Rápido

### Documentação

- **Completa**: `.\docs\RLS-RBAC-FIXES-README.md`
- **Resumo**: `.\docs\RLS-RBAC-FIXES-SUMMARY.md`
- **Este guia**: `.\docs\QUICK-START.md`

### Logs Importantes

- **Testes**: `.\logs\test_results_[timestamp].log`
- **Aplicação**: Console do PowerShell onde rodou `pnpm start`
- **PostgreSQL**: `C:\Program Files\PostgreSQL\17\data\log\`

### Rollback Completo

```powershell
# Se algo der muito errado, restaurar backup
$latestBackup = Get-ChildItem ".\backups\backup_antes_fixes_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

psql -U postgres -d nr-bps_db -f $latestBackup.FullName

Write-Host "✅ Banco restaurado para estado anterior" -ForegroundColor Green
```

---

**Última Atualização**: 14/12/2025  
**Tempo Estimado**: 5-10 minutos  
**Dificuldade**: Média
