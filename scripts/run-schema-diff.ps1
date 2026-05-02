$env:PGPASSWORD = if ($env:NEON_PASSWORD) { $env:NEON_PASSWORD } else { throw 'Set $env:NEON_PASSWORD before running' }
$env:PGSSLMODE = "require"
$H = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$U = "neondb_owner"

$v2 = psql -h $H -U $U -d "neondb_v2" -t -A -F "|" -f "scripts\count-cols.sql"
$st = psql -h $H -U $U -d "neondb_staging" -t -A -F "|" -f "scripts\count-cols.sql"

$v2_h = @{}
$v2 | Where-Object{$_} | ForEach-Object {
    $p=$_.Split("|")
    if ($p.Count -eq 2) { $v2_h[$p[0]]=[int]$p[1] }
}
$st_h = @{}
$st | Where-Object{$_} | ForEach-Object {
    $p=$_.Split("|")
    if ($p.Count -eq 2) { $st_h[$p[0]]=[int]$p[1] }
}

$all = ($v2_h.Keys + $st_h.Keys) | Select-Object -Unique | Sort-Object
$diffs = $all | Where-Object { $v2_h[$_] -ne $st_h[$_] }

if ($diffs.Count -eq 0) {
    Write-Host "SCHEMAS IDENTICOS - mesmas colunas em todas tabelas" -ForegroundColor Green
} else {
    Write-Host "DIFERENCAS ($($diffs.Count)):" -ForegroundColor Yellow
    $diffs | ForEach-Object {
        $tbl = $_
        $v2c = $v2_h[$tbl]
        $stc = $st_h[$tbl]
        Write-Host "  ${tbl}: v2=${v2c} staging=${stc}"
    }
}
