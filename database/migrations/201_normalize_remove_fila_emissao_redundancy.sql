-- ==========================================
-- MIGRATION 201: Normalização e Remoção de Redundância
-- Descrição: Remove redundância entre fila_emissao e auditoria_laudos
--            Consolidando informações na tabela auditoria_laudos
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- ANÁLISE PRÉ-MIGRAÇÃO
-- ==========================================

-- Esta migration vai:
-- 1. Migrar dados de fila_emissao para auditoria_laudos
-- 2. Adicionar campos necessários em auditoria_laudos
-- 3. Deprecar (não dropar ainda) fila_emissao
-- 4. Criar views para compatibilidade

-- ==========================================
-- 1. BACKUP DE SEGURANÇA
-- ==========================================

-- Criar tabela de backup antes de qualquer alteração
CREATE TABLE IF NOT EXISTS _backup_fila_emissao_20260204 AS
SELECT * FROM fila_emissao;

COMMENT ON TABLE _backup_fila_emissao_20260204 IS
'Backup da tabela fila_emissao antes da migration 201 - Pode ser removido após validação';

-- ==========================================
-- 2. ESTENDER auditoria_laudos
-- ==========================================

-- Adicionar campos para rastrear solicitação de emissão
ALTER TABLE auditoria_laudos
ADD COLUMN IF NOT EXISTS solicitado_por VARCHAR(11),
ADD COLUMN IF NOT EXISTS tipo_solicitante VARCHAR(20),
ADD COLUMN IF NOT EXISTS tentativas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS erro TEXT;

-- Criar índice para buscar por solicitante
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_solicitado_por
ON auditoria_laudos(solicitado_por);

-- ==========================================
-- 3. MIGRAR DADOS DE fila_emissao PARA auditoria_laudos
-- ==========================================

-- Inserir registros de solicitação de emissão na auditoria
INSERT INTO auditoria_laudos (
  lote_id,
  acao,
  status,
  solicitado_por,
  tipo_solicitante,
  tentativas,
  erro,
  criado_em
)
SELECT 
  fe.lote_id,
  'solicitar_emissao' as acao,
  CASE 
    WHEN fe.tentativas >= fe.max_tentativas THEN 'falha'
    WHEN fe.tentativas > 0 THEN 'reprocessando'
    ELSE 'pendente'
  END as status,
  fe.solicitado_por,
  fe.tipo_solicitante,
  fe.tentativas,
  fe.erro,
  fe.criado_em
FROM fila_emissao fe
WHERE NOT EXISTS (
  -- Evitar duplicatas se migration rodar múltiplas vezes
  SELECT 1 FROM auditoria_laudos al
  WHERE al.lote_id = fe.lote_id
    AND al.acao = 'solicitar_emissao'
    AND al.criado_em = fe.criado_em
);

-- ==========================================
-- 4. CRIAR VIEW DE COMPATIBILIDADE
-- ==========================================

-- View para manter compatibilidade com código que ainda usa fila_emissao
CREATE OR REPLACE VIEW v_fila_emissao AS
SELECT 
  al.id,
  al.lote_id,
  al.tentativas,
  3 as max_tentativas, -- Valor padrão
  al.criado_em as proxima_tentativa,
  al.erro,
  al.criado_em,
  al.criado_em as atualizado_em,
  al.solicitado_por,
  al.tipo_solicitante,
  al.criado_em as solicitado_em
FROM auditoria_laudos al
WHERE al.acao = 'solicitar_emissao'
  AND al.status IN ('pendente', 'reprocessando')
ORDER BY al.criado_em ASC;

COMMENT ON VIEW v_fila_emissao IS
'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';

-- ==========================================
-- 5. DEPRECAR (NÃO DROPAR) fila_emissao
-- ==========================================

-- Renomear tabela para indicar que está deprecated
-- (não dropar ainda para permitir rollback seguro)
ALTER TABLE fila_emissao RENAME TO _deprecated_fila_emissao;

COMMENT ON TABLE _deprecated_fila_emissao IS
'DEPRECATED - Use auditoria_laudos ou v_fila_emissao. Esta tabela será removida em migration futura.';

-- ==========================================
-- 6. CRIAR FUNÇÃO HELPER PARA BUSCAR SOLICITAÇÕES
-- ==========================================

CREATE OR REPLACE FUNCTION fn_obter_solicitacao_emissao(p_lote_id INTEGER)
RETURNS TABLE (
  lote_id INTEGER,
  solicitado_por VARCHAR(11),
  tipo_solicitante VARCHAR(20),
  solicitado_em TIMESTAMP,
  tentativas INTEGER,
  erro TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.lote_id,
    al.solicitado_por,
    al.tipo_solicitante,
    al.criado_em as solicitado_em,
    al.tentativas,
    al.erro
  FROM auditoria_laudos al
  WHERE al.lote_id = p_lote_id
    AND al.acao = 'solicitar_emissao'
  ORDER BY al.criado_em DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_obter_solicitacao_emissao IS
'Busca a última solicitação de emissão para um lote específico';

-- ==========================================
-- 7. ATUALIZAR TRIGGERS E FUNCTIONS
-- ==========================================

-- Criar trigger para garantir que solicitação seja registrada
CREATE OR REPLACE FUNCTION fn_registrar_solicitacao_emissao()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando lote muda para 'emissao_solicitada', registrar na auditoria
  IF OLD.status != 'emissao_solicitada' AND NEW.status = 'emissao_solicitada' THEN
    -- Verificar se já existe registro recente (últimos 5 minutos)
    IF NOT EXISTS (
      SELECT 1 FROM auditoria_laudos
      WHERE lote_id = NEW.id
        AND acao = 'solicitar_emissao'
        AND criado_em > NOW() - INTERVAL '5 minutes'
    ) THEN
      INSERT INTO auditoria_laudos (
        lote_id,
        acao,
        status,
        criado_em
      ) VALUES (
        NEW.id,
        'solicitar_emissao',
        'pendente',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrar_solicitacao_emissao ON lotes_avaliacao;

CREATE TRIGGER trg_registrar_solicitacao_emissao
  AFTER UPDATE OF status ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION fn_registrar_solicitacao_emissao();

-- ==========================================
-- 8. ADICIONAR COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN auditoria_laudos.solicitado_por IS
'CPF do usuário que solicitou a emissão (RH ou Entidade)';

COMMENT ON COLUMN auditoria_laudos.tipo_solicitante IS
'Tipo do solicitante: rh ou gestor_entidade';

COMMENT ON COLUMN auditoria_laudos.tentativas IS
'Número de tentativas de processamento (para retry)';

COMMENT ON COLUMN auditoria_laudos.erro IS
'Mensagem de erro se processamento falhou';

-- ==========================================
-- 9. VALIDAR MIGRAÇÃO
-- ==========================================

-- Verificar se todos os registros foram migrados
DO $$
DECLARE
  count_fila INTEGER;
  count_auditoria INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_fila FROM _deprecated_fila_emissao;
  
  SELECT COUNT(*) INTO count_auditoria 
  FROM auditoria_laudos 
  WHERE acao = 'solicitar_emissao';
  
  IF count_auditoria < count_fila THEN
    RAISE WARNING 'Possível perda de dados: fila_emissao tinha % registros, auditoria_laudos tem %',
      count_fila, count_auditoria;
  ELSE
    RAISE NOTICE 'Migração bem-sucedida: % registros migrados', count_auditoria;
  END IF;
END $$;

COMMIT;

-- ==========================================
-- ROLLBACK (se necessário)
-- ==========================================

/*
BEGIN;

-- Restaurar fila_emissao
ALTER TABLE _deprecated_fila_emissao RENAME TO fila_emissao;

-- Remover campos adicionados
ALTER TABLE auditoria_laudos
DROP COLUMN IF EXISTS solicitado_por,
DROP COLUMN IF EXISTS tipo_solicitante,
DROP COLUMN IF EXISTS tentativas,
DROP COLUMN IF EXISTS erro;

-- Remover view
DROP VIEW IF EXISTS v_fila_emissao;

-- Remover função
DROP FUNCTION IF EXISTS fn_obter_solicitacao_emissao;

-- Remover trigger
DROP TRIGGER IF EXISTS trg_registrar_solicitacao_emissao ON lotes_avaliacao;
DROP FUNCTION IF EXISTS fn_registrar_solicitacao_emissao;

-- Remover backup
DROP TABLE IF EXISTS _backup_fila_emissao_20260204;

-- Remover migração
DELETE FROM _migrations WHERE version = 201;

COMMIT;
*/

-- ==========================================
-- LIMPEZA FUTURA (executar após validação em produção)
-- ==========================================

/*
-- Após 30 dias de validação em produção, executar:
BEGIN;

DROP TABLE IF EXISTS _deprecated_fila_emissao;
DROP TABLE IF EXISTS _backup_fila_emissao_20260204;

COMMIT;
*/
