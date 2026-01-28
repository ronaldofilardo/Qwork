-- Dev DB stubs for local testing
-- Adiciona coluna contratante_id em clinicas se não existir
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS contratante_id integer;

-- Ajuste do mapping para a clinica de teste (substitua ids conforme necessário)
UPDATE clinicas SET contratante_id = 1 WHERE id = 1;

-- Função stub para evitar erro quando o app tenta logar access denied
CREATE OR REPLACE FUNCTION log_access_denied(
  p_user text,
  p_action text,
  p_resource text,
  p_reason text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Opcional: inserir em tabela de logs se quiser rastrear
  -- INSERT INTO app_access_logs(user_id, action, resource, reason, created_at) VALUES (p_user, p_action, p_resource, p_reason, now());
  RETURN;
END;
$$;
