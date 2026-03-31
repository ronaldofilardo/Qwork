-- Migration 1030: Atribui código ao Representante Teste (CPF 33333333333)
-- O campo codigo é NOT NULL e auto-gerado via trigger apenas no INSERT.
-- Registros criados via SQL direto podem não ter o código preenchido corretamente.

UPDATE public.representantes
SET
  codigo = public.gerar_codigo_representante(),
  atualizado_em = NOW()
WHERE cpf = '33333333333'
  AND (codigo IS NULL OR codigo = '' OR LENGTH(REPLACE(codigo, '-', '')) < 8);
