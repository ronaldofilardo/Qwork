-- Desabilitar triggers obsoletas que impedem fluxo contract-first
-- Data: 2025-12-24
-- Contexto: Fluxo contract-first não usa contrato_id na tabela contratantes
--           Status transitions precisam ser flexíveis durante desenvolvimento

-- PROBLEMA 1: Trigger que valida transições de status antigas
-- Impedia mudança de 'aprovado' → 'aguardando_pagamento'
DROP TRIGGER IF EXISTS trg_validar_transicao_status ON contratantes;
DROP FUNCTION IF EXISTS validar_transicao_status_contratante();

-- PROBLEMA 2: Trigger que sincroniza status baseado em contrato_aceito/contrato_id
-- Ambas colunas removidas no novo modelo
DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa ON contratantes;
DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa_payment_first ON contratantes;

-- Verificar triggers restantes
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgrelid::regclass::text = 'contratantes'
  AND tgname NOT LIKE 'RI_%'
  AND tgenabled = 'O';
