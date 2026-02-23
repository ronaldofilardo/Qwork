-- Migration 1101: Adicionar colunas de arquivo em empresas_clientes
-- Necessário para persistir caminhos dos documentos enviados no cadastro de empresas clientes da clínica.
-- Inclui: Cartão CNPJ, Contrato Social e Documento de Identificação do representante.

ALTER TABLE empresas_clientes
  ADD COLUMN IF NOT EXISTS cartao_cnpj_path      character varying,
  ADD COLUMN IF NOT EXISTS contrato_social_path  character varying,
  ADD COLUMN IF NOT EXISTS doc_identificacao_path character varying;

COMMENT ON COLUMN empresas_clientes.cartao_cnpj_path       IS 'Caminho do arquivo Cartão CNPJ enviado no cadastro';
COMMENT ON COLUMN empresas_clientes.contrato_social_path   IS 'Caminho do arquivo Contrato Social enviado no cadastro';
COMMENT ON COLUMN empresas_clientes.doc_identificacao_path IS 'Caminho do arquivo de identificação do representante enviado no cadastro';

-- Atualizar rastreador — não é gerenciado automaticamente neste projeto, manter manualmente.
-- UPDATE schema_migrations SET version = 1101 WHERE version = 1100;
