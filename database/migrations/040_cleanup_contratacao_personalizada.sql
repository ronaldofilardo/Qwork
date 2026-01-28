-- ==========================================
-- MIGRAÇÃO 040: LIMPEZA DE CONTRATACAO_PERSONALIZADA
-- Data: 22/12/2025
-- Descrição: Remove toda infraestrutura obsoleta relacionada a contratacao_personalizada
-- ==========================================

BEGIN;

-- 1. Remover funções obsoletas
DROP FUNCTION IF EXISTS atualizar_contratacao_personalizada_timestamp CASCADE;
DROP FUNCTION IF EXISTS verificar_acesso_contratacao_personalizada CASCADE;
DROP FUNCTION IF EXISTS validar_transicao_contratacao_personalizada CASCADE;
DROP FUNCTION IF EXISTS criar_contrato_para_contratacao CASCADE;
DROP FUNCTION IF EXISTS trg_after_update_sincronizar_contratacao_personalizada CASCADE;
DROP FUNCTION IF EXISTS registrar_transicao_estado_personalizada CASCADE;
DROP FUNCTION IF EXISTS validar_transicao_estado_personalizada CASCADE;
DROP FUNCTION IF EXISTS notificar_pre_cadastro_criado CASCADE;
DROP FUNCTION IF EXISTS notificar_valor_definido CASCADE;
DROP FUNCTION IF EXISTS registrar_alteracao_valor CASCADE;
DROP FUNCTION IF EXISTS liberar_login_para_contratante CASCADE;

-- 2. Remover tabelas de histórico obsoletas
DROP TABLE IF EXISTS historico_transicoes_personalizadas CASCADE;
DROP TABLE IF EXISTS historico_alteracoes_valores CASCADE;

-- 3. Remover tabela principal
DROP TABLE IF EXISTS contratacao_personalizada CASCADE;

-- 4. Garantir que contratos tem a coluna conteudo_gerado
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS conteudo_gerado TEXT;

-- 5. Comentários
COMMENT ON TABLE contratos IS 'Contratos gerados para contratantes. Fluxo simplificado sem tabelas intermediárias.';
COMMENT ON COLUMN contratos.conteudo_gerado IS 'Conteúdo completo do contrato gerado para o contratante';

COMMIT;
