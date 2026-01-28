-- Trigger para validar integridade de clinica_id
CREATE OR REPLACE FUNCTION validate_user_clinica_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar se clinica_id existe
    IF NEW.clinica_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM clinicas WHERE id = NEW.clinica_id) THEN
            RAISE EXCEPTION 'Clínica % não existe', NEW.clinica_id;
        END IF;
    END IF;

    -- Validar regras de negócio por perfil
    CASE NEW.perfil
        WHEN 'admin' THEN
            -- Admin pode ter clinica_id NULL ou específica
            NULL;
        WHEN 'rh' THEN
            -- RH deve ter clinica_id obrigatória
            IF NEW.clinica_id IS NULL THEN
                RAISE EXCEPTION 'Gestor RH deve estar associado a uma clínica';
            END IF;
        WHEN 'emissor' THEN
            -- Emissor pode ter clinica_id NULL (acesso global)
            NULL;
        WHEN 'funcionario' THEN
            -- Funcionário deve ter clinica_id obrigatória
            IF NEW.clinica_id IS NULL THEN
                RAISE EXCEPTION 'Funcionário deve estar associado a uma clínica';
            END IF;
        ELSE
            RAISE EXCEPTION 'Perfil inválido: %', NEW.perfil;
    END CASE;

    -- Log de auditoria para mudanças críticas
    IF TG_OP = 'UPDATE' AND OLD.clinica_id IS DISTINCT FROM NEW.clinica_id THEN
        INSERT INTO audit_logs (
            action, resource_type, resource_id, old_values, new_values,
            performed_by, performed_at, ip_address
        ) VALUES (
            'UPDATE_CLINICA_ASSOCIATION',
            'funcionario',
            NEW.cpf,
            json_build_object('clinica_id', OLD.clinica_id),
            json_build_object('clinica_id', NEW.clinica_id),
            current_setting('app.current_user_cpf', true),
            NOW(),
            current_setting('app.client_ip', true)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar empresa pertence à clínica
CREATE OR REPLACE FUNCTION validate_empresa_clinica_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar se clinica_id da empresa existe
    IF NOT EXISTS (SELECT 1 FROM clinicas WHERE id = NEW.clinica_id) THEN
        RAISE EXCEPTION 'Clínica % não existe para empresa', NEW.clinica_id;
    END IF;

    -- Impedir mudança de clínica de empresa com funcionários ativos
    IF TG_OP = 'UPDATE' AND OLD.clinica_id IS DISTINCT FROM NEW.clinica_id THEN
        IF EXISTS (SELECT 1 FROM funcionarios WHERE empresa_id = NEW.id AND ativo = true) THEN
            RAISE EXCEPTION 'Não é possível mudar clínica de empresa com funcionários ativos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar funcionário pertence à empresa da mesma clínica
CREATE OR REPLACE FUNCTION validate_funcionario_empresa_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Se empresa_id foi definido, validar que pertence à mesma clínica
    IF NEW.empresa_id IS NOT NULL THEN
        -- Verificar se empresa existe
        IF NOT EXISTS (SELECT 1 FROM empresas_clientes WHERE id = NEW.empresa_id) THEN
            RAISE EXCEPTION 'Empresa % não existe', NEW.empresa_id;
        END IF;

        -- Verificar se empresa pertence à mesma clínica do funcionário
        IF NOT EXISTS (
            SELECT 1 FROM empresas_clientes
            WHERE id = NEW.empresa_id AND clinica_id = NEW.clinica_id
        ) THEN
            RAISE EXCEPTION 'Empresa % não pertence à clínica % do funcionário',
                NEW.empresa_id, NEW.clinica_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trg_validate_user_clinica ON funcionarios;

CREATE TRIGGER trg_validate_user_clinica
    BEFORE INSERT OR UPDATE ON funcionarios
    FOR EACH ROW EXECUTE FUNCTION validate_user_clinica_integrity();

DROP TRIGGER IF EXISTS trg_validate_empresa_clinica ON empresas_clientes;

CREATE TRIGGER trg_validate_empresa_clinica
    BEFORE INSERT OR UPDATE ON empresas_clientes
    FOR EACH ROW EXECUTE FUNCTION validate_empresa_clinica_integrity();

DROP TRIGGER IF EXISTS trg_validate_funcionario_empresa ON funcionarios;

CREATE TRIGGER trg_validate_funcionario_empresa
    BEFORE INSERT OR UPDATE ON funcionarios
    FOR EACH ROW EXECUTE FUNCTION validate_funcionario_empresa_integrity();