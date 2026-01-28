-- Migration: Corrigir comparações de enum em sync_personalizado_status
-- Data: 2026-01-24
-- Descrição: Adiciona cast explícito ::text para comparações entre tipos enum
--           Corrige erro "operador não existe: text = status_aprovacao_enum"

CREATE OR REPLACE FUNCTION public.sync_personalizado_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando contratacao_personalizada muda para valor_definido, atualizar contratante
    IF NEW.status::text = 'valor_definido' AND (OLD.status IS NULL OR OLD.status::text = 'aguardando_valor_admin') THEN
        UPDATE contratantes 
        SET status = 'aguardando_pagamento', atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        RAISE NOTICE 'Contratante % atualizado para aguardando_pagamento', NEW.contratante_id;
    END IF;
    
    -- Quando pago, ativar contratante e disparar criação de conta
    IF NEW.status::text = 'pago' AND OLD.status::text = 'aguardando_pagamento' THEN
        UPDATE contratantes 
        SET status = 'aprovado', -- Usar 'aprovado' em vez de 'ativo' (não existe no enum)
            data_liberacao_login = CURRENT_TIMESTAMP, 
            ativa = true,
            atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        -- Chamar função para criar conta responsável
        PERFORM criar_conta_responsavel_personalizado(NEW.contratante_id);
        
        RAISE NOTICE 'Contratante % ativado e conta criada', NEW.contratante_id;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_personalizado_status() IS 'Sincroniza status de contratacao_personalizada para contratantes. Cast ::text para evitar erros de comparação de enum.';
