-- ============================================================
-- SEED EMISSOR - BANCO NEON PRODUÇÃO
-- Data: 2026-02-03
-- Objetivo: Criar role emissor + permissões + seed de emissor específico
-- ============================================================

BEGIN;

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

-- Permissão: read:laudos
INSERT INTO public.permissions (name, resource, action, description)
VALUES (
  'read:laudos',
  'laudos',
  'read',
  'Permissão para visualizar laudos'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- Permissão: write:laudos
INSERT INTO public.permissions (name, resource, action, description)
VALUES (
  'write:laudos',
  'laudos',
  'write',
  'Permissão para criar e atualizar laudos'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- Permissão: read:lotes:clinica
INSERT INTO public.permissions (name, resource, action, description)
VALUES (
  'read:lotes:clinica',
  'lotes',
  'read',
  'Permissão para visualizar lotes finalizados de todas as clínicas'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- ============================================================
-- 3. ASSOCIAR PERMISSÕES AO ROLE EMISSOR
-- ============================================================

-- Associar read:laudos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'emissor' AND p.name = 'read:laudos'
ON CONFLICT DO NOTHING;

-- Associar write:laudos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'emissor' AND p.name = 'write:laudos'
ON CONFLICT DO NOTHING;

-- Associar read:lotes:clinica
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'emissor' AND p.name = 'read:lotes:clinica'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CRIAR EMISSOR ESPECÍFICO (CPF: 53051173991)
-- ============================================================

-- Hash da senha '5978rdf' gerado com bcrypt (custo 10)
-- Você pode gerar um novo hash se necessário com: bcrypt.hash('5978rdf', 10)
-- Hash exemplo: $2a$10$... (substitua pelo hash real se tiver bcryptjs disponível)

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
  'sender@qwork.com',
  '$2a$10$ez.cvULSRPa0CE3QugnWQeMFL2qMy9OF.lz2EW/s.cJ0Hv.2LGr7G',
  'emissor',
  'emissor',
  NULL, -- emissor independente (sem clinica_id)
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

-- ============================================================
-- 5. VERIFICAÇÕES (OPCIONAL - COMENTADO POR PADRÃO)
-- ============================================================

-- Descomentar para validar após execução:

-- -- Verificar role criado
-- SELECT id, name, display_name, hierarchy_level, active FROM public.roles WHERE name = 'emissor';

-- -- Verificar permissões associadas
-- SELECT p.name, p.resource, p.action
-- FROM public.permissions p
-- JOIN public.role_permissions rp ON p.id = rp.permission_id
-- JOIN public.roles r ON r.id = rp.role_id
-- WHERE r.name = 'emissor'
-- ORDER BY p.name;

-- -- Verificar emissor criado
-- SELECT cpf, nome, email, perfil, usuario_tipo, clinica_id, ativo
-- FROM public.funcionarios
-- WHERE cpf = '53051173991';

COMMIT;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- INSTRUÇÕES DE USO:
-- 1. Acesse o console SQL do Neon (https://console.neon.tech)
-- 2. Selecione o banco de produção
-- 3. IMPORTANTE: Gere o hash real da senha '5978rdf' usando bcryptjs
--    Exemplo em Node.js: const bcrypt = require('bcryptjs'); bcrypt.hash('5978rdf', 10).then(console.log);
-- 4. Substitua o hash placeholder na linha 93 pelo hash real
-- 5. Cole e execute este script completo
-- 6. Descomente as verificações se quiser validar os resultados
-- 7. Execute: SELECT * FROM public.roles WHERE name = 'emissor';
--    Execute: SELECT * FROM public.funcionarios WHERE cpf = '53051173991';
