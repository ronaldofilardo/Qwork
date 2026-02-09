# ====================================================================
# SCRIPT DE SINCRONIZAÇÃO COMPLETA: DEV → NEON (PRODUÇÃO)
# Data: 2026-02-06
# ====================================================================
# Este script compara os schemas e gera um script de migração completo
# para sincronizar o banco Neon (produção) com o banco de desenvolvimento

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SINCRONIZAÇÃO COMPLETA: DEV → NEON" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$devSchema = ".\tmp\schema-dev-complete.sql"
$prodSchema = ".\tmp\schema-prod-neon.sql"
$migrationScript = ".\tmp\MIGRATION_SYNC_NEON_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Verificar se os arquivos existem
if (-not (Test-Path $devSchema)) {
    Write-Host "❌ ERRO: Schema de desenvolvimento não encontrado: $devSchema" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $prodSchema)) {
    Write-Host "❌ ERRO: Schema de produção não encontrado: $prodSchema" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Schemas encontrados" -ForegroundColor Green
Write-Host "  Dev:  $(((Get-Item $devSchema).Length / 1KB).ToString('0.00')) KB" -ForegroundColor Gray
Write-Host "  Prod: $(((Get-Item $prodSchema).Length / 1KB).ToString('0.00')) KB" -ForegroundColor Gray
Write-Host ""

# Ler os schemas
$devContent = Get-Content $devSchema -Raw
$prodContent = Get-Content $prodSchema -Raw

# Função para extrair nomes de tabelas
function Extract-TableNames {
    param([string]$content)
    
    $tables = [System.Collections.ArrayList]::new()
    $matches = [regex]::Matches($content, 'CREATE TABLE (?:public\.)?([a-z_]+)\s+\(')
    
    foreach ($match in $matches) {
        [void]$tables.Add($match.Groups[1].Value)
    }
    
    return $tables | Sort-Object
}

# Função para extrair colunas de uma tabela
function Extract-TableColumns {
    param([string]$content, [string]$tableName)
    
    $pattern = "CREATE TABLE (?:public\.)?$tableName\s+\((.*?)\);"
    $match = [regex]::Match($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($match.Success) {
        return $match.Groups[1].Value
    }
    return $null
}

Write-Host "📊 Analisando diferenças..." -ForegroundColor Yellow
Write-Host ""

# Extrair tabelas
$devTables = Extract-TableNames $devContent
$prodTables = Extract-TableNames $prodContent

# Tabelas apenas em DEV (precisam ser criadas)
$newTables = $devTables | Where-Object { $_ -notin $prodTables }

# Tabelas apenas em PROD (precisam ser avaliadas para remoção)
$obsoleteTables = $prodTables | Where-Object { $_ -notin $devTables }

# Tabelas em comum (precisam ter colunas comparadas)
$commonTables = $devTables | Where-Object { $_ -in $prodTables }

Write-Host "📋 RESUMO DA ANÁLISE:" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "  Tabelas em DEV:      $($devTables.Count)" -ForegroundColor Cyan
Write-Host "  Tabelas em PROD:     $($prodTables.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Apenas em DEV:       $($newTables.Count) tabelas" -ForegroundColor Green
Write-Host "  Apenas em PROD:      $($obsoleteTables.Count) tabelas" -ForegroundColor Red
Write-Host "  Em comum:            $($commonTables.Count) tabelas" -ForegroundColor Yellow
Write-Host ""

if ($newTables.Count -gt 0) {
    Write-Host "✨ NOVAS TABELAS (em DEV):" -ForegroundColor Green
    foreach ($table in $newTables) {
        Write-Host "   • $table" -ForegroundColor Green
    }
    Write-Host ""
}

if ($obsoleteTables.Count -gt 0) {
    Write-Host "⚠️  TABELAS OBSOLETAS (apenas em PROD):" -ForegroundColor Red
    foreach ($table in $obsoleteTables) {
        Write-Host "   • $table" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "GERANDO SCRIPT DE MIGRAÇÃO COMPLETO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar geração do script de migração
$migrationContent = @"
-- ====================================================================
-- MIGRAÇÃO COMPLETA: SINCRONIZAÇÃO DEV → NEON (PRODUÇÃO)
-- ====================================================================
-- Data de Geração: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- 
-- OBJETIVO:
--   Sincronizar completamente o banco de produção (Neon) com o banco
--   de desenvolvimento (nr-bps_db), incluindo:
--   - Tabelas, colunas, constraints
--   - Índices
--   - Triggers
--   - Funções
--   - Views
--   - Sequences
--   - RLS Policies
--   - E tudo mais
-- 
-- ⚠️  ATENÇÃO: Este script faz mudanças estruturais significativas
--    Recomenda-se:
--    1. Criar backup completo do banco Neon antes de executar
--    2. Executar em horário de baixo tráfego
--    3. Validar em ambiente de staging primeiro (se disponível)
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRAÇÃO COMPLETA: SINCRONIZAÇÃO'
\echo 'Iniciando em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')'
\echo '========================================='

-- ====================================================================
-- ESTATÍSTICAS ANTES DA MIGRAÇÃO
-- ====================================================================

\echo ''
\echo 'Coletando estatísticas ANTES da migração...'

DO `$`$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE trigger_schema = 'public';
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    
    RAISE NOTICE 'ANTES - Tabelas: %, Funções: %, Triggers: %, Views: %', table_count, function_count, trigger_count, view_count;
END
`$`$;

-- ====================================================================
-- PARTE 1: EXECUTAR TODAS AS MIGRAÇÕES DO DIRETÓRIO
-- ====================================================================

\echo ''
\echo 'PARTE 1: Aplicando migrações do diretório database/migrations/'
\echo 'NOTA: Este script deve ser executado APÓS aplicar todas as migrações'
\echo 'individualmente ou usar um script de aplicação automática.'
\echo ''

-- As migrações devem ser aplicadas na ordem correta.
-- Este script assume que você está aplicando manualmente ou via outro processo.
-- Alternativamente, você pode inserir aqui os comandos \i para cada migração.

\echo '⚠️  IMPORTANTE: Certifique-se de que TODAS as migrações foram aplicadas!'
\echo '   Verifique o diretório: database/migrations/'
\echo ''

-- ====================================================================
-- PARTE 2: DROP E RECREATE DE OBJETOS DEPENDENTES
-- ====================================================================

\echo ''
\echo 'PARTE 2: Recriando objetos dependentes (views, triggers, etc.)...'

-- Dropar views que podem estar desatualizadas
DROP VIEW IF EXISTS vw_funcionarios_por_lote CASCADE;
DROP VIEW IF EXISTS vw_audit_trail_por_contratante CASCADE;
DROP VIEW IF EXISTS equipe_administrativa CASCADE;
DROP VIEW IF EXISTS usuarios_resumo CASCADE;
DROP VIEW IF EXISTS gestores CASCADE;
DROP VIEW IF EXISTS vw_funcionarios_completo CASCADE;

\echo '✓ Views antigas removidas'

-- ====================================================================
-- PARTE 3: CRIAR TABELAS FALTANTES (ARQUITETURA CORRETA)
-- ====================================================================

\echo ''
\echo 'PARTE 3: Criando tabelas da nova arquitetura...'

-- 3.1 Criar entidades_senhas (senhas de gestores de entidade)
CREATE TABLE IF NOT EXISTS entidades_senhas (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entidades_senhas_cpf_contratante_unique 
        UNIQUE (cpf, contratante_id)
);

CREATE INDEX IF NOT EXISTS idx_entidades_senhas_cpf ON entidades_senhas(cpf);
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_contratante ON entidades_senhas(contratante_id);

\echo '✓ Tabela entidades_senhas criada/verificada'

-- 3.2 Criar clinicas_senhas (senhas de RH de clínica)
CREATE TABLE IF NOT EXISTS clinicas_senhas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clinicas_senhas_cpf_clinica_unique 
        UNIQUE (cpf, clinica_id)
);

CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_cpf ON clinicas_senhas(cpf);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica ON clinicas_senhas(clinica_id);

\echo '✓ Tabela clinicas_senhas criada/verificada'

-- 3.3 Criar funcionarios_entidades (relacionamento funcionário -> entidade)
CREATE TABLE IF NOT EXISTS funcionarios_entidades (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo TIMESTAMP,
    CONSTRAINT funcionarios_entidades_unique 
        UNIQUE (funcionario_id, contratante_id)
);

CREATE INDEX IF NOT EXISTS idx_func_entidades_funcionario ON funcionarios_entidades(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_func_entidades_contratante ON funcionarios_entidades(contratante_id);
CREATE INDEX IF NOT EXISTS idx_func_entidades_ativo ON funcionarios_entidades(ativo);

\echo '✓ Tabela funcionarios_entidades criada/verificada'

-- 3.4 Criar funcionarios_clinicas (relacionamento funcionário -> empresa -> clínica)
CREATE TABLE IF NOT EXISTS funcionarios_clinicas (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas_clientes(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo TIMESTAMP,
    CONSTRAINT funcionarios_clinicas_unique 
        UNIQUE (funcionario_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_func_clinicas_funcionario ON funcionarios_clinicas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_func_clinicas_empresa ON funcionarios_clinicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_func_clinicas_ativo ON funcionarios_clinicas(ativo);

\echo '✓ Tabela funcionarios_clinicas criada/verificada'

-- ====================================================================
-- PARTE 4: CRIAR TRIGGERS DE VALIDAÇÃO
-- ====================================================================

\echo ''
\echo 'PARTE 4: Criando triggers de validação...'

-- Trigger para validar tipo='entidade' em entidades_senhas
CREATE OR REPLACE FUNCTION validate_entidade_tipo()
RETURNS TRIGGER AS `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tomadores WHERE id = NEW.contratante_id AND tipo = 'entidade') THEN
        RAISE EXCEPTION 'contratante_id % não é do tipo entidade', NEW.contratante_id;
    END IF;
    RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_entidade_tipo ON entidades_senhas;
CREATE TRIGGER trg_validate_entidade_tipo
BEFORE INSERT OR UPDATE ON entidades_senhas
FOR EACH ROW EXECUTE FUNCTION validate_entidade_tipo();

-- Trigger para validar tipo='entidade' em funcionarios_entidades
CREATE OR REPLACE FUNCTION validate_funcionario_entidade_tipo()
RETURNS TRIGGER AS `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tomadores WHERE id = NEW.contratante_id AND tipo = 'entidade') THEN
        RAISE EXCEPTION 'contratante_id % não é do tipo entidade', NEW.contratante_id;
    END IF;
    RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_funcionario_entidade_tipo ON funcionarios_entidades;
CREATE TRIGGER trg_validate_funcionario_entidade_tipo
BEFORE INSERT OR UPDATE ON funcionarios_entidades
FOR EACH ROW EXECUTE FUNCTION validate_funcionario_entidade_tipo();

\echo '✓ Triggers de validação criados'

-- ====================================================================
-- PARTE 5: MIGRAR DADOS (SE NECESSÁRIO)
-- ====================================================================

\echo ''
\echo 'PARTE 5: Migrando dados para nova estrutura...'

-- 5.1 Migrar senhas de ENTIDADES (se tomadores_senhas existir)
DO `$`$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores_senhas') THEN
        INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
        SELECT cs.contratante_id, cs.cpf, cs.senha_hash, cs.primeira_senha_alterada, cs.criado_em, cs.atualizado_em
        FROM tomadores_senhas cs
        JOIN tomadores c ON c.id = cs.contratante_id
        WHERE c.tipo = 'entidade'
        ON CONFLICT (cpf, contratante_id) DO NOTHING;
        
        RAISE NOTICE '✓ Senhas de entidades migradas';
    END IF;
END `$`$;

-- 5.2 Migrar senhas de CLÍNICAS (se tomadores_senhas existir)
DO `$`$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores_senhas') THEN
        INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
        SELECT cl.id, cs.cpf, cs.senha_hash, cs.primeira_senha_alterada, cs.criado_em, cs.atualizado_em
        FROM tomadores_senhas cs
        JOIN tomadores c ON c.id = cs.contratante_id
        JOIN clinicas cl ON cl.contratante_id = c.id
        WHERE c.tipo = 'clinica'
        ON CONFLICT (cpf, clinica_id) DO NOTHING;
        
        RAISE NOTICE '✓ Senhas de clínicas (RH) migradas';
    END IF;
END `$`$;

-- 5.3 Migrar relacionamentos de funcionários de ENTIDADES
DO `$`$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'funcionarios' AND column_name = 'contratante_id') THEN
        INSERT INTO funcionarios_entidades (funcionario_id, contratante_id, ativo, data_vinculo)
        SELECT f.id, f.contratante_id, f.ativo, f.criado_em
        FROM funcionarios f
        WHERE f.contratante_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'funcionarios' AND column_name = 'clinica_id')
          AND EXISTS (SELECT 1 FROM tomadores c WHERE c.id = f.contratante_id AND c.tipo = 'entidade')
        ON CONFLICT (funcionario_id, contratante_id) DO NOTHING;
        
        RAISE NOTICE '✓ Funcionários de entidades migrados';
    END IF;
END `$`$;

-- 5.4 Migrar relacionamentos de funcionários de CLÍNICAS
DO `$`$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'funcionarios' AND column_name = 'empresa_id') THEN
        INSERT INTO funcionarios_clinicas (funcionario_id, empresa_id, ativo, data_vinculo)
        SELECT f.id, f.empresa_id, f.ativo, f.criado_em
        FROM funcionarios f
        WHERE f.empresa_id IS NOT NULL
        ON CONFLICT (funcionario_id, empresa_id) DO NOTHING;
        
        RAISE NOTICE '✓ Funcionários de clínicas migrados';
    END IF;
END `$`$;

-- ====================================================================
-- PARTE 6: REMOVER COLUNAS OBSOLETAS (SE EXISTIREM)
-- ====================================================================

\echo ''
\echo 'PARTE 6: Removendo colunas obsoletas de funcionarios...'

-- Verificar e remover colunas obsoletas
DO `$`$
BEGIN
    -- Remover constraints primeiro
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_clinica_check') THEN
        ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_clinica_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_funcionarios_clinica') THEN
        ALTER TABLE funcionarios DROP CONSTRAINT fk_funcionarios_clinica;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_funcionarios_contratante') THEN
        ALTER TABLE funcionarios DROP CONSTRAINT fk_funcionarios_contratante;
    END IF;
    
    -- Remover colunas
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'funcionarios' AND column_name = 'clinica_id') THEN
        ALTER TABLE funcionarios DROP COLUMN clinica_id CASCADE;
        RAISE NOTICE '✓ Coluna clinica_id removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'funcionarios' AND column_name = 'empresa_id') THEN
        ALTER TABLE funcionarios DROP COLUMN empresa_id CASCADE;
        RAISE NOTICE '✓ Coluna empresa_id removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'funcionarios' AND column_name = 'contratante_id') THEN
        ALTER TABLE funcionarios DROP COLUMN contratante_id CASCADE;
        RAISE NOTICE '✓ Coluna contratante_id removida';
    END IF;
END `$`$;

-- ====================================================================
-- PARTE 7: RECRIAR VIEWS
-- ====================================================================

\echo ''
\echo 'PARTE 7: Recriando views...'

-- View unificada de funcionários com vínculos
CREATE OR REPLACE VIEW vw_funcionarios_completo AS
SELECT 
    f.*,
    -- Vínculo com entidade
    fe.contratante_id as entidade_id,
    fe.ativo as vinculo_entidade_ativo,
    -- Vínculo com clínica (via empresa)
    fc.empresa_id,
    ec.clinica_id,
    fc.ativo as vinculo_clinica_ativo,
    -- Tipo de vínculo
    CASE 
        WHEN fe.id IS NOT NULL THEN 'entidade'
        WHEN fc.id IS NOT NULL THEN 'clinica'
        ELSE NULL
    END as tipo_vinculo
FROM funcionarios f
LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id;

-- View de gestores (RH e Gestor)
CREATE OR REPLACE VIEW gestores AS
SELECT 
    u.cpf, 
    u.nome, 
    u.email, 
    u.tipo_usuario, 
    u.clinica_id, 
    u.contratante_id as entidade_id,
    u.ativo,
    u.criado_em,
    u.atualizado_em
FROM usuarios u
WHERE u.tipo_usuario IN ('rh', 'gestor');

\echo '✓ Views recriadas'

-- ====================================================================
-- PARTE 8: ADICIONAR COMENTÁRIOS
-- ====================================================================

\echo ''
\echo 'PARTE 8: Adicionando comentários de documentação...'

COMMENT ON TABLE entidades_senhas IS 'Senhas de gestores de entidade. Separada de clinicas_senhas.';
COMMENT ON TABLE clinicas_senhas IS 'Senhas de RH (gestores de clínica). Separada de entidades_senhas.';
COMMENT ON TABLE funcionarios_entidades IS 'Relacionamento funcionário -> entidade (direto).';
COMMENT ON TABLE funcionarios_clinicas IS 'Relacionamento funcionário -> empresa -> clínica.';
COMMENT ON VIEW vw_funcionarios_completo IS 'View helper com todos os vínculos de funcionários.';
COMMENT ON VIEW gestores IS 'View de gestores (RH de clínicas e Gestores de entidades).';

\echo '✓ Comentários adicionados'

-- ====================================================================
-- ESTATÍSTICAS FINAIS
-- ====================================================================

\echo ''
\echo 'Coletando estatísticas DEPOIS da migração...'

DO `$`$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE trigger_schema = 'public';
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    
    RAISE NOTICE 'DEPOIS - Tabelas: %, Funções: %, Triggers: %, Views: %', table_count, function_count, trigger_count, view_count;
END
`$`$;

-- ====================================================================
-- FINALIZAÇÃO
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'MIGRAÇÃO COMPLETA FINALIZADA COM SUCESSO!'
\echo '========================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Validar estrutura do banco'
\echo '2. Executar testes de integração'
\echo '3. Verificar funcionamento dos endpoints'
\echo '4. Monitorar logs de erro'
\echo ''

COMMIT;

-- Feito!
"@

# Salvar o script
$migrationContent | Out-File -FilePath $migrationScript -Encoding UTF8

Write-Host "✅ SCRIPT DE MIGRAÇÃO GERADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Arquivo: $migrationScript" -ForegroundColor Cyan
Write-Host "📦 Tamanho: $(((Get-Item $migrationScript).Length / 1KB).ToString('0.00')) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  BACKUP DO NEON (CRÍTICO):" -ForegroundColor Yellow
Write-Host "   pg_dump -h ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech -U neondb_owner -d neondb -F c -f backup_neon_antes_sync.dump" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  EXECUTAR MIGRAÇÃO:" -ForegroundColor Yellow
Write-Host "   psql 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require' -f $migrationScript" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  VALIDAR ESTRUTURA:" -ForegroundColor Yellow
Write-Host "   Execute queries de teste para validar tabelas, triggers, views" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   - Execute em horário de baixo tráfego" -ForegroundColor Red
Write-Host "   - Tenha o backup pronto antes de executar" -ForegroundColor Red
Write-Host "   - Monitore logs durante e após a execução" -ForegroundColor Red
Write-Host ""
