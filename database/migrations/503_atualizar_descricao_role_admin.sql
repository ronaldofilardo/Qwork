-- =========================================
-- MIGRATION 503: Atualizar Descrição da Role Admin
-- =========================================
-- Data: 2026-02-06
-- Motivo: Atualizar descrição para refletir corretamente escopo administrativo
-- =========================================

BEGIN;

UPDATE roles 
SET description = 'Administrador do sistema - gerencia APENAS aspectos administrativos: tomadores (clínicas e entidades), planos e emissores. NÃO tem acesso operacional (empresas, funcionários, avaliações, lotes, laudos)'
WHERE name = 'admin';

COMMIT;

-- Descrição atualizada para remover menções outdated
