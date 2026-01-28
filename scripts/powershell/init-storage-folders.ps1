# Script de Inicialização de Estrutura de Pastas para Armazenamento de PDFs
# Data: 2025-12-31
# Descrição: Cria estrutura organizada de pastas para armazenar PDFs (laudos, recibos, relatórios)
# Uso: .\scripts\powershell\init-storage-folders.ps1

# Verificar se está executando como administrador (opcional, mas recomendado)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "⚠️  Este script não está sendo executado como Administrador. Algumas operações podem falhar."
}

# Caminho base do projeto
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$storagePath = Join-Path $projectRoot "storage"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Inicializando Estrutura de Armazenamento de PDFs - QWork" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Criar pastas principais
$folders = @(
    "storage",
    "storage\laudos",
    "storage\recibos",
    "storage\relatorios",
    "storage\backups"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $projectRoot $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        Write-Host "✅ Criado: $folder" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Já existe: $folder" -ForegroundColor Yellow
    }
}

# Criar subpastas para recibos organizadas por ano
$currentYear = (Get-Date).Year
$years = @($currentYear, ($currentYear + 1))

foreach ($year in $years) {
    $yearPath = Join-Path (Join-Path $projectRoot "storage\recibos") $year
    if (-not (Test-Path $yearPath)) {
        New-Item -Path $yearPath -ItemType Directory -Force | Out-Null
        Write-Host "✅ Criado: storage\recibos\$year" -ForegroundColor Green
        
        # Criar subpastas de meses (01-janeiro a 12-dezembro)
        $months = @(
            "01-janeiro", "02-fevereiro", "03-marco", "04-abril",
            "05-maio", "06-junho", "07-julho", "08-agosto",
            "09-setembro", "10-outubro", "11-novembro", "12-dezembro"
        )
        
        foreach ($month in $months) {
            $monthPath = Join-Path $yearPath $month
            if (-not (Test-Path $monthPath)) {
                New-Item -Path $monthPath -ItemType Directory -Force | Out-Null
            }
        }
        Write-Host "   ↳ Criadas 12 subpastas de meses" -ForegroundColor Gray
    } else {
        Write-Host "⏭️  Já existe: storage\recibos\$year" -ForegroundColor Yellow
    }
}

# Criar subpastas para relatórios
$relatoriosFolders = @(
    "storage\relatorios\gestao-cobranca",
    "storage\relatorios\auditoria",
    "storage\relatorios\admin"
)

foreach ($folder in $relatoriosFolders) {
    $fullPath = Join-Path $projectRoot $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        Write-Host "✅ Criado: $folder" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Já existe: $folder" -ForegroundColor Yellow
    }
}

# Criar arquivo .gitkeep em cada pasta vazia para versionar a estrutura
$gitkeepFolders = @(
    "storage\laudos",
    "storage\relatorios\gestao-cobranca",
    "storage\relatorios\auditoria",
    "storage\relatorios\admin",
    "storage\backups"
)

foreach ($folder in $gitkeepFolders) {
    $fullPath = Join-Path $projectRoot $folder
    $gitkeepPath = Join-Path $fullPath ".gitkeep"
    if (-not (Test-Path $gitkeepPath)) {
        New-Item -Path $gitkeepPath -ItemType File -Force | Out-Null
    }
}

# Criar arquivo README.md na pasta storage
$readmePath = Join-Path $storagePath "README.md"
if (-not (Test-Path $readmePath)) {
    $readmeContent = @"
# Armazenamento de PDFs - QWork

Esta pasta contém a estrutura organizada para armazenamento local de PDFs gerados pelo sistema.

## Estrutura

- **laudos/**: PDFs de laudos psicossociais (organizados por lote)
- **recibos/**: PDFs de recibos de pagamento (organizados por ano/mês)
- **relatorios/**: PDFs de relatórios administrativos
  - gestao-cobranca/
  - auditoria/
  - admin/
- **backups/**: Cópias de segurança

## Observações

- Os PDFs são armazenados primariamente no banco de dados (BYTEA) com hash SHA-256.
- Esta estrutura serve como backup local e para exportação.
- Em produção, sincronizar com cloud storage (Vercel Blob ou AWS S3).
- Não versionar arquivos PDF, apenas a estrutura (.gitkeep).

## Backup

Execute periodicamente sincronização com cloud storage:
``````powershell
# Exemplo: sincronizar com AWS S3
aws s3 sync ./storage/ s3://qwork-storage/
``````

## Gerado automaticamente em $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
"@
    Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
    Write-Host "✅ Criado: storage\README.md" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   ✅ Estrutura de armazenamento inicializada com sucesso!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Pastas criadas:" -ForegroundColor White
Write-Host "   • storage/laudos/" -ForegroundColor Gray
Write-Host "   • storage/recibos/$currentYear/ (com 12 subpastas de meses)" -ForegroundColor Gray
Write-Host "   • storage/recibos/$($currentYear + 1)/ (com 12 subpastas de meses)" -ForegroundColor Gray
Write-Host "   • storage/relatorios/gestao-cobranca/" -ForegroundColor Gray
Write-Host "   • storage/relatorios/auditoria/" -ForegroundColor Gray
Write-Host "   • storage/relatorios/admin/" -ForegroundColor Gray
Write-Host "   • storage/backups/" -ForegroundColor Gray
Write-Host ""
