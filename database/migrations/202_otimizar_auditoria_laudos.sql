-- Migration 202: Otimização robusta da tabela auditoria_laudos
-- Objetivo: Prevenir duplicações, otimizar buscas e garantir integridade de dados

-- =====================================================================
-- PARTE 1: ADICIONAR ÍNDICES PARA PERFORMANCE E EVITAR DUPLICAÇÕES
-- =====================================================================

-- Índice único para prevenir solicitações duplicadas no mesmo lote
-- Permite múltiplas ações diferentes, mas não duplicatas da mesma ação recente
-- Removido o filtro de tempo pois NOW() não é IMMUTABLE
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_laudos_unique_solicitation
ON auditoria_laudos (lote_id, acao, solicitado_por)
WHERE acao = 'solicitar_emissao' 
  AND status IN ('pendente', 'reprocessando');

COMMENT ON INDEX idx_auditoria_laudos_unique_solicitation IS 
'Previne solicitações duplicadas de emissão no mesmo lote enquanto status estiver pendente/reprocessando.';

-- Índice para buscar solicitações pendentes por lote (usado em listagens)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_laudos_pending_queue
ON auditoria_laudos (lote_id, status, acao, criado_em DESC)
WHERE status IN ('pendente', 'reprocessando', 'erro');

COMMENT ON INDEX idx_auditoria_laudos_pending_queue IS 
'Acelera busca de solicitações pendentes/erro na fila de processamento.';

-- Índice para buscar histórico de um lote específico
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditoria_laudos_lote_history
ON auditoria_laudos (lote_id, criado_em DESC)
INCLUDE (acao, status, emissor_cpf, observacoes);

COMMENT ON INDEX idx_auditoria_laudos_lote_history IS 
'Otimiza busca de histórico completo de auditoria por lote (include para evitar table lookup).';

-- =====================================================================
-- PARTE 2: ADICIONAR CHECK CONSTRAINTS PARA INTEGRIDADE
-- =====================================================================

-- Garantir que ações de solicitação manual tenham solicitante
-- Primeiro, atualizar registros existentes que violam a constraint
UPDATE auditoria_laudos
SET solicitado_por = emissor_cpf
WHERE acao IN ('solicitar_emissao', 'solicitacao_manual')
  AND solicitado_por IS NULL
  AND emissor_cpf IS NOT NULL;

-- Agora adicionar a constraint
ALTER TABLE auditoria_laudos
ADD CONSTRAINT chk_solicitation_has_requester
CHECK (
  (acao NOT IN ('solicitar_emissao', 'solicitacao_manual') OR solicitado_por IS NOT NULL)
);

COMMENT ON CONSTRAINT chk_solicitation_has_requester ON auditoria_laudos IS 
'Garante que solicitações manuais sempre tenham o CPF do solicitante registrado.';

-- Garantir que tipo_solicitante seja válido quando presente
ALTER TABLE auditoria_laudos
ADD CONSTRAINT chk_tipo_solicitante_valid
CHECK (
  tipo_solicitante IS NULL OR tipo_solicitante IN ('rh', 'gestor', 'admin', 'emissor')
);

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos IS 
'Valida tipos permitidos de solicitante.';

-- Garantir que status seja válido
ALTER TABLE auditoria_laudos
ADD CONSTRAINT chk_status_valid
CHECK (
  status IN ('pendente', 'processando', 'emitido', 'enviado', 'erro', 'reprocessando', 'cancelado')
);

COMMENT ON CONSTRAINT chk_status_valid ON auditoria_laudos IS 
'Garante que apenas status válidos sejam registrados.';

-- =====================================================================
-- PARTE 3: OTIMIZAR ÍNDICES EXISTENTES (REMOVER REDUNDÂNCIAS)
-- =====================================================================

-- O índice idx_auditoria_laudos_lote_acao é redundante com o novo idx_auditoria_laudos_lote_history
-- Vamos mantê-lo por ser mais específico para queries de lote+ação
-- Mas vamos remover idx_auditoria_laudos_lote que é coberto pelos outros

DROP INDEX IF EXISTS idx_auditoria_laudos_lote;

COMMENT ON INDEX idx_auditoria_laudos_lote_acao IS 
'Índice principal para queries que filtram por lote e ação específica.';

-- =====================================================================
-- PARTE 4: ADICIONAR FUNÇÃO DE LIMPEZA AUTOMÁTICA
-- =====================================================================

-- Função para limpar registros antigos de auditoria (manter histórico de 1 ano)
CREATE OR REPLACE FUNCTION limpar_auditoria_laudos_antiga()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM auditoria_laudos
  WHERE criado_em < NOW() - INTERVAL '1 year'
    AND status NOT IN ('erro', 'cancelado'); -- Manter erros para analise

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Limpeza de auditoria: % registros removidos', rows_deleted;
  
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpar_auditoria_laudos_antiga() IS 
'Remove registros de auditoria com mais de 1 ano (exceto erros). Executar mensalmente via cron.';

-- =====================================================================
-- PARTE 5: ANÁLISE E ESTATÍSTICAS
-- =====================================================================

-- Atualizar estatísticas da tabela para otimizar planos de query
ANALYZE auditoria_laudos;

-- Verificar saúde dos índices
REINDEX TABLE CONCURRENTLY auditoria_laudos;

-- =====================================================================
-- PARTE 6: DOCUMENTAÇÃO DE COLUNAS
-- =====================================================================

COMMENT ON COLUMN auditoria_laudos.lote_id IS 
'Referencia ao lote de avaliacao. FK com ON DELETE CASCADE.';

COMMENT ON COLUMN auditoria_laudos.acao IS 
'Acao executada: emissao_automatica, envio_automatico, solicitacao_manual, solicitar_emissao, reprocessamento_manual, etc.';

COMMENT ON COLUMN auditoria_laudos.status IS 
'Status do evento: pendente, processando, emitido, enviado, erro, reprocessando, cancelado.';

COMMENT ON COLUMN auditoria_laudos.solicitado_por IS 
'CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes manuais.';

COMMENT ON COLUMN auditoria_laudos.tipo_solicitante IS 
'Tipo do solicitante: rh, gestor, admin, emissor. Obrigatório quando solicitado_por preenchido.';

COMMENT ON COLUMN auditoria_laudos.tentativas IS 
'Contador de tentativas de processamento para retry logic. Default 0.';

COMMENT ON COLUMN auditoria_laudos.erro IS 
'Mensagem de erro detalhada quando processamento falha. NULL se bem-sucedido.';

-- =====================================================================
-- VALIDAÇÃO DA MIGRATION
-- =====================================================================

-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'auditoria_laudos'
ORDER BY indexname;

-- Verificar constraints criadas
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'auditoria_laudos'::regclass
ORDER BY conname;
