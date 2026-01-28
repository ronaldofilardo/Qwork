# Script PowerShell para sincronizar o banco Neon com o schema.sql local
# Uso: ./sync-neon-db.ps1

$schemaPath = "database/schema-clean-final.sql"
$connString = "postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Verifica se o psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql não encontrado. Instale o PostgreSQL Client Tools e tente novamente."
    exit 1
}

if (-not (Test-Path $schemaPath)) {
    Write-Error "Arquivo $schemaPath não encontrado."
    exit 1
}

Write-Host "Aplicando $schemaPath no banco Neon..."

$env:PGPASSWORD = "npg_NfJGO8vck9ob"
psql $connString -f $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sincronização concluída com sucesso!"
} else {
    Write-Error "Falha ao sincronizar o banco. Verifique o log acima."
}
