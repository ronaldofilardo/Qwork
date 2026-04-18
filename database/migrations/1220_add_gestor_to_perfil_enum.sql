-- =============================================================================
-- Migration 1220: Adicionar 'gestor' ao perfil_usuario_enum
-- Data: 2026-04-18
-- Contexto: Auditoria RBAC revelou que 'gestor' existe em usuario_tipo_enum
--   e é usado na sessão da aplicação, mas não estava em perfil_usuario_enum.
--   Isso causa inconsistência entre os dois enums e pode quebrar constraints
--   futuras que validem contra perfil_usuario_enum.
--
-- NOTA: ADD VALUE não pode ser executado dentro de transação com rollback.
--       Esta migration é idempotente via IF NOT EXISTS.
-- =============================================================================

-- ADD VALUE para enum não pode ser dentro de BEGIN/COMMIT
ALTER TYPE public.perfil_usuario_enum ADD VALUE IF NOT EXISTS 'gestor';
