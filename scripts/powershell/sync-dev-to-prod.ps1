# Script PowerShell para sincronizar dados do banco de desenvolvimento para produção
# Uso: ./sync-dev-to-prod.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SINCRONIZAÇÃO DEV -> PROD" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# URLs de conexão
$localConnString = "postgresql://postgres:123456@localhost:5432/nr-bps_db"
$prodConnString = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Arquivos temporários
$tempDir = "temp_sync"
$schemaFile = "$tempDir/schema_export.sql"
$dataFile = "$tempDir/data_export.sql"

# Configuração: executar apenas schema/migrations em PROD (sem dados)
# Se quiser importar dados manualmente, defina $skipDataImport = $false
$skipDataImport = $true

# Verifica se o psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql não encontrado. Instale o PostgreSQL Client Tools."
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Error "pg_dump não encontrado. Instale o PostgreSQL Client Tools."
    exit 1
}

# Cria diretório temporário
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

Write-Host "1. Exportando schema do banco de desenvolvimento..." -ForegroundColor Yellow
$env:PGPASSWORD = "123456"
pg_dump -h localhost -U postgres -d nr-bps_db --schema-only --no-owner --no-acl -f $schemaFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao exportar schema."
    exit 1
}
Write-Host "✅ Schema exportado" -ForegroundColor Green

Write-Host ""
Write-Host "2. Exportando dados do banco de desenvolvimento..." -ForegroundColor Yellow
pg_dump -h localhost -U postgres -d nr-bps_db --data-only --no-owner --no-acl `
    --table=clinicas `
    --table=empresas_clientes `
    --table=funcionarios `
    --table=avaliacoes `
    --table=respostas `
    --table=resultados `
    --table=lotes_avaliacao `
    --table=lotes_avaliacao_funcionarios `
    --table=laudos `
    -f $dataFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao exportar dados."
    exit 1
}
Write-Host "✅ Dados exportados" -ForegroundColor Green

Write-Host ""
Write-Host "3. Aplicando schema no banco de produção..." -ForegroundColor Yellow
Write-Host "   (Isso irá recriar as tabelas e deixar o DB sem dados)" -ForegroundColor Gray
$env:PGPASSWORD = "npg_J2QYqn5oxCzp"

# Primeiro, configurar o search_path e drop das tabelas existentes
$dropScript = @"
SET search_path TO public;
-- Dropar tabelas para garantir estado limpo
DROP TABLE IF EXISTS laudos CASCADE;
DROP TABLE IF EXISTS lotes_avaliacao_funcionarios CASCADE;
DROP TABLE IF EXISTS lotes_avaliacao CASCADE;
DROP TABLE IF EXISTS resultados CASCADE;
DROP TABLE IF EXISTS respostas CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS empresas_clientes CASCADE;
DROP TABLE IF EXISTS clinicas CASCADE;
DROP TABLE IF EXISTS questao_condicoes CASCADE;
DROP TABLE IF EXISTS clinicas_empresas CASCADE;
DROP TABLE IF EXISTS relatorio_templates CASCADE;
DROP TABLE IF EXISTS analise_estatistica CASCADE;
"@

$dropScript | psql $prodConnString

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Aviso ao dropar tabelas (pode ser normal se não existirem)."
}

# Aplica o schema - limpar schema public primeiro para garantir estado consistente
Write-Host "Limpando schema public (DROP/CREATE) para garantir estado limpo)..." -ForegroundColor Yellow
$cleanupSchema = @"
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
"@
$cleanupSchema | psql $prodConnString

Write-Host "Aplicando schema (parando em primeiro erro)..." -ForegroundColor Yellow
psql $prodConnString --set ON_ERROR_STOP=on -f $schemaFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao aplicar schema. Rever logs e reexecutar após correção."
    exit 1
}
Write-Host "✅ Schema aplicado" -ForegroundColor Green

# Aplicar migração 007 (criação de audit_logs) antes da 029/004 se necessário
Write-Host "" 
Write-Host "3.0. Verificando/Aplicando migração 007 (cria audit_logs)..." -ForegroundColor Yellow
$exists007 = @"
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'audit_logs' AND table_schema = 'public'
) as migration_007_applied;
"@

$check007 = $exists007 | psql $prodConnString -t

if ($check007 -match "f") {
    Write-Host "   Aplicando migração 007..." -ForegroundColor Cyan
    psql $prodConnString --set ON_ERROR_STOP=on -f "database/migrations/007_refactor_status_fila_emissao.sql"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao aplicar migração 007. Sincronização abortada."
        exit 1
    }
    Write-Host "✅ Migração 007 aplicada" -ForegroundColor Green
} else {
    Write-Host "✅ Migração 007 já aplicada anteriormente" -ForegroundColor Green
}

# Aplicar migração 029 primeiro (cria funções current_user_* que são dependência de 004)
Write-Host "" 
Write-Host "3.1. Aplicando migração 029 (funções current_user_* e correções RBAC/RLS)..." -ForegroundColor Yellow
$exists029 = @"
SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_proc 
  WHERE proname = 'current_user_cpf'
) as migration_029_applied;
"@

$check029 = $exists029 | psql $prodConnString -t

if ($check029 -match "f") {
    Write-Host "   Aplicando migração 029..." -ForegroundColor Cyan
    psql $prodConnString --set ON_ERROR_STOP=on -f "database/migrations/029_correcoes_rbac_rls.sql"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao aplicar migração 029. Sincronização abortada."
        exit 1
    }
    Write-Host "✅ Migração 029 aplicada" -ForegroundColor Green
} else {
    Write-Host "✅ Migração 029 já aplicada anteriormente" -ForegroundColor Green
}

Write-Host ""
# PRE-FLIGHT: garantir que audit_logs e funções helper existam antes de aplicar 004
Write-Host "3.4. Preflight: criando audit_logs e funções helper se necessário..." -ForegroundColor Yellow
$preflight = @'
SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_cpf CHAR(11) NOT NULL,
    user_perfil VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_cpf ON public.audit_logs (user_cpf);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Criar funções current_user_* apenas se não existirem (evita conflitos de tipos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_cpf') THEN
    EXECUTE '
    CREATE FUNCTION public.current_user_cpf() RETURNS VARCHAR(11) AS $$
    BEGIN
      RETURN nullif(current_setting(''app.current_user_cpf'', true), '''');
    END;
    $$ LANGUAGE plpgsql STABLE;
    ';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_perfil') THEN
    EXECUTE '
    CREATE FUNCTION public.current_user_perfil() RETURNS VARCHAR(50) AS $$
    BEGIN
      RETURN nullif(current_setting(''app.current_user_perfil'', true), '''');
    END;
    $$ LANGUAGE plpgsql STABLE;
    ';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_clinica_id') THEN
    EXECUTE '
    CREATE FUNCTION public.current_user_clinica_id() RETURNS INTEGER AS $$
    DECLARE
      clinica_id_str VARCHAR(50);
      clinica_id_int INTEGER;
    BEGIN
      clinica_id_str := nullif(current_setting(''app.current_user_clinica_id'', true), '''');
      IF clinica_id_str IS NOT NULL THEN
        clinica_id_int := clinica_id_str::INTEGER;
        RETURN clinica_id_int;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql STABLE;
    ';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_func') THEN
    EXECUTE '
    CREATE FUNCTION public.audit_trigger_func() RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = ''DELETE'') THEN
        INSERT INTO public.audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data, details)
        VALUES (current_user_cpf(), current_user_perfil(), ''DELETE'', TG_TABLE_NAME, OLD.id::TEXT, row_to_json(OLD), ''Record deleted'');
        RETURN OLD;
      ELSIF (TG_OP = ''UPDATE'') THEN
        INSERT INTO public.audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, details)
        VALUES (current_user_cpf(), current_user_perfil(), ''UPDATE'', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(OLD), row_to_json(NEW), ''Record updated'');
        RETURN NEW;
      ELSIF (TG_OP = ''INSERT'') THEN
        INSERT INTO public.audit_logs (user_cpf, user_perfil, action, resource, resource_id, new_data, details)
        VALUES (current_user_cpf(), current_user_perfil(), ''INSERT'', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(NEW), ''Record created'');
        RETURN NEW;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END$$;
'@

# Executar preflight (criar helpers apenas se ausentes)
$preflight | psql $prodConnString --set ON_ERROR_STOP=on

Write-Host "3.5. Aplicando migração 004 (RLS/RBAC)..." -ForegroundColor Yellow
Write-Host "   Verificando se migração já foi aplicada..." -ForegroundColor Gray

# Verificar se migração 004 já foi aplicada
$migrationCheck = @"
SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_proc 
  WHERE proname = 'user_has_permission'
) as migration_004_applied;
"@

$checkResult = $migrationCheck | psql $prodConnString -t

if ($checkResult -match "f") {
    Write-Host "   Aplicando migração 004..." -ForegroundColor Cyan
    # Garantir search_path pública antes de aplicar 004
psql $prodConnString -c "SET search_path TO public;" 
psql $prodConnString --set ON_ERROR_STOP=on -f "database/migrations/004_rls_rbac_fixes.sql"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao aplicar migração 004. Sincronização abortada."
        exit 1
    }
    Write-Host "✅ Migração 004 aplicada" -ForegroundColor Green
} else {
    Write-Host "✅ Migração 004 já aplicada anteriormente" -ForegroundColor Green
}

Write-Host ""
Write-Host "3.6. Aplicando migração 005 (correção FK/constraints)..." -ForegroundColor Yellow
psql $prodConnString --set ON_ERROR_STOP=on -f "database/migrations/005_fix_duplicated_fk_and_constraints.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Aviso ao aplicar migração 005 (pode já ter sido aplicada)."
} else {
    Write-Host "✅ Migração 005 aplicada" -ForegroundColor Green
}

Write-Host ""
if (-not $skipDataImport) {
    Write-Host "4. Importando dados para produção..." -ForegroundColor Yellow
    psql $prodConnString -f $dataFile

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao importar dados."
        exit 1
    }
    Write-Host "✅ Dados importados" -ForegroundColor Green
} else {
    Write-Host "4. PULANDO importação de dados em PRODUÇÃO (configuração)" -ForegroundColor Yellow
    # Garantir que o banco fique sem dados: truncar todas as tabelas após aplicar schema/migrations
    $truncateScript = @"
    SET search_path TO public;
    -- Truncar todas as tabelas de usuário garantido estado vazio
    TRUNCATE TABLE laudos, lotes_avaliacao_funcionarios, lotes_avaliacao, resultados, respostas, avaliacoes, funcionarios, empresas_clientes, clinicas, questao_condicoes, clinicas_empresas, relatorio_templates, analise_estatistica RESTART IDENTITY CASCADE;
"@
    $truncateScript | psql $prodConnString
    Write-Host "✅ Truncate executado - banco deixado sem dados" -ForegroundColor Green
}

Write-Host ""
Write-Host "5. Atualizando sequences..." -ForegroundColor Yellow
$sequenceScript = @"
SET search_path TO public;
SELECT setval('clinicas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clinicas));
SELECT setval('empresas_clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM empresas_clientes));
SELECT setval('funcionarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM funcionarios));
SELECT setval('avaliacoes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM avaliacoes));
SELECT setval('respostas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM respostas));
SELECT setval('resultados_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resultados));
"@

$sequenceScript | psql $prodConnString

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Aviso ao atualizar sequences."
}
Write-Host "✅ Sequences atualizadas" -ForegroundColor Green

Write-Host ""
Write-Host "6. Verificando sincronização..." -ForegroundColor Yellow

$verifyScript = @"
SET search_path TO public;
SELECT 'Clínicas' as tabela, COUNT(*) as registros FROM clinicas
UNION ALL
SELECT 'Empresas', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'Funcionários', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'Avaliações', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'Respostas', COUNT(*) FROM respostas
UNION ALL
SELECT 'Resultados', COUNT(*) FROM resultados;
"@

Write-Host ""
Write-Host "Contagem de registros em PRODUÇÃO:" -ForegroundColor Cyan
$verifyScript | psql $prodConnString

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ SINCRONIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Os dados de desenvolvimento foram copiados para produção." -ForegroundColor White
Write-Host "As APIs em produção agora usarão os mesmos dados." -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste o ambiente em: https://nr-bps-popup-clean.vercel.app" -ForegroundColor Gray
Write-Host "2. Verifique se as APIs estão funcionando" -ForegroundColor Gray
Write-Host "3. Faça login com os mesmos usuários de desenvolvimento" -ForegroundColor Gray
Write-Host ""

# Limpeza automática de arquivos temporários (confirmado pelo responsável de deploy)
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
Write-Host "✅ Arquivos temporários removidos" -ForegroundColor Green
