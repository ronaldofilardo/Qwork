-- Migration 048: Corrigir trigger para definir status='rejeitado' quando ativa=false
-- Data: 2025-12-26
-- Descrição: Ajustar trigger para corresponder aos testes de máquina de estado

BEGIN;

-- Função corrigida para sincronizar status com ativa (bidirecional)
CREATE OR REPLACE FUNCTION tomadores_sync_status_ativa()
RETURNS trigger AS $$
BEGIN
  -- Para inserts: manter o status como definido (não alterar automaticamente)
  IF TG_OP = 'INSERT' THEN
    -- Não alterar status em inserts - permitir que novos tomadores tenham status apropriado
    RETURN NEW;
  END IF;

  -- Para updates: sincronização bidirecional
  IF TG_OP = 'UPDATE' THEN
    -- Se status mudou para 'rejeitado', definir ativa = false
    IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'rejeitado' THEN
      NEW.ativa := false;
    END IF;

    -- Se ativa mudou para false, definir status = 'rejeitado'
    IF (OLD.ativa IS DISTINCT FROM NEW.ativa) AND NEW.ativa = false THEN
      NEW.status := 'rejeitado';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O trigger já existe, só precisa recriar a função
-- DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa ON tomadores;
-- CREATE TRIGGER tr_tomadores_sync_status_ativa
-- BEFORE INSERT OR UPDATE ON tomadores
-- FOR EACH ROW EXECUTE FUNCTION tomadores_sync_status_ativa();

-- Corrigir dados existentes: tomadores com ativa=false devem ter status='rejeitado'
UPDATE tomadores
SET status = 'rejeitado'::status_aprovacao_enum
WHERE ativa = false AND status != 'rejeitado';

COMMIT;