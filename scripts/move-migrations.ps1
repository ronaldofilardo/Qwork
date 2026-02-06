cd "c:/apps/QWork/database/migrations"
if (-not (Test-Path "archive")) {
    New-Item -ItemType Directory -Path "archive" -Force
}
Move-Item -Path "024_add_tipo_notificacao_laudo_emitido_automaticamente.sql" -Destination "archive/" -Force
Move-Item -Path "075_add_emissao_automatica_fix_flow.sql" -Destination "archive/" -Force
Move-Item -Path "082_generate_laudo_immediately_on_concluido.sql" -Destination "archive/" -Force
Move-Item -Path "150_remove_auto_emission_trigger.sql" -Destination "archive/" -Force
Move-Item -Path "151_remove_auto_laudo_creation_trigger.sql" -Destination "archive/" -Force
Move-Item -Path "152_add_tipo_notificacao_emissao_solicitada.sql" -Destination "archive/" -Force
Move-Item -Path "302_sanitize_auto_emission_aggressive.sql" -Destination "archive/" -Force
