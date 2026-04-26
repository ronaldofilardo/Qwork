-- Migration 1226
-- Fix constraint representantes_somente_pj para permitir comercial especial (PF com CPF='22222222222')
-- Origem: comercial PF foi criado em 1215, mas constraint impede UPDATE

ALTER TABLE public.representantes
  DROP CONSTRAINT IF EXISTS representantes_somente_pj;

-- Novo constraint: PJ normal OU comercial especial (PF com CPF='22222222222')
ALTER TABLE public.representantes
  ADD CONSTRAINT representantes_somente_pj
  CHECK (
    (tipo_pessoa = 'pj')
    OR (tipo_pessoa = 'pf' AND cpf = '22222222222')
  );
