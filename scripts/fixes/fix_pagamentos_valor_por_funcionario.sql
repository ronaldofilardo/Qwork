-- Corrige pagamentos onde valor_por_funcionario ou numero_funcionarios está ausente
-- Estratégia segura:
-- 1) Para pagamentos com contrato_id preenchido: usar valores do contrato (valor_personalizado e numero_funcionarios)
-- 2) Senão, usar valores do plano vinculado ao contratante (pl.valor_por_funcionario) e contratante.numero_funcionarios_estimado
-- 3) Atualizar pagamentos.valor = valor_por_funcionario * numero_funcionarios
-- 4) Atualizar recibos relacionados (valor_total_anual, valor_por_funcionario, numero_funcionarios_cobertos)

BEGIN;

-- 1) Atualizar pagamentos com contrato
WITH to_update AS (
  SELECT p.id as pagamento_id, ctr.id as contrato_id, 
         COALESCE(ctr.valor_personalizado, pl.valor_por_funcionario, 20.00) as unit,
         COALESCE(ctr.numero_funcionarios, c.numero_funcionarios_estimado, 1) as nfunc
  FROM pagamentos p
  JOIN contratos ctr ON p.contrato_id = ctr.id
  LEFT JOIN planos pl ON ctr.plano_id = pl.id
  JOIN tomadores c ON p.contratante_id = c.id
  WHERE (p.valor_por_funcionario IS NULL OR p.numero_funcionarios IS NULL)
)
UPDATE pagamentos p
SET valor_por_funcionario = tu.unit,
    numero_funcionarios = tu.nfunc,
    valor = tu.unit * tu.nfunc
FROM to_update tu
WHERE p.id = tu.pagamento_id;

-- 2) Atualizar pagamentos sem contrato, usando plano do contratante
WITH to_update2 AS (
  SELECT p.id as pagamento_id, 
         COALESCE(pl.valor_por_funcionario, 20.00) as unit,
         COALESCE(c.numero_funcionarios_estimado, 1) as nfunc
  FROM pagamentos p
  LEFT JOIN planos pl ON pl.id = (
    SELECT plano_id FROM tomadores WHERE id = p.contratante_id LIMIT 1
  )
  JOIN tomadores c ON p.contratante_id = c.id
  WHERE p.contrato_id IS NULL AND (p.valor_por_funcionario IS NULL OR p.numero_funcionarios IS NULL)
)
UPDATE pagamentos p
SET valor_por_funcionario = tu.unit,
    numero_funcionarios = tu.nfunc,
    valor = tu.unit * tu.nfunc
FROM to_update2 tu
WHERE p.id = tu.pagamento_id;

-- 3) Propagar valores para recibos existentes
UPDATE recibos r
SET valor_total_anual = p.valor,
    valor_por_funcionario = p.valor_por_funcionario,
    numero_funcionarios_cobertos = p.numero_funcionarios
FROM pagamentos p
WHERE r.pagamento_id = p.id
  AND (r.valor_total_anual IS NULL OR r.valor_total_anual <> p.valor OR r.valor_por_funcionario IS NULL OR r.numero_funcionarios_cobertos IS NULL);

COMMIT;

-- Exibir resumo após execução
SELECT 'Resumo: pagamentos atualizados' as info,
       COUNT(*) as total_pagamentos_ajustados
FROM pagamentos p
WHERE p.valor_por_funcionario IS NOT NULL AND p.numero_funcionarios IS NOT NULL;

-- FIM
