$env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
$env:PGSSLMODE = "require"
$H = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$U = "neondb_owner"

$ids_neon = psql -h $H -U $U -d "neondb" -t -A -f "scripts\get-func-ids.sql"
$ids_v2   = psql -h $H -U $U -d "neondb_v2" -t -A -f "scripts\get-func-ids.sql"

$ids_neon = $ids_neon | Where-Object { $_ -match '^\d+$' }
$ids_v2   = $ids_v2   | Where-Object { $_ -match '^\d+$' }

$missing  = $ids_neon | Where-Object { $_ -notin $ids_v2 }
$extra    = $ids_v2   | Where-Object { $_ -notin $ids_neon }

Write-Host "neondb: $($ids_neon.Count) | neondb_v2: $($ids_v2.Count)"
Write-Host "IDs em neondb mas NAO em v2: $($missing -join ', ')"
Write-Host "IDs em v2 mas NAO em neondb: $($extra -join ', ')"
