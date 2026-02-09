-- Migration 900: Simplificar gestor_entidade → gestor
-- Data: 2026-02-09
-- Descrição: Padroniza perfil 'gestor_entidade' para 'gestor' em todo o sistema

BEGIN;

-- ================================================
-- 1. REMOVER CONSTRAINTS ANTIGOS PRIMEIRO
-- ================================================

ALTER TABLE auditoria_laudos
DROP CONSTRAINT IF EXISTS chk_tipo_solicitante_valid;

ALTER TABLE notificacoes
DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;

-- ================================================
-- 2. ATUALIZAR DADOS EXISTENTES
-- ================================================

-- Atualizar auditoria_laudos
UPDATE auditoria_laudos
SET tipo_solicitante = 'gestor'
WHERE tipo_solicitante = 'gestor_entidade';

-- Atualizar notificacoes
UPDATE notificacoes
SET destinatario_tipo = 'gestor'
WHERE destinatario_tipo = 'gestor_entidade';

-- ================================================
-- 3. RECRIAR CONSTRAINTS COM NOVOS VALORES
-- ================================================

ALTER TABLE auditoria_laudos
ADD CONSTRAINT chk_tipo_solicitante_valid
CHECK (
  tipo_solicitante IS NULL OR 
  tipo_solicitante IN ('rh', 'gestor', 'admin', 'emissor')
);

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos IS 
'Valida tipos permitidos de solicitante: rh, gestor, admin, emissor.';

-- ================================================
-- 3. ATUALIZAR CONSTRAINT em notificacoes
-- ================================================

ALTER TABLE notificacoes
DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;

ALTER TABLE notificacoes
ADD CONSTRAINT notificacoes_destinatario_tipo_check
CHECK (
  destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor'::text, 'funcionario'::text, 'contratante'::text, 'clinica'::text])
);

-- ================================================
-- 4. LOG
-- ================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 900: Perfil gestor_entidade → gestor aplicado com sucesso';
END $$;

COMMIT;
