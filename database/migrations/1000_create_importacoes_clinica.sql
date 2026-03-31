-- Migration 1000: Criar tabela importacoes_clinica
-- Histórico e auditoria de importações em massa de empresas/funcionários por clínicas

CREATE TABLE IF NOT EXISTS importacoes_clinica (
  id SERIAL PRIMARY KEY,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  usuario_cpf CHARACTER(11) NOT NULL,
  data_importacao TIMESTAMP NOT NULL DEFAULT NOW(),
  arquivo_nome VARCHAR(255) NOT NULL,
  total_linhas INTEGER NOT NULL DEFAULT 0,
  total_empresas_criadas INTEGER DEFAULT 0,
  total_empresas_existentes INTEGER DEFAULT 0,
  total_funcionarios_criados INTEGER DEFAULT 0,
  total_funcionarios_atualizados INTEGER DEFAULT 0,
  total_vinculos_criados INTEGER DEFAULT 0,
  total_vinculos_atualizados INTEGER DEFAULT 0,
  total_inativacoes INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'concluida',
  erros_detalhes JSONB,
  mapeamento_colunas JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_importacoes_clinica_clinica ON importacoes_clinica(clinica_id);
CREATE INDEX IF NOT EXISTS idx_importacoes_clinica_data ON importacoes_clinica(data_importacao DESC);
CREATE INDEX IF NOT EXISTS idx_importacoes_clinica_status ON importacoes_clinica(status);
