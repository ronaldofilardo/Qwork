-- ============================================================
-- ETAPA: Implementar Gestores RH Únicos por Clínica
-- Data: 12/12/2025
-- Objetivo: Garantir apenas 1 RH ativo por clínica e vincular
--           ações à clínica (não ao indivíduo)
-- ============================================================

-- 1. Adicionar constraint única para 1 RH ativo por clínica
-- Isso impede múltiplos RHs ativos na mesma clínica
CREATE UNIQUE INDEX idx_funcionarios_clinica_rh_ativo ON funcionarios (clinica_id)
WHERE
    perfil = 'rh'
    AND ativo = true;

COMMENT ON INDEX idx_funcionarios_clinica_rh_ativo IS 'Garante que apenas 1 gestor RH ativo por clínica';

-- 2. Criar índice para performance em queries de RH
CREATE INDEX idx_funcionarios_perfil_ativo ON funcionarios (perfil, ativo)
WHERE
    perfil = 'rh';

COMMENT ON INDEX idx_funcionarios_perfil_ativo IS 'Otimiza queries de listagem de gestores RH';

-- 3. Adicionar função de validação para garantir obrigatoriedade
CREATE OR REPLACE FUNCTION validar_rh_obrigatorio()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Se estiver desativando um RH, verificar se existe outro ativo
    IF NEW.perfil = 'rh' AND NEW.ativo = false THEN
        SELECT COUNT(*) INTO v_count
        FROM funcionarios
        WHERE clinica_id = NEW.clinica_id
          AND perfil = 'rh'
          AND ativo = true
          AND cpf != NEW.cpf;
        
        -- Se não há outro RH ativo, bloquear
        IF v_count = 0 THEN
            RAISE EXCEPTION 'Não é possível desativar o único gestor RH ativo da clínica. Crie ou ative outro gestor antes.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_rh_obrigatorio () IS 'Impede desativação do último RH ativo de uma clínica';

-- 4. Criar trigger para validação
DROP TRIGGER IF EXISTS trigger_validar_rh_obrigatorio ON funcionarios;

CREATE TRIGGER trigger_validar_rh_obrigatorio
BEFORE UPDATE ON funcionarios
FOR EACH ROW
WHEN (OLD.perfil = 'rh' AND NEW.ativo = false AND OLD.ativo = true)
EXECUTE FUNCTION validar_rh_obrigatorio();

COMMENT ON TRIGGER trigger_validar_rh_obrigatorio ON funcionarios IS 'Valida que clínica sempre tenha ao menos 1 RH ativo';

-- 5. Verificar estado atual - quantos RHs ativos por clínica
SELECT
    c.id,
    c.nome as clinica,
    COUNT(f.cpf) as rhs_ativos,
    STRING_AGG (
        f.nome || ' (' || f.cpf || ')',
        ', '
    ) as gestores
FROM
    clinicas c
    LEFT JOIN funcionarios f ON f.clinica_id = c.id
    AND f.perfil = 'rh'
    AND f.ativo = true
GROUP BY
    c.id,
    c.nome
ORDER BY c.id;

-- 6. Informacoes sobre a implementacao
DO $$ 
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'IMPLEMENTACAO CONCLUIDA: Gestores RH Unicos por Clinica';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Mudancas aplicadas:';
    RAISE NOTICE '1. OK Constraint unica: apenas 1 RH ativo por clinica';
    RAISE NOTICE '2. OK Indices de performance para queries de RH';
    RAISE NOTICE '3. OK Trigger de validacao: impede desativar ultimo RH';
    RAISE NOTICE '4. OK Verificacao de estado atual realizada';
    RAISE NOTICE '';
    RAISE NOTICE 'Proximos passos:';
    RAISE NOTICE '- Executar etapa-gestores-rh-unico-parte2.sql (campos lotes)';
    RAISE NOTICE '- Atualizar endpoints de API';
    RAISE NOTICE '- Implementar endpoint de substituicao';
    RAISE NOTICE '============================================================';
END $$;