-- Migration 047: Corrigir trigger para ativação em planos personalizados
-- Data: 2025-12-26
-- Descrição: Modificar trigger para só ativar conta após confirmação de pagamento para planos personalizados

BEGIN;

-- Função robusta para sincronizar status com ativa (personalizado)
CREATE OR REPLACE FUNCTION tomadores_sync_status_ativa_personalizado()
RETURNS trigger AS $$
DECLARE
    v_status_ativo status_aprovacao_enum[] := ARRAY['aprovado'::status_aprovacao_enum];
    v_status_inativo status_aprovacao_enum[] := ARRAY['rejeitado'::status_aprovacao_enum];
    v_plano_tipo VARCHAR(50);
    v_pagamento_confirmado BOOLEAN;
BEGIN
  -- Para inserts e updates
  IF TG_OP IN ('INSERT', 'UPDATE') THEN

    -- Buscar informações do plano e pagamento
    SELECT p.tipo, c2.pagamento_confirmado INTO v_plano_tipo, v_pagamento_confirmado
    FROM tomadores c2
    LEFT JOIN planos p ON c2.plano_id = p.id
    WHERE c2.id = NEW.id;

    -- Regra 1: Status aprovado → ativa deve ser true, MAS apenas se:
    -- - Não é plano personalizado, OU
    -- - É personalizado E pagamento confirmado
    IF NEW.status = ANY(v_status_ativo) AND NEW.ativa IS NOT TRUE THEN
      IF v_plano_tipo != 'personalizado' OR (v_plano_tipo = 'personalizado' AND v_pagamento_confirmado = true) THEN
        NEW.ativa := true;
        RAISE NOTICE 'Contratante %: Status % requer ativa=true, corrigindo', NEW.id, NEW.status;
      END IF;
    END IF;

    -- Regra 2: Status rejeitado/inativa → ativa deve ser false
    IF NEW.status = ANY(v_status_inativo) AND NEW.ativa IS NOT FALSE THEN
      NEW.ativa := false;
      RAISE NOTICE 'Contratante %: Status % requer ativa=false, corrigindo', NEW.id, NEW.status;
    END IF;

    -- Regra 3: Se ativa=true mas status não é aprovado → corrigir para 'aprovado'
    IF NEW.ativa = true AND NOT (NEW.status = ANY(v_status_ativo)) THEN
      NEW.status := 'aprovado'::status_aprovacao_enum;
      RAISE NOTICE 'Contratante %: ativa=true requer status aprovado, definindo status=aprovado', NEW.id;
    END IF;

    -- Regra 4: Se ativa=false mas status é aprovado → corrigir para 'rejeitado' APENAS se não é personalizado ou pagamento não confirmado
    IF NEW.ativa = false AND NEW.status = ANY(v_status_ativo) THEN
      IF v_plano_tipo != 'personalizado' OR (v_plano_tipo = 'personalizado' AND v_pagamento_confirmado = false) THEN
        NEW.status := 'rejeitado'::status_aprovacao_enum;
        RAISE NOTICE 'Contratante %: ativa=false com status aprovado, definindo status=rejeitado', NEW.id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Substituir trigger pela nova versão (regras para planos personalizados)
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa_robust ON tomadores;
CREATE TRIGGER tr_tomadores_sync_status_ativa_personalizado
BEFORE INSERT OR UPDATE ON tomadores
FOR EACH ROW EXECUTE FUNCTION tomadores_sync_status_ativa_personalizado();

-- Corrigir dados existentes: desativar contas de personalizados sem pagamento
UPDATE tomadores
SET ativa = false
WHERE id IN (
  SELECT c.id
  FROM tomadores c
  JOIN planos p ON c.plano_id = p.id
  WHERE p.tipo = 'personalizado'
  AND c.pagamento_confirmado = false
  AND c.ativa = true
);

COMMIT;