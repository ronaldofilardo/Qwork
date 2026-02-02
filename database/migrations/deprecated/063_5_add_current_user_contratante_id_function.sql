-- Migration 063.5: Adiciona função current_user_contratante_id()
-- Data: 2026-01-04
-- Descrição: Cria função para recuperar contratante_id do contexto da sessão RLS

BEGIN;

COMMENT ON EXTENSION plpgsql IS '=== MIGRATION 063.5: Criando função current_user_contratante_id ===';

-- Criar função para obter contratante_id do usuário atual
CREATE OR REPLACE FUNCTION current_user_contratante_id()
RETURNS INTEGER AS $$
DECLARE
    contratante_id_str VARCHAR(50);
    contratante_id_int INTEGER;
BEGIN
    contratante_id_str := nullif(current_setting('app.current_user_contratante_id', true), '');
    IF contratante_id_str IS NOT NULL THEN
        contratante_id_int := contratante_id_str::INTEGER;
        RETURN contratante_id_int;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_user_contratante_id() IS 'Retorna o contratante_id do contexto da sessão para RLS de entidades';

SELECT '063.5 Função current_user_contratante_id() criada' as status;

COMMIT;

COMMENT ON EXTENSION plpgsql IS '=== MIGRATION 063.5: Concluída com sucesso ===';
