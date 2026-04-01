-- Script: Criar views tomadores e gestores no staging
-- Gerado para resolver gap de views entre DEV e staging

-- Step 1: Adicionar plano_id em clinicas (nao existe no staging)
ALTER TABLE public.clinicas ADD COLUMN IF NOT EXISTS plano_id INTEGER;

-- Step 2: View tomadores (UNION de entidades + clinicas)
CREATE OR REPLACE VIEW public.tomadores AS
  SELECT id, nome, cnpj,
         'entidade'::varchar(20) AS tipo,
         email, responsavel_nome, responsavel_cpf,
         responsavel_email, responsavel_celular,
         plano_id, ativa, pagamento_confirmado, status,
         numero_funcionarios_estimado, criado_em, atualizado_em
  FROM public.entidades WHERE id IS NOT NULL
  UNION ALL
  SELECT id, nome, cnpj,
         'clinica'::varchar(20) AS tipo,
         email, responsavel_nome, responsavel_cpf,
         responsavel_email, responsavel_celular,
         plano_id, ativa, pagamento_confirmado, status,
         numero_funcionarios_estimado, criado_em, atualizado_em
  FROM public.clinicas WHERE id IS NOT NULL;

-- Step 3: View gestores (usuarios com tipo rh ou gestor)
CREATE OR REPLACE VIEW public.gestores AS
  SELECT cpf, nome, email,
    tipo_usuario AS usuario_tipo,
    CASE
      WHEN tipo_usuario = 'rh'::usuario_tipo_enum THEN 'RH (Clinica)'
      WHEN tipo_usuario = 'gestor'::usuario_tipo_enum THEN 'Gestor de Entidade'
      ELSE 'Outro'
    END AS tipo_gestor_descricao,
    clinica_id, entidade_id, ativo, criado_em, atualizado_em
  FROM public.usuarios
  WHERE tipo_usuario = ANY(ARRAY['rh'::usuario_tipo_enum, 'gestor'::usuario_tipo_enum]);

SELECT 'Views tomadores e gestores criadas com sucesso!' AS resultado;
