#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verifica o estado completo de um contratante no fluxo de aprovação

.DESCRIPTION
    Este script analisa o estado atual de um contratante específico,
    verificando todas as etapas do fluxo de aprovação até liberação de login.
    
    Útil para diagnosticar problemas no fluxo de cadastro/aprovação.

.PARAMETER ContratanteId
    ID do contratante a ser verificado

.EXAMPLE
    .\check-contratante-state.ps1 -ContratanteId 7
#>

param(
    [Parameter(Mandatory=$true)]
    [int]$ContratanteId
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO DE ESTADO DO CONTRATANTE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Conectar ao banco
$env:PGPASSWORD = "123456"
$dbName = "nr-bps_db"
$dbUser = "postgres"

function Invoke-SqlQuery {
    param([string]$Query)
    
    $result = psql -U $dbUser -d $dbName -t -A -F "|" -c $Query 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao executar query:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $null
    }
    
    return $result
}

# 1. DADOS DO CONTRATANTE
Write-Host "📋 1. DADOS DO CONTRATANTE" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

$query = @"
SELECT 
    id, tipo, nome, cnpj, status, ativa, pagamento_confirmado,
    responsavel_nome, responsavel_cpf,
    aprovado_em, aprovado_por_cpf,
    data_liberacao_login, data_primeiro_pagamento,
    criado_em
FROM contratantes 
WHERE id = $ContratanteId;
"@

$contratante = Invoke-SqlQuery -Query $query

if (!$contratante) {
    Write-Host "❌ Contratante ID $ContratanteId não encontrado!" -ForegroundColor Red
    exit 1
}

$fields = $contratante -split '\|'
$tipo = $fields[1]
$nome = $fields[2]
$cnpj = $fields[3]
$status = $fields[4]
$ativa = $fields[5]
$pagamento_conf = $fields[6]
$resp_nome = $fields[7]
$resp_cpf = $fields[8]
$aprovado_em = $fields[9]
$aprovado_por = $fields[10]
$data_lib_login = $fields[11]
$data_pag = $fields[12]
$criado_em = $fields[13]

Write-Host "  ID:               $ContratanteId"
Write-Host "  Tipo:             $tipo" -ForegroundColor $(if ($tipo -eq 'entidade') { 'Cyan' } else { 'Magenta' })
Write-Host "  Nome:             $nome"
Write-Host "  CNPJ:             $cnpj"
Write-Host "  Status:           $status" -ForegroundColor $(switch ($status) {
    'aprovado' { 'Green' }
    'pendente' { 'Yellow' }
    'rejeitado' { 'Red' }
    default { 'Gray' }
})
Write-Host "  Ativa:            $ativa" -ForegroundColor $(if ($ativa -eq 't') { 'Green' } else { 'Red' })
Write-Host "  Pag. Confirmado:  $pagamento_conf" -ForegroundColor $(if ($pagamento_conf -eq 't') { 'Green' } else { 'Red' })
Write-Host "  Responsável:      $resp_nome (CPF: $resp_cpf)"
Write-Host "  Aprovado em:      $(if ($aprovado_em) { $aprovado_em } else { 'NÃO APROVADO' })"
Write-Host "  Aprovado por:     $(if ($aprovado_por) { $aprovado_por } else { 'N/A' })"
Write-Host "  Login liberado:   $(if ($data_lib_login) { $data_lib_login } else { 'NÃO LIBERADO' })"
Write-Host "  Primeiro pag.:    $(if ($data_pag) { $data_pag } else { 'SEM PAGAMENTO' })"
Write-Host "  Criado em:        $criado_em"
Write-Host ""

# 2. SENHA EM CONTRATANTES_SENHAS
Write-Host "🔐 2. SENHA EM CONTRATANTES_SENHAS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

$queryCS = @"
SELECT cpf, length(senha_hash) as hash_len, criado_em 
FROM contratantes_senhas 
WHERE contratante_id = $ContratanteId;
"@

$senhaCS = Invoke-SqlQuery -Query $queryCS

if ($senhaCS) {
    $csFields = $senhaCS -split '\|'
    Write-Host "  ✅ Senha existe!" -ForegroundColor Green
    Write-Host "  CPF:           $($csFields[0])"
    Write-Host "  Hash length:   $($csFields[1]) chars" -ForegroundColor $(if ($csFields[1] -eq '60') { 'Green' } else { 'Red' })
    Write-Host "  Criado em:     $($csFields[2])"
} else {
    Write-Host "  ❌ Senha NÃO existe em contratantes_senhas!" -ForegroundColor Red
}
Write-Host ""

# 3. REGISTRO EM CLINICAS (se tipo='clinica')
if ($tipo -eq 'clinica') {
    Write-Host "🏥 3. REGISTRO EM CLINICAS" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray
    
    $queryClinica = @"
SELECT id, nome, email, criado_em 
FROM clinicas 
WHERE contratante_id = $ContratanteId;
"@
    
    $clinica = Invoke-SqlQuery -Query $queryClinica
    
    if ($clinica) {
        $clFields = $clinica -split '\|'
        Write-Host "  ✅ Clínica criada!" -ForegroundColor Green
        Write-Host "  ID:          $($clFields[0])"
        Write-Host "  Nome:        $($clFields[1])"
        Write-Host "  Email:       $($clFields[2])"
        Write-Host "  Criado em:   $($clFields[3])"
    } else {
        Write-Host "  ❌ Clínica NÃO criada!" -ForegroundColor Red
        Write-Host "  ⚠️  Deveria ter sido criada durante aprovação." -ForegroundColor Yellow
    }
    Write-Host ""
}

# 4. REGISTRO EM FUNCIONARIOS (Verificação de legado)
Write-Host "👤 4. REGISTRO EM FUNCIONARIOS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

$queryFunc = @"
SELECT f.id, f.cpf, f.nome, f.perfil, f.ativo, f.contratante_id, 
       length(f.senha_hash) as hash_len, f.criado_em
FROM funcionarios f
WHERE f.cpf = '$resp_cpf' AND f.contratante_id = $ContratanteId;
"@

$func = Invoke-SqlQuery -Query $queryFunc

if ($func) {
    $fFields = $func -split '\|'
    Write-Host "  ⚠️  Funcionário existe (legado/migração antiga):" -ForegroundColor Yellow
    Write-Host "  ID:               $($fFields[0])"
    Write-Host "  CPF:              $($fFields[1])"
    Write-Host "  Nome:             $($fFields[2])"
    Write-Host "  Perfil:           $($fFields[3])" -ForegroundColor Cyan
    Write-Host "  Ativo:            $($fFields[4])"
    Write-Host "  Contratante ID:   $($fFields[5])"
    Write-Host "  Hash length:      $($fFields[6]) chars" -ForegroundColor $(if ($fFields[6] -eq '60') { 'Green' } else { 'Red' })
    Write-Host "  Criado em:        $($fFields[7])"
    Write-Host "  💡 Nota: Sistema atual NÃO cria funcionários para responsáveis" -ForegroundColor Gray
} else {
    Write-Host "  ℹ️  Funcionário NÃO existe (esperado - responsáveis não são funcionários)" -ForegroundColor Cyan
}
Write-Host ""

# 5. VÍNCULO EM CONTRATANTES_FUNCIONARIOS
if ($func) {
    Write-Host "🔗 5. VÍNCULO EM CONTRATANTES_FUNCIONARIOS" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray
    
    $fid = ($func -split '\|')[0]
    
    $queryVinc = @"
SELECT funcionario_id, contratante_id, tipo_contratante, vinculo_ativo, criado_em
FROM contratantes_funcionarios
WHERE funcionario_id = $fid AND contratante_id = $ContratanteId;
"@
    
    $vinc = Invoke-SqlQuery -Query $queryVinc
    
    if ($vinc) {
        $vFields = $vinc -split '\|'
        Write-Host "  ✅ Vínculo existe!" -ForegroundColor Green
        Write-Host "  Funcionário ID:   $($vFields[0])"
        Write-Host "  Contratante ID:   $($vFields[1])"
        Write-Host "  Tipo:             $($vFields[2])"
        Write-Host "  Ativo:            $($vFields[3])"
        Write-Host "  Criado em:        $($vFields[4])"
    } else {
        Write-Host "  ❌ Vínculo NÃO existe!" -ForegroundColor Red
    }
    Write-Host ""
}

# 6. EMPRESAS VINCULADAS
Write-Host "🏢 6. EMPRESAS VINCULADAS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

if ($tipo -eq 'entidade') {
    $queryEmp = @"
SELECT id, nome, cnpj, ativa
FROM empresas_clientes
WHERE contratante_id = $ContratanteId;
"@
} else {
    $queryEmp = @"
SELECT ec.id, ec.nome, ec.cnpj, ec.ativa, ec.clinica_id
FROM empresas_clientes ec
JOIN clinicas cl ON ec.clinica_id = cl.id
WHERE cl.contratante_id = $ContratanteId;
"@
}

$empresas = Invoke-SqlQuery -Query $queryEmp

if ($empresas) {
    $empArray = $empresas -split "`n"
    Write-Host "  ✅ $($empArray.Count) empresa(s) encontrada(s):" -ForegroundColor Green
    foreach ($emp in $empArray) {
        $eFields = $emp -split '\|'
        Write-Host "    • ID: $($eFields[0]) | $($eFields[1]) | CNPJ: $($eFields[2]) | Ativa: $($eFields[3])"
    }
} else {
    Write-Host "  ⚠️  Nenhuma empresa vinculada" -ForegroundColor Yellow
}
Write-Host ""

# 7. AUDIT LOGS
Write-Host "📜 7. AUDIT LOGS (últimas 5 ações)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

$queryAudit = @"
SELECT action, usuario_cpf, created_at, details
FROM audit_logs
WHERE resource = 'contratantes' AND resource_id = '$ContratanteId'
ORDER BY created_at DESC
LIMIT 5;
"@

$audits = Invoke-SqlQuery -Query $queryAudit

if ($audits) {
    $auditArray = $audits -split "`n"
    foreach ($audit in $auditArray) {
        $aFields = $audit -split '\|'
        Write-Host "  • $($aFields[0])" -ForegroundColor Cyan -NoNewline
        Write-Host " | CPF: $($aFields[1]) | $($aFields[2])"
        if ($aFields[3]) {
            Write-Host "    Detalhes: $($aFields[3])" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ⚠️  Nenhum log de auditoria encontrado" -ForegroundColor Yellow
}
Write-Host ""

# 8. DIAGNÓSTICO E PRÓXIMOS PASSOS
Write-Host "🔍 8. DIAGNÓSTICO" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray

$issues = @()
$warnings = @()

# Verificar status aprovado mas inativo
if ($status -eq 'aprovado' -and $ativa -eq 'f') {
    $warnings += "⚠️  Contratante aprovado mas não ativado (aguardando pagamento?)"
}

# Verificar ativa mas sem senha
if ($ativa -eq 't' -and !$senhaCS) {
    $issues += "❌ Contratante ativo mas SEM SENHA em contratantes_senhas!"
}

# Verificar clínica sem registro
if ($tipo -eq 'clinica' -and !$clinica) {
    $issues += "❌ Tipo 'clinica' mas SEM REGISTRO na tabela clinicas!"
}

# (Removido: clínicas não precisam mais de funcionários para responsável)

# Verificar login liberado mas inativo
if ($data_lib_login -and $ativa -eq 'f') {
    $issues += "❌ data_liberacao_login definida mas contratante INATIVO!"
}

# Verificar pagamento sem ativação
if ($pagamento_conf -eq 't' -and $ativa -eq 'f') {
    $warnings += "⚠️  Pagamento confirmado mas contratante não ativado (executar ativarContratante?)"
}

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "  ✅ NENHUM PROBLEMA DETECTADO!" -ForegroundColor Green
    
    if ($ativa -eq 't' -and $senhaCS) {
        Write-Host ""
        Write-Host "  🎉 Contratante está TOTALMENTE CONFIGURADO e pronto para login!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Credenciais de login:" -ForegroundColor Cyan
        Write-Host "  CPF:   $resp_cpf"
        
        # Calcular senha padrão
        $cleanCnpj = $cnpj -replace '[.\-/]', ''
        $senhaDefault = $cleanCnpj.Substring($cleanCnpj.Length - 6)
        Write-Host "  Senha: $senhaDefault (últimos 6 dígitos do CNPJ)"
    }
} else {
    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-Host "  ❌ PROBLEMAS CRÍTICOS ENCONTRADOS:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "    $issue" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "  ⚠️  AVISOS:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "    $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "  📝 PRÓXIMOS PASSOS RECOMENDADOS:" -ForegroundColor Cyan
    
    if ($status -eq 'pendente') {
        Write-Host "    1. Aprovar contratante via admin: POST /api/admin/novos-cadastros"
    }
    
    if ($status -eq 'aprovado' -and $pagamento_conf -eq 'f') {
        Write-Host "    2. Confirmar pagamento via simulador (processo automático)"
        Write-Host "       Sistema ativará automaticamente após confirmação"
    }
    
    if ($status -eq 'aprovado' -and $pagamento_conf -eq 't' -and $ativa -eq 'f') {
        Write-Host "    3. ATENÇÃO: Pagamento confirmado mas não ativado!"
        Write-Host "       Verificar logs do sistema - ativação deveria ser automática"
    }
    
    if ($ativa -eq 't' -and !$senhaCS) {
        Write-Host "    4. ATENÇÃO: Conta ativa sem senha!"
        Write-Host "       Sistema deveria criar senha automaticamente"
        Write-Host "       Verificar logs de erro em criarContaResponsavel()"
    }
    
    if ($tipo -eq 'clinica' -and !$clinica) {
        Write-Host "    5. ATENÇÃO: Clínica não criada durante aprovação!"
        Write-Host "       Verificar logs - deveria ser automático"
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FIM DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
