$auth = Get-Content "$env:APPDATA\com.vercel.cli\Data\auth.json" | ConvertFrom-Json
$token = $auth.token
$projectId = "prj_LvK5ytsqYligFlwdzBAihqdgj2WS"
$teamId = "team_xHHvUUaC35GhGpP4ghWud9MR"
$dbUrl = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&channel_binding=require"

# 1. Listar env vars para encontrar o ID do DATABASE_URL atual
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$envList = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env?teamId=$teamId" -Headers $headers -Method GET
$dbEnv = $envList.envs | Where-Object { $_.key -eq "DATABASE_URL" -and $_.target -contains "production" }

Write-Host "DATABASE_URL entries found: $($dbEnv.Count)"
if ($dbEnv) {
    foreach ($e in $dbEnv) {
        Write-Host "  ID: $($e.id) | target: $($e.target -join ',') | gitBranch: $($e.gitBranch)"
        # Remove old entry
        Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env/$($e.id)?teamId=$teamId" -Headers $headers -Method DELETE
        Write-Host "  Removed: $($e.id)"
    }
}

# 2. Adicionar novo DATABASE_URL via API (sem newlines)
$body = @{
    key = "DATABASE_URL"
    value = $dbUrl
    type = "encrypted"
    target = @("production")
} | ConvertTo-Json -Compress

$result = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId" -Headers $headers -Method POST -Body $body
Write-Host "Added: $($result.key) for $($result.target -join ',')" -ForegroundColor Green

# 3. Verificar
$envList2 = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env?teamId=$teamId" -Headers $headers -Method GET
$dbEnv2 = $envList2.envs | Where-Object { $_.key -eq "DATABASE_URL" }
Write-Host "Final DATABASE_URL entries: $($dbEnv2.Count)"
foreach ($e in $dbEnv2) {
    Write-Host "  $($e.key): target=$($e.target -join ',') | id=$($e.id)" -ForegroundColor Cyan
}
