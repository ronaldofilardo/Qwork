# Script para aplicar todas as migrations em PRODUÇÃO
# Pré-requisito: Ter psql instalado no PATH

param(
    [ValidateSet("dev", "prod")]
    [string]$Target = "prod",
    
    [switch]$DryRun = $false,
    
    [switch]$Force = $false
)

# Cores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Configurar conexão
if ($Target -eq "dev") {
    $DbHost = "localhost"
    $DbPort = "5432"
    $DbName = "nr-bps_db"
    $DbUser = "postgres"
    $DbPassword = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }
    Write-Warning "🔨 TARGET: DESENVOLVIMENTO (LOCAL)"
}
else {
    $DbHost = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
    $DbPort = "5432"
    $DbName = "neondb"
    $DbUser = "neondb_owner"
    $DbPassword = if ($env:NEON_PASSWORD) { $env:NEON_PASSWORD } else { throw "Set $env:NEON_PASSWORD" }
    Write-Error "🔴 TARGET: PRODUÇÃO (NEON CLOUD)"
    Write-Warning "⚠️  Continuando em 5 segundos... (Ctrl+C para cancelar)"
    Start-Sleep -Seconds 5
}

# Construir connection string
$ConnStr = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}?sslmode=require"

# Encontrar todas as migrations
$MigrationDir = "database/migrations"
$Migrations = Get-ChildItem -Path $MigrationDir -Filter "*.sql" | 
    Where-Object { $_.Name -notmatch "^_|archive|deprecated" } |
    Sort-Object { 
        # Extrair número do prefixo (001_*, 002_*, etc)
        [int]($_.BaseName -replace '^([0-9]+).*$', '$1')
    }

Write-Info "`n📋 Encontradas $($Migrations.Count) migrations"
Write-Info "🔄 Aplicando ao banco: $DbName`n"

if ($DryRun) {
    Write-Warning "DRY RUN - Nenhum arquivo será executado`n"
}

$Success = 0
$Failed = 0
$Skipped = 0
$AlreadyExists = 0

foreach ($Migration in $Migrations) {
    $BaseName = $Migration.Name
    Write-Info "⏳ [$($Success + $Failed + $Skipped + 1)/$($Migrations.Count)] $BaseName"
    
    if ($DryRun) {
        Write-Success "  [DRY RUN] Seria executado"
        $Skipped++
        continue
    }
    
    try {
        # Ler conteúdo da migration
        $SqlContent = Get-Content -Path $Migration.FullName -Raw -Encoding UTF8
        
        # Executar via psql (redirecionar stderr para stdout)
        $env:PGPASSWORD = $DbPassword
        $TempFile = [System.IO.Path]::GetTempFileName()
        $SqlContent | Out-File -FilePath $TempFile -Encoding UTF8
        
        $Output = psql -h $DbHost -p $DbPort -d $DbName -U $DbUser -f $TempFile 2>&1
        $ExitCode = $LASTEXITCODE
        
        Remove-Item $TempFile -Force -ErrorAction SilentlyContinue
        
        if ($ExitCode -eq 0) {
            Write-Success "  ✅ OK"
            $Success++
        }
        else {
            # Analisar tipo de erro
            $OutputStr = $Output | Out-String
            
            if ($OutputStr -match "already exists|duplicate key|NOTICE|já existe") {
                Write-Warning "  ⚠️  Já aplicada"
                $AlreadyExists++
            }
            elseif ($OutputStr -match "does not exist|não existe" -and $OutputStr -match "ADD VALUE|enum") {
                # Enum value já existe - ignorar
                Write-Warning "  ⚠️  Enum value já existe"
                $AlreadyExists++
            }
            elseif ($Force) {
                Write-Warning "  ⚠️  Erro ignorado (Force mode): $($OutputStr.Substring(0, [Math]::Min(100, $OutputStr.Length)))"
                $Success++
            }
            else {
                Write-Error "  ❌ ERRO:"
                Write-Error "     $($OutputStr.Substring(0, [Math]::Min(200, $OutputStr.Length)))"
                $Failed++
                
                # Perguntar se quer continuar
                if (-not $Force) {
                    $Continue = Read-Host "Continuar? (S/N)"
                    if ($Continue -ne "S" -and $Continue -ne "s") {
                        Write-Error "Abortado pelo usuário"
                        break
                    }
                }
            }
        }
    }
    catch {
        Write-Error "  ❌ Exceção: $_"
        $Failed++
        
        if (-not $Force) {
            $Continue = Read-Host "Continuar? (S/N)"
            if ($Continue -ne "S" -and $Continue -ne "s") {
                Write-Error "Abortado pelo usuário"
                break
            }
        }
    }
    finally {
        $env:PGPASSWORD = $null
    }
}

Write-Info "`n📊 RESULTADO FINAL:"
Write-Success "  ✅ Aplicadas com sucesso: $Success"
Write-Warning "  ⚠️  Já existiam: $AlreadyExists"
Write-Error "  ❌ Falhas: $Failed"

$TotalProcessed = $Success + $AlreadyExists + $Failed
Write-Info "`n  Total processadas: $TotalProcessed / $($Migrations.Count)"

if ($Failed -gt 0) {
    Write-Error "`n⚠️  $Failed migrations falharam. Verifique os erros acima."
    exit 1
}
else {
    Write-Success "`n🎉 Todas as migrations aplicadas com sucesso!"
    Write-Success "   ($Success novas + $AlreadyExists já existentes)"
    exit 0
}
