# Script PowerShell para sincronizar o banco Neon com o schema.sql local
# Uso: ./sync-neon-db.ps1

$schemaPath = "database/schema-clean-final.sql"
# Use PROD_CONN_STRING from environment to avoid hard-coded credentials
$connString = $env:PROD_CONN_STRING
if (-not $connString -or $connString -eq "") {
    Write-Error "PROD_CONN_STRING não definido. Defina a variável de ambiente PROD_CONN_STRING com a connection string do Neon (ex.: postgresql://user:pass@host/db?sslmode=require)."
    exit 1
}

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

# Use PGPASSWORD from environment if set; do NOT hard-code passwords in repo
if ($env:PGPASSWORD) {
    Write-Host "Usando PGPASSWORD provido via variável de ambiente."
} else {
    Write-Host "PGPASSWORD não definido. Configure PGPASSWORD se o seu cliente psql exigir uma senha."
}

psql $connString -f $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sincronização concluída com sucesso!"
} else {
    Write-Error "Falha ao sincronizar o banco. Verifique o log acima."
}
