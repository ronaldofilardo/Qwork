# ====================================================================
# BACKUP COMPLETO DO BANCO NEON (PRODUÇÃO)
# Data: 2026-02-06
# ====================================================================
# Este script cria um backup completo do banco Neon antes das migrações

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "BACKUP COMPLETO DO BANCO NEON" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração
$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "npg_J2QYqn5oxCzp"
$NEON_DB = "neondb"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups\neon"
$BACKUP_FILE = "$BACKUP_DIR\neon_backup_$TIMESTAMP.dump"
$SCHEMA_FILE = "$BACKUP_DIR\neon_schema_$TIMESTAMP.sql"
$DATA_FILE = "$BACKUP_DIR\neon_data_$TIMESTAMP.sql"

# Criar diretório de backup se não existir
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "✓ Diretório de backup criado: $BACKUP_DIR" -ForegroundColor Green
}

Write-Host "📦 Configuração de Backup:" -ForegroundColor Yellow
Write-Host "   Banco:         $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "   Diretório:     $BACKUP_DIR" -ForegroundColor Gray
Write-Host "   Backup Full:   $BACKUP_FILE" -ForegroundColor Gray
Write-Host "   Schema Only:   $SCHEMA_FILE" -ForegroundColor Gray
Write-Host "   Data Only:     $DATA_FILE" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Este processo pode demorar alguns minutos..." -ForegroundColor Yellow
Write-Host ""

# Configurar password
$env:PGPASSWORD = $NEON_PASSWORD

try {
    # 1. Backup completo (formato custom)
    Write-Host "1️⃣  Criando backup completo (formato custom)..." -ForegroundColor Cyan
    $output = & pg_dump -h $NEON_HOST -U $NEON_USER -d $NEON_DB -F c -f $BACKUP_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $backupSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Host "   ✅ Backup completo criado: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao criar backup completo" -ForegroundColor Red
        Write-Host "   Output: $output" -ForegroundColor Red
        throw "Falha no backup completo"
    }
    
    Write-Host ""
    
    # 2. Backup apenas do schema
    Write-Host "2️⃣  Criando backup do schema..." -ForegroundColor Cyan
    $output = & pg_dump -h $NEON_HOST -U $NEON_USER -d $NEON_DB --schema-only -f $SCHEMA_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $schemaSize = (Get-Item $SCHEMA_FILE).Length / 1KB
        Write-Host "   ✅ Schema exportado: $([math]::Round($schemaSize, 2)) KB" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Aviso: Possível problema ao exportar schema" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # 3. Backup apenas dos dados
    Write-Host "3️⃣  Criando backup dos dados..." -ForegroundColor Cyan
    $output = & pg_dump -h $NEON_HOST -U $NEON_USER -d $NEON_DB --data-only -f $DATA_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $dataSize = (Get-Item $DATA_FILE).Length / 1KB
        Write-Host "   ✅ Dados exportados: $([math]::Round($dataSize, 2)) KB" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Aviso: Possível problema ao exportar dados" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✅ BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Arquivos criados:" -ForegroundColor Cyan
    Write-Host "   1. Backup completo: $BACKUP_FILE" -ForegroundColor Gray
    Write-Host "   2. Schema:          $SCHEMA_FILE" -ForegroundColor Gray
    Write-Host "   3. Dados:           $DATA_FILE" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Para restaurar o backup:" -ForegroundColor Yellow
    Write-Host "   pg_restore -h HOST -U USER -d DB -c $BACKUP_FILE" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO DURANTE O BACKUP!" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
    
} finally {
    # Limpar variável de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Listar todos os backups existentes
Write-Host "📋 Backups existentes:" -ForegroundColor Cyan
Get-ChildItem -Path $BACKUP_DIR -Filter "neon_backup_*.dump" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10 |
    ForEach-Object {
        $size = $_.Length / 1MB
        $age = (Get-Date) - $_.LastWriteTime
        Write-Host "   • $($_.Name) - $([math]::Round($size, 2)) MB - $([math]::Round($age.TotalHours, 1))h atrás" -ForegroundColor Gray
    }

Write-Host ""
Write-Host "✅ Pronto! Agora você pode aplicar as migrações com segurança." -ForegroundColor Green
Write-Host ""
