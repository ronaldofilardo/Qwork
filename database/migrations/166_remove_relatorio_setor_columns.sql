-- Migration 166: Remoção definitiva de relatorio_setor do banco de dados
-- Data: 2026-02-27
-- Contexto: Feature de relatório por setor nunca foi completada/publicada.
--           As colunas existem mas nunca foram populadas via API (rotas foram deletadas).
--           Nenhuma query ativa lê ou escreve nesses campos.
--           O componente RelatorioSetor.tsx e as APIs relatorio-setor/ já foram removidos.
-- Ambientes: dev e prod

-- Passo 1: Remover o índice parcial
DROP INDEX IF EXISTS idx_laudos_relatorio_setor;

-- Passo 2: Remover as colunas
ALTER TABLE laudos
  DROP COLUMN IF EXISTS relatorio_setor,
  DROP COLUMN IF EXISTS hash_relatorio_setor;

-- Verificação pós-migration (execute manualmente para confirmar):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'laudos'
--   AND column_name IN ('relatorio_setor', 'hash_relatorio_setor');
-- Resultado esperado: 0 linhas
