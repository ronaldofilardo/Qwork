<#
.SYNOPSIS
Sincronizador completo de banco de dados entre nr-bps_db (local) e Neon (produção)
Combina comparação de schemas e aplicação de migrations pendentes.

.DESCRIPTION
Este script realiza:
1. Validação pré-sincronização (dependências, conexões)
2. Backup do banco de produção (para segurança)
3. Comparação de schemas entre local e produção usando pg_dump
4. Análise e reporte de diferenças
5. Aplicação de migrations pendentes
6. Validação pós-sincronização
7. Limpeza de arquivos temporários

.EXAMPLE
.\sync-database.ps1
Executa o sincronizador com configurações padrão.

.EXAMPLE
.\sync-database.ps1 -Verbose
Executa com saída detalhada.

.EXAMPLE
.\sync-database.ps1 -SkipBackup -SkipValidation
Executa pulando backup e validação prévia.
#>

param (
    [switch]$SkipBackup = $false,
    [switch]$SkipValidation = $false,
    [switch]$Force = $false,
    [string]$ConfigFile = ".env.local",
    [string]$BackupDir = "./database/backups"
)

# Configurações padrão
$DefaultLocalConn = "postgresql://postgres:123456@localhost:5432/nr-bps_db"
$DefaultNeonConn = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neondb?sslmode=require&channel_binding=require"

# Cores para saída
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Debug = "Gray"
}

function Write-ColorOutput {
    param (
        [Parameter(Mandatory)]
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "$(Get-Date -Format 'HH:mm:ss') - $Message" -ForegroundColor $Color
}

function Test-Dependency {
    param (
        [Parameter(Mandatory)]
        [string]$Command,
        [string]$Name
    )
    
    $result = Get-Command $Command -ErrorAction SilentlyContinue
    if (-not $result) {
        Write-ColorOutput "❌ Dependência não encontrada: $Name" -Color $Colors.Error
        Write-ColorOutput "   Instruções: Instale $Name e adicione ao PATH" -Color $Colors.Warning
        return $false
    }
    return $true
}

function Get-ConnectionString {
    param (
        [Parameter(Mandatory)]
        [string]$Key,
        [string]$Default
    )
    
    # Primeiro, tenta carregar do arquivo .env
    if (Test-Path $ConfigFile) {
        $envContent = Get-Content $ConfigFile -Raw
        $envMatch = [regex]::Match($envContent, "$Key=(.*)")
        if ($envMatch.Success) {
            $value = $envMatch.Groups[1].Value.Trim()
            if (-not [string]::IsNullOrWhiteSpace($value) -and $value -ne '""' -and $value -ne "''") {
                return $value
            }
        }
    }
    
    # Se não encontrado no arquivo, usa o valor padrão
    return $Default
}

function Test-Connection {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString,
        [string]$Name
    )
    
    Write-ColorOutput "Testando conexão com $Name..." -Color $Colors.Info
    
    # Extrai parametros da string de conexão
    $parsedConn = @{}
    $ConnectionString -replace '^postgresql://' -split '&' | ForEach-Object {
        if ($_ -like '*@*/*') {
            $auth, $rest = $_ -split '@'
            $user, $pass = $auth -split ':'
            $hostPort, $db = $rest -split '/'
            $dbHost, $dbPort = $hostPort -split ':'
            $parsedConn.User = $user
            $parsedConn.Password = $pass
            $parsedConn.Host = $dbHost
            $parsedConn.Port = $dbPort
            $parsedConn.Database = $db
        } elseif ($_ -like '*=*') {
            $key, $value = $_ -split '='
            $parsedConn[$key] = $value
        }
    }
    
    try {
        $psqlArgs = @(
            "-U", $parsedConn.User,
            "-h", $parsedConn.Host,
            "-p", $parsedConn.Port,
            "-d", $parsedConn.Database,
            "-c", "SELECT version();"
        )
        
        $env:PGPASSWORD = $parsedConn.Password
        $output = & psql @psqlArgs 2>&1
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Conexão com $Name bem-sucedida" -Color $Colors.Success
            return $true
        } else {
            Write-ColorOutput "❌ Falha na conexão com $Name" -Color $Colors.Error
            Write-ColorOutput "   Erro: $($output -join '; ')" -Color $Colors.Warning
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-ColorOutput "❌ Exceção ao conectar com $Name`: $errorMsg" -Color $Colors.Error
        return $false
    }
}

function Backup-Database {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString,
        [string]$Name,
        [string]$BackupPath
    )
    
    if ($SkipBackup) {
        Write-ColorOutput "⚠️  Backup pulado (--SkipBackup)" -Color $Colors.Warning
        return $true
    }
    
    Write-ColorOutput "Realizando backup de $Name..." -Color $Colors.Info
    
    $parsedConn = @{}
    $ConnectionString -replace '^postgresql://' -split '&' | ForEach-Object {
        if ($_ -like '*@*/*') {
            $auth, $rest = $_ -split '@'
            $user, $pass = $auth -split ':'
            $hostPort, $db = $rest -split '/'
            $dbHost, $dbPort = $hostPort -split ':'
            $parsedConn.User = $user
            $parsedConn.Password = $pass
            $parsedConn.Host = $dbHost
            $parsedConn.Port = $dbPort
            $parsedConn.Database = $db
        } elseif ($_ -like '*=*') {
            $key, $value = $_ -split '='
            $parsedConn[$key] = $value
        }
    }
    
    try {
        $backupFile = Join-Path $BackupPath "backup-$($parsedConn.Database)-$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        
        $env:PGPASSWORD = $parsedConn.Password
        & pg_dump -U $parsedConn.User -h $parsedConn.Host -p $parsedConn.Port -d $parsedConn.Database -F p -f $backupFile 2>&1
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Backup de $Name salvo em: $backupFile" -Color $Colors.Success
            return $true
        } else {
            Write-ColorOutput "❌ Falha ao realizar backup de $Name" -Color $Colors.Error
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-ColorOutput "❌ Exceção ao fazer backup de $Name`: $errorMsg" -Color $Colors.Error
        return $false
    }
}

function Compare-Schemas {
    param (
        [Parameter(Mandatory)]
        [string]$LocalConn,
        [Parameter(Mandatory)]
        [string]$NeonConn,
        [string]$OutputDir = "./schema-comparison"
    )
    
    Write-ColorOutput "Comparando schemas local vs. Neon..." -Color $Colors.Info
    
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $localSchemaFile = Join-Path $OutputDir "schema-local-$timestamp.sql"
    $neonSchemaFile = Join-Path $OutputDir "schema-neon-$timestamp.sql"
    $diffFile = Join-Path $OutputDir "schema-diff-$timestamp.txt"
    $reportFile = Join-Path $OutputDir "schema-report-$timestamp.md"
    
    # Extrai schemas usando pg_dump com apenas a estrutura (--schema-only)
    try {
        Write-ColorOutput "Extraindo schema local..." -Color $Colors.Debug
        if (-not (Export-Schema -ConnectionString $LocalConn -OutputFile $localSchemaFile)) {
            return $false
        }
        
        Write-ColorOutput "Extraindo schema Neon..." -Color $Colors.Debug
        if (-not (Export-Schema -ConnectionString $NeonConn -OutputFile $neonSchemaFile)) {
            return $false
        }
        
        # Compara os schemas
        Write-ColorOutput "Gerando diff de schemas..." -Color $Colors.Debug
        $diffOutput = & diff $localSchemaFile $neonSchemaFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Schemas são idênticos" -Color $Colors.Success
            $schemasMatch = $true
        } else {
            $diffOutput | Out-File -FilePath $diffFile -Encoding utf8
            Write-ColorOutput "⚠️  Diferenças encontradas em: $diffFile" -Color $Colors.Warning
            $schemasMatch = $false
        }
        
        # Gera relatório
        Generate-SchemaReport -LocalFile $localSchemaFile -NeonFile $neonSchemaFile -OutputFile $reportFile -DiffFile $diffFile -SchemasMatch $schemasMatch
        
        return $schemasMatch
        
    } catch {
        $errorMsg = $_.Exception.Message
        Write-ColorOutput "❌ Exceção ao comparar schemas: $errorMsg" -Color $Colors.Error
        return $false
    }
}

function Export-Schema {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString,
        [Parameter(Mandatory)]
        [string]$OutputFile
    )
    
    $parsedConn = @{}
    $ConnectionString -replace '^postgresql://' -split '&' | ForEach-Object {
        if ($_ -like '*@*/*') {
            $auth, $rest = $_ -split '@'
            $user, $pass = $auth -split ':'
            $hostPort, $db = $rest -split '/'
            $dbHost, $dbPort = $hostPort -split ':'
            $parsedConn.User = $user
            $parsedConn.Password = $pass
            $parsedConn.Host = $dbHost
            $parsedConn.Port = $dbPort
            $parsedConn.Database = $db
        } elseif ($_ -like '*=*') {
            $key, $value = $_ -split '='
            $parsedConn[$key] = $value
        }
    }
    
    $env:PGPASSWORD = $parsedConn.Password
    & pg_dump -U $parsedConn.User -h $parsedConn.Host -p $parsedConn.Port -d $parsedConn.Database -s -O -x -f $OutputFile 2>&1
    $env:PGPASSWORD = $null
    
    return $LASTEXITCODE -eq 0
}

function Generate-SchemaReport {
    param (
        [Parameter(Mandatory)]
        [string]$LocalFile,
        [Parameter(Mandatory)]
        [string]$NeonFile,
        [Parameter(Mandatory)]
        [string]$OutputFile,
        [Parameter(Mandatory)]
        [string]$DiffFile,
        [bool]$SchemasMatch
    )
    
    $localTables = Get-TableList $LocalFile
    $neonTables = Get-TableList $NeonFile
    
    $reportContent = @"
# Relatório de Comparação de Schemas
## Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')

## Status Geral
$(if ($SchemasMatch) { "✅ Schemas são idênticos" } else { "⚠️  Diferenças encontradas" })

## Estatísticas

### Tabelas
- Local: $($localTables.Count)
- Neon: $($neonTables.Count)

## Tabelas em Local não em Neon
$(Compare-TableLists $localTables $neonTables | ForEach-Object { "`- $_" } | Out-String)

## Tabelas em Neon não em Local
$(Compare-TableLists $neonTables $localTables | ForEach-Object { "`- $_" } | Out-String)

## Arquivos Gerados
- Schema Local: $LocalFile
- Schema Neon: $NeonFile
- Diff: $DiffFile

## Diferenças Detalhadas
$(if (-not $SchemasMatch) { 
    $diffContent = Get-Content $DiffFile -Raw
    "`n``````diff`n$diffContent`n``````"
} else { 
    "Nenhuma" 
})
"@
    
    $reportContent | Out-File -FilePath $OutputFile -Encoding utf8
    Write-ColorOutput "Relatório gerado: $OutputFile" -Color $Colors.Success
}

function Get-TableList {
    param (
        [Parameter(Mandatory)]
        [string]$SchemaFile
    )
    
    $tables = @()
    $content = Get-Content $SchemaFile -Raw
    $tableMatches = [regex]::Matches($content, 'CREATE TABLE\s+"?(\w+)"?', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    foreach ($match in $tableMatches) {
        $tableName = $match.Groups[1].Value
        if (-not $tableName.StartsWith('pg_')) {
            $tables += $tableName
        }
    }
    
    return $tables | Sort-Object
}

function Compare-TableLists {
    param (
        [Parameter(Mandatory)]
        [array]$List1,
        [Parameter(Mandatory)]
        [array]$List2
    )
    
    $differences = @()
    foreach ($item in $List1) {
        if (-not $List2.Contains($item)) {
            $differences += $item
        }
    }
    
    return $differences | Sort-Object
}

function Get-AppliedMigrations {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString
    )
    
    $parsedConn = @{}
    $ConnectionString -replace '^postgresql://' -split '&' | ForEach-Object {
        if ($_ -like '*@*/*') {
            $auth, $rest = $_ -split '@'
            $user, $pass = $auth -split ':'
            $hostPort, $db = $rest -split '/'
            $dbHost, $dbPort = $hostPort -split ':'
            $parsedConn.User = $user
            $parsedConn.Password = $pass
            $parsedConn.Host = $dbHost
            $parsedConn.Port = $dbPort
            $parsedConn.Database = $db
        } elseif ($_ -like '*=*') {
            $key, $value = $_ -split '='
            $parsedConn[$key] = $value
        }
    }
    
    $appliedMigrations = @()
    try {
        $psqlArgs = @(
            "-U", $parsedConn.User,
            "-h", $parsedConn.Host,
            "-p", $parsedConn.Port,
            "-d", $parsedConn.Database,
            "-c", "SELECT DISTINCT version FROM schema_migrations ORDER BY version;"
        )
        
        $env:PGPASSWORD = $parsedConn.Password
        $output = & psql @psqlArgs 2>&1
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0) {
            foreach ($line in $output) {
                if ($line -match '^\d+') {
                    $appliedMigrations += $line.Trim()
                }
            }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-ColorOutput "❌ Exceção ao obter migrations aplicadas: $errorMsg" -Color $Colors.Error
    }
    
    return $appliedMigrations
}

function Get-PendingMigrations {
    param (
        [Parameter(Mandatory)]
        [string]$MigrationsDir = "./database/migrations"
    )
    
    $pendingMigrations = @()
    $migrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
    
    foreach ($file in $migrationFiles) {
        if ($file.Name -match '^(\d+)_') {
            $version = $matches[1].TrimStart('0')
            $pendingMigrations += $version
        }
    }
    
    return $pendingMigrations
}

function Apply-Migrations {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString,
        [string]$MigrationsDir = "./database/migrations"
    )
    
    $appliedMigrations = Get-AppliedMigrations -ConnectionString $ConnectionString
    $pendingMigrations = Get-PendingMigrations -MigrationsDir $MigrationsDir
    
    if (-not $appliedMigrations) {
        $appliedMigrations = @()
    }
    
    $migrationsToApply = @()
    foreach ($pending in $pendingMigrations) {
        if (-not $appliedMigrations.Contains($pending)) {
            $migrationsToApply += $pending
        }
    }
    
    if ($migrationsToApply.Count -eq 0) {
        Write-ColorOutput "✅ Nenhuma migration pendente para aplicar" -Color $Colors.Success
        return $true
    }
    
    Write-ColorOutput "Aplicando $($migrationsToApply.Count) migrations pendentes..." -Color $Colors.Info
    
    $parsedConn = @{}
    $ConnectionString -replace '^postgresql://' -split '&' | ForEach-Object {
        if ($_ -like '*@*/*') {
            $auth, $rest = $_ -split '@'
            $user, $pass = $auth -split ':'
            $hostPort, $db = $rest -split '/'
            $dbHost, $dbPort = $hostPort -split ':'
            $parsedConn.User = $user
            $parsedConn.Password = $pass
            $parsedConn.Host = $dbHost
            $parsedConn.Port = $dbPort
            $parsedConn.Database = $db
        } elseif ($_ -like '*=*') {
            $key, $value = $_ -split '='
            $parsedConn[$key] = $value
        }
    }
    
    $successCount = 0
    $failedCount = 0
    
    foreach ($version in $migrationsToApply | Sort-Object) {
        $migrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*${version}_*.sql"
        
        foreach ($file in $migrationFiles) {
            Write-ColorOutput "Aplicando migration: $($file.Name)" -Color $Colors.Info
            
            try {
                $psqlArgs = @(
                    "-U", $parsedConn.User,
                    "-h", $parsedConn.Host,
                    "-p", $parsedConn.Port,
                    "-d", $parsedConn.Database,
                    "-f", $file.FullName
                )
                
                $env:PGPASSWORD = $parsedConn.Password
                $output = & psql @psqlArgs 2>&1
                $env:PGPASSWORD = $null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✅ Migration aplicada com sucesso: $($file.Name)" -Color $Colors.Success
                    $successCount++
                } else {
                    Write-ColorOutput "❌ Falha ao aplicar migration: $($file.Name)" -Color $Colors.Error
                    Write-ColorOutput "   Erro: $($output -join '; ')" -Color $Colors.Warning
                    $failedCount++
                }
            } catch {
                $errorMsg = $_.Exception.Message
                Write-ColorOutput "❌ Exceção ao aplicar migration $($file.Name)`: $errorMsg" -Color $Colors.Error
                $failedCount++
            }
        }
    }
    
    if ($failedCount -gt 0) {
        Write-ColorOutput "⚠️  $failedCount migration(s) falharam a aplicar" -Color $Colors.Warning
    }
    
    Write-ColorOutput "✅ Migrations aplicadas: $successCount" -Color $Colors.Success
    
    return $failedCount -eq 0
}

function Test-SchemaConsistency {
    param (
        [Parameter(Mandatory)]
        [string]$ConnectionString,
        [string]$MigrationsDir = "./database/migrations"
    )
    
    Write-ColorOutput "Verificando consistência do schema..." -Color $Colors.Info
    
    $appliedMigrations = Get-AppliedMigrations -ConnectionString $ConnectionString
    $pendingMigrations = Get-PendingMigrations -MigrationsDir $MigrationsDir
    
    $pendingCount = $pendingMigrations.Count
    $appliedCount = $appliedMigrations.Count
    
    Write-ColorOutput "📊 Resumo:" -Color $Colors.Info
    Write-ColorOutput "   Migrations disponíveis: $pendingCount" -Color $Colors.Debug
    Write-ColorOutput "   Migrations aplicadas: $appliedCount" -Color $Colors.Debug
    
    if ($appliedCount -ne $pendingCount) {
        $missingMigrations = Compare-TableLists $pendingMigrations $appliedMigrations
        Write-ColorOutput "⚠️  $($missingMigrations.Count) migration(s) não aplicadas" -Color $Colors.Warning
        foreach ($version in $missingMigrations) {
            Write-ColorOutput "   - Migration $version não aplicada" -Color $Colors.Warning
        }
        return $false
    }
    
    Write-ColorOutput "✅ Schema está consistente com todas as migrations" -Color $Colors.Success
    return $true
}

function Write-SyncSummary {
    param (
        [bool]$ValidationPassed,
        [bool]$BackupCreated,
        [bool]$SchemasMatch,
        [int]$AppliedMigrations,
        [int]$FailedMigrations,
        [bool]$FinalValidationPassed
    )
    
    Write-ColorOutput "`n" -Color $Colors.Info
    $sepLine = "=" * 70
    Write-ColorOutput $sepLine -Color $Colors.Info
    Write-ColorOutput "           RELATÓRIO DE SINCRONIZAÇÃO COMPLETO" -Color $Colors.Info
    Write-ColorOutput $sepLine -Color $Colors.Info
    Write-ColorOutput "" -Color $Colors.Info
    
    $statusMap = @{
        "✅ Sucesso" = "Green"
        "⚠️  Aviso" = "Yellow"
        "❌ Falha" = "Red"
    }
    
    $validationStatus = if ($ValidationPassed) { "✅ Sucesso" } else { "❌ Falha" }
    $backupStatus = if ($BackupCreated) { "✅ Sucesso" } else { if ($SkipBackup) { "⚠️  Pulado" } else { "❌ Falha" } }
    $schemaStatus = if ($SchemasMatch) { "✅ Sucesso" } else { "⚠️  Diferenças" }
    $migrationStatus = if ($FailedMigrations -eq 0 -and $AppliedMigrations -ge 0) { "✅ Sucesso" } else { "❌ Falha" }
    $finalStatus = if ($FinalValidationPassed) { "✅ Sucesso" } else { "❌ Falha" }
    
    Write-ColorOutput "📋 Resumo Detalhado:" -Color $Colors.Info
    Write-ColorOutput "   1. Validação Pré-Sincronização: $validationStatus" -Color $statusMap[$validationStatus.Split()[0]]
    Write-ColorOutput "   2. Backup do Banco de Dados: $backupStatus" -Color $statusMap[$backupStatus.Split()[0]]
    Write-ColorOutput "   3. Comparação de Schemas: $schemaStatus" -Color $statusMap[$schemaStatus.Split()[0]]
    Write-ColorOutput "   4. Aplicação de Migrations: $migrationStatus" -Color $statusMap[$migrationStatus.Split()[0]]
    Write-ColorOutput "      - Migrations aplicadas com sucesso: $AppliedMigrations" -Color $Colors.Debug
    Write-ColorOutput "      - Migrations com falha: $FailedMigrations" -Color $Colors.Debug
    Write-ColorOutput "   5. Validação Pós-Sincronização: $finalStatus" -Color $statusMap[$finalStatus.Split()[0]]
    Write-ColorOutput "" -Color $Colors.Info
    
    $overallStatus = "✅ Sucesso"
    $overallColor = $Colors.Success
    
    if (-not $ValidationPassed -or -not $FinalValidationPassed -or $FailedMigrations -gt 0) {
        $overallStatus = "❌ Falha"
        $overallColor = $Colors.Error
    } elseif (-not $SchemasMatch) {
        $overallStatus = "⚠️  Aviso"
        $overallColor = $Colors.Warning
    }
    
    Write-ColorOutput "🏁 Status Geral: $overallStatus" -Color $overallColor
}

function Main {
    Write-ColorOutput "`n" -Color $Colors.Info
    Write-ColorOutput "🚀 Iniciando sincronização completa de banco de dados" -Color $Colors.Info
    $separator = "=" * 70
    Write-ColorOutput $separator -Color $Colors.Info
    
    # 1. Validação pré-sincronização
    if (-not $SkipValidation) {
        Write-ColorOutput "`n🔍 Validação pré-sincronização" -Color $Colors.Info
        $separator2 = "-" * 50
        Write-ColorOutput $separator2 -Color $Colors.Info
        
        $dependencies = @(
            @{ Command = "psql"; Name = "PostgreSQL Client (psql)" },
            @{ Command = "pg_dump"; Name = "PostgreSQL Dump (pg_dump)" }
        )
        
        foreach ($dep in $dependencies) {
            if (-not (Test-Dependency -Command $dep.Command -Name $dep.Name)) {
                return 1
            }
        }
    }
    
    # 2. Carrega conexões
    Write-ColorOutput "`n📚 Carregando configurações" -Color $Colors.Info
    $localConn = Get-ConnectionString -Key "LOCAL_DATABASE_URL" -Default $DefaultLocalConn
    $neonConn = Get-ConnectionString -Key "DATABASE_URL" -Default $DefaultNeonConn
    
    if (-not $SkipValidation) {
        if (-not (Test-Connection -ConnectionString $localConn -Name "Banco Local (nr-bps_db)")) {
            Write-ColorOutput "❌ Não foi possível conectar ao banco local" -Color $Colors.Error
            return 2
        }
        
        if (-not (Test-Connection -ConnectionString $neonConn -Name "Banco Neon (Produção)")) {
            Write-ColorOutput "❌ Não foi possível conectar ao banco Neon" -Color $Colors.Error
            return 3
        }
    }
    
    # 3. Cria diretório de backups se não existir
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    # 4. Realiza backup
    $backupCreated = $true
    if (-not (Backup-Database -ConnectionString $neonConn -Name "Banco Neon (Produção)" -BackupPath $BackupDir)) {
        if (-not $Force) {
            Write-ColorOutput "❌ Backup falhou. Sincronização abortada." -Color $Colors.Error
            return 4
        }
        Write-ColorOutput "⚠️  Backup falhou, mas continua sincronização (--Force)" -Color $Colors.Warning
        $backupCreated = $false
    }
    
    # 5. Compara schemas
    $schemasMatch = $true
    if (-not (Compare-Schemas -LocalConn $localConn -NeonConn $neonConn)) {
        $schemasMatch = $false
    }
    
    # 6. Aplica migrations pendentes
    Write-ColorOutput "`n🎯 Aplicando migrations pendentes" -Color $Colors.Info
    $separator3 = "-" * 50
    Write-ColorOutput $separator3 -Color $Colors.Info
    
    $appliedMigrations = 0
    $failedMigrations = 0
    
    if (Apply-Migrations -ConnectionString $neonConn) {
        $appliedMigrations = Get-PendingMigrations | Where-Object {
            -not (Get-AppliedMigrations -ConnectionString $neonConn) -contains $_
        }
    } else {
        $failedMigrations = (Get-PendingMigrations | Where-Object {
            -not (Get-AppliedMigrations -ConnectionString $neonConn) -contains $_
        }).Count
    }
    
    # 7. Validação pós-sincronização
    $finalValidation = $true
    if (-not $SkipValidation) {
        Write-ColorOutput "`n✅ Validação pós-sincronização" -Color $Colors.Info
        $separator4 = "-" * 50
        Write-ColorOutput $separator4 -Color $Colors.Info
        
        if (-not (Test-SchemaConsistency -ConnectionString $neonConn)) {
            $finalValidation = $false
        }
    }
    
    # 8. Relatório final
    Write-SyncSummary -ValidationPassed $true -BackupCreated $backupCreated -SchemasMatch $schemasMatch -AppliedMigrations $appliedMigrations -FailedMigrations $failedMigrations -FinalValidationPassed $finalValidation
    
    Write-ColorOutput "`n✅ Sincronização concluída" -Color $Colors.Success
    Write-ColorOutput "Note: Verifique os logs e relatórios para detalhes completos" -Color $Colors.Warning
    
    return if ($failedMigrations -gt 0 -or -not $finalValidation) { 5 } else { 0 }
}

# Executa o script
try {
    $exitCode = Main
    exit $exitCode
} catch {
    $errorMsg = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    Write-ColorOutput "❌ Erro fatal: $errorMsg" -Color $Colors.Error
    Write-ColorOutput "Stack trace: $stackTrace" -Color $Colors.Warning
    exit 99
}
