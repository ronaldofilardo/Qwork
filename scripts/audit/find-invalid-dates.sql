-- 🔍 SCRIPT DE AUDITORIA - Procurar Datas Impossíveis no Banco de Dados
-- 
-- Este script identifica funcionários com datas de nascimento impossíveis
-- como 31/02/1990, 31/04/1990, etc.
-- 
-- CUIDADO: Executar PRIMEIRO em staging/backup antes de PROD!

-- ============================================================
-- 1️⃣ VERIFICAÇÃO: Encontrar datas impossíveis
-- ============================================================

-- Query 1: Fevereiro com mais de 28 dias (ignorar bissextos por enquanto)
SELECT 
  'Fevereiro 31+ dias' AS tipo_erro,
  COUNT(*) AS quantidade,
  STRING_AGG(CONCAT(cpf, ' - ', nome), ', ' ORDER BY cpf) AS funcionarios
FROM funcionarios
WHERE 
  EXTRACT(MONTH FROM data_nascimento) = 2 
  AND EXTRACT(DAY FROM data_nascimento) > 29
GROUP BY EXTRACT(MONTH FROM data_nascimento);

-- Query 2: Meses com 30 dias tendo dia 31
SELECT 
  'Dia 31 em mêses com 30 dias' AS tipo_erro,
  CASE EXTRACT(MONTH FROM data_nascimento)
    WHEN 4 THEN 'Abril'
    WHEN 6 THEN 'Junho'
    WHEN 9 THEN 'Setembro'
    WHEN 11 THEN 'Novembro'
  END AS mes,
  COUNT(*) AS quantidade,
  STRING_AGG(CONCAT(cpf, ' - ', nome), ', ' ORDER BY cpf) AS funcionarios
FROM funcionarios
WHERE 
  EXTRACT(DAY FROM data_nascimento) = 31
  AND EXTRACT(MONTH FROM data_nascimento) IN (4, 6, 9, 11)
GROUP BY EXTRACT(MONTH FROM data_nascimento);

-- Query 3: 29 de Fevereiro em anos NÃO-bissextos
WITH bissextos AS (
  SELECT 
    EXTRACT(YEAR FROM data_nascimento)::integer AS ano,
    (
      EXTRACT(YEAR FROM data_nascimento)::integer % 4 = 0 
      AND (EXTRACT(YEAR FROM data_nascimento)::integer % 100 != 0 
           OR EXTRACT(YEAR FROM data_nascimento)::integer % 400 = 0)
    ) AS eh_bissexto
  FROM funcionarios
  WHERE 
    EXTRACT(MONTH FROM data_nascimento) = 2 
    AND EXTRACT(DAY FROM data_nascimento) = 29
)
SELECT 
  'Fevereiro 29 em não-bissextos' AS tipo_erro,
  COUNT(*) AS quantidade,
  STRING_AGG(DISTINCT ano::text, ', ' ORDER BY ano::text) AS anos
FROM bissextos
WHERE eh_bissexto = FALSE;

-- Query 4: Listagem DETALHADA de todas as anomalias
SELECT 
  f.cpf,
  f.nome,
  f.data_nascimento,
  EXTRACT(DAY FROM f.data_nascimento)::int AS dia,
  EXTRACT(MONTH FROM f.data_nascimento)::int AS mes,
  EXTRACT(YEAR FROM f.data_nascimento)::int AS ano,
  CASE 
    WHEN EXTRACT(MONTH FROM f.data_nascimento) = 2 AND EXTRACT(DAY FROM f.data_nascimento) > 29 
      THEN '❌ Fevereiro com 31 dias'
    WHEN EXTRACT(MONTH FROM f.data_nascimento) IN (4, 6, 9, 11) AND EXTRACT(DAY FROM f.data_nascimento) = 31 
      THEN '❌ Mês com 30 dias tem dia 31'
    WHEN EXTRACT(MONTH FROM f.data_nascimento) = 2 AND EXTRACT(DAY FROM f.data_nascimento) = 29 
      AND (EXTRACT(YEAR FROM f.data_nascimento)::int % 4 != 0 
           OR (EXTRACT(YEAR FROM f.data_nascimento)::int % 100 = 0 
               AND EXTRACT(YEAR FROM f.data_nascimento)::int % 400 != 0))
      THEN '❌ Fevereiro 29 em não-bissexto'
    ELSE '✓ Válida'
  END AS status
FROM funcionarios f
WHERE 
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 AND EXTRACT(DAY FROM f.data_nascimento) > 29
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) IN (4, 6, 9, 11) 
    AND EXTRACT(DAY FROM f.data_nascimento) = 31
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 
    AND EXTRACT(DAY FROM f.data_nascimento) = 29
    AND (EXTRACT(YEAR FROM f.data_nascimento)::int % 4 != 0 
         OR (EXTRACT(YEAR FROM f.data_nascimento)::int % 100 = 0 
             AND EXTRACT(YEAR FROM f.data_nascimento)::int % 400 != 0))
  )
ORDER BY f.data_nascimento DESC;

-- ============================================================
-- 2️⃣ RESUMO: Quantas datas impossíveis existem?
-- ============================================================

SELECT 
  COUNT(*) AS total_funcionarios_com_data_impossivel,
  COUNT(DISTINCT cpf) AS funcionarios_unicos,
  MIN(data_nascimento) AS data_mais_antiga,
  MAX(data_nascimento) AS data_mais_recente
FROM funcionarios f
WHERE 
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 AND EXTRACT(DAY FROM f.data_nascimento) > 29
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) IN (4, 6, 9, 11) 
    AND EXTRACT(DAY FROM f.data_nascimento) = 31
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 
    AND EXTRACT(DAY FROM f.data_nascimento) = 29
    AND (EXTRACT(YEAR FROM f.data_nascimento)::int % 4 != 0 
         OR (EXTRACT(YEAR FROM f.data_nascimento)::int % 100 = 0 
             AND EXTRACT(YEAR FROM f.data_nascimento)::int % 400 != 0))
  );

-- ============================================================
-- 3️⃣ SCRIPT DE CORREÇÃO (Use com CUIDADO!)
-- ============================================================
-- 
-- OPÇÃO 1: Corrigir para último dia válido do mês
-- (Exemplo: 31/02/1990 → 28/02/1990)

-- ⚠️ BACKU P ANTES! ⚠️
-- CREATE TABLE funcionarios_backup AS SELECT * FROM funcionarios;

-- Fevereiro 31 → Fevereiro 28
UPDATE funcionarios
SET data_nascimento = 
  (data_nascimento - INTERVAL '3 days')::DATE
WHERE 
  EXTRACT(MONTH FROM data_nascimento) = 2 
  AND EXTRACT(DAY FROM data_nascimento) > 29;

-- Abril, Junho, Setembro, Novembro: dia 31 → dia 30
UPDATE funcionarios
SET data_nascimento = 
  (data_nascimento - INTERVAL '1 day')::DATE
WHERE 
  EXTRACT(DAY FROM data_nascimento) = 31
  AND EXTRACT(MONTH FROM data_nascimento) IN (4, 6, 9, 11);

-- ============================================================
-- 4️⃣ VERIFICAÇÃO PÓS-CORREÇÃO
-- ============================================================

-- Confirmar que não há mais datas impossíveis
SELECT 'Após correção:' AS verificacao;

SELECT COUNT(*) AS datas_impossíveis_restantes
FROM funcionarios f
WHERE 
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 AND EXTRACT(DAY FROM f.data_nascimento) > 29
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) IN (4, 6, 9, 11) 
    AND EXTRACT(DAY FROM f.data_nascimento) = 31
  )
  OR
  (
    EXTRACT(MONTH FROM f.data_nascimento) = 2 
    AND EXTRACT(DAY FROM f.data_nascimento) = 29
    AND (EXTRACT(YEAR FROM f.data_nascimento)::int % 4 != 0 
         OR (EXTRACT(YEAR FROM f.data_nascimento)::int % 100 = 0 
             AND EXTRACT(YEAR FROM f.data_nascimento)::int % 400 != 0))
  );

-- Resultado esperado: 0 (zero)

-- ============================================================
-- 5️⃣ DICA: Regenerar hashes de senha após correção
-- ============================================================

-- Se as datas foram corrigidas, os hashes podem ficar desincronizados!
-- Os funcionários precisam fazer login novamente para atualizar as senhas.

-- Query para listar funcionários que teram login afetado:
SELECT 
  cpf,
  nome,
  data_nascimento,
  'Será necessário novo login' AS acao
FROM funcionarios
WHERE cpf IN (
  -- Substitua com os CPFs que foram corrigidos
  SELECT DISTINCT cpf 
  FROM funcionarios_backup
  WHERE 
    (
      EXTRACT(MONTH FROM data_nascimento) = 2 
      AND EXTRACT(DAY FROM data_nascimento) > 29
    )
    OR
    (
      EXTRACT(MONTH FROM data_nascimento) IN (4, 6, 9, 11) 
      AND EXTRACT(DAY FROM data_nascimento) = 31
    )
);

-- ============================================================
-- NOTAS
-- ============================================================
/*
1. Executar queries de verificação PRIMEIRO
2. Se houver resultados, contatar:
   - Usuários afetados
   - Responsável de TI
   - Gerente de RH
3. Decidir sobre estratégia de correção:
   - Ajustar para último dia válido (automático)
   - Pedir confirmação da data real por usuário (manual)
4. Após correção, todos os funcionários perdem acesso
5. Email deve ser enviado: "Atualize sua data de nascimento"
6. Novo hash será gerado no próximo login bem-sucedido

RISCO: Se houver muitos registros afetados, pode indicar:
- Problema na criação de dados (sem validação prévia)
- Importação de dados de sistema legado
- Corrupção de dados
*/
