# ====================================================================
# VALIDATE PROD SCHEMA SYNC — neondb_v2 vs neondb_staging
# Data: 25/04/2026
# Objetivo: Validar que PROD está em dia com STAGING após sync de migrations.
#            Verifica: schema_migrations gap, contagem de colunas,
#            integridade dos dados, tabelas/colunas legacy ausentes.
#            NÃO modifica nenhum banco.
# ====================================================================

$NEON_HOST  = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER  = "neondb_owner"
$PROD_DB    = "neondb_v2"
$STAGING_DB = "neondb_staging"

$password = if ($env:NEON_PROD_PASSWORD) { $env:NEON_PROD_PASSWORD }
            elseif ($env:PGPASSWORD)      { $env:PGPASSWORD }
            else                          { "REDACTED_NEON_PASSWORD" }

$env:PGPASSWORD    = $password
$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$checks_ok  = 0
$checks_err = 0

function Pass($msg)  { Write-Host "  [PASS] $msg" -ForegroundColor Green;  $script:checks_ok++  }
function Fail($msg)  { Write-Host "  [FAIL] $msg" -ForegroundColor Red;    $script:checks_err++ }
function Warn($msg)  { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Head($msg)  { Write-Host ""; Write-Host "== $msg ==" -ForegroundColor Cyan }

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  VALIDAÇÃO PÓS-SYNC: neondb_v2 vs neondb_staging" -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan

# ====================================================================
# CHECK 1: schema_migrations gap
# ====================================================================
Head "1. Gap de schema_migrations"

$prodV = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -c `
    "SELECT version FROM schema_migrations WHERE version < 9000 ORDER BY version;" 2>&1 |
    Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

$stagV = psql -h $NEON_HOST -U $NEON_USER -d $STAGING_DB -t -A -c `
    "SELECT version FROM schema_migrations WHERE version < 9000 ORDER BY version;" 2>&1 |
    Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

$prodMax = $prodV | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum
$stagMax = $stagV | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum

Write-Host "  PROD    max: $prodMax ($($prodV.Count) total)"
Write-Host "  STAGING max: $stagMax ($($stagV.Count) total)"

$missing = $stagV | Where-Object { $prodV -notcontains $_ } | Sort-Object
if ($missing.Count -eq 0) {
    Pass "Todas migrations de STAGING estao em PROD"
} else {
    Fail "$($missing.Count) migrations ainda faltando em PROD: $($missing -join ', ')"
}

$orphans = $prodV | Where-Object { $stagV -notcontains $_ } | Sort-Object
if ($orphans.Count -eq 0) {
    Pass "Nenhuma migration orfa em PROD"
} else {
    Warn "$($orphans.Count) migrations orfas em PROD (existem em PROD mas nao em STAGING): $($orphans -join ', ')"
}

# ====================================================================
# CHECK 2: Contagem de colunas por tabela (PROD vs STAGING)
# ====================================================================
Head "2. Contagem de colunas (PROD vs STAGING)"

$countColsSQL = @"
SELECT table_name, count(*) AS cols
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
"@

$prodCols = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB    -t -A -F "|" -c $countColsSQL 2>&1 |
    Where-Object { $_ -match '\|' }
$stagCols = psql -h $NEON_HOST -U $NEON_USER -d $STAGING_DB -t -A -F "|" -c $countColsSQL 2>&1 |
    Where-Object { $_ -match '\|' }

$prodColMap = @{}
$prodCols | ForEach-Object {
    $p = $_.Split("|")
    if ($p.Count -eq 2) { $prodColMap[$p[0].Trim()] = [int]$p[1].Trim() }
}
$stagColMap = @{}
$stagCols | ForEach-Object {
    $p = $_.Split("|")
    if ($p.Count -eq 2) { $stagColMap[$p[0].Trim()] = [int]$p[1].Trim() }
}

$allTables = ($prodColMap.Keys + $stagColMap.Keys) | Select-Object -Unique | Sort-Object
$colDiffs = @()
$allTables | ForEach-Object {
    $t = $_
    $pc = $prodColMap[$t]
    $sc = $stagColMap[$t]
    if ($pc -ne $sc) {
        $colDiffs += "  $t : PROD=$pc STAGING=$sc"
    }
}

if ($colDiffs.Count -eq 0) {
    Pass "Contagem de colunas identica em todas as tabelas"
} else {
    Fail "$($colDiffs.Count) tabelas com contagem diferente de colunas:"
    $colDiffs | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

# Tabelas em STAGING mas não em PROD
$tablesOnlyInStaging = $stagColMap.Keys | Where-Object { -not $prodColMap.ContainsKey($_) }
if ($tablesOnlyInStaging.Count -gt 0) {
    Fail "Tabelas presentes em STAGING mas AUSENTES em PROD: $($tablesOnlyInStaging -join ', ')"
} else {
    Pass "Nenhuma tabela do STAGING faltando em PROD"
}

# Tabelas em PROD mas não em STAGING
$tablesOnlyInProd = $prodColMap.Keys | Where-Object { -not $stagColMap.ContainsKey($_) }
if ($tablesOnlyInProd.Count -gt 0) {
    Warn "Tabelas presentes em PROD mas ausentes em STAGING: $($tablesOnlyInProd -join ', ')"
}

# ====================================================================
# CHECK 3: Colunas legacy não devem existir em PROD
# ====================================================================
Head "3. Colunas/tabelas legacy (devem estar ausentes em PROD)"

$legacyCheck = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -F "|" -c @"
SELECT table_name || '.' || column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND (
    (table_name = 'clinicas'        AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'entidades'    AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'contratos'    AND column_name IN ('plano_id','valor_personalizado'))
    OR (table_name = 'lotes_avaliacao' AND column_name = 'contratante_id')
    OR (table_name = 'funcionarios' AND column_name = 'contratante_id')
  );
"@ 2>&1 | Where-Object { $_ -match '\.' }

if ($legacyCheck.Count -eq 0) {
    Pass "Nenhuma coluna legacy encontrada"
} else {
    Fail "Colunas legacy presentes em PROD:"
    $legacyCheck | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

$legacyTables = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -c @"
SELECT tablename FROM pg_tables
WHERE schemaname='public'
  AND tablename IN ('contratos_planos','payment_links','confirmacao_identidade','planos');
"@ 2>&1 | Where-Object { $_ -match '\w' -and $_ -notmatch '^--' }

if ($legacyTables.Count -eq 0) {
    Pass "Nenhuma tabela legacy encontrada"
} else {
    Fail "Tabelas legacy presentes em PROD: $($legacyTables -join ', ')"
}

# ====================================================================
# CHECK 4: Integridade dos dados de PROD (contagens devem ser >= backup)
# ====================================================================
Head "4. Integridade de dados PROD (contagens de segurança)"

$countSQL = @"
SELECT 'clinicas'           AS t, count(*) FROM clinicas       UNION ALL
SELECT 'entidades',          count(*) FROM entidades            UNION ALL
SELECT 'empresas_clientes',  count(*) FROM empresas_clientes    UNION ALL
SELECT 'funcionarios',       count(*) FROM funcionarios         UNION ALL
SELECT 'avaliacoes',         count(*) FROM avaliacoes           UNION ALL
SELECT 'respostas',          count(*) FROM respostas            UNION ALL
SELECT 'laudos',             count(*) FROM laudos               UNION ALL
SELECT 'lotes_avaliacao',    count(*) FROM lotes_avaliacao      UNION ALL
SELECT 'contratos',          count(*) FROM contratos            UNION ALL
SELECT 'pagamentos',         count(*) FROM pagamentos           UNION ALL
SELECT 'usuarios',           count(*) FROM usuarios             UNION ALL
SELECT 'representantes',     count(*) FROM representantes
ORDER BY 1;
"@

# Contagens MÍNIMAS esperadas (tiradas do backup 20260425_163100)
$minExpected = @{
    "avaliacoes"       = 324
    "clinicas"         = 26
    "contratos"        = 44
    "empresas_clientes"= 55
    "entidades"        = 16
    "funcionarios"     = 354
    "laudos"           = 77
    "lotes_avaliacao"  = 86
    "pagamentos"       = 40
    "representantes"   = 2
    "respostas"        = 5342
    "usuarios"         = 46
}

$prodCounts = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -F "|" -c $countSQL 2>&1 |
    Where-Object { $_ -match '\|' }

$dataOK = $true
$prodCounts | ForEach-Object {
    $p = $_.Split("|")
    if ($p.Count -eq 2) {
        $tbl = $p[0].Trim()
        $cnt = [int]$p[1].Trim()
        $min = $minExpected[$tbl]
        if ($min -and $cnt -lt $min) {
            Fail "${tbl}: $cnt rows (esperado >= $min do backup) — DADOS PODEM TER SIDO PERDIDOS!"
            $dataOK = $false
        } else {
            Write-Host "  [OK]   ${tbl}: $cnt rows $(if ($min) { "(>= $min)" })" -ForegroundColor Green
        }
    }
}

if ($dataOK) { Pass "Dados de PROD intactos (todas contagens >= backup pré-sync)" }

# ====================================================================
# RESULTADO FINAL
# ====================================================================
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Checks OK   : $checks_ok" -ForegroundColor Green
Write-Host "  Checks FAIL : $checks_err" -ForegroundColor $(if ($checks_err -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($checks_err -eq 0) {
    Write-Host "  SYNC VALIDADO! PROD esta sincronizado com STAGING." -ForegroundColor Green
    Write-Host "  Dados preservados. Schema atualizado." -ForegroundColor Green
} else {
    Write-Host "  ATENCAO: $checks_err check(s) falharam. Revise os erros acima." -ForegroundColor Red
}

Write-Host ""

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($checks_err -gt 0) { exit 1 }
exit 0
