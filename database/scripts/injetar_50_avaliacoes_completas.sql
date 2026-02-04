-- ==========================================
-- Script: Injetar 50 avaliações completas em um lote existente
-- Descrição: Cria avaliações completas para funcionários que nunca foram avaliados
--             com respostas aleatórias e resultados calculados
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

-- ==========================================
-- CONFIGURAÇÕES INICIAIS
-- ==========================================
-- Substitua esses valores pelos IDs reais
\set LOTE_ID 1
\set EMPRESA_ID 1

-- ==========================================
-- 1. VERIFICAR DADOS BASE
-- ==========================================
BEGIN;

-- Verificar se lote existe e está ativo
SELECT id, codigo, status, empresa_id
FROM lotes_avaliacao
WHERE id = :LOTE_ID
  AND empresa_id = :EMPRESA_ID;

-- Contar funcionários elegíveis (ativos, nunca avaliados)
SELECT COUNT(*) as total_funcionarios_elegiveis
FROM funcionarios
WHERE empresa_id = :EMPRESA_ID
  AND ativo = true
  AND indice_avaliacao = 0;

-- ==========================================
-- 2. CRIAR AVALIAÇÕES
-- ==========================================

-- Tabela temporária para armazenar funcionários selecionados
CREATE TEMP TABLE temp_funcionarios_selecionados AS
SELECT cpf, nome
FROM funcionarios
WHERE empresa_id = :EMPRESA_ID
  AND ativo = true
  AND indice_avaliacao = 0
LIMIT 50;

-- Inserir avaliações
INSERT INTO avaliacoes (
  funcionario_cpf,
  inicio,
  envio,
  status,
  grupo_atual,
  lote_id,
  criado_em,
  atualizado_em
)
SELECT 
  cpf,
  NOW() - INTERVAL '1 day' * (random() * 30)::integer, -- Data aleatória nos últimos 30 dias
  NOW() - INTERVAL '1 hour' * (random() * 24)::integer, -- Data de envio após início
  'concluida'::varchar,
  10, -- Último grupo
  :LOTE_ID,
  NOW(),
  NOW()
FROM temp_funcionarios_selecionados
RETURNING id, funcionario_cpf;

-- ==========================================
-- 3. GERAR RESPOSTAS ALEATÓRIAS
-- ==========================================
-- Respostas possíveis (0, 25, 50, 75, 100)
WITH respostas_possiveis AS (
  SELECT unnest(ARRAY[0, 25, 50, 75, 100]) as valor
),
-- Grupos e itens baseados em lib/questoes.ts
grupos_itens AS (
  SELECT 1 as grupo, 'Q1' as item UNION ALL
  SELECT 1 as grupo, 'Q2' as item UNION ALL
  SELECT 1 as grupo, 'Q3' as item UNION ALL
  SELECT 1 as grupo, 'Q9' as item UNION ALL
  SELECT 2 as grupo, 'Q13' as item UNION ALL
  SELECT 2 as grupo, 'Q17' as item UNION ALL
  SELECT 2 as grupo, 'Q18' as item UNION ALL
  SELECT 2 as grupo, 'Q19' as item UNION ALL
  SELECT 3 as grupo, 'Q20' as item UNION ALL
  SELECT 3 as grupo, 'Q21' as item UNION ALL
  SELECT 3 as grupo, 'Q23' as item UNION ALL
  SELECT 3 as grupo, 'Q25' as item UNION ALL
  SELECT 3 as grupo, 'Q26' as item UNION ALL
  SELECT 3 as grupo, 'Q28' as item UNION ALL
  SELECT 4 as grupo, 'Q31' as item UNION ALL
  SELECT 4 as grupo, 'Q32' as item UNION ALL
  SELECT 4 as grupo, 'Q33' as item UNION ALL
  SELECT 4 as grupo, 'Q34' as item UNION ALL
  SELECT 5 as grupo, 'Q35' as item UNION ALL
  SELECT 5 as grupo, 'Q38' as item UNION ALL
  SELECT 5 as grupo, 'Q41' as item UNION ALL
  SELECT 6 as grupo, 'Q43' as item UNION ALL
  SELECT 6 as grupo, 'Q45' as item UNION ALL
  SELECT 7 as grupo, 'Q48' as item UNION ALL
  SELECT 7 as grupo, 'Q52' as item UNION ALL
  SELECT 7 as grupo, 'Q55' as item UNION ALL
  SELECT 8 as grupo, 'Q56' as item UNION ALL
  SELECT 8 as grupo, 'Q57' as item UNION ALL
  SELECT 8 as grupo, 'Q58' as item UNION ALL
  SELECT 9 as grupo, 'Q59' as item UNION ALL
  SELECT 9 as grupo, 'Q61' as item UNION ALL
  SELECT 9 as grupo, 'Q62' as item UNION ALL
  SELECT 9 as grupo, 'Q64' as item UNION ALL
  SELECT 10 as grupo, 'Q65' as item UNION ALL
  SELECT 10 as grupo, 'Q66' as item UNION ALL
  SELECT 10 as grupo, 'Q68' as item UNION ALL
  SELECT 10 as grupo, 'Q70' as item
),
-- Combinações de avaliações com grupos/itens
avaliacoes_itens AS (
  SELECT 
    a.id as avaliacao_id,
    gi.grupo,
    gi.item
  FROM avaliacoes a
  JOIN temp_funcionarios_selecionados t ON a.funcionario_cpf = t.cpf
  CROSS JOIN grupos_itens gi
  WHERE a.lote_id = :LOTE_ID
)
-- Inserir respostas aleatórias
INSERT INTO respostas (
  avaliacao_id,
  grupo,
  item,
  valor,
  criado_em
)
SELECT 
  ai.avaliacao_id,
  ai.grupo,
  ai.item,
  (SELECT valor FROM respostas_possiveis ORDER BY random() LIMIT 1),
  NOW()
FROM avaliacoes_itens ai;

-- ==========================================
-- 4. CALCULAR RESULTADOS
-- ==========================================

-- Função auxiliar para calcular score do grupo
CREATE OR REPLACE FUNCTION calcular_score_grupo(p_avaliacao_id INTEGER, p_grupo INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  v_total_itens INTEGER;
  v_soma_valores NUMERIC;
  v_score NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_itens
  FROM respostas 
  WHERE avaliacao_id = p_avaliacao_id AND grupo = p_grupo;
  
  SELECT COALESCE(SUM(valor), 0) INTO v_soma_valores
  FROM respostas 
  WHERE avaliacao_id = p_avaliacao_id AND grupo = p_grupo;
  
  v_score := (v_soma_valores / (v_total_itens * 100)) * 100;
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Inserir resultados por grupo
INSERT INTO resultados (
  avaliacao_id,
  grupo,
  dominio,
  score,
  categoria,
  criado_em
)
SELECT 
  a.id as avaliacao_id,
  g.grupo,
  g.dominio,
  calcular_score_grupo(a.id, g.grupo) as score,
  CASE 
    WHEN calcular_score_grupo(a.id, g.grupo) >= 75 THEN 'alto'
    WHEN calcular_score_grupo(a.id, g.grupo) >= 50 THEN 'medio'
    ELSE 'baixo'
  END as categoria,
  NOW()
FROM avaliacoes a
CROSS JOIN (
  SELECT 1 as grupo, 'Demandas no Trabalho' as dominio UNION ALL
  SELECT 2 as grupo, 'Organização e Conteúdo do Trabalho' as dominio UNION ALL
  SELECT 3 as grupo, 'Relações Sociais e Liderança' as dominio UNION ALL
  SELECT 4 as grupo, 'Interface Trabalho-Indivíduo' as dominio UNION ALL
  SELECT 5 as grupo, 'Valores Organizacionais' as dominio UNION ALL
  SELECT 6 as grupo, 'Traços de Personalidade' as dominio UNION ALL
  SELECT 7 as grupo, 'Saúde e Bem-Estar' as dominio UNION ALL
  SELECT 8 as grupo, 'Comportamentos Ofensivos' as dominio UNION ALL
  SELECT 9 as grupo, 'Comportamento de Jogo' as dominio UNION ALL
  SELECT 10 as grupo, 'Endividamento Financeiro' as dominio
) g
WHERE a.lote_id = :LOTE_ID
  AND EXISTS (SELECT 1 FROM temp_funcionarios_selecionados t WHERE a.funcionario_cpf = t.cpf);

-- ==========================================
-- 5. ANÁLISE ESTATÍSTICA
-- ==========================================

-- Inserir análise estatística
INSERT INTO analise_estatistica (
  avaliacao_id,
  grupo,
  score_original,
  score_ajustado,
  anomalia_detectada,
  tipo_anomalia,
  recomendacao,
  created_at
)
SELECT 
  r.avaliacao_id,
  r.grupo,
  r.score as score_original,
  r.score as score_ajustado,
  CASE 
    WHEN r.score IN (0, 25, 50, 75, 100) THEN true
    WHEN r.score < 0 OR r.score > 100 THEN true
    WHEN r.grupo = 8 AND r.score > 0 THEN true
    ELSE false
  END as anomalia_detectada,
  CASE 
    WHEN r.score IN (0, 25, 50, 75, 100) THEN 'Possível padrão de resposta uniforme'
    WHEN r.score < 0 OR r.score > 100 THEN 'Score fora do intervalo válido'
    WHEN r.grupo = 8 AND r.score > 0 THEN 'Comportamentos ofensivos detectados'
    ELSE null
  END as tipo_anomalia,
  CASE 
    WHEN r.grupo = 8 AND r.score > 0 THEN 'Implementar programa de prevenção ao assédio e violência'
    ELSE null
  END as recomendacao,
  NOW()
FROM resultados r
WHERE EXISTS (
  SELECT 1 FROM temp_funcionarios_selecionados t 
  JOIN avaliacoes a ON t.cpf = a.funcionario_cpf
  WHERE a.id = r.avaliacao_id AND a.lote_id = :LOTE_ID
);

-- ==========================================
-- 6. ATUALIZAR FUNCIONÁRIOS
-- ==========================================
-- Atualizar índice de avaliação e data do último lote
UPDATE funcionarios f
SET 
  indice_avaliacao = (SELECT numero_ordem FROM lotes_avaliacao WHERE id = :LOTE_ID),
  data_ultimo_lote = NOW(),
  atualizado_em = NOW()
WHERE EXISTS (
  SELECT 1 FROM temp_funcionarios_selecionados t 
  WHERE f.cpf = t.cpf
);

-- ==========================================
-- 7. VERIFICAR RESULTADOS
-- ==========================================
-- Contar avaliações criadas
SELECT COUNT(*) as avaliacoes_criadas
FROM avaliacoes 
WHERE lote_id = :LOTE_ID
  AND EXISTS (SELECT 1 FROM temp_funcionarios_selecionados t WHERE funcionario_cpf = t.cpf);

-- Contar respostas geradas
SELECT COUNT(*) as respostas_geradas
FROM respostas r
JOIN avaliacoes a ON r.avaliacao_id = a.id
WHERE a.lote_id = :LOTE_ID
  AND EXISTS (SELECT 1 FROM temp_funcionarios_selecionados t WHERE a.funcionario_cpf = t.cpf);

-- Contar resultados calculados
SELECT COUNT(*) as resultados_calculados
FROM resultados r
JOIN avaliacoes a ON r.avaliacao_id = a.id
WHERE a.lote_id = :LOTE_ID
  AND EXISTS (SELECT 1 FROM temp_funcionarios_selecionados t WHERE a.funcionario_cpf = t.cpf);

-- ==========================================
-- 8. LIMPEZA TEMPORÁRIA
-- ==========================================
DROP FUNCTION IF EXISTS calcular_score_grupo;
DROP TABLE IF EXISTS temp_funcionarios_selecionados;

COMMIT;

-- ==========================================
-- EXPLICAR PASSOS
-- ==========================================
/*
1. **Configuração Inicial**: Define os IDs do lote e empresa para a operação
2. **Verificação de Dados**: Confere se o lote existe e conta funcionários elegíveis
3. **Criação de Avaliações**: Insere registros na tabela `avaliacoes` com status 'concluida'
4. **Geração de Respostas**: Cria respostas aleatórias para cada questão usando valores válidos (0, 25, 50, 75, 100)
5. **Cálculo de Resultados**: Calcula o score por grupo e determina a categoria (baixo/medio/alto)
6. **Análise Estatística**: Detecta anomalias nos scores (padrões uniformes, valores fora do range, comportamentos ofensivos)
7. **Atualização de Funcionários**: Atualiza o índice de avaliação e a data do último lote dos funcionários avaliados

NOTAS:
- O script seleciona apenas funcionários que nunca foram avaliados (indice_avaliacao = 0)
- Cada avaliação é associada exclusivamente ao lote especificado
- Respostas são aleatórias para simular comportamento real
- Scores são calculados com base na soma das respostas por grupo
*/
