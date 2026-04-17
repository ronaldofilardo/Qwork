-- ============================================================================
-- Migration 9002: Remover Sistema de NF/Ciclos de Comissão (Código Legado)
-- ============================================================================
-- Data: 2026-04-16
-- Contexto: O sistema de ciclos mensais com exigência de NF/RPA para liberar
--           pagamentos foi descontinuado. Esta migration:
--           1. Normaliza status legados antes de remover
--           2. Remove FK e colunas NF de comissoes_laudo
--           3. Remove a tabela ciclos_comissao
--
-- IMPORTANTE: IF EXISTS em todos os comandos — seguro para staging e produção.
-- ============================================================================

BEGIN;

-- 1. Normalizar status legados em comissoes_laudo
--    pendente_consolidacao → retida (aguardando aprovação normal)
--    congelada_rep_suspenso → retida (volta ao estado inicial)
UPDATE comissoes_laudo
  SET status = 'retida'
  WHERE status::text IN ('pendente_consolidacao', 'congelada_rep_suspenso');

-- 2. Normalizar status de representantes bloqueados por NF
--    apto_bloqueado → apto (desbloqueio automático)
UPDATE representantes
  SET status = 'apto'
  WHERE status::text = 'apto_bloqueado';

-- 3. Remover FK de comissoes_laudo → ciclos_comissao
ALTER TABLE comissoes_laudo DROP CONSTRAINT IF EXISTS comissoes_laudo_ciclo_id_fkey;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS ciclo_id;

-- 4. Remover colunas de NF/RPA de comissoes_laudo
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_path;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_nome_arquivo;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_enviada_em;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_aprovada_em;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_rejeitada_em;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_motivo_rejeicao;

-- 5. Remover tabela ciclos_comissao (CASCADE remove FKs dependentes)
DROP TABLE IF EXISTS ciclos_comissao CASCADE;

-- 6. Remover índice do vendedor (pode ter sobrado de migration 1124)
DROP INDEX IF EXISTS idx_ciclos_comissao_vendedor_mes;
DROP INDEX IF EXISTS idx_ciclos_comissao_rep_mes;

-- Nota: Os valores de enum 'pendente_consolidacao', 'congelada_rep_suspenso',
--       'apto_bloqueado' NÃO podem ser removidos do PostgreSQL sem recriar
--       o tipo. Como não causam dano ficando no enum, são mantidos mas
--       não serão mais usados pelo código.

COMMIT;
