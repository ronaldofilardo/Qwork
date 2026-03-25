-- Migration 1127: Criar tabela importacoes_clinica para histórico de importações em massa
-- Data: 2026-03-25

CREATE TABLE IF NOT EXISTS importacoes_clinica (
  id SERIAL PRIMARY KEY,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  usuario_cpf VARCHAR(11) NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  total_linhas INTEGER NOT NULL,
  empresas_criadas INTEGER DEFAULT 0,
  empresas_existentes INTEGER DEFAULT 0,
  funcionarios_criados INTEGER DEFAULT 0,
  funcionarios_atualizados INTEGER DEFAULT 0,
  vinculos_criados INTEGER DEFAULT 0,
  vinculos_atualizados INTEGER DEFAULT 0,
  inativacoes INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'concluido',
  erros_detalhes JSONB,
  mapeamento_colunas JSONB,
  tempo_processamento_ms INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consulta de histórico por clínica
CREATE INDEX IF NOT EXISTS idx_importacoes_clinica_clinica_id ON importacoes_clinica(clinica_id);
CREATE INDEX IF NOT EXISTS idx_importacoes_clinica_criado_em ON importacoes_clinica(criado_em DESC);
