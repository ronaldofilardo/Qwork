-- Migração: Sistema de Jobs para Geração de PDFs em Background
-- Data: 2026-01-01
-- Descrição: Cria tabela pdf_jobs e triggers para enfileirar geração de PDFs de recibos

BEGIN;

-- 1) Tabela de jobs para processamento de PDFs
CREATE TABLE IF NOT EXISTS pdf_jobs (
  id SERIAL PRIMARY KEY,
  recibo_id INTEGER NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  UNIQUE(recibo_id) -- Um job por recibo (idempotente)
);

CREATE INDEX idx_pdf_jobs_status ON pdf_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_pdf_jobs_recibo ON pdf_jobs(recibo_id);
CREATE INDEX idx_pdf_jobs_created ON pdf_jobs(created_at);

-- 2) Função trigger para criar job quando recibo é inserido sem PDF
CREATE OR REPLACE FUNCTION trigger_criar_pdf_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Se recibo foi criado/atualizado e não tem PDF, enfileirar job
  IF NEW.pdf IS NULL AND NEW.ativo = true THEN
    INSERT INTO pdf_jobs (recibo_id, status, attempts)
    VALUES (NEW.id, 'pending', 0)
    ON CONFLICT (recibo_id) DO NOTHING; -- Evitar duplicatas
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger em recibos para auto-enfileirar
DROP TRIGGER IF EXISTS trg_recibos_criar_pdf_job ON recibos;
CREATE TRIGGER trg_recibos_criar_pdf_job
AFTER INSERT OR UPDATE ON recibos
FOR EACH ROW
EXECUTE FUNCTION trigger_criar_pdf_job();

-- 4) Função para atualizar updated_at em pdf_jobs
CREATE OR REPLACE FUNCTION update_pdf_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pdf_jobs_update_timestamp ON pdf_jobs;
CREATE TRIGGER trg_pdf_jobs_update_timestamp
BEFORE UPDATE ON pdf_jobs
FOR EACH ROW
EXECUTE FUNCTION update_pdf_jobs_timestamp();

COMMIT;

-- Verificação
SELECT 'Tabela pdf_jobs criada com sucesso' as status;
SELECT COUNT(*) as total_jobs_pendentes FROM pdf_jobs WHERE status = 'pending';