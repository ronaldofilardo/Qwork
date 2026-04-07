$auth = Get-Content "$env:APPDATA\com.vercel.cli\Data\auth.json" | ConvertFrom-Json
$token = $auth.token
$teamId = "team_xHHvUUaC35GhGpP4ghWud9MR"
$projectId = "prj_LvK5ytsqYligFlwdzBAihqdgj2WS"
$deployId = "dpl_6SoDvm92U9gPQKGnZowruComFfDk"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# 1. Verificar estado atual do deploy
Write-Host "Verificando estado do deploy..." -ForegroundColor Cyan
$deploy = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments/$deployId`?teamId=$teamId" -Headers $headers -Method GET
Write-Host "Deploy: $($deploy.id) | state: $($deploy.readyState) | target: $($deploy.target)"

# 2. Promover via promote-deployment endpoint
Write-Host ""
Write-Host "Promovendo para producao..." -ForegroundColor Cyan
try {
    $body = "{`"id`":`"$deployId`"}"
    $result = Invoke-RestMethod -Uri "https://api.vercel.com/v1/projects/$projectId/promote-deployment?teamId=$teamId" -Headers $headers -Method POST -Body $body
    Write-Host "SUCCESS" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}
