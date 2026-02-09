-- Trigger para atualizar view materializada automaticamente
-- Este trigger chama refresh_mv_admin_contratante_dashboard() após mudanças relevantes

-- Trigger para entidades (renomeado de tomadores)
CREATE OR REPLACE FUNCTION trigger_refresh_mv_entidades()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh concorrente (não bloqueia leituras)
  PERFORM refresh_mv_admin_contratante_dashboard();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS trg_refresh_mv_on_entidades ON entidades;
CREATE TRIGGER trg_refresh_mv_on_entidades
  AFTER INSERT OR UPDATE OR DELETE ON entidades
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_entidades();

DROP TRIGGER IF EXISTS trg_refresh_mv_on_pagamentos ON pagamentos;
CREATE TRIGGER trg_refresh_mv_on_pagamentos
  AFTER INSERT OR UPDATE OR DELETE ON pagamentos
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_entidades();

DROP TRIGGER IF EXISTS trg_refresh_mv_on_avaliacoes ON avaliacoes;
CREATE TRIGGER trg_refresh_mv_on_avaliacoes
  AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_entidades();

-- Trigger para funcionários (afeta contagens)
DROP TRIGGER IF EXISTS trg_refresh_mv_on_funcionarios ON funcionarios;
CREATE TRIGGER trg_refresh_mv_on_funcionarios
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_entidades();

-- Nota: Tabela "entidades" foi renomeada para 'entidades'