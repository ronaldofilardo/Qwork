-- Migração 053: Trigger para sincronização de estados entre contratacao_personalizada e tomadores
-- Data: 19/01/2026
-- Descrição: Garante sincronização automática de status entre tabelas, evitando estados desalinhados

BEGIN;

-- Criar função para sincronizar status
CREATE OR REPLACE FUNCTION sync_personalizado_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando contratacao_personalizada muda para valor_definido, atualizar contratante
    IF NEW.status = 'valor_definido' AND (OLD.status IS NULL OR OLD.status = 'aguardando_valor_admin') THEN
        UPDATE tomadores 
        SET status = 'aguardando_pagamento', atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        RAISE NOTICE 'Contratante % atualizado para aguardando_pagamento', NEW.contratante_id;
    END IF;
    
    -- Quando pago, ativar contratante e disparar criação de conta
    IF NEW.status = 'pago' AND OLD.status = 'aguardando_pagamento' THEN
        UPDATE tomadores 
        SET status = 'ativo', 
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
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_sync_personalizado_status ON contratacao_personalizada;

-- Criar trigger
CREATE TRIGGER trg_sync_personalizado_status
AFTER UPDATE ON contratacao_personalizada
FOR EACH ROW 
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION sync_personalizado_status();

COMMENT ON FUNCTION sync_personalizado_status() IS 'Sincroniza automaticamente status entre contratacao_personalizada e tomadores';

COMMIT;

SELECT '✓ Migração 053 aplicada com sucesso' AS status;
