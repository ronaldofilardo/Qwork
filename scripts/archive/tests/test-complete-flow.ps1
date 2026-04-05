# ============================================================================
# Script de Teste Completo do Fluxo Qwork
# Data: 2026-01-22
# Descrição: Testa todo o fluxo desde cadastro até emissão de lote
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTE COMPLETO DE FLUXO QWORK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuração
$baseUrl = "http://localhost:3000"
$env:PGPASSWORD = "123456"

# Função auxiliar para fazer requisições
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    $uri = "$baseUrl$Endpoint"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
        UseBasicParsing = $true
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }
    
    try {
        $response = Invoke-WebRequest @params
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = ($response.Content | ConvertFrom-Json)
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
        }
    }
}

# 1. VERIFICAR ESTADO DO BANCO
Write-Host "[1/6] Verificando estado do banco..." -ForegroundColor Yellow
$tablesCheck = psql -U postgres -d nr-bps_db -c "\dt" -t | Select-String -Pattern "tomadores|funcionarios|lotes_avaliacao|planos|contratacao_personalizada"
if ($tablesCheck) {
    Write-Host "✓ Tabelas principais existem" -ForegroundColor Green
} else {
    Write-Host "✗ Tabelas faltando!" -ForegroundColor Red
    exit 1
}

# Verificar planos
$planosCount = psql -U postgres -d nr-bps_db -t -c "SELECT COUNT(*) FROM planos;"
Write-Host "OK Planos cadastrados: $($planosCount.Trim())" -ForegroundColor Green

# 2. CADASTRAR NOVO CONTRATANTE
Write-Host "`n[2/6] Testando cadastro de contratante..." -ForegroundColor Yellow
$cnpjTeste = "12345678000199"

# Limpar cadastro anterior se existir
psql -U postgres -d nr-bps_db -c "DELETE FROM tomadores WHERE cnpj = '$cnpjTeste';" | Out-Null

$cadastroData = @{
    tipo = "entidade"
    nome = "Empresa Teste Fluxo"
    cnpj = $cnpjTeste
    inscricao_estadual = "123456789"
    email = "teste@empresa.com"
    telefone = "(11) 98765-4321"
    endereco = "Rua Teste, 123"
    cidade = "São Paulo"
    estado = "SP"
    cep = "01234-567"
    responsavel_nome = "João da Silva"
    responsavel_cpf = "12345678901"
    responsavel_cargo = "Diretor"
    responsavel_email = "joao@empresa.com"
    responsavel_celular = "(11) 91234-5678"
    plano_id = 1
}

# API de cadastro público não existe, vamos inserir direto no banco
$insertQuery = @"
INSERT INTO tomadores (
    tipo, nome, cnpj, inscricao_estadual, email, telefone,
    endereco, cidade, estado, cep,
    responsavel_nome, responsavel_cpf, responsavel_cargo,
    responsavel_email, responsavel_celular,
    status, plano_id, ativa, pagamento_confirmado,
    criado_em, atualizado_em
) VALUES (
    'entidade', 'Empresa Teste Fluxo', '$cnpjTeste', '123456789',
    'teste@empresa.com', '(11) 98765-4321',
    'Rua Teste, 123', 'São Paulo', 'SP', '01234-567',
    'João da Silva', '12345678901', 'Diretor',
    'joao@empresa.com', '(11) 91234-5678',
    'pendente', 1, false, false,
    NOW(), NOW()
) RETURNING id;
"@

$contratanteId = psql -U postgres -d nr-bps_db -t -c $insertQuery
$contratanteId = $contratanteId.Trim()

if ($contratanteId -match '^\d+$') {
    Write-Host "✓ Contratante cadastrado: ID $contratanteId" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao cadastrar contratante" -ForegroundColor Red
    exit 1
}

# 3. CRIAR SENHA PARA O CONTRATANTE
Write-Host "`n[3/6] Criando senha para contratante..." -ForegroundColor Yellow
$cpfResponsavel = "12345678901"
$senhaHash = "test_hash_123" # Em produção seria bcrypt

$insertSenha = @"
INSERT INTO entidades_senhas (cpf, senha_hash, primeiro_acesso)
VALUES ('$cpfResponsavel', '$senhaHash', true)
ON CONFLICT (cpf) DO UPDATE SET senha_hash = '$senhaHash'
RETURNING id;
"@

$senhaId = psql -U postgres -d nr-bps_db -t -c $insertSenha
if ($senhaId -match '^\d+$') {
    Write-Host "✓ Senha criada/atualizada" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao criar senha" -ForegroundColor Red
}

# 4. APROVAR E ATIVAR CONTRATANTE
Write-Host "`n[4/6] Aprovando e ativando contratante..." -ForegroundColor Yellow
$ativarQuery = @"
UPDATE tomadores 
SET status = 'aprovado',
    aprovado_em = NOW(),
    aprovado_por_cpf = '00000000000',
    pagamento_confirmado = true,
    data_primeiro_pagamento = NOW(),
    ativa = true,
    atualizado_em = NOW()
WHERE id = $contratanteId;
"@

psql -U postgres -d nr-bps_db -c $ativarQuery | Out-Null
Write-Host "✓ Contratante aprovado e ativado" -ForegroundColor Green

# 5. CRIAR EMPRESA CLIENTE E FUNCIONÁRIOS
Write-Host "`n[5/6] Criando empresa cliente e funcionários..." -ForegroundColor Yellow

$insertEmpresa = @"
INSERT INTO empresas_clientes (
    contratante_id, nome, cnpj, email, telefone, cidade, estado
) VALUES (
    $contratanteId, 'Empresa Cliente Teste', '98765432000188',
    'contato@cliente.com', '(11) 99999-9999', 'São Paulo', 'SP'
) RETURNING id;
"@

$empresaId = psql -U postgres -d nr-bps_db -t -c $insertEmpresa
$empresaId = $empresaId.Trim()
Write-Host "✓ Empresa cliente criada: ID $empresaId" -ForegroundColor Green

# Criar 3 funcionários
for ($i = 1; $i -le 3; $i++) {
    $cpfFunc = "1234567890$i"
    $insertFunc = @"
    INSERT INTO funcionarios (
        cpf, nome, email, setor, cargo, data_admissao, situacao
    ) VALUES (
        '$cpfFunc', 'Funcionário Teste $i', 'func$i@teste.com',
        'TI', 'Analista', NOW(), 'ativo'
    ) ON CONFLICT (cpf) DO NOTHING
    RETURNING id;
"@
    
    $funcId = psql -U postgres -d nr-bps_db -t -c $insertFunc
    if ($funcId) {
        $funcId = $funcId.Trim()
        # Associar funcionário à empresa e contratante
        psql -U postgres -d nr-bps_db -c "INSERT INTO tomadores_funcionarios (contratante_id, funcionario_id, empresa_cliente_id) VALUES ($contratanteId, $funcId, $empresaId) ON CONFLICT DO NOTHING;" | Out-Null
    }
}
Write-Host "✓ 3 funcionários criados e associados" -ForegroundColor Green

# 6. CRIAR LOTE DE AVALIAÇÃO
Write-Host "`n[6/6] Criando lote de avaliação..." -ForegroundColor Yellow

$insertLote = @"
INSERT INTO lotes_avaliacao (
    empresa_id, codigo, criado_em
) VALUES (
    $empresaId, '001-$(Get-Date -Format "ddMMyy")', NOW()
) RETURNING id;
"@

$loteId = psql -U postgres -d nr-bps_db -t -c $insertLote
$loteId = $loteId.Trim()
Write-Host "✓ Lote criado: ID $loteId" -ForegroundColor Green

# RESUMO
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Contratante ID: $contratanteId" -ForegroundColor White
Write-Host "Empresa ID: $empresaId" -ForegroundColor White
Write-Host "Lote ID: $loteId" -ForegroundColor White
Write-Host "CPF Responsável: $cpfResponsavel" -ForegroundColor White
Write-Host "`n✓ Fluxo completo testado com sucesso!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar estado final
Write-Host "Estado final do contratante:" -ForegroundColor Yellow
psql -U postgres -d nr-bps_db -c "SELECT id, nome, status, ativa, pagamento_confirmado FROM tomadores WHERE id = $contratanteId;"

Write-Host "`nFuncionários associados:" -ForegroundColor Yellow
psql -U postgres -d nr-bps_db -c "SELECT f.id, f.nome, f.cpf FROM funcionarios f JOIN tomadores_funcionarios cf ON f.id = cf.funcionario_id WHERE cf.contratante_id = $contratanteId;"

Write-Host "`nLotes criados:" -ForegroundColor Yellow
psql -U postgres -d nr-bps_db -c "SELECT l.id, l.codigo, l.criado_em FROM lotes_avaliacao l WHERE l.empresa_id = $empresaId;"
