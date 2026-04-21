-- Migration 1215
-- DEV only: Cria Comercial unico CPF 22222222222
-- ASCII only - sem emojis/caracteres especiais
-- Data: 17/04/2026

-- ==========================================================
-- STEP 1: Remover constraint PF-only temporariamente
-- Constraint tipo 'c' (CHECK) - pode ser feito via DDL direto
-- ==========================================================
ALTER TABLE public.representantes DROP CONSTRAINT IF EXISTS representantes_somente_pj;

-- ==========================================================
-- STEP 2: Desabilitar trigger de auto-codigo para codigo='2' manual
-- ==========================================================
ALTER TABLE public.representantes DISABLE TRIGGER trg_representante_codigo;

-- ==========================================================
-- STEP 3: Criar usuario comercial (se nao existir)
-- ==========================================================
INSERT INTO public.usuarios (cpf, nome, email, tipo_usuario, ativo, criado_em, atualizado_em)
SELECT '22222222222', 'Comercial', 'comercial@qwork.app.br', 'comercial', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios WHERE cpf = '22222222222' AND tipo_usuario = 'comercial'
);

-- ==========================================================
-- STEP 4: Criar vendedores_perfil codigo=100
-- Usa ON CONFLICT pois codigo e usuario_id sao UNIQUE
-- ==========================================================
INSERT INTO public.vendedores_perfil (usuario_id, codigo, tipo_pessoa, criado_em, atualizado_em)
SELECT u.id, '100', 'pf', NOW(), NOW()
FROM public.usuarios u
WHERE u.cpf = '22222222222'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendedores_perfil vp WHERE vp.usuario_id = u.id
  );

-- ==========================================================
-- STEP 5: Criar representante Comercial PF codigo=2
-- Valido apenas para este registro especial de sistema
-- ==========================================================
INSERT INTO public.representantes (
  tipo_pessoa, nome, email, telefone, cpf, codigo, status,
  gestor_comercial_cpf, aceite_termos, aceite_disclaimer_nv, criado_em, atualizado_em
)
SELECT 'pf', 'Comercial', 'comercial@qwork.app.br', '00000000000',
       '22222222222', '2', 'ativo', '22222222222',
       false, false, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.representantes WHERE cpf = '22222222222'
);

-- ==========================================================
-- STEP 6: Reabilitar trigger
-- ==========================================================
ALTER TABLE public.representantes ENABLE TRIGGER trg_representante_codigo;

-- ==========================================================
-- STEP 7: Re-adicionar constraint NOT VALID
-- NOT VALID = row PF existente nao e revalidada, novos inserts PF sao bloqueados
-- ==========================================================
ALTER TABLE public.representantes
  ADD CONSTRAINT representantes_somente_pj
  CHECK (tipo_pessoa = 'pj') NOT VALID;

-- ==========================================================
-- VERIFICACAO
-- ==========================================================
SELECT 'usuario' AS tabela, id::text, cpf, nome, tipo_usuario AS info
  FROM public.usuarios WHERE cpf = '22222222222' AND tipo_usuario = 'comercial';

SELECT 'vendedor_perfil' AS tabela, vp.id::text, u.cpf, vp.codigo AS nome, vp.tipo_pessoa AS info
  FROM public.vendedores_perfil vp
  JOIN public.usuarios u ON u.id = vp.usuario_id
 WHERE u.cpf = '22222222222';

SELECT 'representante' AS tabela, id::text, cpf, nome, status AS info
  FROM public.representantes WHERE cpf = '22222222222';