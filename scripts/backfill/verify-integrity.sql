-- Relatório: verificar integridade dos contratos/recibos/documentos
-- Gera um resumo para avaliar o estado atual antes de rodar o backfill

SELECT
  (SELECT COUNT(*) FROM contratos) as total_contratos,
  (SELECT COUNT(*) FROM contratos WHERE hash_contrato IS NULL) as contratos_sem_hash,
  (SELECT COUNT(*) FROM contratos WHERE pdf_contrato IS NULL) as contratos_sem_pdf,
  (SELECT COUNT(*) FROM recibos) as total_recibos,
  (SELECT COUNT(*) FROM recibos WHERE hash_pdf IS NULL) as recibos_sem_hash,
  (SELECT COUNT(*) FROM documentos_contratacao) as total_documentos,
  (SELECT COUNT(*) FROM documentos_contratacao WHERE hash_original IS NULL) as documentos_sem_hash;

-- Exibir amostra de contratos sem hash
SELECT id, contratante_id, criado_em FROM contratos WHERE hash_contrato IS NULL ORDER BY criado_em DESC LIMIT 20;

-- Exibir amostra de contratos sem pdf
SELECT id, contratante_id, criado_em FROM contratos WHERE pdf_contrato IS NULL ORDER BY criado_em DESC LIMIT 20;

-- Exibir documentos apontando para arquivos inexistentes
SELECT id, contratante_id, tipo, caminho_arquivo FROM documentos_contratacao WHERE NOT (caminho_arquivo IS NULL) LIMIT 100; -- ver manualmente caminhos
