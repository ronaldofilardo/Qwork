# ==============================================================================
# Script: Executar Migration Asaas em PRODUÇÃO
# ==============================================================================
# Data: 2026-02-17
# Descrição: Executa a migration de Asaas no banco de dados de produção
# ==============================================================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " MIGRATION ASAAS - PRODUÇÃO" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================================
# VERIFICAÇÕES INICIAIS
# ==============================================================================

Write-Host "⚠️  ATENÇÃO: Você está prestes a modificar o banco de PRODUÇÃO!" -ForegroundColor Red
Write-Host ""
Write-Host "Antes de continuar:" -ForegroundColor Yellow
Write-Host "  1. ✅ Você fez BACKUP do banco de produção?"
Write-Host "  2. ✅ Você tem acesso ao Neon Console?"
Write-Host "  3. ✅ Você revisou o script SQL?"
Write-Host ""

$confirmacao = Read-Host "Digite 'SIM' para continuar"

if ($confirmacao -ne "SIM") {
    Write-Host ""
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para executar a migration:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: https://console.neon.tech/"
    Write-Host "  2. Selecione seu projeto de produção"
    Write-Host "  3. Vá para SQL Editor"
    Write-Host "  4. Cole e execute: database/migrations/EXECUTAR_EM_PRODUCAO_asaas_migration.sql"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " INFORMAÇÕES DA MIGRATION" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================================
# VERIFICAR SE ARQUIVO EXISTE
# ==============================================================================

$migrationFile = "database\migrations\EXECUTAR_EM_PRODUCAO_asaas_migration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Arquivo de migration não encontrado!" -ForegroundColor Red
    Write-Host "   Esperado: $migrationFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivo de migration encontrado" -ForegroundColor Green
Write-Host "   Localização: $migrationFile" -ForegroundColor Gray
Write-Host ""

# ==============================================================================
# MOSTRAR O QUE SERÁ FEITO
# ==============================================================================

Write-Host "📋 A migration irá:" -ForegroundColor Cyan
Write-Host "   1. Adicionar 9 colunas Asaas na tabela 'pagamentos'"
Write-Host "   2. Criar tabela 'webhook_logs'"
Write-Host "   3. Criar índices para performance"
Write-Host "   4. Adicionar comentários nas colunas"
Write-Host ""

# ==============================================================================
# SOLICITAR DADOS DE CONEXÃO
# ==============================================================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " CONEXÃO COM BANCO DE PRODUÇÃO" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Você pode encontrar a string de conexão em:" -ForegroundColor Yellow
Write-Host "  - Neon Console > Dashboard > Connection String"
Write-Host "  - Vercel > Project Settings > Environment Variables > DATABASE_URL"
Write-Host ""

Write-Host "Escolha uma opção:" -ForegroundColor Cyan
Write-Host "  1. Colar string de conexão completa (postgresql://...)"
Write-Host "  2. Abrir instruções para usar Neon Console (recomendado)"
Write-Host "  3. Cancelar"
Write-Host ""

$opcao = Read-Host "Digite a opção (1, 2 ou 3)"

if ($opcao -eq "3") {
    Write-Host ""
    Write-Host "❌ Operação cancelada" -ForegroundColor Red
    exit 0
}

if ($opcao -eq "2") {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host " INSTRUÇÕES - NEON CONSOLE (RECOMENDADO)" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Passos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Acesse: https://console.neon.tech/" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Selecione seu projeto de PRODUÇÃO" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Clique em 'SQL Editor' no menu lateral" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Copie todo o conteúdo do arquivo:" -ForegroundColor White
    Write-Host "   database\migrations\EXECUTAR_EM_PRODUCAO_asaas_migration.sql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Cole no editor SQL" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Clique em 'Run' (ou pressione Ctrl+Enter)" -ForegroundColor White
    Write-Host ""
    Write-Host "7. Aguarde a execução (30 segundos)" -ForegroundColor White
    Write-Host ""
    Write-Host "8. Verifique as mensagens:" -ForegroundColor White
    Write-Host "   ✅ 'Coluna asaas_xxx adicionada'" -ForegroundColor Green
    Write-Host "   ✅ 'Tabela webhook_logs criada'" -ForegroundColor Green
    Write-Host "   ✅ 'COMMIT'" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Pressione ENTER para abrir o arquivo SQL no Explorer..."
    Read-Host
    
    # Abrir o arquivo no Explorer
    explorer.exe /select,"$PWD\$migrationFile"
    
    exit 0
}

if ($opcao -eq "1") {
    Write-Host ""
    $connectionString = Read-Host "Cole a string de conexão"
    
    if ([string]::IsNullOrWhiteSpace($connectionString)) {
        Write-Host ""
        Write-Host "❌ String de conexão não pode estar vazia" -ForegroundColor Red
        exit 1
    }
    
    # Verificar se é PostgreSQL
    if (-not $connectionString.StartsWith("postgresql://") -and -not $connectionString.StartsWith("postgres://")) {
        Write-Host ""
        Write-Host "❌ String de conexão inválida" -ForegroundColor Red
        Write-Host "   Deve começar com 'postgresql://' ou 'postgres://'" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host " EXECUTANDO MIGRATION" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar se psql está instalado
    try {
        $psqlVersion = psql --version 2>&1
        Write-Host "✅ PostgreSQL Client encontrado: $psqlVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ psql não encontrado!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Por favor, instale o PostgreSQL Client:" -ForegroundColor Yellow
        Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ou use o Neon Console (opção 2)" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "Executando migration..." -ForegroundColor Yellow
    Write-Host ""
    
    # Executar migration
    try {
        $env:PGPASSWORD = ""  # Limpar password anterior
        Get-Content $migrationFile | psql $connectionString
        
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host " ✅ MIGRATION EXECUTADA COM SUCESSO!" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host ""
    }
    catch {
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host " ❌ ERRO AO EXECUTAR MIGRATION" -ForegroundColor Red
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Erro: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Tente usar o Neon Console:" -ForegroundColor Yellow
        Write-Host "  https://console.neon.tech/" -ForegroundColor Cyan
        exit 1
    }
}
else {
    Write-Host ""
    Write-Host "❌ Opção inválida" -ForegroundColor Red
    exit 1
}

# ==============================================================================
# VERIFICAÇÃO PÓS-MIGRATION
# ==============================================================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " PRÓXIMOS PASSOS" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. ✅ Verifique se as colunas foram criadas:" -ForegroundColor Green
Write-Host "   - asaas_payment_id"
Write-Host "   - asaas_customer_id"
Write-Host "   - asaas_payment_url"
Write-Host "   - asaas_boleto_url"
Write-Host "   - asaas_invoice_url"
Write-Host "   - asaas_pix_qrcode"
Write-Host "   - asaas_pix_qrcode_image"
Write-Host "   - asaas_net_value"
Write-Host "   - asaas_due_date"
Write-Host ""

Write-Host "2. ✅ Teste criar um pagamento na aplicação" -ForegroundColor Green
Write-Host ""

Write-Host "3. ✅ Monitore os logs do Vercel por 30 minutos" -ForegroundColor Green
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " FIM" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
