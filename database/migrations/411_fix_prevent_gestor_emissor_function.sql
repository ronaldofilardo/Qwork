-- Migration 411: Corrigir função prevent_gestor_being_emissor
-- A função foi criada (Migration 200) referenciando nomes legados:
--   contratantes_senhas → entidades_senhas
--   contratantes        → entidades
--   contratante_id      → entidade_id
--   gestor_entidade     → gestor
-- Este migration faz o CREATE OR REPLACE com os nomes corretos do schema atual.

BEGIN;

CREATE OR REPLACE FUNCTION prevent_gestor_being_emissor() RETURNS trigger AS $$
BEGIN
  -- Se estamos inserindo/atualizando para perfil 'emissor', garantir que o CPF NÃO pertença a um gestor
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.perfil = 'emissor') THEN
      -- Se CPF existe em entidades_senhas ligado a uma entidade do tipo 'entidade', bloquear
      IF EXISTS(
        SELECT 1 FROM entidades_senhas es
        JOIN entidades e ON e.id = es.entidade_id
        WHERE es.cpf = NEW.cpf AND e.tipo = 'entidade' AND e.ativa = true
      ) THEN
        RAISE EXCEPTION 'CPF pertence a gestor de entidade; não pode ser emissor';
      END IF;

      -- Se CPF já estiver associado a um gestor RH (perfil='rh') em funcionarios, bloquear
      IF EXISTS(
        SELECT 1 FROM funcionarios f
        WHERE f.cpf = NEW.cpf AND f.perfil = 'rh' AND (TG_OP = 'INSERT' OR f.id <> NEW.id)
      ) THEN
        RAISE EXCEPTION 'CPF pertence a gestor RH; não pode ser emissor';
      END IF;
    END IF;

    -- Se estamos tornando alguém em gestor (rh/gestor), garantir que CPF não seja emissor
    IF (NEW.perfil IN ('rh', 'gestor')) THEN
      IF EXISTS(
        SELECT 1 FROM funcionarios f
        WHERE f.cpf = NEW.cpf AND f.perfil = 'emissor' AND (TG_OP = 'INSERT' OR f.id <> NEW.id)
      ) THEN
        RAISE EXCEPTION 'CPF pertence a emissor; não pode tornar-se gestor';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_gestor_being_emissor() IS
  'Migration 411: Impede que CPF de gestor de entidade seja usado como emissor em funcionarios. '
  'Usa entidades/entidades_senhas (nomes atuais, substituindo contratantes legacy).';

-- Verificação: garantir que a função existe com a definição atualizada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'prevent_gestor_being_emissor'
  ) THEN
    RAISE EXCEPTION 'Migration 411 falhou: função prevent_gestor_being_emissor não encontrada';
  END IF;
  RAISE NOTICE 'Migration 411 OK: prevent_gestor_being_emissor atualizada';
END;
$$;

COMMIT;
