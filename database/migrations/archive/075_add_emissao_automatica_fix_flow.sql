-- ==========================================
-- MIGRATION 075: Corrigir Fluxo de Emissão Automática de Laudos
-- ==========================================
-- Descrição:
--   1. Adiciona campos de controle para emissão e envio separados
--   2. Implementa trigger para cancelamento automático quando todas avaliações inativadas
--   3. Refina lógica de transição para 'concluido' com emissão imediata
--   4. Adiciona índices e métricas para observabilidade
-- Data: 2026-01-05
-- Versão: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR CAMPOS DE CONTROLE
-- ==========================================

-- Adicionar campo emitido_em (marca quando PDF foi gerado)
ALTER TABLE lotes_avaliacao 
ADD COLUMN IF NOT EXISTS emitido_em TIMESTAMP WITH TIME ZONE;

-- Adicionar campo enviado_em (marca quando notificação foi enviada)
ALTER TABLE lotes_avaliacao 
ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP WITH TIME ZONE;

-- Adicionar campo cancelado_automaticamente
ALTER TABLE lotes_avaliacao 
ADD COLUMN IF NOT EXISTS cancelado_automaticamente BOOLEAN DEFAULT false;

-- Adicionar campo motivo_cancelamento
ALTER TABLE lotes_avaliacao 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

COMMENT ON COLUMN lotes_avaliacao.emitido_em IS 'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';
COMMENT ON COLUMN lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi enviado (notificação disparada)';
COMMENT ON COLUMN lotes_avaliacao.cancelado_automaticamente IS 'Indica se o lote foi cancelado automaticamente pelo sistema';
COMMENT ON COLUMN lotes_avaliacao.motivo_cancelamento IS 'Motivo do cancelamento automático';

-- ==========================================
-- 2. TRIGGER: CANCELAMENTO AUTOMÁTICO
-- ==========================================

-- Função para verificar se lote deve ser cancelado automaticamente
CREATE OR REPLACE FUNCTION verificar_cancelamento_automatico_lote()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_ativas INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliação que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se não tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- Só processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliações do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status != 'inativada') as ativas
  INTO
    v_total_avaliacoes,
    v_avaliacoes_inativadas,
    v_avaliacoes_ativas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se TODAS as avaliações foram inativadas, cancelar lote automaticamente
  IF v_avaliacoes_ativas = 0 AND v_avaliacoes_inativadas > 0 THEN
    UPDATE lotes_avaliacao
    SET 
      status = 'cancelado'::status_lote,
      cancelado_automaticamente = true,
      motivo_cancelamento = 'Todas as avaliações foram inativadas',
      auto_emitir_agendado = false,
      auto_emitir_em = NULL,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Garantir que só cancela se ainda estiver ativo
    
    RAISE NOTICE 'Lote % cancelado automaticamente: todas as % avaliações foram inativadas', 
      v_lote_id, v_avaliacoes_inativadas;
      
    -- Registrar notificação para admin
    INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
    VALUES (
      'lote_cancelado_auto',
      'Lote ' || v_lote_id || ' foi cancelado automaticamente porque todas as avaliações foram inativadas',
      v_lote_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS trg_verificar_cancelamento_automatico_lote ON avaliacoes;

-- Criar trigger que dispara APÓS UPDATE de status em avaliações
CREATE TRIGGER trg_verificar_cancelamento_automatico_lote
  AFTER UPDATE OF status ON avaliacoes
  FOR EACH ROW
  WHEN (NEW.status = 'inativada')
  EXECUTE FUNCTION verificar_cancelamento_automatico_lote();

COMMENT ON FUNCTION verificar_cancelamento_automatico_lote() IS 'Cancela automaticamente o lote quando todas as avaliações são inativadas';

-- ==========================================
-- 3. ATUALIZAR TRIGGER DE CONCLUSÃO DE LOTE
-- ==========================================

-- Atualizar função para marcar emissão imediata ao concluir
CREATE OR REPLACE FUNCTION verificar_conclusao_lote()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliação que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se não tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- Só processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliações do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO
    v_total_avaliacoes,
    v_avaliacoes_concluidas,
    v_avaliacoes_inativadas,
    v_avaliacoes_pendentes
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se todas as avaliações (exceto as inativadas) foram concluídas, marcar lote como concluído
  -- E agendar envio para 10 minutos depois (emissão será imediata via cron)
  IF v_avaliacoes_pendentes = 0 AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes AND v_avaliacoes_concluidas > 0 THEN
    UPDATE lotes_avaliacao
    SET 
      status = 'concluido'::status_lote,
      auto_emitir_agendado = true,
      auto_emitir_em = NOW() + INTERVAL '10 minutes',  -- Apenas para o ENVIO (emissão é imediata)
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Evitar update desnecessário
    
    RAISE NOTICE 'Lote % marcado como concluído e agendado para envio em 10 minutos: % concluídas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_conclusao_lote() IS 'Atualiza lote para concluído e agenda envio (emissão é imediata)';

-- ==========================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índice para buscar lotes prontos para emissão (status concluído e não emitido)
CREATE INDEX IF NOT EXISTS idx_lotes_pronto_emissao 
ON lotes_avaliacao (status, emitido_em) 
WHERE status = 'concluido' AND emitido_em IS NULL;

-- Índice para buscar lotes prontos para envio (emitido mas não enviado e auto_emitir_em vencido)
CREATE INDEX IF NOT EXISTS idx_lotes_pronto_envio 
ON lotes_avaliacao (emitido_em, enviado_em, auto_emitir_em) 
WHERE emitido_em IS NOT NULL AND enviado_em IS NULL;

-- Índice para monitoramento de cancelamentos automáticos
CREATE INDEX IF NOT EXISTS idx_lotes_cancelados_auto 
ON lotes_avaliacao (cancelado_automaticamente, status) 
WHERE cancelado_automaticamente = true;

-- ==========================================
-- 5. VIEWS PARA MONITORAMENTO
-- ==========================================

-- View para monitorar latências de emissão
DROP VIEW IF EXISTS vw_metricas_emissao_laudos;
CREATE OR REPLACE VIEW vw_metricas_emissao_laudos AS
SELECT
  la.id,
  
  la.status,
  la.liberado_em,
  la.atualizado_em as concluido_em,
  la.emitido_em,
  la.enviado_em,
  EXTRACT(EPOCH FROM (la.emitido_em - la.atualizado_em))::INTEGER as latencia_emissao_segundos,
  EXTRACT(EPOCH FROM (la.enviado_em - la.emitido_em))::INTEGER as latencia_envio_segundos,
  EXTRACT(EPOCH FROM (la.enviado_em - la.liberado_em))::INTEGER as latencia_total_segundos,
  la.auto_emitir_agendado,
  la.auto_emitir_em,
  la.cancelado_automaticamente,
  la.motivo_cancelamento,
  COALESCE(ec.nome, cont.nome) as entidade_nome
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
LEFT JOIN contratantes cont ON la.contratante_id = cont.id
WHERE la.status IN ('concluido', 'cancelado')
  OR la.emitido_em IS NOT NULL;

COMMENT ON VIEW vw_metricas_emissao_laudos IS 'Métricas de latência e status para monitoramento de emissão automática';

-- View para alertas (lotes com latência alta ou problemas)
DROP VIEW IF EXISTS vw_alertas_emissao_laudos;
CREATE OR REPLACE VIEW vw_alertas_emissao_laudos AS
SELECT
  la.id,
  
  la.status,
  CASE
    WHEN la.status = 'concluido' AND la.emitido_em IS NULL AND la.atualizado_em < NOW() - INTERVAL '5 minutes' THEN 'CRITICO: Lote concluído há mais de 5min sem emissão'
    WHEN la.emitido_em IS NOT NULL AND la.enviado_em IS NULL AND la.auto_emitir_em < NOW() - INTERVAL '5 minutes' THEN 'CRITICO: Lote emitido há mais de 5min sem envio'
    WHEN la.auto_emitir_agendado = true AND la.status = 'ativo' AND la.auto_emitir_em < NOW() THEN 'AVISO: Lote ativo com auto_emitir_em vencido'
    ELSE 'OK'
  END as tipo_alerta,
  la.atualizado_em as concluido_em,
  la.emitido_em,
  la.enviado_em,
  la.auto_emitir_em,
  EXTRACT(EPOCH FROM (NOW() - la.atualizado_em))::INTEGER as idade_conclusao_segundos,
  COALESCE(ec.nome, cont.nome) as entidade_nome
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
LEFT JOIN contratantes cont ON la.contratante_id = cont.id
WHERE (
  (la.status = 'concluido' AND la.emitido_em IS NULL)
  OR (la.emitido_em IS NOT NULL AND la.enviado_em IS NULL)
  OR (la.auto_emitir_agendado = true AND la.status = 'ativo' AND la.auto_emitir_em < NOW())
);

COMMENT ON VIEW vw_alertas_emissao_laudos IS 'Alertas de lotes com problemas no fluxo de emissão automática';

-- ==========================================
-- 6. FUNÇÃO AUXILIAR DE DIAGNÓSTICO
-- ==========================================

CREATE OR REPLACE FUNCTION diagnosticar_lote_emissao(p_lote_id INTEGER)
RETURNS TABLE(
  campo TEXT,
  valor TEXT,
  status_ok BOOLEAN,
  mensagem TEXT
) AS $$
DECLARE
  v_lote RECORD;
  v_avaliacoes RECORD;
BEGIN
  -- Buscar dados do lote
  SELECT * INTO v_lote FROM lotes_avaliacao WHERE id = p_lote_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'lote'::TEXT, 'NOT_FOUND'::TEXT, false, 'Lote não encontrado'::TEXT;
    RETURN;
  END IF;

  -- Buscar estatísticas de avaliações
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO v_avaliacoes
  FROM avaliacoes WHERE lote_id = p_lote_id;

  -- Retornar diagnóstico
  RETURN QUERY SELECT 'status'::TEXT, v_lote.status::TEXT, true, 'Status do lote'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_total'::TEXT, v_avaliacoes.total::TEXT, v_avaliacoes.total > 0, 'Total de avaliações'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_concluidas'::TEXT, v_avaliacoes.concluidas::TEXT, v_avaliacoes.concluidas > 0, 'Avaliações concluídas'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_pendentes'::TEXT, v_avaliacoes.pendentes::TEXT, v_avaliacoes.pendentes = 0, 'Avaliações pendentes'::TEXT;
  RETURN QUERY SELECT 'emitido_em'::TEXT, COALESCE(v_lote.emitido_em::TEXT, 'NULL'), v_lote.emitido_em IS NOT NULL, 'Data de emissão'::TEXT;
  RETURN QUERY SELECT 'enviado_em'::TEXT, COALESCE(v_lote.enviado_em::TEXT, 'NULL'), v_lote.enviado_em IS NOT NULL, 'Data de envio'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_agendado'::TEXT, v_lote.auto_emitir_agendado::TEXT, v_lote.auto_emitir_agendado, 'Flag de agendamento'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_em'::TEXT, COALESCE(v_lote.auto_emitir_em::TEXT, 'NULL'), v_lote.auto_emitir_em IS NOT NULL, 'Data agendada'::TEXT;
  RETURN QUERY SELECT 'cancelado_auto'::TEXT, COALESCE(v_lote.cancelado_automaticamente::TEXT, 'false'), NOT COALESCE(v_lote.cancelado_automaticamente, false), 'Cancelamento automático'::TEXT;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION diagnosticar_lote_emissao(INTEGER) IS 'Função de diagnóstico para depuração de problemas de emissão';

COMMIT;
