# Script de Comparação Rigorosa de Schemas - Produção vs Desenvolvimento
# Data: 2026-02-04
# Objetivo: Detectar todas as diferenças entre prod e dev

$ErrorActionPreference = "Stop"

# URLs dos bancos
$prodUrl = $env:DATABASE_URL
$devUrl = $env:LOCAL_DATABASE_URL ?? "postgresql://postgres@localhost:5432/nr-bps_db"

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputDir = "c:\apps\QWork\schema-comparison"
$reportFile = "$outputDir\comparison-report-$timestamp.md"

Write-Host "🔍 Iniciando comparação rigorosa de schemas..." -ForegroundColor Cyan
Write-Host ""

# Criar diretório se não existir
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Função auxiliar para executar query e retornar resultado
function Invoke-PsqlQuery {
    param(
        [string]$Url,
        [string]$Query
    )
    $result = psql $Url -t -A -c $Query 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Erro ao executar query: $result"
        return @()
    }
    return $result | Where-Object { $_ -ne "" }
}

# Iniciar relatório
@"
# Relatório de Comparação de Schemas
**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Produção:** Neon Cloud (neondb)  
**Desenvolvimento:** Local PostgreSQL (nr-bps_db)

---

"@ | Out-File $reportFile

Write-Host "📊 Comparando TRIGGERS..." -ForegroundColor Yellow

# 1. COMPARAR TRIGGERS
$prodTriggers = Invoke-PsqlQuery $prodUrl "SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name;"
$devTriggers = Invoke-PsqlQuery $devUrl "SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name;"

@"

## 1. TRIGGERS

### Triggers em PRODUÇÃO ($(($prodTriggers | Measure-Object).Count)):
``````
$($prodTriggers -join "`n")
``````

### Triggers em DESENVOLVIMENTO ($(($devTriggers | Measure-Object).Count)):
``````
$($devTriggers -join "`n")
``````

### ⚠️ Diferenças:

"@ | Out-File $reportFile -Append

$prodTriggerNames = $prodTriggers | ForEach-Object { ($_ -split '\|')[0] }
$devTriggerNames = $devTriggers | ForEach-Object { ($_ -split '\|')[0] }

$missingInProd = $devTriggerNames | Where-Object { $_ -notin $prodTriggerNames }
$missingInDev = $prodTriggerNames | Where-Object { $_ -notin $devTriggerNames }

if ($missingInProd.Count -gt 0) {
    "**Triggers faltando em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingInProd | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingInDev.Count -gt 0) {
    "**Triggers extras em PRODUÇÃO (não estão em DEV):**" | Out-File $reportFile -Append
    $missingInDev | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingInProd.Count -eq 0 -and $missingInDev.Count -eq 0) {
    "✅ **Todos os triggers estão alinhados!**" | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

Write-Host "📊 Comparando VIEWS..." -ForegroundColor Yellow

# 2. COMPARAR VIEWS
$prodViews = Invoke-PsqlQuery $prodUrl "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;"
$devViews = Invoke-PsqlQuery $devUrl "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;"

@"

## 2. VIEWS

### Views em PRODUÇÃO ($(($prodViews | Measure-Object).Count)):
``````
$($prodViews -join "`n")
``````

### Views em DESENVOLVIMENTO ($(($devViews | Measure-Object).Count)):
``````
$($devViews -join "`n")
``````

### ⚠️ Diferenças:

"@ | Out-File $reportFile -Append

$missingViewsInProd = $devViews | Where-Object { $_ -notin $prodViews }
$missingViewsInDev = $prodViews | Where-Object { $_ -notin $devViews }

if ($missingViewsInProd.Count -gt 0) {
    "**Views faltando em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingViewsInProd | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingViewsInDev.Count -gt 0) {
    "**Views extras em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingViewsInDev | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingViewsInProd.Count -eq 0 -and $missingViewsInDev.Count -eq 0) {
    "✅ **Todas as views estão alinhadas!**" | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

Write-Host "📊 Comparando FUNÇÕES..." -ForegroundColor Yellow

# 3. COMPARAR FUNÇÕES
$prodFunctions = Invoke-PsqlQuery $prodUrl "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name;"
$devFunctions = Invoke-PsqlQuery $devUrl "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name;"

@"

## 3. FUNÇÕES

### Funções em PRODUÇÃO ($(($prodFunctions | Measure-Object).Count)):
``````
$($prodFunctions -join "`n")
``````

### Funções em DESENVOLVIMENTO ($(($devFunctions | Measure-Object).Count)):
``````
$($devFunctions -join "`n")
``````

### ⚠️ Diferenças:

"@ | Out-File $reportFile -Append

$missingFuncsInProd = $devFunctions | Where-Object { $_ -notin $prodFunctions }
$missingFuncsInDev = $prodFunctions | Where-Object { $_ -notin $devFunctions }

if ($missingFuncsInProd.Count -gt 0) {
    "**Funções faltando em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingFuncsInProd | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingFuncsInDev.Count -gt 0) {
    "**Funções extras em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingFuncsInDev | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingFuncsInProd.Count -eq 0 -and $missingFuncsInDev.Count -eq 0) {
    "✅ **Todas as funções estão alinhadas!**" | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

Write-Host "📊 Comparando CONSTRAINTS..." -ForegroundColor Yellow

# 4. COMPARAR CONSTRAINTS (FK, PK, UNIQUE, CHECK)
$prodConstraints = Invoke-PsqlQuery $prodUrl "SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' ORDER BY table_name, constraint_name;"
$devConstraints = Invoke-PsqlQuery $devUrl "SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' ORDER BY table_name, constraint_name;"

@"

## 4. CONSTRAINTS

### Constraints em PRODUÇÃO ($(($prodConstraints | Measure-Object).Count)):
``````
$($prodConstraints -join "`n")
``````

### Constraints em DESENVOLVIMENTO ($(($devConstraints | Measure-Object).Count)):
``````
$($devConstraints -join "`n")
``````

### ⚠️ Diferenças:

"@ | Out-File $reportFile -Append

$prodConstraintNames = $prodConstraints | ForEach-Object { ($_ -split '\|')[0] }
$devConstraintNames = $devConstraints | ForEach-Object { ($_ -split '\|')[0] }

$missingConsInProd = $devConstraintNames | Where-Object { $_ -notin $prodConstraintNames }
$missingConsInDev = $prodConstraintNames | Where-Object { $_ -notin $devConstraintNames }

if ($missingConsInProd.Count -gt 0) {
    "**Constraints faltando em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingConsInProd | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingConsInDev.Count -gt 0) {
    "**Constraints extras em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingConsInDev | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingConsInProd.Count -eq 0 -and $missingConsInDev.Count -eq 0) {
    "✅ **Todas as constraints estão alinhadas!**" | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

Write-Host "📊 Comparando TABELAS..." -ForegroundColor Yellow

# 5. COMPARAR TABELAS
$prodTables = Invoke-PsqlQuery $prodUrl "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
$devTables = Invoke-PsqlQuery $devUrl "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"

@"

## 5. TABELAS

### Tabelas em PRODUÇÃO ($(($prodTables | Measure-Object).Count)):
``````
$($prodTables -join "`n")
``````

### Tabelas em DESENVOLVIMENTO ($(($devTables | Measure-Object).Count)):
``````
$($devTables -join "`n")
``````

### ⚠️ Diferenças:

"@ | Out-File $reportFile -Append

$missingTablesInProd = $devTables | Where-Object { $_ -notin $prodTables }
$missingTablesInDev = $prodTables | Where-Object { $_ -notin $devTables }

if ($missingTablesInProd.Count -gt 0) {
    "**Tabelas faltando em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingTablesInProd | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingTablesInDev.Count -gt 0) {
    "**Tabelas extras em PRODUÇÃO:**" | Out-File $reportFile -Append
    $missingTablesInDev | ForEach-Object { "- $_" } | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

if ($missingTablesInProd.Count -eq 0 -and $missingTablesInDev.Count -eq 0) {
    "✅ **Todas as tabelas estão alinhadas!**" | Out-File $reportFile -Append
    "" | Out-File $reportFile -Append
}

Write-Host "📊 Comparando COLUNAS das principais tabelas..." -ForegroundColor Yellow

# 6. COMPARAR COLUNAS DAS PRINCIPAIS TABELAS
$mainTables = @('lotes_avaliacao', 'laudos', 'avaliacoes', 'funcionarios', 'audit_logs', 'auditoria_laudos')

@"

## 6. COLUNAS DAS PRINCIPAIS TABELAS

"@ | Out-File $reportFile -Append

foreach ($table in $mainTables) {
    $prodCols = Invoke-PsqlQuery $prodUrl "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table' ORDER BY ordinal_position;"
    $devCols = Invoke-PsqlQuery $devUrl "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table' ORDER BY ordinal_position;"
    
    @"

### Tabela: **$table**

**PRODUÇÃO:**
``````
$($prodCols -join "`n")
``````

**DESENVOLVIMENTO:**
``````
$($devCols -join "`n")
``````

"@ | Out-File $reportFile -Append

    $prodColNames = $prodCols | ForEach-Object { ($_ -split '\|')[0] }
    $devColNames = $devCols | ForEach-Object { ($_ -split '\|')[0] }
    
    $missingInProd = $devColNames | Where-Object { $_ -notin $prodColNames }
    $missingInDev = $prodColNames | Where-Object { $_ -notin $devColNames }
    
    if ($missingInProd.Count -gt 0 -or $missingInDev.Count -gt 0) {
        "**⚠️ Diferenças detectadas:**" | Out-File $reportFile -Append
        if ($missingInProd.Count -gt 0) {
            "- Colunas faltando em PROD: $($missingInProd -join ', ')" | Out-File $reportFile -Append
        }
        if ($missingInDev.Count -gt 0) {
            "- Colunas extras em PROD: $($missingInDev -join ', ')" | Out-File $reportFile -Append
        }
        "" | Out-File $reportFile -Append
    } else {
        "✅ **Colunas alinhadas!**" | Out-File $reportFile -Append
        "" | Out-File $reportFile -Append
    }
}

# RESUMO FINAL
@"

---

## 📋 RESUMO FINAL

"@ | Out-File $reportFile -Append

$totalIssues = $missingInProd.Count + $missingInDev.Count + $missingViewsInProd.Count + $missingViewsInDev.Count + 
               $missingFuncsInProd.Count + $missingFuncsInDev.Count + $missingConsInProd.Count + $missingConsInDev.Count +
               $missingTablesInProd.Count + $missingTablesInDev.Count

if ($totalIssues -eq 0) {
    @"
✅ **SUCESSO!** Os schemas estão perfeitamente alinhados!

Não foram detectadas diferenças significativas entre produção e desenvolvimento.
"@ | Out-File $reportFile -Append
} else {
    @"
⚠️ **ATENÇÃO!** Foram detectadas $totalIssues diferenças entre os schemas.

**Recomendações:**
1. Revise cada diferença listada acima
2. Execute as migrations faltantes em produção
3. Valide o funcionamento após aplicar as correções

"@ | Out-File $reportFile -Append
}

Write-Host ""
Write-Host "✅ Relatório gerado com sucesso!" -ForegroundColor Green
Write-Host "📄 Arquivo: $reportFile" -ForegroundColor Cyan
Write-Host ""

# Abrir relatório
notepad $reportFile
