-- ============================================================
-- SEED EMISSOR - BANCO NEON PRODUÇÃO (BYPASS RLS)
-- Data: 2026-02-03
-- Objetivo: Criar role emissor + permissões + seed de emissor específico
-- ATENÇÃO: Execute este script como OWNER/SUPERUSER no console Neon
-- ============================================================

-- IMPORTANTE: Este script desabilita RLS temporariamente
-- Execute no SQL Editor do Neon com usuário 'neondb_owner'

BEGIN;

-- Desabilitar RLS temporariamente (requer permissões de owner)
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.funcionarios DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. CRIAR ROLE EMISSOR
-- ============================================================
INSERT INTO public.roles (name, display_name, description, hierarchy_level, active, created_at)
VALUES (
  'emissor',
  'Emissor de Laudos',
  'Profissional responsável pela emissão e assinatura de laudos médicos - papel independente',
  80,
  TRUE,
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  active = EXCLUDED.active;

-- ============================================================
-- 2. CRIAR PERMISSÕES NECESSÁRIAS PARA EMISSOR
-- ============================================================

INSERT INTO public.permissions (name, resource, action, description)
VALUES 
  ('read:laudos', 'laudos', 'read', 'Permissão para visualizar laudos'),
  ('write:laudos', 'laudos', 'write', 'Permissão para criar e atualizar laudos'),
  ('read:lotes:clinica', 'lotes', 'read', 'Permissão para visualizar lotes finalizados de todas as clínicas')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================
-- 3. ASSOCIAR PERMISSÕES AO ROLE EMISSOR
-- ============================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'emissor' 
  AND p.name IN ('read:laudos', 'write:laudos', 'read:lotes:clinica')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CRIAR EMISSOR ESPECÍFICO (CPF: 53051173991)
-- ============================================================

INSERT INTO public.funcionarios (
  cpf,
  nome,
  email,
  senha_hash,
  perfil,
  usuario_tipo,
  clinica_id,
  ativo,
  indice_avaliacao,
  criado_em,
  atualizado_em
)
VALUES (
  '53051173991',
  'Emissor Teste QWork',
  'emissor@qwork.com.br',
  '$2a$10$ez.cvULSRPa0CE3QugnWQeMFL2qMy9OF.lz2EW/s.cJ0Hv.2LGr7G',
  'emissor',
  'emissor',
  NULL,
  TRUE,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  senha_hash = EXCLUDED.senha_hash,
  perfil = EXCLUDED.perfil,
  usuario_tipo = EXCLUDED.usuario_tipo,
  clinica_id = EXCLUDED.clinica_id,
  ativo = EXCLUDED.ativo,
  atualizado_em = NOW();

-- Reabilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. VERIFICAÇÕES
-- ============================================================

-- Verificar role criado
SELECT 'ROLE CRIADO:' as status;
SELECT id, name, display_name, hierarchy_level, active 
FROM public.roles 
WHERE name = 'emissor';

-- Verificar permissões associadas
SELECT 'PERMISSÕES ASSOCIADAS:' as status;
SELECT p.name, p.resource, p.action
FROM public.permissions p
JOIN public.role_permissions rp ON p.id = rp.permission_id
JOIN public.roles r ON r.id = rp.role_id
WHERE r.name = 'emissor'
ORDER BY p.name;

-- Verificar emissor criado
SELECT 'EMISSOR CRIADO:' as status;
SELECT cpf, nome, email, perfil, usuario_tipo, clinica_id, ativo
FROM public.funcionarios
WHERE cpf = '53051173991';

COMMIT;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
