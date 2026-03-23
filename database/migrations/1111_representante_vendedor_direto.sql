-- Migration 1111: Representante como Vendedor Direto
-- Adiciona coluna percentual_vendedor_direto em representantes.
-- Quando um representante cria leads diretamente (sem vendedor intermediário),
-- usa esse percentual de comissão separado do percentual_comissao da equipe.

ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS percentual_vendedor_direto NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN representantes.percentual_vendedor_direto IS
  'Percentual de comissão do representante quando age como vendedor direto (cria leads sem vendedor intermediário). NULL = não definido pelo admin.';
