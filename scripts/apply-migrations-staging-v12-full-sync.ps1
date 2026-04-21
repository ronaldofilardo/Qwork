# ====================================================================
# APLICAR MIGRATIONS v12 NO BANCO STAGING — SYNC COMPLETO (600-1226)
# Data: 2026-04-21
# Branch: feature/v2
# Target: neondb_staging (Neon Cloud)
# ====================================================================
# Objetivo: Sincronizar STAGING (atualmente em 1008/1101-1145/9000-9001)
# com todas as migrations faltantes até 1226, preparando para 1227
#
# Estratégia:
# 1. Aplicar migration 600 (novo modelo comissionamento)
# 2. Aplicar migrations 601-1226 (ordem numérica)
# 3. Depois pode-se aplicar 1227 com segurança
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} elseif ($env:PGPASSWORD) {
    # já definido
} else {
    Write-Host "ERRO: Defina NEON_STAGING_PASSWORD ou PGPASSWORD." -ForegroundColor Red
    Write-Host "  Modo de uso: `$env:NEON_STAGING_PASSWORD = 'sua_senha'; .\apply-migrations-staging-v12-full-sync.ps1" -ForegroundColor Yellow
    exit 1
}

$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC STAGING v12 — Full Sync (600-1226)" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# Definir migrations a aplicar (em ordem, validadas como existentes)
$migrations = @(
    @{ file = "600_novo_modelo_comissionamento.sql"; desc = "Novo modelo comissionamento (percentual/custo_fixo)" }
    @{ file = "601_migrate_funcionarios_data.sql"; desc = "Migração dados funcionários" }
    @{ file = "602_fix_empresas_clientes.sql"; desc = "Fix empresas clientes" }
    @{ file = "603_recreate_funcionarios_views.sql"; desc = "Recriar views funcionários" }
    @{ file = "604_create_relationships_rls_policies.sql"; desc = "RLS policies relacionamentos" }
    @{ file = "605_remove_obsolete_fk_columns_from_funcionarios.sql"; desc = "Remove FK obsoletas" }
    @{ file = "605a_drop_dependencies_before_column_removal.sql"; desc = "Drop deps antes remover colunas" }
    @{ file = "606_fix_calcular_elegibilidade_lote_func.sql"; desc = "Fix calcular elegibilidade" }
    @{ file = "606_fix_calcular_elegibilidade_lote_func_utf8.sql"; desc = "Fix calcular elegibilidade UTF8" }
    @{ file = "607_force_recreate_calcular_elegibilidade_func.sql"; desc = "Recreate elegibilidade" }
    @{ file = "700_fix_trigger_criar_usuario_clinica_id.sql"; desc = "Fix trigger user clinica" }
    @{ file = "800_add_payment_flow_to_lotes.sql"; desc = "Add payment flow" }
    @{ file = "801_remove_expiracao_link_pagamento.sql"; desc = "Remove expiracao link" }
    @{ file = "802_fix_v_solicitacoes_emissao.sql"; desc = "Fix view solicitacoes" }
    @{ file = "900_simplificar_perfil_gestor.sql"; desc = "Simplificar perfil gestor" }
    @{ file = "1146_fix_auditoria_seq_desync.sql"; desc = "Fix auditoria seq desync" }
    @{ file = "1147_create_rate_limit_entries.sql"; desc = "Create rate limit entries" }
    @{ file = "1148_leads_asaas_wallet_id.sql"; desc = "Leads asaas wallet ID" }
    @{ file = "1149_importacao_templates.sql"; desc = "Importacao templates" }
    @{ file = "1200_taxa_manutencao_schema.sql"; desc = "Taxa manutenção schema" }
    @{ file = "1201_pagamentos_link_token.sql"; desc = "Pagamentos link token" }
    @{ file = "1202_audit_delecoes_tomador.sql"; desc = "Audit delecoes tomador" }
    @{ file = "1203_percentual_comissao_comercial.sql"; desc = "Percentual comissao comercial" }
    @{ file = "1204_custo_fixo_por_representante.sql"; desc = "Custo fixo por representante" }
    @{ file = "1204_remove_proposta_comercial_colunas.sql"; desc = "Remove proposta comercial" }
    @{ file = "1205_view_solicitacoes_emissao_modelo_comissao.sql"; desc = "View solicitacoes modelo comissao" }
    @{ file = "1206_fix_trg_reject_prohibited_roles_use_perfil.sql"; desc = "Fix trigger roles perfil" }
    @{ file = "1207_sync_v_solicitacoes_emissao_valor_negociado_vinculo.sql"; desc = "Sync view valor negociado" }
    @{ file = "1208_consolidar_view_emissao_custo_fixo.sql"; desc = "Consolidar view custo fixo" }
    @{ file = "1209_comissao_comercial_vinculos_pf_removal.sql"; desc = "Comissao comercial PF removal" }
    @{ file = "1210_view_emissao_add_percentual_comercial.sql"; desc = "View emissao percentual comercial" }
    @{ file = "1211_view_emissao_valor_total_coalesce.sql"; desc = "View emissao valor total coalesce" }
    @{ file = "1212_consolidar_comissoes_remove_sistema_antigo.sql"; desc = "Consolidar comissoes remove antigo" }
    @{ file = "1213_usuarios_asaas_wallet_id.sql"; desc = "Usuarios asaas wallet ID" }
    @{ file = "1214_add_gestor_comercial_cpf_representantes.sql"; desc = "Add gestor comercial CPF" }
    @{ file = "1215_criar_comercial_unico_cpf_22222222222.sql"; desc = "Criar comercial único CPF" }
    @{ file = "1215_sync_vinculos_comissao_schema.sql"; desc = "Sync vinculos comissao schema" }
    @{ file = "1216_criar_comercial_unico_prod_template.sql"; desc = "Criar comercial único PROD template" }
    @{ file = "1217_remove_rpa_legacy.sql"; desc = "Remove RPA legacy" }
    @{ file = "1218_rls_config_tables.sql"; desc = "RLS config tables" }
    @{ file = "1219_fix_rls_policies_rbac.sql"; desc = "Fix RLS policies RBAC" }
    @{ file = "1220_add_gestor_to_perfil_enum.sql"; desc = "Add gestor to perfil enum" }
    @{ file = "1221_add_isento_pagamento.sql"; desc = "Add isento pagamento" }
    @{ file = "1221_sociedade_financeira_beneficiarios.sql"; desc = "Sociedade financeira beneficiarios" }
    @{ file = "1222_sociedade_qwork_wallet_seed.sql"; desc = "Sociedade QWork wallet seed" }
    @{ file = "1223_status_lead_aprovado_rejeitado.sql"; desc = "Status lead aprovado rejeitado" }
    @{ file = "1224_remove_nf_comissoes_laudo.sql"; desc = "Remove NF comissoes laudo" }
    @{ file = "1225_drop_percentual_vendedor_leads_vinculos.sql"; desc = "Drop percentual vendedor leads" }
    @{ file = "1226_fix_constraint_comercial_pf.sql"; desc = "Fix constraint comercial PF" }
)

$errors = @()

# VERIFICAÇÃO PRÉ-APPLY: estado atual do staging
if (-not $DryRun) {
    Write-Host "Estado atual do banco (últimas 5 migrations):" -ForegroundColor Gray
    $checkCmd = @"
SELECT version, installed_on FROM schema_migrations ORDER BY installed_on DESC LIMIT 5;
"@
    $checkCmd | psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    Write-Host ""
}

# Aplicar migrations
foreach ($m in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $m.file
    if (-not (Test-Path $filePath)) {
        Write-Host "  [SKIP] $($m.file) — arquivo não encontrado" -ForegroundColor Yellow
        continue
    }

    Write-Host "  [$( if ($DryRun) { 'DRY' } else { 'RUN' } )] $($m.file)" -ForegroundColor White
    Write-Host "         $($m.desc)" -ForegroundColor Gray

    if (-not $DryRun) {
        $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERRO] Falha ao aplicar $($m.file)" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            $errors += $m.file
            # Continuar para tentar as outras migrations
        } else {
            Write-Host "  [ OK ] Aplicado com sucesso" -ForegroundColor Green
        }
    }
    Write-Host ""
}

Write-Host "====================================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  Dry-run concluido. $($migrations.Count) migrations listadas." -ForegroundColor Yellow
} elseif ($errors.Count -eq 0) {
    Write-Host "  ✅ CONCLUIDO: $($migrations.Count) migrations aplicadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ✓ STAGING agora sincronizado até migration 1226" -ForegroundColor Green
    Write-Host "  ✓ Próximo passo: executar migration 1227 (remove codigo fields)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Para aplicar 1227:" -ForegroundColor Cyan
    Write-Host "  `$env:NEON_STAGING_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    Write-Host "  .\scripts\apply-migrations-staging-v11.ps1" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠️  CONCLUIDO COM ERROS: $($errors.Count) migrations falharam:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "  Revise os erros acima. Algumas migrations podem depender de outras." -ForegroundColor Yellow
    exit 1
}

Write-Host "====================================================================" -ForegroundColor Cyan
