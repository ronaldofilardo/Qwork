# Script para criar usuário Admin
# CPF: 00000000000
# Senha: 5978rdf

Write-Host "🔐 Criando usuário Admin..." -ForegroundColor Cyan
Write-Host ""

$DATABASE_URL = $env:LOCAL_DATABASE_URL ?? "postgresql://postgres@localhost:5432/nr-bps_db"
$CPF = "00000000000"
$NOME = "Administrador"
$SENHA = "5978rdf"

# Gerar hash da senha usando bcrypt (custo 10)
Write-Host "📝 Gerando hash da senha..." -ForegroundColor Yellow

# Usar Node.js para gerar o hash
$hashScript = @"
const bcrypt = require('bcryptjs');
const senha = '$SENHA';
bcrypt.hash(senha, 10).then(hash => {
    console.log(hash);
}).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
"@

$senhaHash = node -e $hashScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar hash da senha" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Hash gerado: $($senhaHash.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Verificar se usuário já existe
Write-Host "🔍 Verificando se usuário já existe..." -ForegroundColor Yellow

$checkQuery = "SELECT cpf, nome, perfil FROM funcionarios WHERE cpf = '$CPF';"
$existing = psql --dbname=$DATABASE_URL --tuples-only --no-align -c $checkQuery 2>&1

if ($existing -match $CPF) {
    Write-Host "⚠️  Usuário admin já existe. Atualizando senha..." -ForegroundColor Yellow
    
    $updateQuery = @"
UPDATE funcionarios 
SET senha_hash = '$senhaHash',
    perfil = 'admin',
    usuario_tipo = 'admin',
    ativo = true
WHERE cpf = '$CPF';
"@
    
    $result = psql --dbname=$DATABASE_URL -c $updateQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Senha do admin atualizada!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao atualizar senha: $result" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "➕ Criando novo usuário admin..." -ForegroundColor Yellow
    
    # Desabilitar triggers temporariamente
    psql --dbname=$DATABASE_URL -c "ALTER TABLE funcionarios DISABLE TRIGGER ALL;" 2>&1 | Out-Null
    
    $insertQuery = @"
INSERT INTO funcionarios (
    cpf,
    nome,
    perfil,
    usuario_tipo,
    senha_hash,
    ativo,
    email,
    indice_avaliacao
) VALUES (
    '$CPF',
    '$NOME',
    'admin',
    'admin',
    '$senhaHash',
    true,
    'admin@qwork.com.br',
    0
)
ON CONFLICT (cpf) DO UPDATE SET
    senha_hash = EXCLUDED.senha_hash,
    perfil = EXCLUDED.perfil,
    usuario_tipo = EXCLUDED.usuario_tipo,
    ativo = EXCLUDED.ativo;
"@
    
    $result = psql --dbname=$DATABASE_URL -c $insertQuery 2>&1
    
    # Reabilitar triggers
    psql --dbname=$DATABASE_URL -c "ALTER TABLE funcionarios ENABLE TRIGGER ALL;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuário admin criado!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar usuário:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        # Garantir que triggers sejam reabilitados mesmo em caso de erro
        psql --dbname=$DATABASE_URL -c "ALTER TABLE funcionarios ENABLE TRIGGER ALL;" 2>&1 | Out-Null
        exit 1
    }
}

Write-Host ""
Write-Host "📊 Verificando usuário criado..." -ForegroundColor Yellow

$verifyQuery = @"
SELECT 
    cpf,
    nome,
    perfil,
    usuario_tipo,
    ativo,
    email
FROM funcionarios 
WHERE cpf = '$CPF';
"@

psql --dbname=$DATABASE_URL -c $verifyQuery

Write-Host ""
Write-Host "✅ Seed concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credenciais de acesso:" -ForegroundColor Cyan
Write-Host "   CPF: $CPF" -ForegroundColor White
Write-Host "   Senha: $SENHA" -ForegroundColor White
Write-Host "   URL: http://localhost:3000/login" -ForegroundColor White
Write-Host ""
