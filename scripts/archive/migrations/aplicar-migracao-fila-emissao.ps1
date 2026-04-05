# ====================================================================
# APLICAR MIGRAÇÃO FALTANTE: fila_emissao
# Data: 2026-02-06
# ====================================================================
# Este script aplica apenas a migração faltante da tabela fila_emissao

param(
    [switch]$SkipConfirmation
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APLICAR MIGRAÇÃO: fila_emissao" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração
$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "REDACTED_NEON_PASSWORD"
$NEON_DB = "neondb"

$MIGRATION_FILE = ".\database\migrations\007b_fila_emissao.sql"

# Verificar se a migração existe
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ ERRO: Arquivo de migração não encontrado: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Migração a ser aplicada:" -ForegroundColor Yellow
Write-Host "   $MIGRATION_FILE" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Este script irá criar a tabela fila_emissao no banco Neon" -ForegroundColor Yellow
Write-Host ""
if (-not $SkipConfirmation) {
    Write-Host "Deseja continuar? (S/N): " -NoNewline -ForegroundColor Yellow
    $confirmation = Read-Host

    if ($confirmation -ne "S" -and $confirmation -ne "s") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "⚠️  SkipConfirmation ativo: prosseguindo sem prompt" -ForegroundColor Yellow
    $confirmation = 'S'
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APLICANDO MIGRAÇÃO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $env:PGPASSWORD = $NEON_PASSWORD
    
    Write-Host "Executando migração..." -ForegroundColor Yellow
    $output = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $MIGRATION_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ MIGRAÇÃO APLICADA COM SUCESSO!" -ForegroundColor Green
        Write-Host ""
        
        # Output resumido
        $output | Select-Object -First 10 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "VALIDANDO" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Validar se a tabela foi criada
        $checkQuery = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_emissao');"
        $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $checkQuery 2>&1
        
        if ($result -match "t") {
            Write-Host "✅ Tabela fila_emissao criada com sucesso!" -ForegroundColor Green
            
            # Contar registros
            $countQuery = "SELECT COUNT(*) FROM fila_emissao;"
            $count = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $countQuery 2>&1
            Write-Host "   Registros: $($count.Trim())" -ForegroundColor Gray
            
        } else {
            Write-Host "⚠️  ATENÇÃO: Tabela fila_emissao não foi encontrada" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "CONCLUÍDO!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ O banco Neon está agora 100% sincronizado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
        Write-Host "   1. Executar validação completa: .\scripts\validar-neon.ps1" -ForegroundColor Gray
        Write-Host "   2. Fazer deploy do código atualizado" -ForegroundColor Gray
        Write-Host "   3. Testar endpoints críticos" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "⚠️  ATENÇÃO: Migração concluída com warnings" -ForegroundColor Yellow
        Write-Host ""
        
        # Mostrar erros
        $errors = $output | Where-Object { $_ -match "ERROR|WARNING" }
        $errors | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Verifique se a tabela foi criada:" -ForegroundColor Yellow
        Write-Host "   .\scripts\validar-neon.ps1" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO AO APLICAR MIGRAÇÃO!" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
    
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
