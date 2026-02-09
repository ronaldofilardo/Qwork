-- Desabilitar triggers obsoletas que impedem fluxo contract-first
-- Data: 2025-12-24
-- Contexto: Fluxo contract-first não usa contrato_id na tabela tomadores
--           Status transitions precisam ser flexíveis durante desenvolvimento

-- PROBLEMA 1: Trigger que valida transições de status antigas
-- Impedia mudança de 'aprovado' → 'aguardando_pagamento'
DROP TRIGGER IF EXISTS trg_validar_transicao_status ON tomadores;
DROP FUNCTION IF EXISTS validar_transicao_status_contratante();

-- PROBLEMA 2: Trigger que sincroniza status baseado em contrato_aceito/contrato_id
-- Ambas colunas removidas no novo modelo
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa ON tomadores;
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa_payment_first ON tomadores;

-- Verificar triggers restantes
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgrelid::regclass::text = 'tomadores'
  AND tgname NOT LIKE 'RI_%'
  AND tgenabled = 'O';
