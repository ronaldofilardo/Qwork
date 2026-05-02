$env:PGPASSWORD = if ($env:NEON_PASSWORD) { $env:NEON_PASSWORD } else { throw 'Set $env:NEON_PASSWORD before running' }
$env:PGSSLMODE = "require"
$H = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$U = "neondb_owner"

Write-Host "=== COMPARACAO COMPLETA: neondb_v2 vs neondb_staging ===" -ForegroundColor Cyan
Write-Host ""

# 1. Indices
$v2i = psql -h $H -U $U -d "neondb_v2" -t -A -F "|" -f "scripts\count-indexes.sql"
$sti = psql -h $H -U $U -d "neondb_staging" -t -A -F "|" -f "scripts\count-indexes.sql"
$v2i_total = ($v2i | Where-Object {$_} | ForEach-Object { [int]($_.Split("|")[1]) } | Measure-Object -Sum).Sum
$sti_total = ($sti | Where-Object {$_} | ForEach-Object { [int]($_.Split("|")[1]) } | Measure-Object -Sum).Sum
Write-Host "[1] Indices: v2=$v2i_total  staging=$sti_total" -ForegroundColor $(if($v2i_total -eq $sti_total){"Green"}else{"Red"})

# 2. Constraints (count)
$cq_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_schema='public'"
$cq_st = psql -h $H -U $U -d "neondb_staging" -t -A -c "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_schema='public'"
Write-Host "[2] Constraints: v2=$cq_v2  staging=$cq_st" -ForegroundColor $(if($cq_v2 -eq $cq_st){"Green"}else{"Yellow"})

# 3. Views (count)
$vq_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM information_schema.views WHERE table_schema='public'"
$vq_st = psql -h $H -U $U -d "neondb_staging" -t -A -c "SELECT count(*) FROM information_schema.views WHERE table_schema='public'"
Write-Host "[3] Views: v2=$vq_v2  staging=$vq_st" -ForegroundColor $(if($vq_v2 -eq $vq_st){"Green"}else{"Yellow"})

# 4. Functions
$fq_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema='public'"
$fq_st = psql -h $H -U $U -d "neondb_staging" -t -A -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema='public'"
Write-Host "[4] Functions: v2=$fq_v2  staging=$fq_st" -ForegroundColor $(if($fq_v2 -eq $fq_st){"Green"}else{"Yellow"})

# 5. RLS Policies
$rq_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM pg_policies"
$rq_st = psql -h $H -U $U -d "neondb_staging" -t -A -c "SELECT count(*) FROM pg_policies"
Write-Host "[5] RLS Policies: v2=$rq_v2  staging=$rq_st" -ForegroundColor $(if($rq_v2 -eq $rq_st){"Green"}else{"Yellow"})

# 6. Triggers
$tq_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public'"
$tq_st = psql -h $H -U $U -d "neondb_staging" -t -A -c "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public'"
Write-Host "[6] Triggers: v2=$tq_v2  staging=$tq_st" -ForegroundColor $(if($tq_v2 -eq $tq_st){"Green"}else{"Yellow"})

# 7. Colunas legacy ausentes em v2
$leg_v2 = psql -h $H -U $U -d "neondb_v2" -t -A -c "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND ((table_name='clinicas' AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id')) OR (table_name='entidades' AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id')) OR (table_name='contratos' AND column_name IN ('plano_id','valor_personalizado')) OR (table_name='lotes_avaliacao' AND column_name='contratante_id'))"
Write-Host "[7] Colunas legacy em v2 (deve ser 0): $leg_v2" -ForegroundColor $(if($leg_v2 -eq "0"){"Green"}else{"Red"})

Write-Host ""
Write-Host "=== RESULTADO ===" -ForegroundColor Cyan
if ($v2i_total -eq $sti_total -and $leg_v2 -eq "0") {
    Write-Host "OK: neondb_v2 e neondb_staging tem estrutura EQUIVALENTE para PROD" -ForegroundColor Green
} else {
    Write-Host "ATENCAO: Diferencas encontradas - verificar manualmente" -ForegroundColor Red
}
