-- Migration 208: Sync local database with Neon production
-- Created: 2026-01-29
-- Purpose: Add missing tables and permissions from Neon to local database

BEGIN;

-- 1. Add missing permissions
INSERT INTO permissions (name, resource, action, description)
VALUES 
  ('manage:rh', 'rh', 'manage', 'Manage RH settings'),
  ('manage:admins', 'admins', 'manage', 'Manage admin users')
ON CONFLICT (name) DO NOTHING;

-- 2. Create audit_access_denied table
CREATE TABLE IF NOT EXISTS audit_access_denied (
  id BIGSERIAL PRIMARY KEY,
  user_cpf CHAR(11),
  user_perfil VARCHAR(20),
  attempted_action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id TEXT,
  reason TEXT,
  query_text TEXT,
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_denied_created_at ON audit_access_denied(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_denied_resource ON audit_access_denied(resource);
CREATE INDEX IF NOT EXISTS idx_audit_denied_user_cpf ON audit_access_denied(user_cpf);

-- 3. Create laudo_arquivos_remotos table
CREATE TABLE IF NOT EXISTS laudo_arquivos_remotos (
  id SERIAL PRIMARY KEY,
  laudo_id INTEGER NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  bucket VARCHAR(255) NOT NULL,
  key VARCHAR(1024) NOT NULL,
  url TEXT NOT NULL,
  checksum VARCHAR(128),
  size_bytes BIGINT,
  tipo VARCHAR(32) DEFAULT 'principal',
  criado_por VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laudo_arquivos_remotos_laudo_id ON laudo_arquivos_remotos(laudo_id);
CREATE INDEX IF NOT EXISTS idx_laudo_arquivos_remotos_tipo ON laudo_arquivos_remotos(laudo_id, tipo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_laudo_arquivos_remotos_principal_unique ON laudo_arquivos_remotos(laudo_id) WHERE tipo = 'principal';

-- 4. Create laudo_downloads table
CREATE TABLE IF NOT EXISTS laudo_downloads (
  id SERIAL PRIMARY KEY,
  laudo_id INTEGER NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  arquivo_remoto_id INTEGER REFERENCES laudo_arquivos_remotos(id) ON DELETE SET NULL,
  user_cpf CHAR(11),
  user_perfil VARCHAR(20),
  ip_address INET,
  user_agent TEXT,
  download_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laudo_downloads_laudo_id ON laudo_downloads(laudo_id);
CREATE INDEX IF NOT EXISTS idx_laudo_downloads_created_at ON laudo_downloads(created_at DESC);

-- 5. Create fila_emissao table
CREATE TABLE IF NOT EXISTS fila_emissao (
  id SERIAL PRIMARY KEY,
  laudo_id INTEGER NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  prioridade INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'pending',
  tentativas INTEGER DEFAULT 0,
  erro_mensagem TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  processado_em TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fila_emissao_status ON fila_emissao(status);
CREATE INDEX IF NOT EXISTS idx_fila_emissao_prioridade ON fila_emissao(prioridade DESC, criado_em ASC);

-- 6. Create lote_id_allocator table
CREATE TABLE IF NOT EXISTS lote_id_allocator (
  id SERIAL PRIMARY KEY,
  clinica_id INTEGER,
  contratante_id INTEGER,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  last_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinica_id, contratante_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_lote_allocator_clinica ON lote_id_allocator(clinica_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_lote_allocator_contratante ON lote_id_allocator(contratante_id, ano, mes);

-- 7. Create policy_expression_backups table
CREATE TABLE IF NOT EXISTS policy_expression_backups (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50),
  policy_expression TEXT NOT NULL,
  backed_up_at TIMESTAMP DEFAULT NOW(),
  restored_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_policy_backups_table ON policy_expression_backups(table_name);

-- 8. Create laudo_generation_jobs table
CREATE TABLE IF NOT EXISTS laudo_generation_jobs (
  id SERIAL PRIMARY KEY,
  laudo_id INTEGER NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  prioridade INTEGER DEFAULT 5,
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  erro_mensagem TEXT,
  worker_id VARCHAR(100),
  criado_em TIMESTAMP DEFAULT NOW(),
  iniciado_em TIMESTAMP,
  finalizado_em TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laudo_jobs_status ON laudo_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_laudo_jobs_laudo_id ON laudo_generation_jobs(laudo_id);
CREATE INDEX IF NOT EXISTS idx_laudo_jobs_prioridade ON laudo_generation_jobs(prioridade DESC, criado_em ASC);

-- 9. Add RLS policies on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_admin_all ON roles;
CREATE POLICY roles_admin_all ON roles
  FOR ALL
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS roles_admin_select ON roles;
CREATE POLICY roles_admin_select ON roles
  FOR SELECT
  USING (current_user_perfil() = 'admin');

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 208 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '- 2 new permissions (manage:rh, manage:admins)';
  RAISE NOTICE '- 7 new tables';
  RAISE NOTICE '- RLS policies on roles table';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
