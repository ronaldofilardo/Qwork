-- ==========================================
-- SCRIPT DE SINCRONIZAÇÃO PROD ← DEV
-- Data: 2026-02-04
-- Objetivo: Aplicar todas as diferenças críticas do banco de desenvolvimento em produção
-- ==========================================

BEGIN;

-- ==========================================
-- 1. TRIGGERS FALTANTES EM PRODUÇÃO
-- ==========================================

-- Trigger: prevent_avaliacao_delete_after_emission
CREATE OR REPLACE FUNCTION prevent_modification_after_emission()
RETURNS TRIGGER AS $$
BEGIN
  -- Buscar status do lote
  IF EXISTS (
    SELECT 1 FROM lotes_avaliacao la
    INNER JOIN laudos l ON la.id = l.lote_id
    WHERE la.id = OLD.lote_id
      AND l.enviado_em IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Não é permitido modificar/deletar avaliação após emissão do laudo (lote_id: %)', OLD.lote_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_avaliacao_delete_after_emission ON avaliacoes;
CREATE TRIGGER prevent_avaliacao_delete_after_emission
  BEFORE DELETE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_modification_after_emission();

DROP TRIGGER IF EXISTS prevent_avaliacao_update_after_emission ON avaliacoes;
CREATE TRIGGER prevent_avaliacao_update_after_emission
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_modification_after_emission();

COMMENT ON FUNCTION prevent_modification_after_emission IS 'Impede modificação/exclusão de avaliações após emissão do laudo';

-- ==========================================

-- Trigger: prevent_lote_update_after_emission
CREATE OR REPLACE FUNCTION prevent_lote_status_change_after_emission()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o lote já tem laudo emitido, bloquear mudanças no status
  IF EXISTS (
    SELECT 1 FROM laudos
    WHERE lote_id = NEW.id AND enviado_em IS NOT NULL
  ) THEN
    IF OLD.status <> NEW.status THEN
      RAISE EXCEPTION 'Não é permitido alterar status do lote após emissão do laudo (lote_id: %)', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_lote_update_after_emission ON lotes_avaliacao;
CREATE TRIGGER prevent_lote_update_after_emission
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_lote_status_change_after_emission();

COMMENT ON FUNCTION prevent_lote_status_change_after_emission IS 'Impede mudança de status do lote após laudo emitido';

-- ==========================================

-- Trigger: tr_contratantes_sync_status_ativa_robust
CREATE OR REPLACE FUNCTION contratantes_sync_status_ativa_robust()
RETURNS TRIGGER AS $$
BEGIN
  -- Versão robusta da sincronização de status_ativa
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    NEW.status_ativa := (NEW.status = 'ativo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa_robust ON contratantes;
CREATE TRIGGER tr_contratantes_sync_status_ativa_robust
  BEFORE INSERT OR UPDATE ON contratantes
  FOR EACH ROW
  EXECUTE FUNCTION contratantes_sync_status_ativa_robust();

COMMENT ON FUNCTION contratantes_sync_status_ativa_robust IS 'Sincroniza status_ativa com status de forma robusta';

-- ==========================================

-- Trigger: trg_audit_lote_status
CREATE OR REPLACE FUNCTION audit_lote_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'status_alterado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'status_anterior', OLD.status,
        'status_novo', NEW.status,
        'lote_id', NEW.id
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_lote_status ON lotes_avaliacao;
CREATE TRIGGER trg_audit_lote_status
  AFTER UPDATE ON lotes_avaliacao
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_lote_status_change();

COMMENT ON FUNCTION audit_lote_status_change IS 'Registra mudanças de status do lote em audit_logs';

-- ==========================================

-- Trigger: trg_immutable_lote
CREATE OR REPLACE FUNCTION prevent_update_finalized_lote()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquear updates em lotes finalizados
  IF OLD.status IN ('emitido', 'enviado') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Não é permitido alterar status de lote finalizado (lote_id: %, status: %)', OLD.id, OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_lote ON lotes_avaliacao;
CREATE TRIGGER trg_immutable_lote
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_update_finalized_lote();

-- ==========================================

-- Trigger: trg_protect_lote_after_emit
CREATE OR REPLACE FUNCTION prevent_modification_lote_when_laudo_emitted()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM laudos
    WHERE lote_id = NEW.id AND emitido_em IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Não é permitido modificar lote após laudo emitido (lote_id: %)', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_lote_after_emit ON lotes_avaliacao;
CREATE TRIGGER trg_protect_lote_after_emit
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_modification_lote_when_laudo_emitted();

-- ==========================================

-- Trigger: trg_reservar_id_laudo_on_lote_insert
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Reservar ID do laudo igual ao ID do lote no momento da inserção
  INSERT INTO laudos (id, lote_id, empresa_id, hash_pdf, rascunho, emitido_em)
  VALUES (NEW.id, NEW.id, NEW.empresa_id, NULL, true, NULL)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
  AFTER INSERT ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert IS 'Reserva ID do laudo igual ao lote no momento da inserção';

-- ==========================================

-- Trigger: trg_validar_transicao_status_lote
CREATE OR REPLACE FUNCTION fn_validar_transicao_status_lote()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar transições de status válidas para lotes
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    -- Regras de transição
    IF OLD.status = 'emitido' AND NEW.status NOT IN ('enviado', 'erro') THEN
      RAISE EXCEPTION 'Transição de status inválida: % → %', OLD.status, NEW.status;
    ELSIF OLD.status = 'enviado' THEN
      RAISE EXCEPTION 'Lote enviado não pode mudar de status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_transicao_status_lote ON lotes_avaliacao;
CREATE TRIGGER trg_validar_transicao_status_lote
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION fn_validar_transicao_status_lote();

COMMENT ON FUNCTION fn_validar_transicao_status_lote IS 'Valida transições de status permitidas para lotes';

-- ==========================================

-- Trigger: trigger_prevent_avaliacao_mutation_during_emission
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquear mutações durante processo de emissão
  IF EXISTS (
    SELECT 1 FROM lotes_avaliacao
    WHERE id = NEW.lote_id AND status = 'emissao_em_andamento'
  ) THEN
    RAISE EXCEPTION 'Não é permitido modificar avaliação durante processo de emissão (lote_id: %)', NEW.lote_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_avaliacao_mutation_during_emission ON avaliacoes;
CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission
  BEFORE UPDATE OR DELETE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_mutation_during_emission();

-- ==========================================

-- Trigger: trigger_prevent_lote_mutation_during_emission
CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'emissao_em_andamento' AND OLD.status <> 'emissao_em_andamento' THEN
    -- Permitir entrada no status
    RETURN NEW;
  ELSIF OLD.status = 'emissao_em_andamento' THEN
    -- Bloquear mutações enquanto em processo
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Permitir saída do status apenas para emitido ou erro
      IF NEW.status NOT IN ('emitido', 'erro') THEN
        RAISE EXCEPTION 'Transição inválida durante emissão: % → %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_lote_mutation_during_emission ON lotes_avaliacao;
CREATE TRIGGER trigger_prevent_lote_mutation_during_emission
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_lote_mutation_during_emission();

COMMENT ON FUNCTION prevent_lote_mutation_during_emission IS 'Protege lote durante processo de emissão';

-- ==========================================
-- 2. FUNÇÕES FALTANTES EM PRODUÇÃO
-- ==========================================

-- Função: limpar_auditoria_laudos_antiga
CREATE OR REPLACE FUNCTION limpar_auditoria_laudos_antiga()
RETURNS void AS $$
BEGIN
  DELETE FROM auditoria_laudos
  WHERE criado_em < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Auditoria de laudos antiga removida';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpar_auditoria_laudos_antiga IS 'Remove registros de auditoria de laudos com mais de 90 dias';

-- ==========================================
-- 3. VIEWS FALTANTES EM PRODUÇÃO
-- ==========================================

-- View: equipe_administrativa
CREATE OR REPLACE VIEW equipe_administrativa AS
SELECT 
  f.cpf,
  f.nome,
  f.perfil,
  f.ativo,
  f.clinica_id,
  c.nome as clinica_nome
FROM funcionarios f
LEFT JOIN clinicas c ON f.clinica_id = c.id
WHERE f.perfil IN ('admin', 'master', 'emissor')
ORDER BY f.perfil, f.nome;

COMMENT ON VIEW equipe_administrativa IS 'Lista de funcionários administrativos (admin, master, emissor)';

-- View: funcionarios_operacionais
CREATE OR REPLACE VIEW funcionarios_operacionais AS
SELECT 
  f.cpf,
  f.nome,
  f.perfil,
  f.ativo,
  f.empresa_id,
  ec.nome as empresa_nome
FROM funcionarios f
LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
WHERE f.perfil IN ('funcionario', 'gestor_entidade')
ORDER BY f.empresa_id, f.nome;

COMMENT ON VIEW funcionarios_operacionais IS 'Lista de funcionários operacionais (funcionario, gestor_entidade)';

-- View: gestores
CREATE OR REPLACE VIEW gestores AS
SELECT 
  f.cpf,
  f.nome,
  f.perfil,
  f.ativo,
  COALESCE(f.empresa_id, f.contratante_id) as entidade_id,
  COALESCE(ec.nome, c.nome) as entidade_nome
FROM funcionarios f
LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
LEFT JOIN contratantes c ON f.contratante_id = c.id
WHERE f.perfil IN ('gestor_entidade', 'rh')
ORDER BY f.perfil, f.nome;

COMMENT ON VIEW gestores IS 'Lista de gestores (gestor_entidade, rh)';

-- View: usuarios_resumo
CREATE OR REPLACE VIEW usuarios_resumo AS
SELECT 
  f.cpf,
  f.nome,
  f.perfil,
  f.ativo,
  f.criado_em,
  COALESCE(ec.nome, c.nome, cl.nome) as vinculo_nome
FROM funcionarios f
LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
LEFT JOIN contratantes c ON f.contratante_id = c.id
LEFT JOIN clinicas cl ON f.clinica_id = cl.id
ORDER BY f.criado_em DESC;

COMMENT ON VIEW usuarios_resumo IS 'Resumo de todos os usuários do sistema';

-- ==========================================
-- VALIDAÇÃO FINAL
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sincronização concluída com sucesso!';
  RAISE NOTICE 'Triggers, funções e views foram atualizados.';
END $$;

COMMIT;
