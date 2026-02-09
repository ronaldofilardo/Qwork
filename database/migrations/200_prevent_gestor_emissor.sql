-- Migration 200: Impedir que Gestor RH / Gestor Entidade tenham perfil 'emissor'
-- Cria triggers que impedem cenários de conflito entre emissores e gestores

BEGIN;

-- Função que valida inserts/updates em funcionarios
CREATE OR REPLACE FUNCTION prevent_gestor_being_emissor() RETURNS trigger AS $$
BEGIN
  -- Se estamos inserindo/atualizando para perfil 'emissor', garantir que o CPF NÃO pertença a um gestor
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.perfil = 'emissor') THEN
      -- Se CPF existe em entidades_senhas ligado a uma contratante do tipo 'entidade', bloquear
      IF EXISTS(
        SELECT 1 FROM entidades_senhas cs
        JOIN tomadores c ON c.id = cs.contratante_id
        WHERE cs.cpf = NEW.cpf AND c.tipo = 'entidade' AND c.ativa = true
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
    IF (NEW.perfil IN ('rh','gestor')) THEN
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

CREATE TRIGGER trg_prevent_gestor_emissor
BEFORE INSERT OR UPDATE ON funcionarios
FOR EACH ROW EXECUTE FUNCTION prevent_gestor_being_emissor();

-- Função que impede um CPF já cadastrado como emissor de virar gestor de entidade (via entidades_senhas)
CREATE OR REPLACE FUNCTION prevent_contratante_for_emissor() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF EXISTS(SELECT 1 FROM funcionarios f WHERE f.cpf = NEW.cpf AND f.perfil = 'emissor') THEN
      RAISE EXCEPTION 'CPF pertence a emissor; não pode ser gestor de entidade';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_contratante_emissor
BEFORE INSERT OR UPDATE ON entidades_senhas
FOR EACH ROW EXECUTE FUNCTION prevent_contratante_for_emissor();

COMMIT;
