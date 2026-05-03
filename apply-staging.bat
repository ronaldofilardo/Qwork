@echo off
set CONN=postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require
echo Applying 1230_fix_prevent_modification...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1230_fix_prevent_modification_allow_finalizacao.sql" 2>&1
echo EXIT: %ERRORLEVEL%
echo Applying 1231_fix_prevent_lote...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1231_fix_prevent_lote_mutation_trigger.sql" 2>&1
echo EXIT: %ERRORLEVEL%
echo Applying 1231_fix_taxa...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1231_fix_taxa_transacao.sql" 2>&1
echo EXIT: %ERRORLEVEL%
echo Applying 1232_fix_audit...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1232_fix_audit_lote_change_user_cpf_fallback.sql" 2>&1
echo EXIT: %ERRORLEVEL%
echo Applying 1234_nivel_cargo...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1234_nivel_cargo_segregado_por_empresa_view.sql" 2>&1
echo EXIT: %ERRORLEVEL%
echo Applying 1235_remove_planos...
psql "%CONN%" -v ON_ERROR_STOP=1 -f "database\migrations\1235_remove_planos_legacy_tables.sql" 2>&1
echo EXIT: %ERRORLEVEL%
