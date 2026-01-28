-- Cria tabela audit_logs mínima usada pela view materializada
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  contratante_id INTEGER,
  action VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_contratante ON audit_logs (contratante_id);
COMMENT ON TABLE audit_logs IS 'Tabela de logs de auditoria (criada temporariamente para permitir criação de views).';
