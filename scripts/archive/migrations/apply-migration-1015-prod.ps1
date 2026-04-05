#!/usr/bin/env pwsh
# Script: apply-migration-1015-prod.ps1
# Descrição: Aplica migração 1015 que popula funcionarios_entidades perdidos
# Data: 2026-02-12

param(
    [string]$MigrationFile = "database/migrations/1015_populate_missing_funcionarios_entidades.sql",
    [string]$Password = "",  # Senha do Neon (pode vir de .env)
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

if (-not $Password) {
    Write-Error "Erro: Senha do Neon é obrigatória. Use: -Password 'sua_senha'"
    exit 1
}

# Configurações PROD (Neon)
$DbHost = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$DbUser = "neondb_owner"
$DbPassword = $env:DATABASE_URL_PASS  # Deve ser passado como parâmetro ou variável de ambiente
$DbName = "neondb"

Write-Host "======================================"
Write-Host "Aplicar Migração 1015 em PROD"
Write-Host "======================================"

# Validar arquivo
if (-not (Test-Path $MigrationFile)) {
    Write-Error "Arquivo de migração não encontrado: $MigrationFile"
    exit 1
}

Write-Host "[INFO] Arquivo de migração: $MigrationFile"
Write-Host "[INFO] Banco de dados: $DbName"
Write-Host "[INFO] Host: $DbHost"

if ($DryRun) {
    Write-Host "[AVISO] Executando em modo DRY-RUN (sem fazer mudanças)"
}

# Ler conteúdo da migração
$MigrationContent = Get-Content -Path $MigrationFile -Raw
if ($Verbose) {
    Write-Host "[DEBUG] Conteúdo da migração (primeiras 500 chars):"
    Write-Host $MigrationContent.Substring(0, [Math]::Min(500, $MigrationContent.Length))
    Write-Host "..."
}

# Definir variável de ambiente para senha
$env:PGPASSWORD = $Password

try {
    Write-Host "`n[ETAPA 1] Diagnóstico PRÉ-MIGRAÇÃO"
    Write-Host "==================================="
    
    $preDiag = psql -h $DbHost -U $DbUser -d $DbName -t -c @"
SELECT 
  (SELECT COUNT(*) FROM funcionarios_entidades) as fe_total,
  (SELECT COUNT(*) FROM funcionarios f WHERE f.perfil = 'funcionario' AND f.contratante_id IS NOT NULL) as fun_com_entidade
"@
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao conectar ao banco de dados"
        exit 1
    }
    
    Write-Host $preDiag
    
    Write-Host "`n[ETAPA 2] Aplicar Migração"
    Write-Host "==========================="
    
    if ($DryRun) {
        Write-Host "[SIMULAÇÃO] Migração seria aplicada aqui"
    }
    else {
        # Executar migração
        $MigrationContent | psql -h $DbHost -U $DbUser -d $DbName -w 2>&1 | Tee-Object -Variable MigrationOutput
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Erro ao aplicar migração"
            Write-Host "Output: $MigrationOutput"
            exit 1
        }
        
        Write-Host "[SUCESSO] Migração aplicada"
    }
    
    Write-Host "`n[ETAPA 3] Diagnóstico PÓS-MIGRAÇÃO"
    Write-Host "===================================="
    
    $posDiag = psql -h $DbHost -U $DbUser -d $DbName -t -c @"
SELECT 
  (SELECT COUNT(*) FROM funcionarios_entidades) as fe_total,
  (SELECT COUNT(*) FROM funcionarios_entidades WHERE ativo = true) as fe_ativo
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $posDiag
    }
    
    Write-Host "`n[SUCESSO] Migração 1015 aplicada com sucesso!"
    
}
catch {
    Write-Error "Erro geral: $_"
    exit 1
}
finally {
    # Limpar variável sensível
    $env:PGPASSWORD = $null
}
