# ============================================================================
# Teste do Fluxo de CLÍNICAS
# Data: 2026-01-22
# Fluxo: Contratante (clinica) -> Clinica -> Empresas -> Funcionarios -> Lotes
# ============================================================================

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = "123456"

Write-Host "`n========================================"
Write-Host "TESTE FLUXO CLÍNICA"
Write-Host "========================================`n"

# 1. CADASTRAR CONTRATANTE TIPO CLÍNICA
Write-Host "[1/6] Cadastrando contratante tipo CLINICA..."
$cnpjTeste = "33333333000199"

psql -U postgres -d nr-bps_db -c "DELETE FROM contratantes WHERE cnpj = '$cnpjTeste';" 2>&1 | Out-Null

$insertContratante = @"
INSERT INTO contratantes (
    tipo, nome, cnpj, email, telefone,
    endereco, cidade, estado, cep,
    responsavel_nome, responsavel_cpf, responsavel_cargo,
    responsavel_email, responsavel_celular,
    status, plano_id, ativa, pagamento_confirmado,
    data_primeiro_pagamento, criado_em, atualizado_em
) VALUES (
    'clinica', 'Clinica de Saude Ocupacional', '$cnpjTeste', 'clinica@teste.com', '(11) 3333-3333',
    'Rua da Clinica, 200', 'Sao Paulo', 'SP', '02000-000',
    'Dr. Gestor Clinica', '33333333333', 'Diretor Medico',
    'gestor@clinica.com', '(11) 93333-3333',
    'aprovado', 2, true, true,
    NOW(), NOW(), NOW()
) RETURNING id;
"@

$contratanteId = (psql -U postgres -d nr-bps_db -t -A -c $insertContratante 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

if ($contratanteId) {
    Write-Host "[OK] Contratante Clinica cadastrado: ID $contratanteId"
} else {
    Write-Host "[ERRO] Falha ao cadastrar contratante"
    exit 1
}

# 2. CRIAR SENHA
Write-Host "`n[2/6] Criando senha para gestor..."
$cpf = "33333333333"
$senhaHash = "`$2b`$10`$YyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy"

$insertSenha = "INSERT INTO entidades_senhas (cpf, senha_hash, contratante_id, primeira_senha_alterada) VALUES ('$cpf', '$senhaHash', $contratanteId, false) ON CONFLICT (cpf) DO UPDATE SET contratante_id = $contratanteId RETURNING id;"

$senhaId = (psql -U postgres -d nr-bps_db -t -A -c $insertSenha 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
Write-Host "[OK] Senha criada: ID $senhaId"

# 3. CRIAR REGISTRO NA TABELA CLINICAS
Write-Host "`n[3/6] Criando registro de clinica..."

$insertClinica = @"
SET app.current_user_cpf = '$cpf';
SET app.current_user_perfil = 'admin';
INSERT INTO clinicas (
    nome, cnpj, email, telefone, cidade, estado,
    contratante_id, ativa, criado_em
) VALUES (
    'Clinica de Saude Ocupacional', '$cnpjTeste', 'clinica@teste.com',
    '(11) 3333-3333', 'Sao Paulo', 'SP',
    $contratanteId, true, NOW()
) RETURNING id;
"@

$clinicaId = (psql -U postgres -d nr-bps_db -t -A -c $insertClinica 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

if ($clinicaId) {
    Write-Host "[OK] Clinica criada: ID $clinicaId"
} else {
    Write-Host "[ERRO] Falha ao criar clinica"
    exit 1
}

# 4. CRIAR EMPRESAS CLIENTES (VINCULADAS À CLÍNICA)
Write-Host "`n[4/6] Criando empresas clientes da clinica..."

$empresaIds = @()
for ($i = 1; $i -le 3; $i++) {
    $cnpjEmpresa = "4444444400$i$($i)9"
    
    $insertEmpresa = @"
    SET app.current_user_cpf = '$cpf';
    SET app.current_user_perfil = 'admin';
    INSERT INTO empresas_clientes (
        clinica_id, nome, cnpj, email, telefone,
        cidade, estado, criado_em
    ) VALUES (
        $clinicaId, 'Empresa Cliente $i', '$cnpjEmpresa',
        'empresa$i@clinica.com', '(11) 4444-444$i',
        'Sao Paulo', 'SP', NOW()
    ) RETURNING id;
"@
    
    $empresaId = (psql -U postgres -d nr-bps_db -t -A -c $insertEmpresa 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
    
    if ($empresaId) {
        $empresaIds += $empresaId
    }
}
Write-Host "[OK] $($empresaIds.Count) empresas clientes criadas"

# 5. CRIAR FUNCIONÁRIOS PARA CADA EMPRESA
Write-Host "`n[5/6] Criando funcionarios para cada empresa..."

$totalFunc = 0
foreach ($empresaId in $empresaIds) {
    for ($i = 1; $i -le 3; $i++) {
        $cpfFunc = "55555$empresaId$i$(Get-Random -Minimum 10 -Maximum 99)"
        $cpfFunc = $cpfFunc.Substring(0, 11)
        
        $insertFunc = "SET app.current_user_cpf = '$cpf'; SET app.current_user_perfil = 'admin'; INSERT INTO funcionarios (cpf, nome, email, setor, cargo, data_admissao, situacao) VALUES ('$cpfFunc', 'Funcionario Emp$empresaId-$i', 'func$i@emp$empresaId.com', 'Admin', 'Assistente', NOW(), 'ativo') ON CONFLICT (cpf) DO UPDATE SET nome = 'Funcionario Emp$empresaId-$i' RETURNING id;"
        
        $funcId = (psql -U postgres -d nr-bps_db -t -A -c $insertFunc 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
        
        if ($funcId) {
            $totalFunc++
            # Associar funcionário à clínica via contratante
            $assocQuery = "INSERT INTO contratantes_funcionarios (contratante_id, funcionario_id, empresa_cliente_id) VALUES ($contratanteId, $funcId, $empresaId) ON CONFLICT (funcionario_id, contratante_id) DO NOTHING;"
            psql -U postgres -d nr-bps_db -c $assocQuery 2>&1 | Out-Null
        }
    }
}
Write-Host "[OK] $totalFunc funcionarios criados e associados"

# 6. CRIAR LOTES PARA CADA EMPRESA
Write-Host "`n[6/6] Criando lotes de avaliacao..."

$loteIds = @()
$counter = 1
foreach ($empresaId in $empresaIds) {
    $codigoLote = "CLI-$(Get-Date -Format 'ddMMyy')-E$counter"
    $insertLote = "SET app.current_user_cpf = '$cpf'; SET app.current_user_perfil = 'admin'; INSERT INTO lotes_avaliacao (empresa_id, codigo, criado_em) VALUES ($empresaId, '$codigoLote', NOW()) RETURNING id;"
    
    $loteId = (psql -U postgres -d nr-bps_db -t -A -c $insertLote 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
    
    if ($loteId) {
        $loteIds += $loteId
    }
    $counter++
}
Write-Host "[OK] $($loteIds.Count) lotes criados"

# RESUMO
Write-Host "`n========================================"
Write-Host "RESUMO - FLUXO CLÍNICA"
Write-Host "========================================"
Write-Host "Contratante (Clinica) ID: $contratanteId"
Write-Host "Clinica ID: $clinicaId"
Write-Host "Empresas Clientes: $($empresaIds.Count)"
Write-Host "Funcionarios Totais: $totalFunc"
Write-Host "Lotes Criados: $($loteIds.Count)"
Write-Host "CPF Gestor: $cpf"
Write-Host "`n[SUCESSO] Fluxo clinica testado!"
Write-Host "========================================`n"

# Verificar estrutura
Write-Host "Verificando hierarquia:"
psql -U postgres -d nr-bps_db -c "
SELECT 
    'Contratante' as nivel,
    c.id,
    c.nome,
    c.tipo
FROM contratantes c 
WHERE c.id = $contratanteId
UNION ALL
SELECT 
    'Clinica',
    cl.id,
    cl.nome,
    NULL
FROM clinicas cl 
WHERE cl.contratante_id = $contratanteId
UNION ALL
SELECT 
    'Empresas',
    COUNT(*)::int,
    'Total: ' || COUNT(*),
    NULL
FROM empresas_clientes e 
WHERE e.clinica_id = $clinicaId
UNION ALL
SELECT 
    'Funcionarios',
    COUNT(*)::int,
    'Total: ' || COUNT(*),
    NULL
FROM contratantes_funcionarios cf 
WHERE cf.contratante_id = $contratanteId;
"
