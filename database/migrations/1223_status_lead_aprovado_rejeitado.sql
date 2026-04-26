-- Migration 1223: Adicionar valores 'aprovado' e 'rejeitado' ao enum status_lead
-- Necessário para as rotas /api/suporte/leads/[id]/aprovar e /api/suporte/leads/[id]/rejeitar
-- Estas rotas já setavam esses status mas o enum não os tinha — bug confirmado.
-- 
-- PostgreSQL exige ADD VALUE fora de bloco transacional para DDL de enum.
-- Executar após garantir que não há constraint que bloqueie.

ALTER TYPE public.status_lead ADD VALUE IF NOT EXISTS 'aprovado';
ALTER TYPE public.status_lead ADD VALUE IF NOT EXISTS 'rejeitado';
