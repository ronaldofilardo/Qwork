-- Migration 400: REMOÇÃO FINAL - Gestores NUNCA em funcionarios
-- Data: 05/02/2026
-- Objetivo: Remover definitivamente qualquer suporte a gestor/rh em funcionarios
-- Após esta migration, gestores só existem em 'usuarios' (fonte única de verdade)
-- NOTA: Adaptada para estrutura atual do banco (usuarios tabela simples)

BEGIN;

-- PARTE 1: BACKUP FINAL de qualquer gestor ainda em funcionarios
CREATE TABLE IF NOT EXISTS funcionarios_backup_gestores_final_400 AS 
SELECT * FROM funcionarios 
WHERE perfil IN ('gestor', 'rh') 
   OR usuario_tipo IN ('gestor', 'rh');

-- Log
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM funcionarios_backup_gestores_final_400;
    RAISE NOTICE '[MIGRATION 400] Backup de % registros de gestores em funcionarios', v_count;
END $$;

-- PARTE 2: REGISTRAR GESTORES EM USUARIOS (estrutura simples atual)
-- Nota: A tabela usuarios atual tem apenas (id, cpf, nome, role, ativo, criado_em)
-- Registramos os gestores para não perdê-los, mesmo com estrutura simplificada
INSERT INTO usuarios (cpf, nome, role, ativo, criado_em)
SELECT DISTINCT
    f.cpf,
    f.nome,
    CASE 
        WHEN f.perfil = 'gestor' THEN 'gestor'
        WHEN f.perfil = 'rh' OR f.usuario_tipo = 'rh' THEN 'rh'
        ELSE 'admin'
    END,
    COALESCE(f.ativo, TRUE),
    COALESCE(f.criado_em, NOW())
FROM funcionarios f
WHERE (f.perfil IN ('gestor', 'rh') 
   OR f.usuario_tipo IN ('gestor', 'rh'))
  AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.cpf = f.cpf)
ON CONFLICT (cpf) DO UPDATE SET
    role = CASE 
        WHEN EXCLUDED.role IN ('gestor', 'rh') THEN EXCLUDED.role
        ELSE usuarios.role
    END,
    ativo = EXCLUDED.ativo;

-- Log migração
DO $$
DECLARE
    v_migrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_migrated 
    FROM usuarios u
    INNER JOIN funcionarios_backup_gestores_final_400 f ON u.cpf = f.cpf;
    RAISE NOTICE '[MIGRATION 400] % gestores registrados em usuarios', v_migrated;
END $$;

-- PARTE 3: DELETAR GESTORES DE FUNCIONARIOS
DELETE FROM funcionarios 
WHERE perfil IN ('gestor', 'rh')
   OR usuario_tipo IN ('gestor', 'rh');

-- Log deleção
DO $$
BEGIN
    RAISE NOTICE '[MIGRATION 400] Gestores removidos de funcionarios';
END $$;

-- PARTE 4: CONSTRAINT FINAL - PROIBIR gestor em funcionarios
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_gestor_in_funcionarios;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS chk_perfil_gestor;

ALTER TABLE funcionarios
ADD CONSTRAINT no_gestor_in_funcionarios CHECK (
    perfil NOT IN ('gestor', 'rh')
);

COMMENT ON CONSTRAINT no_gestor_in_funcionarios ON funcionarios IS 
'Gestores (gestor, rh) devem existir apenas em tabela usuarios. Proibido em funcionarios.';

-- PARTE 5: REMOVER FUNÇÕES QUE CRIAM GESTORES EM FUNCIONARIOS
DROP FUNCTION IF EXISTS fn_create_funcionario_autorizado(VARCHAR, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN, INTEGER);

-- PARTE 6: ATUALIZAR CHECK CONSTRAINT DE PERFIL
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_perfil_check CHECK (
    perfil IN ('funcionario', 'admin', 'emissor', 'cadastro')
);

COMMENT ON CONSTRAINT funcionarios_perfil_check ON funcionarios IS 
'Perfis permitidos em funcionarios: funcionario, admin, emissor, cadastro. Gestores vão para usuarios.';

-- PARTE 7: ATUALIZAR CHECK CONSTRAINT DE USUARIO_TIPO (remover gestores)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_usuario_tipo_exclusivo;

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_usuario_tipo_exclusivo CHECK (
    (usuario_tipo = 'funcionario_clinica' AND empresa_id IS NOT NULL AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
    (usuario_tipo = 'funcionario_entidade' AND contratante_id IS NOT NULL AND empresa_id IS NULL AND clinica_id IS NULL) OR
    (usuario_tipo IN ('admin', 'emissor') AND clinica_id IS NULL AND contratante_id IS NULL AND empresa_id IS NULL)
);

COMMENT ON CONSTRAINT funcionarios_usuario_tipo_exclusivo ON funcionarios IS 
'Permite apenas funcionario_clinica, funcionario_entidade, admin, emissor. Gestores (rh, gestor) proibidos - devem estar em usuarios.';

-- PARTE 8: LOG FINAL
DO $$
DECLARE
    v_funcionarios_count INTEGER;
    v_usuarios_gestores_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_funcionarios_count FROM funcionarios;
    SELECT COUNT(*) INTO v_usuarios_gestores_count 
    FROM usuarios WHERE role IN ('gestor', 'rh');
    
    RAISE NOTICE '=== [MIGRATION 400] CONCLUIDA ===';
    RAISE NOTICE '   - Total funcionarios: %', v_funcionarios_count;
    RAISE NOTICE '   - Total gestores em usuarios: %', v_usuarios_gestores_count;
    RAISE NOTICE '   - Backup em: funcionarios_backup_gestores_final_400';
END $$;

COMMIT;
