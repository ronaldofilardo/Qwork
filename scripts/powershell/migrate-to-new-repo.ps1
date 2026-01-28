# Script de Migração para Novo Repositório
# Uso: .\migrate-to-new-repo.ps1 -NewRepoUrl "<NEW_REPO_URL>"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewRepoUrl,
    
    [Parameter(Mandatory=$false)]
    [switch]$KeepOldRemote = $false
)

Write-Host "`n=== MIGRAÇÃO PARA NOVO REPOSITÓRIO ===" -ForegroundColor Cyan
Write-Host "`nNovo repositório: $NewRepoUrl" -ForegroundColor Yellow

# 1. Backup do remote atual
if ($KeepOldRemote) {
    Write-Host "`n[1/5] Renomeando remote origin -> origin-old..." -ForegroundColor Green
    git remote rename origin origin-old
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Aviso: Não foi possível renomear origin (pode não existir)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[1/5] Removendo remote origin antigo..." -ForegroundColor Green
    git remote remove origin 2>$null
}

# 2. Adicionar novo remote
Write-Host "`n[2/5] Adicionando novo remote..." -ForegroundColor Green
git remote add origin $NewRepoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao adicionar novo remote" -ForegroundColor Red
    exit 1
}

# 3. Verificar estado
Write-Host "`n[3/5] Verificando estado do repositório..." -ForegroundColor Green
git status --short
git remote -v

# 4. Push inicial (sem hooks)
Write-Host "`n[4/5] Fazendo push para novo repositório..." -ForegroundColor Green
Write-Host "Desabilitando hooks temporariamente..." -ForegroundColor Yellow
$env:HUSKY=0

git push -u origin main --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push" -ForegroundColor Red
    Write-Host "Tente novamente ou verifique permissões no repositório remoto" -ForegroundColor Yellow
    exit 1
}

# Push de outras branches
Write-Host "`nPushando outras branches..." -ForegroundColor Yellow
$branches = git branch -r | Select-String "origin-old" | ForEach-Object { $_ -replace "origin-old/", "" }
foreach ($branch in $branches) {
    if ($branch -ne "main" -and $branch.Trim() -ne "") {
        Write-Host "  Pushing $branch..." -ForegroundColor Gray
        git push origin "$branch`:$branch" --force 2>$null
    }
}

# Push de tags
Write-Host "`nPushando tags..." -ForegroundColor Yellow
git push origin --tags --force 2>$null

# 5. Verificação final
Write-Host "`n[5/5] Verificação final..." -ForegroundColor Green
Write-Host "`nRemotes configurados:" -ForegroundColor Cyan
git remote -v
Write-Host "`nBranches remotas:" -ForegroundColor Cyan
git branch -r
Write-Host "`nÚltimos commits:" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO! ===" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: $NewRepoUrl" -ForegroundColor White
Write-Host "2. Verifique se todos os arquivos estão presentes" -ForegroundColor White
Write-Host "3. Configure CI/CD se necessário" -ForegroundColor White
Write-Host "4. Atualize links em documentação`n" -ForegroundColor White
