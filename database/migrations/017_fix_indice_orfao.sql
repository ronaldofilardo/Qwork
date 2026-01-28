-- Correção Crítica: Limpar dados órfãos de avaliações deletadas
-- Problema: Funcionários têm indice_avaliacao > 0 mas nenhuma avaliação concluída no banco
-- Causa: Lotes foram deletados, mas campos indice_avaliacao/data_ultimo_lote não foram limpos

BEGIN;

-- 1) LIMPAR dados órfãos: resetar indice_avaliacao e data_ultimo_lote
-- para funcionários que NÃO têm avaliações concluídas

UPDATE funcionarios f
SET 
  indice_avaliacao = 0,
  data_ultimo_lote = NULL,
  atualizado_em = NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM avaliacoes a 
  WHERE a.funcionario_cpf = f.cpf 
  AND a.status = 'concluida'
)
AND (f.indice_avaliacao > 0 OR f.data_ultimo_lote IS NOT NULL);

-- 2) RECALCULAR indice_avaliacao e data_ultimo_lote baseado em avaliações reais
-- Para funcionários que TÊM avaliações concluídas

WITH avaliacoes_reais AS (
  SELECT 
    a.funcionario_cpf,
    MAX(la.numero_ordem) as ultimo_numero,
    MAX(a.envio) as data_conclusao
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.status = 'concluida'
  GROUP BY a.funcionario_cpf
)
UPDATE funcionarios f
SET 
  indice_avaliacao = ar.ultimo_numero,
  data_ultimo_lote = ar.data_conclusao,
  atualizado_em = NOW()
FROM avaliacoes_reais ar
WHERE f.cpf = ar.funcionario_cpf
AND (f.indice_avaliacao <> ar.ultimo_numero OR f.data_ultimo_lote <> ar.data_conclusao);

-- 3) CRIAR TRIGGER para limpar quando avaliações forem deletadas
CREATE OR REPLACE FUNCTION limpar_indice_ao_deletar_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a avaliação deletada era concluída, recalcular indice do funcionário
  IF OLD.status = 'concluida' THEN
    -- Buscar a última avaliação concluída restante
    WITH ultima_restante AS (
      SELECT 
        MAX(la.numero_ordem) as ultimo_numero,
        MAX(a.envio) as data_conclusao
      FROM avaliacoes a
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.funcionario_cpf = OLD.funcionario_cpf
      AND a.status = 'concluida'
      AND a.id <> OLD.id  -- Excluir a que está sendo deletada
    )
    UPDATE funcionarios
    SET 
      indice_avaliacao = COALESCE((SELECT ultimo_numero FROM ultima_restante), 0),
      data_ultimo_lote = (SELECT data_conclusao FROM ultima_restante),
      atualizado_em = NOW()
    WHERE cpf = OLD.funcionario_cpf;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_limpar_indice_ao_deletar ON avaliacoes;

CREATE TRIGGER trigger_limpar_indice_ao_deletar
BEFORE DELETE ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION limpar_indice_ao_deletar_avaliacao();

COMMIT;

-- Relatório de correções
SELECT 
  'Dados órfãos limpos' as status,
  COUNT(*) FILTER (WHERE indice_avaliacao = 0 AND data_ultimo_lote IS NULL) as funcionarios_zerados,
  COUNT(*) FILTER (WHERE indice_avaliacao > 0) as funcionarios_com_avaliacoes
FROM funcionarios
WHERE empresa_id = 7;
