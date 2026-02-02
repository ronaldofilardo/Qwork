# Script para corrigir chamadas query() em endpoints de gestor
# Substitui por queryAsGestorEntidade ou queryAsGestorRH conforme apropriado

Write-Host "🔧 Corrigindo imports e chamadas de query em endpoints de gestor..." -ForegroundColor Cyan

# Função para processar arquivos de entidade
function Fix-EntidadeEndpoint {
    param($filePath)
    
    if (!(Test-Path $filePath)) { return }
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Verificar se já usa queryAsGestorEntidade
    if ($content -match 'queryAsGestorEntidade') {
        Write-Host "  ✓ $filePath já usa queryAsGestorEntidade" -ForegroundColor Green
        return
    }
    
    # Verificar se usa query do db
    if (!($content -match "from '@/lib/db'")) {
        Write-Host "  - $filePath não importa query de @/lib/db" -ForegroundColor Gray
        return
    }
    
    # Substituir import
    $content = $content -replace "import { query } from '@/lib/db';", "import { queryAsGestorEntidade } from '@/lib/db-gestor';"
    $content = $content -replace "import { query, QueryResult } from '@/lib/db';", "import { queryAsGestorEntidade } from '@/lib/db-gestor';"
    
    # Substituir chamadas query( por queryAsGestorEntidade(
    $content = $content -replace '\bquery\(', 'queryAsGestorEntidade('
    
    if ($content -ne $originalContent) {
        Set-Content $filePath -Value $content -NoNewline
        Write-Host "  ✅ Corrigido: $filePath" -ForegroundColor Green
    }
}

# Função para processar arquivos de clínica
function Fix-ClinicaEndpoint {
    param($filePath)
    
    if (!(Test-Path $filePath)) { return }
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Verificar se já usa queryAsGestorRH
    if ($content -match 'queryAsGestorRH') {
        Write-Host "  ✓ $filePath já usa queryAsGestorRH" -ForegroundColor Green
        return
    }
    
    # Verificar se usa query do db
    if (!($content -match "from '@/lib/db'")) {
        Write-Host "  - $filePath não importa query de @/lib/db" -ForegroundColor Gray
        return
    }
    
    # Substituir import
    $content = $content -replace "import { query } from '@/lib/db';", "import { queryAsGestorRH } from '@/lib/db-gestor';"
    $content = $content -replace "import { query, QueryResult } from '@/lib/db';", "import { queryAsGestorRH } from '@/lib/db-gestor';"
    
    # Substituir chamadas query( por queryAsGestorRH(
    $content = $content -replace '\bquery\(', 'queryAsGestorRH('
    
    if ($content -ne $originalContent) {
        Set-Content $filePath -Value $content -NoNewline
        Write-Host "  ✅ Corrigido: $filePath" -ForegroundColor Green
    }
}

# Processar endpoints de entidade
Write-Host "`n📁 Processando endpoints de entidade..." -ForegroundColor Yellow
Get-ChildItem -Path "app\api\entidade" -Filter "route.ts" -Recurse | ForEach-Object {
    Fix-EntidadeEndpoint $_.FullName
}

# Processar endpoints de clínica
Write-Host "`n📁 Processando endpoints de clínica..." -ForegroundColor Yellow
Get-ChildItem -Path "app\api\clinica" -Filter "route.ts" -Recurse | ForEach-Object {
    Fix-ClinicaEndpoint $_.FullName
}

Write-Host "`n✅ Correção concluída!" -ForegroundColor Green
Write-Host "⚠️  IMPORTANTE: Revise os arquivos modificados para garantir que ficaram corretos" -ForegroundColor Yellow
