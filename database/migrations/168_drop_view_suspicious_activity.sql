-- Migration 168: Remove legacy view suspicious_activity
-- A view foi criada em migrations antigas para detectar padrões suspeitos de acesso.
-- Feature removida — análise de padrões suspeitos não está mais no escopo do sistema.
-- Data: 2026-03-22

DROP VIEW IF EXISTS public.suspicious_activity;
