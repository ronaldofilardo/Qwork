# Script PowerShell para migrar banco de produção NeonDB
# Aplica migrações necessárias para compatibilidade com código atual
# Uso: ./migrate-production.ps1

# Use $env:PROD_CONN_STRING if provided (allows running migrations against a specific Neon instance)
$connString = $env:PROD_CONN_STRING
if (-not $connString -or $connString -eq "") {
    $connString = "postgresql://neondb_owner:npg_8FNwPWA2mpcl@ep-holy-math-ac17vhfi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
}

# Verifica se o psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql não encontrado. Instale o PostgreSQL Client Tools e tente novamente."
    exit 1
}

Write-Host "Iniciando migração do banco de produção..."

# 1. Adicionar colunas faltantes na tabela empresas_clientes
Write-Host "Adicionando colunas cidade, estado, cep na tabela empresas_clientes..."
psql $connString -c "ALTER TABLE empresas_clientes ADD COLUMN IF NOT EXISTS cidade VARCHAR(50), ADD COLUMN IF NOT EXISTS estado CHAR(2), ADD COLUMN IF NOT EXISTS cep VARCHAR(10);"

# 2. Migrar tabela laudos
Write-Host "Aplicando migração da tabela laudos..."
psql $connString -c "
DO \$\$
BEGIN
    -- Adicionar coluna emissor_cpf se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'laudos' AND column_name = 'emissor_cpf') THEN
        ALTER TABLE laudos ADD COLUMN emissor_cpf CHAR(11) REFERENCES funcionarios(cpf);
    END IF;

    -- Adicionar coluna enviado_em se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'laudos' AND column_name = 'enviado_em') THEN
        ALTER TABLE laudos ADD COLUMN enviado_em TIMESTAMP;
    END IF;
END \$\$;
"

# 3. Atualizar constraints
Write-Host "Atualizando constraints da tabela laudos..."
psql $connString -c "
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;
ALTER TABLE laudos ADD CONSTRAINT laudos_status_check CHECK (status IN ('rascunho', 'emitido', 'enviado'));
"

# 4. Criar índices necessários
Write-Host "Criando índices necessários..."
psql $connString -c "
CREATE INDEX IF NOT EXISTS idx_laudos_emissor ON laudos (emissor_cpf);
CREATE INDEX IF NOT EXISTS idx_laudos_lote ON laudos (lote_id);
CREATE INDEX IF NOT EXISTS idx_laudos_status ON laudos (status);
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_lote_emissor_unique;
ALTER TABLE laudos ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);
"

# 5. Verificar estrutura final
Write-Host "Verificando estrutura das tabelas..."
psql $connString -c "
SELECT '=== ESTRUTURA LAUDOS ===' as titulo;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'laudos'
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA EMPRESAS_CLIENTES ===' as titulo;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'empresas_clientes' AND column_name IN ('cidade', 'estado', 'cep', 'emissor_cpf', 'enviado_em')
ORDER BY ordinal_position;
"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migração concluída com sucesso!"
    Write-Host "ℹ️  Recomendação: Faça um novo deploy na Vercel para ativar as mudanças."
} else {
    Write-Error "❌ Falha na migração. Verifique os logs acima."
}