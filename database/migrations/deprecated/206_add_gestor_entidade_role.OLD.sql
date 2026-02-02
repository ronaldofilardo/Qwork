-- Migration 206: Adicionar role 'gestor_entidade' na tabela roles
-- Data: 2026-01-29
-- Contexto: Formalizar papel de gestor de entidade no sistema RBAC
--           Sistema já usa 'gestor_entidade' como string literal no código
--           Esta migration adiciona o registro formal na tabela roles para:
--           - Consistência arquitetural (database reflete código)
--           - Base para permissões granulares RBAC
--           - Documentação clara de papéis no sistema
--
-- IMPORTANTE: Esta é uma mudança de ZERO BREAKING CHANGE
--             - Código continua validando perfil via string literal
--             - Nenhum JOIN é feito entre funcionarios.perfil e roles.name
--             - Sistema NUNCA usa FK de perfil para roles
--             - Apenas adiciona infraestrutura para RBAC futuro

BEGIN;

-- ==========================================
-- 1. INSERIR ROLE GESTOR_ENTIDADE
-- ==========================================

INSERT INTO public.roles (
  name,
  display_name,
  description,
  hierarchy_level,
  active
)
VALUES (
  'gestor_entidade',
  'Gestor de Entidade',
  'Gerencia funcionários de sua entidade privada (sem gestão de empresas intermediárias). Tem acesso a: funcionários, lotes de avaliação, laudos e relatórios da própria entidade.',
  10,  -- Mesmo nível que 'rh' e 'emissor'
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  active = EXCLUDED.active;

-- ==========================================
-- 2. CRIAR PERMISSÕES ESPECÍFICAS PARA ENTIDADES
-- ==========================================

-- Permissões com escopo :entidade (diferente de :clinica usado por RH)
INSERT INTO public.permissions (
  name,
  resource,
  action,
  description
)
VALUES
  -- Avaliações
  (
    'read:avaliacoes:entidade',
    'avaliacoes',
    'read',
    'Ler avaliações de funcionários da entidade'
  ),
  
  -- Funcionários
  (
    'read:funcionarios:entidade',
    'funcionarios',
    'read',
    'Ler funcionários da entidade'
  ),
  (
    'write:funcionarios:entidade',
    'funcionarios',
    'write',
    'Criar/editar funcionários da entidade'
  ),
  
  -- Lotes de Avaliação
  (
    'read:lotes:entidade',
    'lotes',
    'read',
    'Ler lotes de avaliação da entidade'
  ),
  (
    'write:lotes:entidade',
    'lotes',
    'write',
    'Criar/editar lotes de avaliação da entidade'
  ),
  
  -- Laudos
  (
    'read:laudos:entidade',
    'laudos',
    'read',
    'Visualizar laudos de funcionários da entidade'
  ),
  
  -- Contratante (própria entidade)
  (
    'read:contratante:own',
    'contratantes',
    'read',
    'Ler dados da própria entidade/clínica'
  ),
  (
    'write:contratante:own',
    'contratantes',
    'write',
    'Editar dados da própria entidade/clínica'
  )
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 3. ASSOCIAR PERMISSÕES AO ROLE GESTOR_ENTIDADE
-- ==========================================

-- Permissões específicas de entidade
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'gestor_entidade' AND p.name IN (
  'read:avaliacoes:entidade',
  'read:funcionarios:entidade',
  'write:funcionarios:entidade',
  'read:lotes:entidade',
  'write:lotes:entidade',
  'read:laudos:entidade',
  'read:contratante:own',
  'write:contratante:own'
)
ON CONFLICT DO NOTHING;

-- Permissões genéricas (acesso aos próprios dados)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'gestor_entidade' AND p.name IN (
  'read:avaliacoes:own',    -- Pode ver próprias avaliações (caso faça teste)
  'read:funcionarios:own'   -- Pode ver próprios dados
)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. ADICIONAR COMENTÁRIOS EXPLICATIVOS
-- ==========================================

COMMENT ON TABLE public.roles IS 
'Tabela de papéis (roles) do sistema RBAC. Perfis: funcionario, rh, emissor, admin, gestor_entidade. IMPORTANTE: funcionarios.perfil é VARCHAR, NÃO FK para esta tabela. Validação é por string literal.';

-- ==========================================
-- 5. VERIFICAÇÕES E MENSAGENS
-- ==========================================

DO $$
DECLARE
  role_count INTEGER;
  perm_count INTEGER;
  assoc_count INTEGER;
  role_id INTEGER;
BEGIN
  -- Verificar role foi criado
  SELECT COUNT(*), MAX(id) INTO role_count, role_id 
  FROM public.roles 
  WHERE name = 'gestor_entidade';
  
  IF role_count = 0 THEN
    RAISE EXCEPTION 'ERRO CRÍTICO: Role gestor_entidade não foi criado!';
  END IF;
  
  -- Verificar permissões foram criadas
  SELECT COUNT(*) INTO perm_count 
  FROM public.permissions 
  WHERE name LIKE '%:entidade' OR name LIKE '%:own';
  
  IF perm_count < 8 THEN
    RAISE WARNING 'AVISO: Apenas % de 8 permissões esperadas foram criadas', perm_count;
  END IF;
  
  -- Verificar associações
  SELECT COUNT(*) INTO assoc_count 
  FROM public.role_permissions rp
  JOIN public.roles r ON r.id = rp.role_id
  WHERE r.name = 'gestor_entidade';
  
  IF assoc_count = 0 THEN
    RAISE WARNING 'AVISO: Nenhuma permissão foi associada ao role gestor_entidade';
  END IF;
  
  -- Mensagens de sucesso
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OK - Migration 206 aplicada com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Resumo:';
  RAISE NOTICE '  - Role "gestor_entidade" criado: ID %', role_id;
  RAISE NOTICE '  - Permissoes criadas: % permissao(oes)', perm_count;
  RAISE NOTICE '  - Associacoes criadas: % associacao(oes)', assoc_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Proximos passos:';
  RAISE NOTICE '  1. Validar: SELECT * FROM roles WHERE name = ''gestor_entidade'';';
  RAISE NOTICE '  2. Testar: Fazer login como gestor de entidade';
  RAISE NOTICE '  3. Verificar: Sistema continua funcionando normalmente';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '  - Codigo NAO precisa de mudanca (valida perfil via string)';
  RAISE NOTICE '  - Esta migration adiciona apenas infraestrutura RBAC';
  RAISE NOTICE '  - Zero breaking change no sistema existente';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ==========================================
-- VALIDACAO POS-MIGRATION (Copiar e executar separadamente)
-- ==========================================

/*
-- Verificar role foi criado
SELECT 
  id,
  name,
  display_name,
  description,
  hierarchy_level,
  active,
  created_at
FROM roles 
WHERE name = 'gestor_entidade';

-- Verificar permissões associadas
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action,
  p.description
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'gestor_entidade'
ORDER BY p.resource, p.action;

-- Comparar com role 'rh' (devem ser similares, exceto empresas)
SELECT 
  r.name as role_name,
  COUNT(*) as total_permissions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.name IN ('rh', 'gestor_entidade')
GROUP BY r.name;

-- Verificar que perfil continua sendo string (não FK)
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'funcionarios'
  AND column_name = 'perfil';
-- Deve retornar: data_type = 'character varying', length = 20

-- Validar que não há FK de perfil para roles
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'funcionarios'
  AND constraint_name LIKE '%perfil%';
-- Deve retornar: apenas CHECK constraints, NENHUMA FK
*/

-- ==========================================
-- ROLLBACK (Se necessário)
-- ==========================================

/*
BEGIN;

-- Remover associações
DELETE FROM role_permissions
WHERE role_id IN (
  SELECT id FROM roles WHERE name = 'gestor_entidade'
);

-- Remover permissões específicas de entidade
DELETE FROM permissions
WHERE name LIKE '%:entidade' OR name LIKE '%:own';

-- Remover role
DELETE FROM roles WHERE name = 'gestor_entidade';

COMMIT;
*/
