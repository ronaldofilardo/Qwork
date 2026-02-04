-- Migration 164: REMOÇÃO DEFINITIVA - Código/Título de Lote e Modo Emergência
-- Data: 2026-02-03
-- Descrição: Remove COMPLETAMENTE do sistema:
--   1. Campos codigo e titulo da tabela lotes_avaliacao
--   2. Campos modo_emergencia e motivo_emergencia (se ainda existirem)
--   3. Atualiza todas triggers, views e funções que referenciem esses campos
--   4. Mantém apenas IDs alinhados entre lotes_avaliacao e laudos

-- IMPORTANTE: Esta migração é DESTRUTIVA e IRREVERSÍVEL

BEGIN;

-- ============================================================================
-- PARTE 1: REMOVER CAMPOS DA TABELA LOTES_AVALIACAO
-- ============================================================================

ALTER TABLE lotes_avaliacao 
  DROP COLUMN IF EXISTS codigo CASCADE,
  DROP COLUMN IF EXISTS titulo CASCADE,
  DROP COLUMN IF EXISTS modo_emergencia CASCADE,
  DROP COLUMN IF EXISTS motivo_emergencia CASCADE;

COMMENT ON TABLE lotes_avaliacao IS 'Lotes de avaliação - identificação apenas por ID (alinhado com laudos.id)';

-- ============================================================================
-- PARTE 2: ATUALIZAR VIEW V_AUDITORIA_EMISSOES
-- ============================================================================

DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE;

CREATE OR REPLACE VIEW v_auditoria_emissoes AS
SELECT 
    la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.processamento_em,
    la.criado_em AS lote_criado_em,
    ec.nome AS empresa_nome,
    ec.cnpj AS empresa_cnpj,
    c.nome AS clinica_nome,
    COUNT(DISTINCT a.id) AS total_avaliacoes,
    COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) AS avaliacoes_concluidas,
    l.hash_pdf,
    l.arquivo_remoto_url,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
FROM lotes_avaliacao la
JOIN empresas_clientes ec ON la.empresa_id = ec.id
JOIN clinicas c ON ec.clinica_id = c.id
LEFT JOIN avaliacoes a ON la.id = a.lote_id
LEFT JOIN laudos l ON la.id = l.lote_id
GROUP BY 
    la.id,
    la.empresa_id,
    la.numero_ordem,
    la.status,
    la.emitido_em,
    la.enviado_em,
    la.processamento_em,
    la.criado_em,
    ec.nome,
    ec.cnpj,
    c.nome,
    l.hash_pdf,
    l.arquivo_remoto_url,
    l.enviado_em,
    l.emitido_em;

COMMENT ON VIEW v_auditoria_emissoes IS 'View de auditoria de emissões de laudos - ID-only (sem codigo/titulo/emergencia)';

-- ============================================================================
-- PARTE 3: RECRIAR TRIGGER AUDIT_LOTE_CHANGE SEM CAMPOS REMOVIDOS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_lote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      COALESCE(current_setting('app.client_ip', true), 'unknown')
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudanças significativas (excluindo campos removidos)
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em OR
       OLD.processamento_em IS DISTINCT FROM NEW.processamento_em THEN
      
      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        COALESCE(current_setting('app.current_user_cpf', true), 'system'),
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
          'processamento_em', NEW.processamento_em,
          'mudancas', jsonb_build_object(
            'status_anterior', OLD.status,
            'status_novo', NEW.status
          )
        ),
        COALESCE(current_setting('app.client_ip', true), 'unknown')
      );
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      COALESCE(current_setting('app.client_ip', true), 'unknown')
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS audit_lotes_avaliacao ON lotes_avaliacao;
CREATE TRIGGER audit_lotes_avaliacao
  AFTER INSERT OR UPDATE OR DELETE ON lotes_avaliacao
  FOR EACH ROW EXECUTE FUNCTION audit_lote_change();

COMMENT ON FUNCTION audit_lote_change() IS 'Trigger de auditoria para lotes - ID-only (sem codigo/titulo/emergencia)';

-- ============================================================================
-- PARTE 4: LIMPAR AUDIT_LOGS DE REFERÊNCIAS ANTIGAS
-- ============================================================================

-- Remover registros de auditoria relacionados a emergência e codigo
DELETE FROM audit_logs 
WHERE action IN (
    'modo_emergencia_ativado', 
    'emissao_emergencial', 
    'emergencia_laudo',
    'codigo_lote_atualizado'
  )
  OR details::text LIKE '%modo_emergencia%'
  OR details::text LIKE '%motivo_emergencia%'
  OR details::text LIKE '%"codigo":%'
  OR details::text LIKE '%lote_codigo%';

COMMENT ON TABLE audit_logs IS 'Logs de auditoria - removidos registros de emergência e codigo/titulo de lote (2026-02-03)';

-- ============================================================================
-- PARTE 5: VALIDAR INTEGRIDADE ID LOTE = ID LAUDO
-- ============================================================================

-- Verificar se há laudos com IDs diferentes dos lotes (não deveria haver)
DO $$
DECLARE
  count_mismatch INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_mismatch
  FROM laudos l
  WHERE l.id != l.lote_id;
  
  IF count_mismatch > 0 THEN
    RAISE WARNING 'ATENÇÃO: Existem % laudos com ID diferente do lote_id. Revisar manualmente.', count_mismatch;
  ELSE
    RAISE NOTICE 'OK: Todos os laudos têm ID alinhado com lote_id.';
  END IF;
END $$;

COMMIT;

-- Fim da migration 164
