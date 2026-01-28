-- Migration: 044_create_mat_vw_recibos
-- Cria materialized view `vw_recibos_completos_mat` para melhorar performance em consultas de recibos

DROP MATERIALIZED VIEW IF EXISTS vw_recibos_completos_mat;

CREATE MATERIALIZED VIEW vw_recibos_completos_mat AS
SELECT * FROM vw_recibos_completos;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_recibos_completos_mat_id ON vw_recibos_completos_mat (id);
CREATE INDEX IF NOT EXISTS idx_vw_recibos_completos_mat_numero ON vw_recibos_completos_mat (numero_recibo);
CREATE INDEX IF NOT EXISTS idx_vw_recibos_completos_mat_criado ON vw_recibos_completos_mat (criado_em DESC);

-- Função para refresh concurrente (quando possível)
CREATE OR REPLACE FUNCTION refresh_vw_recibos_completos_mat() RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Refreshing materialized view vw_recibos_completos_mat';
  PERFORM 1; -- placeholder
  EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY vw_recibos_completos_mat';
EXCEPTION WHEN undefined_function THEN
  -- Some PostgreSQL versions / configs might not support CONCURRENTLY in certain contexts; fallback
  REFRESH MATERIALIZED VIEW vw_recibos_completos_mat;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW vw_recibos_completos_mat IS 'Materialized view para consultas de recibos com cópia dos dados de vw_recibos_completos (incluir passo de refresh periódico)';
COMMENT ON FUNCTION refresh_vw_recibos_completos_mat IS 'Função helper para atualizar materialized view vw_recibos_completos_mat';
