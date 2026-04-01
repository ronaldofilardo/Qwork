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
SELECT 'tomadores criada' AS resultado;
