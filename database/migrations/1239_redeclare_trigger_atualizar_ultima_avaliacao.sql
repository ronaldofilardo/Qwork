-- Migration 1239: Redeclarar DDL do trigger trigger_atualizar_ultima_avaliacao
-- Contexto:
--   A migration 1106 atualizou a FUNCAO atualizar_ultima_avaliacao_funcionario para escrever
--   per-vinculo (funcionarios_clinicas E funcionarios_entidades), mas nao redeclarou o DDL
--   do TRIGGER. O WHEN condition do trigger ainda provem apenas da migration 016.
--   Esta migration garante que o trigger DDL esta em sincronismo com a funcao atual.
--   Sem esta migracao, o trigger pode ser perdido em ambientes que nao rodaram a migration 016
--   apos qualquer re-criacao da tabela avaliacoes.

DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes;

CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER UPDATE OF status, envio, inativada_em
ON avaliacoes
FOR EACH ROW
WHEN (
  (NEW.status IN ('concluida', 'inativada') AND OLD.status <> NEW.status)
  OR (NEW.envio IS NOT NULL AND OLD.envio IS NULL)
  OR (NEW.inativada_em IS NOT NULL AND OLD.inativada_em IS NULL)
)
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

COMMENT ON TRIGGER trigger_atualizar_ultima_avaliacao ON avaliacoes IS
'Atualiza indice_avaliacao e data_ultimo_lote nas tabelas de vinculo (funcionarios_clinicas, funcionarios_entidades) apos conclusao ou inativacao de avaliacao. Migration 1239 — sincroniza DDL com funcao atualizada na 1106.';
