-- Migration 006: Adicionar função helper e colunas faltantes para recibos
-- Data: 2026-01-15

-- 1) Criar ou substituir função de trigger atualizar_data_modificacao
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Garantir coluna conteudo_gerado em contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS conteudo_gerado TEXT;

-- 3) Criar/atualizar view vw_recibos_completos (safe to replace)
CREATE OR REPLACE VIEW vw_recibos_completos AS
SELECT 
  r.id,
  r.numero_recibo,
  r.vigencia_inicio,
  r.vigencia_fim,
  r.numero_funcionarios_cobertos,
  r.valor_total_anual,
  r.valor_por_funcionario,
  r.forma_pagamento,
  r.numero_parcelas,
  r.descricao_pagamento,
  r.criado_em,
  c.id AS contrato_id,
  c.conteudo_gerado AS contrato_conteudo,
  c.data_aceite AS contrato_data_aceite,
  ct.nome AS contratante_nome,
  ct.cnpj AS contratante_cnpj,
  ct.email AS contratante_email,
  ct.tipo AS contratante_tipo,
  p.nome AS plano_nome,
  p.tipo AS plano_tipo,
  pg.metodo AS pagamento_metodo,
  pg.data_pagamento,
  pg.status AS pagamento_status
FROM recibos r
INNER JOIN contratos c ON r.contrato_id = c.id
INNER JOIN tomadores ct ON r.contratante_id = ct.id
INNER JOIN pagamentos pg ON r.pagamento_id = pg.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE r.ativo = true
ORDER BY r.criado_em DESC;