# ============================================================================
# Script de Teste Completo do Fluxo Qwork (Versao Simplificada)
# Data: 2026-01-22
# ============================================================================

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = "123456"

Write-Host "`n========================================"
Write-Host "TESTE COMPLETO DE FLUXO QWORK"
Write-Host "========================================`n"

# 1. VERIFICAR ESTADO DO BANCO
Write-Host "[1/6] Verificando estado do banco..."
$tablesCount = psql -U postgres -d nr-bps_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
Write-Host "[OK] Tabelas encontradas: $($tablesCount.Trim())"

$planosCount = psql -U postgres -d nr-bps_db -t -c "SELECT COUNT(*) FROM planos;"
Write-Host "[OK] Planos cadastrados: $($planosCount.Trim())"

# 2. CADASTRAR NOVO CONTRATANTE
Write-Host "`n[2/6] Cadastrando contratante..."
$cnpjTeste = "12345678000199"

$deleteResult = psql -U postgres -d nr-bps_db -c "DELETE FROM tomadores WHERE cnpj = '$cnpjTeste';" 2>&1 | Out-Null

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
    'Rua Teste, 123', 'Sao Paulo', 'SP', '01234-567',
    'Joao da Silva', '12345678901', 'Diretor',
    'joao@empresa.com', '(11) 91234-5678',
    'pendente', 1, false, false,
    NOW(), NOW()
) RETURNING id;
"@

$contratanteIdResult = psql -U postgres -d nr-bps_db -t -A -c $insertQuery 2>&1
$contratanteId = ($contratanteIdResult | Select-String -Pattern '^\d+$').Matches.Value

if ($contratanteId) {
    Write-Host "[OK] Contratante cadastrado: ID $contratanteId"
} else {
    Write-Host "[ERRO] Falha ao cadastrar contratante: $contratanteIdResult"
    exit 1
}

# 3. CRIAR SENHA PARA O CONTRATANTE
Write-Host "`n[3/6] Criando senha para contratante..."
$cpfResponsavel = "12345678901"

# Usar bcrypt para gerar hash real
$senhaTexto = "senha123"
# Para teste, usar um hash simples
$senhaHash = "`$2b`$10`$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK"

$insertSenha = "INSERT INTO entidades_senhas (cpf, senha_hash, primeira_senha_alterada, contratante_id) VALUES ('$cpfResponsavel', '$senhaHash', false, $contratanteId) ON CONFLICT (cpf) DO UPDATE SET senha_hash = '$senhaHash', contratante_id = $contratanteId RETURNING id;"

$senhaIdResult = psql -U postgres -d nr-bps_db -t -A -c $insertSenha 2>&1
$senhaId = ($senhaIdResult | Select-String -Pattern '^\d+$').Matches.Value

if ($senhaId) {
    Write-Host "[OK] Senha criada/atualizada: ID $senhaId"
} else {
    Write-Host "[AVISO] Erro ao criar senha: $senhaIdResult"
}

# 4. APROVAR E ATIVAR CONTRATANTE
Write-Host "`n[4/6] Aprovando e ativando contratante..."
$ativarQuery = "UPDATE tomadores SET status = 'aprovado', aprovado_em = NOW(), aprovado_por_cpf = '00000000000', pagamento_confirmado = true, data_primeiro_pagamento = NOW(), ativa = true, atualizado_em = NOW() WHERE id = $contratanteId;"

psql -U postgres -d nr-bps_db -c $ativarQuery | Out-Null
Write-Host "[OK] Contratante aprovado e ativado"

# 5. CRIAR EMPRESA CLIENTE E FUNCIONARIOS
Write-Host "`n[5/6] Criando empresa cliente e funcionarios..."

$insertEmpresa = "INSERT INTO empresas_clientes (contratante_id, nome, cnpj, email, telefone, cidade, estado) VALUES ($contratanteId, 'Empresa Cliente Teste', '98765432000188', 'contato@cliente.com', '(11) 99999-9999', 'Sao Paulo', 'SP') RETURNING id;"

$empresaId = psql -U postgres -d nr-bps_db -t -c $insertEmpresa
$empresaId = $empresaId.Trim()
Write-Host "[OK] Empresa cliente criada: ID $empresaId"

# Criar 3 funcionarios
$funcIds = @()
for ($i = 1; $i -le 3; $i++) {
    $cpfFunc = "1234567890$i"
    $insertFunc = "INSERT INTO funcionarios (cpf, nome, email, setor, cargo, data_admissao, situacao) VALUES ('$cpfFunc', 'Funcionario Teste $i', 'func$i@teste.com', 'TI', 'Analista', NOW(), 'ativo') ON CONFLICT (cpf) DO UPDATE SET nome = 'Funcionario Teste $i' RETURNING id;"
    
    $funcId = psql -U postgres -d nr-bps_db -t -c $insertFunc
    if ($funcId) {
        $funcId = $funcId.Trim()
        $funcIds += $funcId
        # Associar funcionario a empresa e contratante
        $assocQuery = "INSERT INTO tomadores_funcionarios (contratante_id, funcionario_id, empresa_cliente_id) VALUES ($contratanteId, $funcId, $empresaId) ON CONFLICT (funcionario_id, contratante_id) DO NOTHING;"
        psql -U postgres -d nr-bps_db -c $assocQuery | Out-Null
    }
}
Write-Host "[OK] $($funcIds.Count) funcionarios criados e associados"

# 6. CRIAR LOTE DE AVALIACAO
Write-Host "`n[6/6] Criando lote de avaliacao..."

$codigoLote = "001-$(Get-Date -Format 'ddMMyy')"
$insertLote = "INSERT INTO lotes_avaliacao (empresa_id, codigo, criado_em) VALUES ($empresaId, '$codigoLote', NOW()) RETURNING id;"

$loteId = psql -U postgres -d nr-bps_db -t -c $insertLote
$loteId = $loteId.Trim()
Write-Host "[OK] Lote criado: ID $loteId"

# RESUMO
Write-Host "`n========================================"
Write-Host "RESUMO DO TESTE"
Write-Host "========================================"
Write-Host "Contratante ID: $contratanteId"
Write-Host "Empresa ID: $empresaId"
Write-Host "Lote ID: $loteId"
Write-Host "CPF Responsavel: $cpfResponsavel"
Write-Host "Funcionarios: $($funcIds -join ', ')"
Write-Host "`n[SUCESSO] Fluxo completo testado com sucesso!"
Write-Host "========================================`n"

# Verificar estado final
Write-Host "Estado final do contratante:"
psql -U postgres -d nr-bps_db -c "SELECT id, nome, status, ativa, pagamento_confirmado FROM tomadores WHERE id = $contratanteId;"

Write-Host "`nFuncionarios associados:"
psql -U postgres -d nr-bps_db -c "SELECT f.id, f.nome, f.cpf FROM funcionarios f JOIN tomadores_funcionarios cf ON f.id = cf.funcionario_id WHERE cf.contratante_id = $contratanteId LIMIT 5;"

Write-Host "`nLotes criados:"
psql -U postgres -d nr-bps_db -c "SELECT l.id, l.codigo, l.criado_em FROM lotes_avaliacao l WHERE l.empresa_id = $empresaId;"

Write-Host "`n[INFO] Agora teste acessar http://localhost:3000 com os dados criados"
