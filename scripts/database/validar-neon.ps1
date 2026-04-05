# ====================================================================
# SCRIPT DE VALIDAÇÃO DO BANCO NEON
# Data: 2026-02-06
# ====================================================================
# Valida a estrutura do banco Neon e compara com o esperado

param(
    [switch]$CompareWithDev,
    [switch]$Detailed
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO DO BANCO NEON" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração
$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "npg_J2QYqn5oxCzp"
$NEON_DB = "neondb"

$env:PGPASSWORD = $NEON_PASSWORD

# Tabelas críticas esperadas
$expectedTables = @(
    "usuarios",
    "tomadores",
    "clinicas",
    "empresas_clientes",
    "funcionarios",
    "entidades_senhas",
    "clinicas_senhas",
    "funcionarios_entidades",
    "funcionarios_clinicas",
    "lotes_avaliacao",
    "avaliacoes",
    "laudos",
    "fila_emissao",
    "resultados",
    "pagamentos",
    "contratos",
    "notificacoes",
    "auditoria_geral"
)

# Views esperadas
$expectedViews = @(
    "vw_funcionarios_completo",
    "gestores"
)

# Triggers críticos
$criticalTriggers = @(
    "trg_validate_entidade_tipo",
    "trg_validate_funcionario_entidade_tipo"
)

Write-Host "🔍 Executando validações..." -ForegroundColor Yellow
Write-Host ""

try {
    # ====================================================================
    # 1. VALIDAR CONECTIVIDADE
    # ====================================================================
    
    Write-Host "1️⃣  Testando conectividade..." -ForegroundColor Cyan
    $testQuery = "SELECT version();"
    $version = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Conectado ao Neon PostgreSQL" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro de conexão: $version" -ForegroundColor Red
        throw "Falha na conexão com o banco"
    }
    
    Write-Host ""
    
    # ====================================================================
    # 2. VALIDAR TABELAS CRÍTICAS
    # ====================================================================
    
    Write-Host "2️⃣  Validando tabelas críticas..." -ForegroundColor Cyan
    $missingTables = @()
    $foundTables = @()
    
    foreach ($table in $expectedTables) {
        $query = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');"
        $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
        
        if ($result -match "t") {
            Write-Host "   ✅ $table" -ForegroundColor Green
            $foundTables += $table
        } else {
            Write-Host "   ❌ $table (FALTANDO)" -ForegroundColor Red
            $missingTables += $table
        }
    }
    
    Write-Host ""
    Write-Host "   Tabelas encontradas: $($foundTables.Count)/$($expectedTables.Count)" -ForegroundColor $(if($missingTables.Count -eq 0){"Green"}else{"Yellow"})
    
    if ($missingTables.Count -gt 0) {
        Write-Host "   ⚠️  Tabelas faltando:" -ForegroundColor Red
        $missingTables | ForEach-Object { Write-Host "      • $_" -ForegroundColor Red }
    }
    
    Write-Host ""
    
    # ====================================================================
    # 3. VALIDAR VIEWS
    # ====================================================================
    
    Write-Host "3️⃣  Validando views..." -ForegroundColor Cyan
    $missingViews = @()
    
    foreach ($view in $expectedViews) {
        $query = "SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = '$view');"
        $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
        
        if ($result -match "t") {
            Write-Host "   ✅ $view" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $view (FALTANDO)" -ForegroundColor Red
            $missingViews += $view
        }
    }
    
    Write-Host ""
    
    # ====================================================================
    # 4. VALIDAR ESTRUTURA DE FUNCIONARIOS
    # ====================================================================
    
    Write-Host "4️⃣  Validando estrutura de funcionarios..." -ForegroundColor Cyan
    
    $obsoleteColumns = @("clinica_id", "empresa_id", "contratante_id")
    $columnsStillPresent = @()
    
    foreach ($col in $obsoleteColumns) {
        $query = "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = '$col');"
        $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
        
        if ($result -match "t") {
            Write-Host "   ⚠️  Coluna obsoleta ainda existe: $col" -ForegroundColor Red
            $columnsStillPresent += $col
        } else {
            Write-Host "   ✅ Coluna obsoleta removida: $col" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    
    # ====================================================================
    # 5. CONTAR REGISTROS NAS TABELAS NOVAS
    # ====================================================================
    
    Write-Host "5️⃣  Contando registros nas tabelas novas..." -ForegroundColor Cyan
    
    $newTables = @("entidades_senhas", "clinicas_senhas", "funcionarios_entidades", "funcionarios_clinicas")
    
    foreach ($table in $newTables) {
        $query = "SELECT COUNT(*) FROM $table;"
        $count = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $countStr = $count.Trim()
            try {
                $countInt = [int]$countStr
                Write-Host "   • $table`: $countInt registros" -ForegroundColor $(if($countInt -gt 0){"Green"}else{"Yellow"})
            } catch {
                Write-Host "   • $table`: $countStr registros" -ForegroundColor Gray
            }
        } else {
            Write-Host "   • $table`: erro ao contar" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # ====================================================================
    # 6. VALIDAR TRIGGERS
    # ====================================================================
    
    if ($Detailed) {
        Write-Host "6️⃣  Validando triggers críticos..." -ForegroundColor Cyan
        
        foreach ($trigger in $criticalTriggers) {
            $query = "SELECT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = '$trigger');"
            $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
            
            if ($result -match "t") {
                Write-Host "   ✅ $trigger" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $trigger (FALTANDO)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
    }
    
    # ====================================================================
    # 7. ESTATÍSTICAS GERAIS
    # ====================================================================
    
    Write-Host "7️⃣  Estatísticas gerais..." -ForegroundColor Cyan
    
    $statsQuery = @"
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as functions,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views,
    (SELECT COUNT(*) FROM pg_constraint WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as constraints;
"@
    
    $stats = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $statsQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $stats = $stats.Trim() -replace '\s+', ' '
        $parts = $stats -split '\|'
        
        Write-Host "   • Tabelas:     $($parts[0].Trim())" -ForegroundColor Cyan
        Write-Host "   • Funções:     $($parts[1].Trim())" -ForegroundColor Cyan
        Write-Host "   • Triggers:    $($parts[2].Trim())" -ForegroundColor Cyan
        Write-Host "   • Views:       $($parts[3].Trim())" -ForegroundColor Cyan
        Write-Host "   • Constraints: $($parts[4].Trim())" -ForegroundColor Cyan
    }
    
    Write-Host ""
    
    # ====================================================================
    # 8. COMPARAÇÃO COM DEV (OPCIONAL)
    # ====================================================================
    
    if ($CompareWithDev) {
        Write-Host "8️⃣  Comparando com banco de desenvolvimento..." -ForegroundColor Cyan
        Write-Host ""
        
        $DEV_HOST = "localhost"
        $DEV_USER = "postgres"
        $DEV_PASSWORD = "123456"
        $DEV_DB = "nr-bps_db"
        
        $env:PGPASSWORD = $DEV_PASSWORD
        
        # Contar tabelas em dev
        $devTablesQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $devTablesCount = & psql -h $DEV_HOST -U $DEV_USER -d $DEV_DB -t -c $devTablesQuery 2>&1
        
        # Restaurar password do Neon
        $env:PGPASSWORD = $NEON_PASSWORD
        
        # Contar tabelas em prod
        $prodTablesQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $prodTablesCount = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $prodTablesQuery 2>&1
        
        $devCount = [int]$devTablesCount.Trim()
        $prodCount = [int]$prodTablesCount.Trim()
        $diff = $devCount - $prodCount
        
        Write-Host "   DEV:  $devCount tabelas" -ForegroundColor Cyan
        Write-Host "   PROD: $prodCount tabelas" -ForegroundColor Cyan
        Write-Host "   Diferença: $diff tabelas" -ForegroundColor $(if($diff -eq 0){"Green"}elseif($diff -lt 5){"Yellow"}else{"Red"})
        Write-Host ""
    }
    
    # ====================================================================
    # RESULTADO FINAL
    # ====================================================================
    
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "RESULTADO DA VALIDAÇÃO" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $issues = $missingTables.Count + $missingViews.Count + $columnsStillPresent.Count
    
    if ($issues -eq 0) {
        Write-Host "✅ VALIDAÇÃO PASSOU!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   • Todas as tabelas críticas estão presentes" -ForegroundColor Green
        Write-Host "   • Todas as views estão presentes" -ForegroundColor Green
        Write-Host "   • Colunas obsoletas foram removidas" -ForegroundColor Green
        Write-Host "   • Estrutura está conforme esperado" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⚠️  VALIDAÇÃO COM ISSUES ($issues problemas)" -ForegroundColor Yellow
        Write-Host ""
        
        if ($missingTables.Count -gt 0) {
            Write-Host "   ⚠️  $($missingTables.Count) tabelas faltando" -ForegroundColor Red
        }
        
        if ($missingViews.Count -gt 0) {
            Write-Host "   ⚠️  $($missingViews.Count) views faltando" -ForegroundColor Red
        }
        
        if ($columnsStillPresent.Count -gt 0) {
            Write-Host "   ⚠️  $($columnsStillPresent.Count) colunas obsoletas ainda presentes" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "   Revise os detalhes acima e execute as migrações necessárias" -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO DURANTE VALIDAÇÃO!" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
    
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
