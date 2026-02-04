-- Script de Correção: Auto-Conclusão de Avaliações com 37 Respostas
-- Data: 04/02/2026
-- Objetivo: Marcar como 'concluida' avaliações que têm exatamente 37 respostas únicas

BEGIN;

-- Buscar avaliações com 37 respostas mas não concluídas
WITH avaliacoes_completas AS (
  SELECT 
    a.id,
    a.status,
    COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
  FROM avaliacoes a
  JOIN respostas r ON r.avaliacao_id = a.id
  WHERE a.status != 'concluida'
  GROUP BY a.id, a.status
  HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
)
SELECT 
  ac.id,
  ac.status,
  ac.total_respostas,
  '❌ Deveria estar concluída!' as observacao
FROM avaliacoes_completas ac;

-- Atualizar para concluída
UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(
        envio, 
        (SELECT MAX(r.criado_em) FROM respostas r WHERE r.avaliacao_id = a.id)
    ),
    atualizado_em = NOW()
WHERE a.id IN (
    SELECT a2.id
    FROM avaliacoes a2
    JOIN respostas r ON r.avaliacao_id = a2.id
    WHERE a2.status != 'concluida'
    GROUP BY a2.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
);

-- Verificar resultados
SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.atualizado_em > NOW() - INTERVAL '1 minute'
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status, a.envio
ORDER BY a.id;

COMMIT;
