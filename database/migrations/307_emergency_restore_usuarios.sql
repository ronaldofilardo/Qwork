-- Migration 307: EMERGÊNCIA - Recriar coluna tipo_usuario na tabela usuarios
-- Data: 05/02/2026
-- Problema: A migration 306 removeu acidentalmente a coluna tipo_usuario
-- Solução: Recriar a coluna com o enum correto

-- Adicionar coluna tipo_usuario de volta
ALTER TABLE usuarios ADD COLUMN tipo_usuario usuario_tipo_enum;

-- Atualizar valores baseados nos dados existentes
-- Se tem entidade_id, é gestor
UPDATE usuarios SET tipo_usuario = 'gestor' WHERE entidade_id IS NOT NULL;
-- Se tem clinica_id, é rh
UPDATE usuarios SET tipo_usuario = 'rh' WHERE clinica_id IS NOT NULL AND entidade_id IS NULL;
-- Se não tem clinica_id nem entidade_id, é admin (pelo CPF)
UPDATE usuarios SET tipo_usuario = 'admin' WHERE clinica_id IS NULL AND entidade_id IS NULL AND cpf = '00000000000';

-- Verificar se todos os registros têm tipo_usuario definido
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM usuarios WHERE tipo_usuario IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Ainda existem % registros sem tipo_usuario definido', null_count;
    END IF;
END $$;

-- Tornar a coluna NOT NULL
ALTER TABLE usuarios ALTER COLUMN tipo_usuario SET NOT NULL;

-- Recriar índices e constraints que dependiam da coluna
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_ativo ON usuarios(tipo_usuario, ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);

-- Recriar constraint de validação
ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK (
    (tipo_usuario = ANY (ARRAY['admin'::usuario_tipo_enum, 'emissor'::usuario_tipo_enum]))
    AND clinica_id IS NULL AND entidade_id IS NULL
    OR tipo_usuario = 'rh'::usuario_tipo_enum AND clinica_id IS NOT NULL AND entidade_id IS NULL
    OR tipo_usuario = 'gestor'::usuario_tipo_enum AND entidade_id IS NOT NULL AND clinica_id IS NULL
);