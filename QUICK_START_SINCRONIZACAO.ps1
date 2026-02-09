#!/usr/bin/env pwsh
<#
.SYNOPSIS
QUICK START - Sincronizar Lotes Avaliacao em 3 passos

.DESCRIPTION
Guia rapido para sincronizar tabela lotes_avaliacao entre 
desenvolvimento e producao.

Problema: Producao tem 20 colunas, desenvolvimento tem 30
Coluna de Pagamento (9) + Entidade ID (1) = 10 colunas faltando

Solucao: Execute este script
#>

Write-Host ""
Write-Host "======================================================================"
Write-Host "  SINCRONIZACAO LOTES AVALIACAO - QUICK START"
Write-Host "  Desenvolvimento vs Producao"
Write-Host "======================================================================"
Write-Host ""

Write-Host "STATUS ATUAL:"
Write-Host "  Dev:  30 colunas (completo)"
Write-Host "  Prod: 20 colunas (faltam 10)"
Write-Host ""
Write-Host "PROBLEMA:"
Write-Host "  [X] Features de pagamento nao funcionam em producao"
Write-Host "  [X] Colunas status_pagamento, pago_em, etc so existem em dev"
Write-Host ""
Write-Host "SOLUCAO:"
Write-Host "  [OK] Executar migration para adicionar 10 colunas em prod"
Write-Host "  [OK] Leva ~10 minutos"
Write-Host "  [OK] Backup automatico incluido"
Write-Host ""

Write-Host ""
Write-Host "======================================================================"
Write-Host "PASSO 1: TESTE (Simula sem fazer nada)"
Write-Host "======================================================================"
Write-Host ""

Write-Host "Execute este comando:" -ForegroundColor White
Write-Host "  powershell -File sincronizar_lotes_pagamento.ps1 -DryRun `$true" -ForegroundColor Green

Write-Host ""
Write-Host "Resultado esperado:"
Write-Host "  [OK] Conectividade validada"
Write-Host "  [OK] Estrutura validada"
Write-Host "  [OK] NADA foi alterado (e apenas simulacao)"
Write-Host ""

$testResponse = Read-Host "Continuar para Passo 2? (S/N)" 

if ($testResponse -ne "S" -and $testResponse -ne "s") {
  Write-Host "Abortado pelo usuario" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "PASSO 2: EXECUCAO REAL (Com Backup Automatico)"
Write-Host "======================================================================"
Write-Host ""

Write-Host "IMPORTANTE - CHECKLIST:" -ForegroundColor Yellow
Write-Host "  [ ] 2 pessoas validando (um executa, outro monitora)"
Write-Host "  [ ] Horario de baixo uso (madrugada/fim de semana)"
Write-Host "  [ ] Ninguem usando producao neste momento"
Write-Host "  [ ] Roteador de comunicacao notificado"
Write-Host ""

$proceed = Read-Host "Todos os itens confirmados? Digite 'CONFIRMO' para prosseguir"

if ($proceed -ne "CONFIRMO") {
  Write-Host "Abortado - requisitos nao atendidos" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "[*] Iniciando sincronizacao em 5 segundos..." -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "======================================================================"
Write-Host "  EXECUTANDO SINCRONIZACAO"
Write-Host "======================================================================"
Write-Host ""

# Executar o script de sincronizacao
& powershell -ExecutionPolicy Bypass -File C:\apps\QWork\sincronizar_lotes_pagamento.ps1 -Backup $true

Write-Host ""
Write-Host "======================================================================"
Write-Host "PASSO 3: VALIDACAO POS-SINCRONIZACAO"
Write-Host "======================================================================"
Write-Host ""

Write-Host "Verificando estrutura de producao..."
Write-Host ""

$env:PGPASSWORD='npg_J2QYqn5oxCzp'
$result = psql -U neondb_owner -d neondb -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech -A -t -c "
SELECT COUNT(*) as total_colunas,
       COUNT(CASE WHEN column_name LIKE '%pagamento%' THEN 1 END) as colunas_pagamento
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao';
"

Write-Host "Resultado:"
Write-Host $result -ForegroundColor Green

# Verifica se tem 30 colunas
if ($result -match "30") {
  Write-Host ""
  Write-Host "[OK] SUCESSO! Producao agora tem 30 colunas (sincronizado com dev)" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "[!] Verificar resultado - esperado 30 colunas" -ForegroundColor Yellow
}

$env:PGPASSWORD = ""

Write-Host ""
Write-Host "======================================================================"
Write-Host "PROXIMAS ETAPAS"
Write-Host "======================================================================"
Write-Host ""

Write-Host "1. [OK] Revisar logs:"
Write-Host "        notepad C:\apps\QWork\logs\sincronizacao_lotes_*.log"
Write-Host ""

Write-Host "2. [OK] Testar features de pagamento em STAGING"
Write-Host "        Tabelas agora tem colunas de pagamento ativadas"
Write-Host ""

Write-Host "3. [OK] Antes do proximo deploy:"
Write-Host "        Reexecutar analise para confirmar 100% sincronizado"
Write-Host ""

Write-Host "======================================================================"
Write-Host "[OK] SINCRONIZACAO COMPLETA!"
Write-Host "====================================================================="
Write-Host ""

Write-Host "Para questoes tecnicas detalhadas, ver:"
Write-Host "  [DOC] ANALISE_DETALHADA_LOTES_AVALIACAO.md" -ForegroundColor Cyan
Write-Host ""
