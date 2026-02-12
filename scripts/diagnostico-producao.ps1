# Script para forçar atualização e verificar em Produção
Write-Host "`n=== DIAGNÓSTICO: Produção Vercel ===" -ForegroundColor Cyan

Write-Host "`n1. Banco de dados (CONFIRMADO):" -ForegroundColor Green
Write-Host "   ✅ 1 lote encontrado: Lote 1005" -ForegroundColor White
Write-Host "   ✅ Status: aguardando_cobranca" -ForegroundColor White
Write-Host "   ✅ View v_solicitacoes_emissao: OK" -ForegroundColor White

Write-Host "`n2. Possíveis causas do problema:" -ForegroundColor Yellow
Write-Host "   A. Cache do navegador (mais provável)" -ForegroundColor White
Write-Host "   B. Deploy pendente no Vercel" -ForegroundColor White
Write-Host "   C. Erro na API em produção" -ForegroundColor White

Write-Host "`n3. SOLUÇÕES RÁPIDAS:" -ForegroundColor Cyan

Write-Host "`n   Opção 1: HARD REFRESH no navegador" -ForegroundColor Yellow
Write-Host "   - Windows/Linux: Ctrl + Shift + R" -ForegroundColor White
Write-Host "   - Mac: Cmd + Shift + R" -ForegroundColor White
Write-Host "   - Ou: Ctrl + F5" -ForegroundColor White

Write-Host "`n   Opção 2: Limpar cache do navegador" -ForegroundColor Yellow
Write-Host "   - Abra DevTools (F12)" -ForegroundColor White
Write-Host "   - Clique com botão direito no botão Atualizar" -ForegroundColor White
Write-Host "   - Selecione 'Esvaziar cache e recarregar forçado'" -ForegroundColor White

Write-Host "`n   Opção 3: Verificar Console do navegador" -ForegroundColor Yellow
Write-Host "   - Pressione F12" -ForegroundColor White
Write-Host "   - Vá na aba Console" -ForegroundColor White
Write-Host "   - Procure por erros em vermelho" -ForegroundColor White
Write-Host "   - Vá na aba Network" -ForegroundColor White
Write-Host "   - Filtre por 'emissoes'" -ForegroundColor White
Write-Host "   - Veja se a requisição está retornando dados" -ForegroundColor White

Write-Host "`n4. Testando agora se há deploy pendente..." -ForegroundColor Yellow

# Verificar último commit
try {
    $lastCommit = git log -1 --pretty=format:"%h - %s (%ar)"
    Write-Host "`n   Último commit local:" -ForegroundColor Gray
    Write-Host "   $lastCommit" -ForegroundColor White
    
    # Verificar se há commits não pushados
    git fetch origin main 2>$null
    $unpushed = git log origin/main..HEAD --oneline
    
    if ($unpushed) {
        Write-Host "`n   ⚠️  HÁ COMMITS NÃO PUSHADOS!" -ForegroundColor Red
        Write-Host "   Execute: git push origin main" -ForegroundColor Yellow
    } else {
        Write-Host "`n   ✅ Todos os commits foram enviados" -ForegroundColor Green
    }
} catch {
    Write-Host "`n   Não foi possível verificar git" -ForegroundColor Red
}

Write-Host "`n5. Se o problema persistir:" -ForegroundColor Yellow
Write-Host "   - Abra o navegador em modo anônimo/privado" -ForegroundColor White
Write-Host "   - Faça login como admin novamente" -ForegroundColor White
Write-Host "   - Navegue para Financeiro > Pagamentos" -ForegroundColor White

Write-Host "`n=== PRÓXIMOS PASSOS ===" -ForegroundColor Cyan
Write-Host "1. Faça HARD REFRESH (Ctrl + Shift + R)" -ForegroundColor Yellow
Write-Host "2. Se não funcionar, abra F12 e veja o Console/Network" -ForegroundColor Yellow
Write-Host "3. Tire print do Console se houver erros`n" -ForegroundColor Yellow
