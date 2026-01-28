-- Trigger para atualizar view materializada automaticamente
-- Este trigger chama refresh_mv_admin_contratante_dashboard() após mudanças relevantes

-- Trigger para contratantes
CREATE OR REPLACE FUNCTION trigger_refresh_mv_contratantes()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh concorrente (não bloqueia leituras)
  PERFORM refresh_mv_admin_contratante_dashboard();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS trg_refresh_mv_on_contratantes ON contratantes;
CREATE TRIGGER trg_refresh_mv_on_contratantes
  AFTER INSERT OR UPDATE OR DELETE ON contratantes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_contratantes();

DROP TRIGGER IF EXISTS trg_refresh_mv_on_pagamentos ON pagamentos;
CREATE TRIGGER trg_refresh_mv_on_pagamentos
  AFTER INSERT OR UPDATE OR DELETE ON pagamentos
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_contratantes();

DROP TRIGGER IF EXISTS trg_refresh_mv_on_avaliacoes ON avaliacoes;
CREATE TRIGGER trg_refresh_mv_on_avaliacoes
  AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_contratantes();

-- Trigger para funcionários (afeta contagens)
DROP TRIGGER IF EXISTS trg_refresh_mv_on_funcionarios ON funcionarios;
CREATE TRIGGER trg_refresh_mv_on_funcionarios
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_mv_contratantes();