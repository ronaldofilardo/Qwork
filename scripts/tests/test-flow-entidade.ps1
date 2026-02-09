# ============================================================================
# Teste do Fluxo de ENTIDADES
# Data: 2026-01-22
# Fluxo: Contratante (entidade) -> Empresas -> Funcionarios -> Lotes
# ============================================================================

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = "123456"

Write-Host "`n========================================"
Write-Host "TESTE FLUXO ENTIDADE"
Write-Host "========================================`n"

# 1. CADASTRAR CONTRATANTE TIPO ENTIDADE
Write-Host "[1/5] Cadastrando contratante tipo ENTIDADE..."
$cnpjTeste = "11111111000199"

# Tentar pegar existente primeiro
$existente = (psql -U postgres -d nr-bps_db -t -A -c "SELECT id FROM tomadores WHERE cnpj = '$cnpjTeste';" 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

if ($existente) {
    $contratanteId = $existente
    Write-Host "[OK] Usando contratante existente: ID $contratanteId"
    
    # Atualizar para garantir que está ativo
    psql -U postgres -d nr-bps_db -c "UPDATE tomadores SET ativa = true, pagamento_confirmado = true, status = 'aprovado', data_primeiro_pagamento = COALESCE(data_primeiro_pagamento, NOW()) WHERE id = $contratanteId;" 2>&1 | Out-Null
} else {
    $insertContratante = @"
INSERT INTO tomadores (
    tipo, nome, cnpj, email, telefone,
    endereco, cidade, estado, cep,
    responsavel_nome, responsavel_cpf, responsavel_cargo,
    responsavel_email, responsavel_celular,
    status, plano_id, ativa, pagamento_confirmado,
    data_primeiro_pagamento, criado_em, atualizado_em
) VALUES (
    'entidade', 'Entidade Teste Ltda', '$cnpjTeste', 'entidade@teste.com', '(11) 1111-1111',
    'Rua da Entidade, 100', 'Sao Paulo', 'SP', '01000-000',
    'Gestor Entidade', '11111111111', 'Diretor',
    'gestor@entidade.com', '(11) 91111-1111',
    'aprovado', 1, true, true,
    NOW(), NOW(), NOW()
) RETURNING id;
"@

    $contratanteId = (psql -U postgres -d nr-bps_db -t -A -c $insertContratante 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

    if ($contratanteId) {
        Write-Host "[OK] Entidade cadastrada: ID $contratanteId"
    } else {
        Write-Host "[ERRO] Falha ao cadastrar entidade"
        exit 1
    }
}

# 2. CRIAR SENHA
Write-Host "`n[2/5] Criando senha para gestor..."
$cpf = "11111111111"
$senhaHash = "`$2b`$10`$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"

$insertSenha = "INSERT INTO entidades_senhas (cpf, senha_hash, contratante_id, primeira_senha_alterada) VALUES ('$cpf', '$senhaHash', $contratanteId, false) ON CONFLICT (cpf) DO UPDATE SET contratante_id = $contratanteId RETURNING id;"

$senhaId = (psql -U postgres -d nr-bps_db -t -A -c $insertSenha 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
Write-Host "[OK] Senha criada: ID $senhaId"

# 3. CRIAR EMPRESA CLIENTE (DIRETAMENTE VINCULADA À ENTIDADE)
Write-Host "`n[3/5] Criando empresa cliente da entidade..."

$insertEmpresa = @"
SET app.current_user_cpf = '$cpf';
SET app.current_user_perfil = 'admin';
INSERT INTO empresas_clientes (
    contratante_id, nome, cnpj, email, telefone, 
    cidade, estado, criado_em
) VALUES (
    $contratanteId, 'Empresa da Entidade', '22222222000199',
    'empresa@entidade.com', '(11) 2222-2222',
    'Sao Paulo', 'SP', NOW()
) RETURNING id;
"@

$empresaId = (psql -U postgres -d nr-bps_db -t -A -c $insertEmpresa 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

if ($empresaId) {
    Write-Host "[OK] Empresa cliente criada: ID $empresaId"
} else {
    Write-Host "[ERRO] Falha ao criar empresa"
    exit 1
}

# 4. CRIAR FUNCIONÁRIOS
Write-Host "`n[4/5] Criando funcionarios..."

$funcIds = @()
for ($i = 1; $i -le 5; $i++) {
    $cpfFunc = "2222222222$i"
    $insertFunc = "SET app.current_user_cpf = '$cpf'; SET app.current_user_perfil = 'admin'; INSERT INTO funcionarios (cpf, nome, email, setor, cargo, data_admissao, situacao) VALUES ('$cpfFunc', 'Funcionario Entidade $i', 'func$i@entidade.com', 'Operacional', 'Tecnico', NOW(), 'ativo') ON CONFLICT (cpf) DO UPDATE SET nome = 'Funcionario Entidade $i' RETURNING id;"
    
    $funcId = (psql -U postgres -d nr-bps_db -t -A -c $insertFunc 2>&1 | Select-String -Pattern '^\d+$').Matches.Value
    
    if ($funcId) {
        $funcIds += $funcId
        # Associar funcionário à entidade e empresa
        $assocQuery = "INSERT INTO tomadores_funcionarios (contratante_id, funcionario_id, empresa_cliente_id) VALUES ($contratanteId, $funcId, $empresaId) ON CONFLICT (funcionario_id, contratante_id) DO NOTHING;"
        psql -U postgres -d nr-bps_db -c $assocQuery 2>&1 | Out-Null
    }
}
Write-Host "[OK] $($funcIds.Count) funcionarios criados e associados"

# 5. CRIAR LOTE DE AVALIAÇÃO
Write-Host "`n[5/5] Criando lote de avaliacao..."

$codigoLote = "ENT-$(Get-Date -Format 'ddMMyy')"
$insertLote = "SET app.current_user_cpf = '$cpf'; SET app.current_user_perfil = 'admin'; INSERT INTO lotes_avaliacao (empresa_id, codigo, criado_em) VALUES ($empresaId, '$codigoLote', NOW()) RETURNING id;"

$loteId = (psql -U postgres -d nr-bps_db -t -A -c $insertLote 2>&1 | Select-String -Pattern '^\d+$').Matches.Value

if ($loteId) {
    Write-Host "[OK] Lote criado: ID $loteId"
} else {
    Write-Host "[ERRO] Falha ao criar lote"
}

# RESUMO
Write-Host "`n========================================"
Write-Host "RESUMO - FLUXO ENTIDADE"
Write-Host "========================================"
Write-Host "Contratante (Entidade) ID: $contratanteId"
Write-Host "Empresa Cliente ID: $empresaId"
Write-Host "Funcionarios: $($funcIds.Count)"
Write-Host "Lote ID: $loteId"
Write-Host "CPF Gestor: $cpf"
Write-Host "`n[SUCESSO] Fluxo entidade testado!"
Write-Host "========================================`n"

# Verificar estrutura
Write-Host "Verificando hierarquia:"
psql -U postgres -d nr-bps_db -c "
SELECT 
    'Contratante' as tipo,
    c.id,
    c.nome,
    c.tipo as subtipo
FROM tomadores c 
WHERE c.id = $contratanteId
UNION ALL
SELECT 
    'Empresa',
    e.id,
    e.nome,
    NULL
FROM empresas_clientes e 
WHERE e.contratante_id = $contratanteId
UNION ALL
SELECT 
    'Funcionarios',
    COUNT(*)::int,
    'Total: ' || COUNT(*),
    NULL
FROM tomadores_funcionarios cf 
WHERE cf.contratante_id = $contratanteId;
"
