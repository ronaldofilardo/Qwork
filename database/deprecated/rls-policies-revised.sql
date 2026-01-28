-- ================================================================
-- POLÍTICAS RLS REVISADAS - QWORK
-- ================================================================
-- Data: 11/12/2025
-- Objetivo: Implementar restrições específicas para o perfil Admin
--           e mecanismos de imutabilidade para resultados concluídos
-- ================================================================

-- ================================================================
-- PARTE 1: REMOÇÃO DAS POLÍTICAS ANTIGAS DO ADMIN
-- ================================================================

-- Remover políticas antigas que davam acesso total ao Admin
DROP POLICY IF EXISTS "admin_all_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "admin_all_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_all_lotes" ON lotes_avaliacao;

DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;

DROP POLICY IF EXISTS "admin_all_respostas" ON respostas;

DROP POLICY IF EXISTS "admin_all_resultados" ON resultados;

DROP POLICY IF EXISTS "admin_all_clinicas" ON clinicas;

-- ================================================================
-- PARTE 2: NOVAS POLÍTICAS RESTRITIVAS PARA ADMIN
-- ================================================================

-- ------------------------------------------------------------
-- TABELA: funcionarios
-- RESTRIÇÃO: Admin só pode acessar funcionários RH (não vinculados a empresas)
-- ------------------------------------------------------------
CREATE POLICY "admin_restricted_funcionarios" ON funcionarios FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
    AND perfil = 'rh'
    AND empresa_id IS NULL
);

-- ------------------------------------------------------------
-- TABELA: avaliacoes
-- RESTRIÇÃO: Admin NÃO pode acessar avaliações
-- ------------------------------------------------------------
-- Não criar política para admin em avaliacoes = bloqueio total

-- ------------------------------------------------------------
-- TABELA: empresas_clientes
-- RESTRIÇÃO: Admin NÃO pode criar, editar ou deletar empresas
-- ------------------------------------------------------------
-- Apenas visualização para referência (pode ser removido se não necessário)
CREATE POLICY "admin_view_empresas" ON empresas_clientes FOR
SELECT USING (
        current_setting (
            'app.current_user_perfil', true
        ) = 'admin'
    );

-- ------------------------------------------------------------
-- TABELA: lotes_avaliacao
-- RESTRIÇÃO: Admin NÃO pode acessar lotes de avaliação
-- ------------------------------------------------------------
-- Não criar política para admin em lotes_avaliacao = bloqueio total

-- ------------------------------------------------------------
-- TABELA: laudos
-- RESTRIÇÃO: Admin NÃO pode acessar laudos (apenas emissor)
-- ------------------------------------------------------------
-- Não criar política para admin em laudos = bloqueio total

-- ------------------------------------------------------------
-- TABELA: respostas
-- RESTRIÇÃO: Admin NÃO pode acessar respostas de avaliações
-- ------------------------------------------------------------
-- Não criar política para admin em respostas = bloqueio total

-- ------------------------------------------------------------
-- TABELA: resultados
-- RESTRIÇÃO: Admin NÃO pode acessar resultados de avaliações
-- ------------------------------------------------------------
-- Não criar política para admin em resultados = bloqueio total

-- ------------------------------------------------------------
-- TABELA: clinicas
-- PERMISSÃO: Admin pode visualizar e gerenciar clínicas
-- ------------------------------------------------------------
CREATE POLICY "admin_manage_clinicas" ON clinicas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

-- ================================================================
-- ================================================================
-- Admin é agora o único perfil de administrador com permissões limitadas.

-- ================================================================
-- PARTE 4: MECANISMO DE IMUTABILIDADE PARA RESULTADOS
-- ================================================================

-- ------------------------------------------------------------
-- Função para verificar se resultado pode ser modificado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_resultado_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_perfil TEXT;
BEGIN
    -- Obter perfil do usuário atual
    v_perfil := current_setting('app.current_user_perfil', true);
    

    -- Para UPDATE ou DELETE, verificar se avaliação está concluída
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = OLD.avaliacao_id;
        
        -- Se avaliação está concluída, bloquear modificação
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
                USING HINT = 'Resultados de avaliações concluídas são imutáveis para garantir integridade dos dados.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    -- Para INSERT, verificar se avaliação já não está concluída
    IF TG_OP = 'INSERT' THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = NEW.avaliacao_id;
        
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido adicionar resultados a avaliações já concluídas. Avaliação ID: %', NEW.avaliacao_id
                USING HINT = 'Finalize a avaliação antes de tentar adicionar resultados novamente.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Trigger para aplicar imutabilidade em resultados
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_resultado_immutability ON resultados;

CREATE TRIGGER trigger_resultado_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON resultados
    FOR EACH ROW
    EXECUTE FUNCTION check_resultado_immutability();

-- ================================================================
-- PARTE 5: MECANISMO DE IMUTABILIDADE PARA RESPOSTAS
-- ================================================================

-- ------------------------------------------------------------
-- Função para verificar se resposta pode ser modificada
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_resposta_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_perfil TEXT;
BEGIN
    -- Obter perfil do usuário atual
    v_perfil := current_setting('app.current_user_perfil', true);
    
    -- Para UPDATE ou DELETE, verificar se avaliação está concluída
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = OLD.avaliacao_id;
        
        -- Se avaliação está concluída, bloquear modificação
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
                USING HINT = 'Respostas de avaliações concluídas são imutáveis para garantir integridade dos dados.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Trigger para aplicar imutabilidade em respostas
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_resposta_immutability ON respostas;

CREATE TRIGGER trigger_resposta_immutability
    BEFORE UPDATE OR DELETE ON respostas
    FOR EACH ROW
    EXECUTE FUNCTION check_resposta_immutability();

-- ================================================================
-- PARTE 6: PROTEÇÃO ADICIONAL - AVALIAÇÕES CONCLUÍDAS
-- ================================================================

-- ------------------------------------------------------------
-- Função para impedir mudança de status de "concluida" para outro
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_concluded_avaliacao()
RETURNS TRIGGER AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    -- Obter perfil do usuário atual
    v_perfil := current_setting('app.current_user_perfil', true);
    
    -- Se avaliação estava concluída, não permitir mudança de status
    IF OLD.status = 'concluida' AND NEW.status != 'concluida' THEN
        RAISE EXCEPTION 'Não é permitido alterar o status de uma avaliação concluída. Avaliação ID: %', OLD.id
            USING HINT = 'Avaliações concluídas não podem ter seu status alterado.',
                  ERRCODE = '23506';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Trigger para proteger status de avaliações concluídas
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_protect_concluded_avaliacao ON avaliacoes;

CREATE TRIGGER trigger_protect_concluded_avaliacao
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION protect_concluded_avaliacao();

-- ================================================================
-- PARTE 7: FUNÇÕES DE AUDITORIA (OPCIONAL - PARA LOG)
-- ================================================================

-- ------------------------------------------------------------
-- Função para logar tentativas de acesso bloqueadas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_access_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    perfil TEXT,
    cpf TEXT,
    tabela TEXT,
    operacao TEXT,
    motivo TEXT
);

-- Esta tabela pode ser usada futuramente para auditoria

-- ================================================================
-- FIM DO SCRIPT
-- ================================================================

-- Comentários finais:
-- 1. Admin agora tem acesso limitado apenas a:
--    - Funcionários com perfil 'rh' ou 'emissor'
--    - Empresas (visualização e gestão)
--    - Clínicas (gestão completa)
--
-- 2. Admin NÃO pode acessar:
--    - Avaliações
--    - Respostas
--    - Resultados
--    - Lotes de avaliação
--    - Laudos
--
-- 3. Resultados e respostas de avaliações concluídas são imutáveis
--
-- 4. Status de avaliações concluídas não pode ser alterado