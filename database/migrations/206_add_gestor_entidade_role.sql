-- Migration 206: Adicionar role gestor_entidade na tabela roles
-- Data: 2026-01-29
-- Contexto: Formalizar papel de gestor de entidade no sistema RBAC

BEGIN;

INSERT INTO public.roles (name, display_name, description, hierarchy_level, active)
VALUES ('gestor_entidade', 'Gestor de Entidade', 'Gerencia funcionarios de sua entidade privada', 10, true)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description;

INSERT INTO public.permissions (name, resource, action, description)
VALUES
  ('read:avaliacoes:entidade', 'avaliacoes', 'read', 'Ler avaliacoes de funcionarios da entidade'),
  ('read:funcionarios:entidade', 'funcionarios', 'read', 'Ler funcionarios da entidade'),
  ('write:funcionarios:entidade', 'funcionarios', 'write', 'Criar/editar funcionarios da entidade'),
  ('read:lotes:entidade', 'lotes', 'read', 'Ler lotes de avaliacao da entidade'),
  ('write:lotes:entidade', 'lotes', 'write', 'Criar/editar lotes de avaliacao da entidade'),
  ('read:laudos:entidade', 'laudos', 'read', 'Visualizar laudos de funcionarios da entidade'),
  ('read:contratante:own', 'contratantes', 'read', 'Ler dados da propria entidade'),
  ('write:contratante:own', 'contratantes', 'write', 'Editar dados da propria entidade')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'gestor_entidade' AND p.name IN (
  'read:avaliacoes:entidade', 'read:funcionarios:entidade', 'write:funcionarios:entidade',
  'read:lotes:entidade', 'write:lotes:entidade', 'read:laudos:entidade',
  'read:contratante:own', 'write:contratante:own'
)
ON CONFLICT DO NOTHING;

SELECT 'OK - Role gestor_entidade criado com sucesso!' as status;

COMMIT;
