# ====================================================================
# APLICAR MIGRATIONS v3 NO BANCO STAGING — SYNC COMPLETO
# Data: 31/03/2026
# Branch: staging (espelho de feature/v2)
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica TODAS as migrations necessárias para sincronizar
# o staging com o DEV. Inclui as migrations do v2 e todas as novas.
# Migrations idempotentes são seguras para re-executar.
# Não-idempotentes podem falhar com "already exists" — OK.
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "npg_J2QYqn5oxCzp"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

$env:PGPASSWORD = $NEON_PASSWORD

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC COMPLETO STAGING v3 (neondb_staging)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# Lista COMPLETA E ORDENADA de todas as migrations necessárias
# Inclui v2 (re-run seguro) + todas as novas
# ====================================================================
$migrations = @(
    # ---- Segurança/Cleanup (legado) ----
    "211_fix_security_critical.sql",
    "308_remove_perfil_cadastro_super_legado.sql",
    "309_emissor_granular_rls_laudos.sql",

    # ---- Comissionamento (500-510) ----
    "500_sistema_comissionamento.sql",
    "501_add_valor_servico_lotes_avaliacao.sql",
    "501_recreate_views.sql",
    "502_ajustes_comissionamento.sql",
    "503_percentual_comissao_por_representante.sql",
    "504_view_only.sql",
    "504_vinculos_comissao_suporte_clinica.sql",
    "505_corrigir_vinculos_comissao_constraint.sql",
    "505_status_comissao_revision.sql",
    "505_comissoes_laudo_suporte_clinica.sql",
    "506_comissoes_fixes_e_retroativas.sql",
    "510_representante_login_unificado.sql",

    # ---- Representantes (520-528) ----
    "520_representante_convites_senha.sql",
    "521_dados_bancarios_status.sql",
    "522_fix_view_solicitacoes_emissao_entidade.sql",
    "523_lead_valor_negociado.sql",
    "524_v_solicitacoes_emissao_valor_negociado.sql",
    "525_fix_view_solicitacoes_emissao_entidade_v2.sql",
    "526_representantes_aceites_politica.sql",
    "526_vinculos_comissao_valor_negociado.sql",
    "527_representantes_aceites_politica_prod.sql",
    "528_primeira_senha_grandfathering.sql",

    # ---- Parcelamento / Vendedores (530-536) ----
    "530_comissoes_parcelamento.sql",
    "531_comissoes_geradas_count.sql",
    "531_drop_lote_rep_unico_index.sql",
    "532_parcela_confirmada_em.sql",
    "533_remove_planos_system.sql",
    "534_create_vendedores_perfil.sql",
    "535_create_vendedores_dados_bancarios.sql",
    "536_hierarquia_comercial_1to1.sql",

    # ---- Funcionários Relationships (600) ----
    "600_representantes_cadastro_leads.sql",
    "600_create_funcionarios_relationships.sql",
    "600b_fix_funcionarios_clinicas_add_clinica_id.sql",
    "601_migrate_funcionarios_data.sql",
    "602_fix_empresas_clientes.sql",
    "603_recreate_funcionarios_views.sql",
    "604_create_relationships_rls_policies.sql",
    "605a_drop_dependencies_before_column_removal.sql",
    "605_remove_obsolete_fk_columns_from_funcionarios.sql",
    "606_fix_calcular_elegibilidade_lote_func.sql",
    "606_fix_calcular_elegibilidade_lote_func_utf8.sql",
    "607_force_recreate_calcular_elegibilidade_func.sql",

    # ---- Triggers / Pagamento / Perfis (700-900) ----
    "700_fix_trigger_criar_usuario_clinica_id.sql",
    "800_add_payment_flow_to_lotes.sql",
    "801_remove_expiracao_link_pagamento.sql",
    "802_fix_v_solicitacoes_emissao.sql",
    "900_simplificar_perfil_gestor.sql",

    # ---- Fixes e Sync (1000-1015) ----
    "1000_adicionar_constraints_tipo.sql",
    "1000_create_importacoes_clinica.sql",
    "1000_religar_gestores_desconectados.sql",
    "1000_reverter_status_avaliacao_para_concluida.sql",
    "1000_sync_prod_from_dev.sql",
    "1001_estrutura_roles_e_imutabilidade.sql",
    "1001_fix_audit_lote_user_cpf.sql",
    "1002_rastreabilidade_emissao_manual.sql",
    "1003_fix_contratante_id_funcionarios.sql",
    "1003_fix_fn_reservar_id_laudo.sql",
    "1004_add_usuario_tipo_to_funcionarios.sql",
    "1004_auto_recalc_lote_status.sql",
    "1004_fix_fn_reservar_laudo_status_rascunho.sql",
    "1005_create_missing_recalc_function.sql",
    "1005_fix_enum_rascunho_values.sql",
    "1005b_fix_all_laudos_fk.sql",
    "1006_fix_laudos_status_check.sql",
    "1006_sync_prod_schema_cleanup.sql",
    "1007_add_arquivo_remoto_metadata.sql",
    "1007_fix_validar_sessao_rls_variable.sql",
    "1008_add_entidade_id_to_lotes_avaliacao.sql",
    "1008b_fix_entidade_segregation.sql",
    "1009_fix_prevent_mutation_function_prod.sql",
    "1010_consolidar_correcao_prevent_mutation_functions.sql",
    "1011_fix_audit_lote_remove_processamento_em.sql",
    "1012_create_confirmacao_identidade.sql",
    "1013_make_confirmacao_identidade_avaliacao_id_nullable.sql",
    "1014_remove_trigger_auditoria_confirmacao_identidade.sql",
    "1015_populate_missing_funcionarios_entidades.sql",

    # ---- Sync Prod / Refactoring (1016-1017) ----
    "1016_sync_prod_dois_fluxos_distintos.sql",
    "1017_fn_cpf_em_uso_cross_table.sql",
    "1017_rename_contratante_id_to_tomador_id.sql",

    # ---- Compat Views / Novos Perfis (1018-1030) ----
    "1018_compat_views_tomadors.sql",
    "1019_drop_compat_views_tomadors.sql",
    "1020_enforce_lotes_owner_segregation.sql",
    "1021_fix_trigger_allow_finalizado_after_upload.sql",
    "1022_novos_perfis.sql",
    "1023_hierarquia_comercial.sql",
    "1024_vendedor_leads.sql",
    "1025_add_telefone_to_usuarios.sql",
    "1027_add_observacoes_to_leads_representante.sql",
    "1028_fix_rls_vendedor_leads.sql",
    "1029_notificacoes_comercial.sql",
    "1030_add_data_fim_hierarquia_comercial.sql",

    # ---- Features Recentes (1100-1133) ----
    "1100_fix_premature_laudo_creation.sql",
    "1101_add_file_columns_to_empresas_clientes.sql",
    "1102_add_arquivo_remoto_to_cadastros.sql",
    "1102b_add_arquivo_remoto_columns_safe.sql",
    "1103_add_job_fields_to_vinculo_tables.sql",
    "1104_update_elegibilidade_per_vinculo.sql",
    "1105_rls_avaliacoes_rh_fix.sql",
    "1106_trigger_indice_per_vinculo.sql",
    "1107_representantes_senhas.sql",
    "1108_vendedores_convite_aceites.sql",
    "1109_grandfathering_primeiro_acesso.sql",
    "1110_leads_tipo_cliente_aprovacao.sql",
    "1111_representante_vendedor_direto.sql",
    "1120_comissao_split_leads.sql",
    "1121_comissao_split_vinculos.sql",
    "1122_comissao_laudo_vendedor.sql",
    "1123_deprecar_percentual_global.sql",
    "1124_fechamento_mensal_comissoes.sql",
    "1125_num_vidas_estimado.sql",
    "1126_vendedores_tipo_pessoa_e_docs.sql",
    "1127_importacoes_clinica.sql",
    "1128_sequential_codigo_representante_vendedor.sql",
    "1129_entidade_configuracoes.sql",
    "1129_limpeza_estruturas_legadas.sql",
    "1130_hotfix_view_e_coluna_producao.sql",
    "1130_politica_70_porcento_emissao.sql",
    "1131_add_link_disponibilizado_em_e_tipo_notificacao.sql",
    "1132_rls_universal_suporte_comercial_vendedor.sql",
    "1133_avaliacoes_confirmacao_identificacao.sql",

    # ---- Fixes auxiliares ----
    "fix_audit_function_cpf.sql",
    "DEV_SYNC_505_506.sql"
)

Write-Host "Total de migrations: $($migrations.Count)" -ForegroundColor Yellow
Write-Host "Banco: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host ""

$success = 0
$failed = 0
$skipped = 0
$warnings = 0
$errors = @()
$warningList = @()

foreach ($migration in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $migration

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $migration (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $migration" -ForegroundColor Cyan
        continue
    }

    Write-Host "  >> Aplicando: $migration..." -ForegroundColor Cyan -NoNewline

    # Redirecionar stderr para capturá-lo
    $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        # Verificar se há erros no output mesmo com exit code 0
        $hasError = $output | Where-Object { $_ -match "^ERROR:" }
        if ($hasError) {
            # Erros de "already exists" ou "does not exist" não são fatais
            $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop" }
            if ($isAlreadyExists) {
                Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
                $warnings++
                $warningList += $migration
            } else {
                Write-Host " ERRO (exit=0)" -ForegroundColor Red
                $outputStr = ($output | Where-Object { $_ -match "ERROR:" }) -join " | "
                Write-Host "     $outputStr" -ForegroundColor DarkRed
                $failed++
                $errors += $migration
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $success++
        }
    } else {
        # Exit code != 0 — pode ser erro real ou constraint duplicada
        $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop|violates" }
        if ($isAlreadyExists) {
            Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
            $warnings++
            $warningList += $migration
        } else {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = ($output | Where-Object { $_ -match "ERROR:|psql:" }) -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $migration
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Resultado:" -ForegroundColor White
Write-Host "  OK Sucesso:   $success" -ForegroundColor Green
Write-Host "  WARN (skip):  $warnings" -ForegroundColor Yellow
Write-Host "  ERRO:         $failed" -ForegroundColor Red
Write-Host "  Skip (N/A):   $skipped" -ForegroundColor Gray

if ($warningList.Count -gt 0) {
    Write-Host ""
    Write-Host "  Warnings (ja aplicadas, OK):" -ForegroundColor Yellow
    $warningList | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com ERRO (requer atencao):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING SINCRONIZADO COM DEV!" -ForegroundColor Green
    Write-Host "URL: https://staging.qwork.app.br" -ForegroundColor Cyan
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima. Warnings sao normais (ja aplicadas)." -ForegroundColor Yellow
}
Write-Host ""
