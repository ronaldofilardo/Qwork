-- Migration 046: Melhorar auditoria de mudancas em campos criticos
-- Data: 26/12/2025
-- Descricao: Adiciona triggers para auditar mudancas em payment_link_token e valor_por_funcionario

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN

        -- Funcao para auditar mudancas em campos criticos
        CREATE OR REPLACE FUNCTION auditar_mudancas_campos_criticos()
        RETURNS TRIGGER AS $func$
        BEGIN
            -- Auditar mudanca de payment_link_token
            IF OLD.payment_link_token IS DISTINCT FROM NEW.payment_link_token THEN
                INSERT INTO historico_transicoes_personalizadas (
                    contratacao_id,
                    status_anterior,
                    status_novo,
                    usuario_cpf,
                    usuario_perfil,
                    motivo,
                    dados_contexto
                ) VALUES (
                    NEW.id,
                    OLD.status,
                    NEW.status,
                    COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), 'system'),
                    COALESCE(NULLIF(current_setting('app.current_user_perfil', TRUE), ''), 'system'),
                    'Mudanca de payment_link_token',
                    jsonb_build_object(
                        'campo', 'payment_link_token',
                        'valor_anterior', OLD.payment_link_token,
                        'valor_novo', NEW.payment_link_token,
                        'timestamp', NOW()
                    )
                );
            END IF;

            -- Auditar mudanca de valor_por_funcionario
            IF OLD.valor_por_funcionario IS DISTINCT FROM NEW.valor_por_funcionario THEN
                INSERT INTO historico_transicoes_personalizadas (
                    contratacao_id,
                    status_anterior,
                    status_novo,
                    usuario_cpf,
                    usuario_perfil,
                    motivo,
                    dados_contexto
                ) VALUES (
                    NEW.id,
                    OLD.status,
                    NEW.status,
                    COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), 'system'),
                    COALESCE(NULLIF(current_setting('app.current_user_perfil', TRUE), ''), 'system'),
                    'Mudanca de valor_por_funcionario',
                    jsonb_build_object(
                        'campo', 'valor_por_funcionario',
                        'valor_anterior', OLD.valor_por_funcionario,
                        'valor_novo', NEW.valor_por_funcionario,
                        'timestamp', NOW()
                    )
                );
            END IF;

            -- Auditar mudanca de numero_funcionarios_estimado
            IF OLD.numero_funcionarios_estimado IS DISTINCT FROM NEW.numero_funcionarios_estimado THEN
                INSERT INTO historico_transicoes_personalizadas (
                    contratacao_id,
                    status_anterior,
                    status_novo,
                    usuario_cpf,
                    usuario_perfil,
                    motivo,
                    dados_contexto
                ) VALUES (
                    NEW.id,
                    OLD.status,
                    NEW.status,
                    COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), 'system'),
                    COALESCE(NULLIF(current_setting('app.current_user_perfil', TRUE), ''), 'system'),
                    'Mudanca de numero_funcionarios_estimado',
                    jsonb_build_object(
                        'campo', 'numero_funcionarios_estimado',
                        'valor_anterior', OLD.numero_funcionarios_estimado,
                        'valor_novo', NEW.numero_funcionarios_estimado,
                        'timestamp', NOW()
                    )
                );
            END IF;

            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Criar trigger para auditar campos criticos
        DROP TRIGGER IF EXISTS trg_auditar_campos_criticos ON contratacao_personalizada;

        CREATE TRIGGER trg_auditar_campos_criticos
        AFTER UPDATE ON contratacao_personalizada
        FOR EACH ROW
        WHEN (
            OLD.payment_link_token IS DISTINCT FROM NEW.payment_link_token OR
            OLD.valor_por_funcionario IS DISTINCT FROM NEW.valor_por_funcionario OR
            OLD.numero_funcionarios_estimado IS DISTINCT FROM NEW.numero_funcionarios_estimado
        )
        EXECUTE FUNCTION auditar_mudancas_campos_criticos();

        RAISE NOTICE 'Migration 046: Trigger de auditoria de campos criticos criado';
    ELSE
        RAISE NOTICE 'Migration 046: Tabela contratacao_personalizada nao existe';
    END IF;
END $$;
