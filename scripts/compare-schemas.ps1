# Script de Comparação de Schemas (Local vs Neon)
# Uso: .\scripts\compare-schemas.ps1

param(
    [switch]$SkipLocal = $false,
    [switch]$SkipNeon = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  COMPARAÇÃO DE SCHEMAS - LOCAL vs NEON (PRODUÇÃO)  " -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

$outputDir = ".\schema-comparison"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Criar diretório de saída
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "✓ Diretório criado: $outputDir" -ForegroundColor Green
}

# ============================================================================
# VARIÁVEIS DE AMBIENTE
# ============================================================================

# Carregar .env.local se existir
$envFile = ".\.env.local"
if (Test-Path $envFile) {
    Write-Host "Carregando variáveis de .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            if ($Verbose) {
                Write-Host "  $key = $value" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
}

# Configurações de banco
$localDbName = "nr-bps_db"
$localDbUser = "postgres"
$localDbPassword = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }
$localDbHost = "localhost"
$localDbPort = "5432"

# URL do Neon (da variável de ambiente)
$neonUrl = $env:DATABASE_URL

if (-not $neonUrl) {
    Write-Host "❌ ERRO: DATABASE_URL não encontrada!" -ForegroundColor Red
    Write-Host "   Configure a variável DATABASE_URL no .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Variáveis de ambiente carregadas" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFICAR PG_DUMP
# ============================================================================

try {
    $pgDumpVersion = pg_dump --version
    Write-Host "✓ pg_dump encontrado: $pgDumpVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: pg_dump não encontrado!" -ForegroundColor Red
    Write-Host "   Instale PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# GERAR SCHEMA LOCAL
# ============================================================================

if (-not $SkipLocal) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  1. GERANDO SCHEMA LOCAL (nr-bps_db)               " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""

    $localSchemaFile = Join-Path $outputDir "schema-local-$timestamp.sql"

    try {
        $env:PGPASSWORD = $localDbPassword
        pg_dump -h $localDbHost -p $localDbPort -U $localDbUser -d $localDbName `
                --schema-only `
                --no-owner `
                --no-privileges `
                --no-tablespaces `
                --no-security-labels `
                --no-publications `
                --no-subscriptions `
                > $localSchemaFile

        $localSize = (Get-Item $localSchemaFile).Length / 1KB
        Write-Host "✓ Schema local gerado: $localSchemaFile" -ForegroundColor Green
        Write-Host "  Tamanho: $([math]::Round($localSize, 2)) KB" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ ERRO ao gerar schema local: $_" -ForegroundColor Red
        exit 1
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "⚠️ Pulando geração do schema local (--SkipLocal)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# GERAR SCHEMA NEON
# ============================================================================

if (-not $SkipNeon) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  2. GERANDO SCHEMA NEON (Produção)                 " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""

    $neonSchemaFile = Join-Path $outputDir "schema-neon-$timestamp.sql"

    # Extrair senha da URL para evitar prompt
    if ($neonUrl -match 'postgresql://([^:]+):([^@]+)@(.+)') {
        $neonUser = $matches[1]
        $neonPassword = $matches[2]
        $neonHostDb = $matches[3]
        
        Write-Host "  Conectando ao Neon Cloud..." -ForegroundColor Yellow
        if ($Verbose) {
            $maskedUrl = "postgresql://$neonUser`:***@$neonHostDb"
            Write-Host "  URL: $maskedUrl" -ForegroundColor Gray
        }

        try {
            $env:PGPASSWORD = $neonPassword
            pg_dump $neonUrl `
                    --schema-only `
                    --no-owner `
                    --no-privileges `
                    --no-tablespaces `
                    --no-security-labels `
                    --no-publications `
                    --no-subscriptions `
                    > $neonSchemaFile

            $neonSize = (Get-Item $neonSchemaFile).Length / 1KB
            Write-Host "✓ Schema Neon gerado: $neonSchemaFile" -ForegroundColor Green
            Write-Host "  Tamanho: $([math]::Round($neonSize, 2)) KB" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "❌ ERRO ao gerar schema Neon: $_" -ForegroundColor Red
            Write-Host "   Verifique se DATABASE_URL está correta" -ForegroundColor Yellow
            exit 1
        } finally {
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "❌ ERRO: DATABASE_URL em formato inválido!" -ForegroundColor Red
        Write-Host "   Formato esperado: postgresql://user:pass@host/db" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⚠️ Pulando geração do schema Neon (--SkipNeon)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# COMPARAR SCHEMAS
# ============================================================================

if (-not $SkipLocal -and -not $SkipNeon) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  3. COMPARANDO SCHEMAS                             " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""

    $diffFile = Join-Path $outputDir "schema-diff-$timestamp.txt"
    $reportFile = Join-Path $outputDir "schema-report-$timestamp.md"

    # Comparar arquivos
    $localContent = Get-Content $localSchemaFile
    $neonContent = Get-Content $neonSchemaFile

    $diff = Compare-Object $localContent $neonContent -IncludeEqual:$false

    if ($diff.Count -eq 0) {
        Write-Host "✅ SCHEMAS IDÊNTICOS!" -ForegroundColor Green
        Write-Host "   Local e Neon estão 100% sincronizados" -ForegroundColor Green
        Write-Host ""

        # Gerar relatório de sucesso
        @"
# RELATÓRIO DE COMPARAÇÃO DE SCHEMAS

**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Status:** ✅ **IDÊNTICOS**

## Resultado

Os schemas local (nr-bps_db) e produção (Neon Cloud) estão **100% sincronizados**.

### Detalhes

- **Schema Local:** $localSchemaFile ($([math]::Round($localSize, 2)) KB)
- **Schema Neon:** $neonSchemaFile ($([math]::Round($neonSize, 2)) KB)
- **Diferenças:** 0

## Próximos Passos

✅ Schemas validados  
✅ Pode prosseguir com deploy  
✅ Nenhuma migration pendente  

"@ | Out-File $reportFile -Encoding UTF8

    } else {
        Write-Host "⚠️ DIFERENÇAS ENCONTRADAS!" -ForegroundColor Yellow
        Write-Host "   Total de linhas diferentes: $($diff.Count)" -ForegroundColor Yellow
        Write-Host ""

        # Salvar diferenças
        $diff | Out-File $diffFile -Encoding UTF8

        # Análise detalhada
        $onlyInLocal = ($diff | Where-Object { $_.SideIndicator -eq '<=' }).Count
        $onlyInNeon = ($diff | Where-Object { $_.SideIndicator -eq '=>' }).Count

        Write-Host "  Apenas no LOCAL: $onlyInLocal linhas" -ForegroundColor Cyan
        Write-Host "  Apenas no NEON:  $onlyInNeon linhas" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "  Diferenças salvas em: $diffFile" -ForegroundColor Gray
        Write-Host ""

        # Mostrar primeiras diferenças
        Write-Host "  Primeiras 20 diferenças:" -ForegroundColor Yellow
        Write-Host "  " + ("─" * 60) -ForegroundColor Gray
        $diff | Select-Object -First 20 | ForEach-Object {
            $indicator = if ($_.SideIndicator -eq '<=') { 'LOCAL' } else { 'NEON ' }
            $color = if ($_.SideIndicator -eq '<=') { 'Cyan' } else { 'Magenta' }
            Write-Host "  [$indicator] $($_.InputObject)" -ForegroundColor $color
        }
        Write-Host "  " + ("─" * 60) -ForegroundColor Gray
        Write-Host ""

        # Gerar relatório detalhado
        @"
# RELATÓRIO DE COMPARAÇÃO DE SCHEMAS

**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Status:** ⚠️ **DIFERENÇAS ENCONTRADAS**

## Resultado

Foram encontradas **$($diff.Count) linhas diferentes** entre local e produção.

### Estatísticas

| Métrica | Valor |
|---------|-------|
| Apenas no LOCAL | $onlyInLocal linhas |
| Apenas no NEON | $onlyInNeon linhas |
| Total de diferenças | $($diff.Count) linhas |

### Detalhes

- **Schema Local:** $localSchemaFile ($([math]::Round($localSize, 2)) KB)
- **Schema Neon:** $neonSchemaFile ($([math]::Round($neonSize, 2)) KB)
- **Arquivo de diferenças:** $diffFile

## Análise

As diferenças podem indicar:

1. **Migrations não aplicadas no Neon** (mais comum)
2. **Migrations não aplicadas localmente**
3. **Alterações manuais no banco**
4. **Diferentes versões do PostgreSQL**

## Primeiras 50 Diferenças

``````diff
$(($diff | Select-Object -First 50 | ForEach-Object {
    $indicator = if ($_.SideIndicator -eq '<=') { '-' } else { '+' }
    "$indicator $($_.InputObject)"
}) -join "`n")
``````

## Próximos Passos

1. [ ] Analisar arquivo de diferenças completo: ``$diffFile``
2. [ ] Verificar migrations pendentes:
   ``````sql
   SELECT migration_name, applied_at 
   FROM _prisma_migrations 
   ORDER BY migration_name DESC LIMIT 50;
   ``````
3. [ ] Aplicar migrations faltantes (se necessário)
4. [ ] Executar novamente este script para validar

## Comandos Úteis

``````powershell
# Ver diferenças completas
Get-Content "$diffFile"

# Aplicar migration específica no Neon
psql `$env:DATABASE_URL -f database/migrations/XXX_nome_migration.sql

# Verificar migrations aplicadas
psql `$env:DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY migration_name;"
``````

"@ | Out-File $reportFile -Encoding UTF8

        Write-Host "  📄 Relatório completo: $reportFile" -ForegroundColor Cyan
        Write-Host ""
    }
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  RESUMO                                            " -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Arquivos gerados em: $outputDir" -ForegroundColor White
Write-Host ""

if (-not $SkipLocal) {
    Write-Host "  📄 Schema Local:  $localSchemaFile" -ForegroundColor Cyan
}
if (-not $SkipNeon) {
    Write-Host "  📄 Schema Neon:   $neonSchemaFile" -ForegroundColor Magenta
}
if (-not $SkipLocal -and -not $SkipNeon) {
    if ($diff.Count -eq 0) {
        Write-Host "  ✅ Relatório:     $reportFile (IDÊNTICOS)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Diferenças:   $diffFile" -ForegroundColor Yellow
        Write-Host "  📄 Relatório:     $reportFile" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipLocal -and -not $SkipNeon -and $diff.Count -gt 0) {
    Write-Host "⚠️ AÇÃO NECESSÁRIA: Analisar diferenças e aplicar migrations faltantes" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Script concluído com sucesso!" -ForegroundColor Green
    exit 0
}
