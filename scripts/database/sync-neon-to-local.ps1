# Script para sincronizar banco Neon Cloud → nr-bps_db local
# Faz dump completo do Neon (schema + dados) e restaura no banco local

Write-Host "🔄 Sincronização Neon Cloud → nr-bps_db local" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# URLs dos bancos
$NEON_URL = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$LOCAL_URL = "postgresql://postgres:123456@localhost:5432/nr-bps_db"

# Arquivos temporários
$DUMP_FILE = "neon-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql"
$DUMP_PATH = Join-Path $PSScriptRoot $DUMP_FILE

Write-Host "📦 Etapa 1: Fazendo dump do banco Neon Cloud..." -ForegroundColor Yellow
Write-Host "   Origem: ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb" -ForegroundColor Gray
Write-Host "   Arquivo: $DUMP_FILE" -ForegroundColor Gray
Write-Host ""

# Fazer dump do Neon (schema + dados)
$dumpArgs = @(
    "--dbname=$NEON_URL",
    "--file=$DUMP_PATH",
    "--verbose",
    "--no-owner",
    "--no-acl",
    "--clean",
    "--if-exists"
)

try {
    & pg_dump @dumpArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump falhou com código $LASTEXITCODE"
    }
    
    Write-Host "✅ Dump concluído: $DUMP_FILE" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro ao fazer dump do Neon: $_" -ForegroundColor Red
    exit 1
}

# Confirmação antes de sobrescrever banco local
Write-Host "⚠️  ATENÇÃO: Isso irá SOBRESCREVER o banco local nr-bps_db!" -ForegroundColor Red
Write-Host "   Destino: localhost:5432/nr-bps_db" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "   Deseja continuar? (digite 'SIM' para confirmar)"

if ($confirm -ne "SIM") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Yellow
    Write-Host "   Dump salvo em: $DUMP_PATH" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "📥 Etapa 2: Restaurando no banco local nr-bps_db..." -ForegroundColor Yellow
Write-Host ""

# Restaurar no banco local
$restoreArgs = @(
    "--dbname=$LOCAL_URL",
    "--file=$DUMP_PATH",
    "--verbose"
)

try {
    & psql @restoreArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  psql retornou código $LASTEXITCODE (pode ser normal se houver avisos)" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Restauração concluída!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro ao restaurar no banco local: $_" -ForegroundColor Red
    Write-Host "   Dump preservado em: $DUMP_PATH" -ForegroundColor Gray
    exit 1
}

# Verificar dados restaurados
Write-Host "📊 Etapa 3: Verificando dados restaurados..." -ForegroundColor Yellow
Write-Host ""

$verifyQuery = @"
SELECT 
    'tomadores' as tabela, COUNT(*) as registros FROM tomadores
UNION ALL
SELECT 'empresas_clientes', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'avaliacoes', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'lotes_avaliacao', COUNT(*) FROM lotes_avaliacao
UNION ALL
SELECT 'laudos', COUNT(*) FROM laudos
UNION ALL
SELECT 'planos', COUNT(*) FROM planos;
"@

try {
    $result = psql --dbname=$LOCAL_URL --tuples-only --no-align --field-separator=' | ' -c $verifyQuery
    
    Write-Host "Tabelas principais:" -ForegroundColor Cyan
    foreach ($line in $result) {
        if ($line.Trim()) {
            Write-Host "  $line" -ForegroundColor White
        }
    }
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Não foi possível verificar dados: $_" -ForegroundColor Yellow
}

# Limpeza opcional
Write-Host "🗑️  Deseja remover o arquivo de dump? (ele ocupa espaço)" -ForegroundColor Yellow
$cleanup = Read-Host "   Digite 'SIM' para remover $DUMP_FILE"

if ($cleanup -eq "SIM") {
    Remove-Item $DUMP_PATH -Force
    Write-Host "✅ Arquivo removido" -ForegroundColor Green
} else {
    Write-Host "📁 Dump preservado em: $DUMP_PATH" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Sincronização concluída com sucesso!" -ForegroundColor Green
Write-Host "   Banco local nr-bps_db agora está sincronizado com Neon Cloud" -ForegroundColor Gray
Write-Host ""
