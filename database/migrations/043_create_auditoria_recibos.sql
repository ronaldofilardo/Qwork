-- Migration: 043_create_auditoria_recibos
-- Tabela de auditoria para ações relacionadas a recibos (geração PDF, reprocessamentos, erros)

CREATE TABLE IF NOT EXISTS auditoria_recibos (
  id serial PRIMARY KEY,
  recibo_id integer NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
  acao varchar(80) NOT NULL,
  status varchar(40) NOT NULL,
  ip_address varchar(50),
  observacoes text,
  criado_em timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_recibos_recibo ON auditoria_recibos (recibo_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_recibos_criado ON auditoria_recibos (criado_em DESC);

COMMENT ON TABLE auditoria_recibos IS 'Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocessamento, erro)';
