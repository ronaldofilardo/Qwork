# Migração de dados Neon Cloud → nr-bps_db
# Migra: planos, tomadores, clínicas, empresas, funcionários (com dependências)

Write-Host "🔄 Migração de Dados: Neon Cloud → nr-bps_db" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$NEON_URL = $env:DATABASE_URL
$LOCAL_URL = $env:LOCAL_DATABASE_URL ?? "postgresql://postgres@localhost:5432/nr-bps_db"

Write-Host "📊 Verificando dados no Neon Cloud..." -ForegroundColor Yellow
$check = psql --dbname=$NEON_URL --tuples-only --no-align -c @"
SELECT 
    (SELECT COUNT(*) FROM planos) as planos,
    (SELECT COUNT(*) FROM tomadores) as tomadores,
    (SELECT COUNT(*) FROM clinicas) as clinicas,
    (SELECT COUNT(*) FROM empresas_clientes) as empresas,
    (SELECT COUNT(*) FROM funcionarios) as funcionarios;
"@

Write-Host "Origem (Neon): $check" -ForegroundColor Gray
Write-Host ""

# Ordem de migração (respeita foreign keys)
$tables = @(
    "planos",
    "tomadores",
    "entidades_senhas",
    "clinicas",
    "empresas_clientes",
    "funcionarios"
)

Write-Host "🚀 Iniciando migração de $($tables.Count) tabelas..." -ForegroundColor Yellow
Write-Host ""

foreach ($table in $tables) {
    Write-Host "  📦 Migrando $table..." -ForegroundColor Cyan
    
    # Exportar dados da tabela do Neon (formato COPY)
    $dumpFile = "temp_$table.sql"
    
    try {
        # Fazer dump apenas dos dados da tabela
        pg_dump --dbname=$NEON_URL `
                --table=public.$table `
                --data-only `
                --column-inserts `
                --file=$dumpFile `
                2>&1 | Out-Null
        
        if (Test-Path $dumpFile) {
            # Restaurar no banco local
            psql --dbname=$LOCAL_URL --file=$dumpFile 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                $count = psql --dbname=$LOCAL_URL --tuples-only --no-align -c "SELECT COUNT(*) FROM $table;"
                Write-Host "     ✅ $table migrada: $count registros" -ForegroundColor Green
            } else {
                Write-Host "     ⚠️  $table: possível erro (verificar manualmente)" -ForegroundColor Yellow
            }
            
            # Limpar arquivo temporário
            Remove-Item $dumpFile -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-Host "     ❌ Erro ao migrar $table : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Verificando migração..." -ForegroundColor Yellow

$result = psql --dbname=$LOCAL_URL --tuples-only --no-align --field-separator=' | ' -c @"
SELECT 'planos' as tabela, COUNT(*) as registros FROM planos
UNION ALL
SELECT 'tomadores', COUNT(*) FROM tomadores
UNION ALL
SELECT 'clinicas', COUNT(*) FROM clinicas
UNION ALL
SELECT 'empresas_clientes', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios;
"@

Write-Host ""
Write-Host "Resultado da migração (nr-bps_db):" -ForegroundColor Cyan
foreach ($line in $result) {
    if ($line.Trim()) {
        Write-Host "  $line" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✅ Migração de dados concluída!" -ForegroundColor Green
Write-Host "   Banco nr-bps_db agora contém os dados de desenvolvimento" -ForegroundColor Gray
Write-Host ""
