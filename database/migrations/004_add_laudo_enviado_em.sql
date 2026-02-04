-- Migration 004: Adicionar campo laudo_enviado_em na tabela lotes_avaliacao
-- Objetivo: Rastrear quando o laudo foi enviado pelo emissor para a clínica

-- 1. Adicionar coluna laudo_enviado_em
ALTER TABLE lotes_avaliacao
ADD COLUMN IF NOT EXISTS laudo_enviado_em TIMESTAMP;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo foi enviado pelo emissor para a clínica';

-- 3. Criar índice para performance em consultas
CREATE INDEX IF NOT EXISTS idx_lotes_laudo_enviado ON lotes_avaliacao (laudo_enviado_em)
WHERE
    laudo_enviado_em IS NOT NULL;

-- 4. Migrar dados existentes: Preencher laudo_enviado_em com base em laudos já enviados
UPDATE lotes_avaliacao la
SET
    laudo_enviado_em = l.enviado_em
FROM laudos l
WHERE
    la.id = l.lote_id
    AND l.status = 'enviado'
    AND la.laudo_enviado_em IS NULL
    AND l.enviado_em IS NOT NULL;

-- 5. Verificar resultado
SELECT
    COUNT(*) as total_lotes,
    COUNT(laudo_enviado_em) as lotes_com_laudo_enviado,
    COUNT(*) - COUNT(laudo_enviado_em) as lotes_sem_laudo
FROM lotes_avaliacao;

-- 6. Exibir exemplos de lotes com laudo enviado
SELECT
    la.id,
    
    la.titulo,
    la.status as status_lote,
    la.laudo_enviado_em,
    l.status as status_laudo,
    l.enviado_em
FROM lotes_avaliacao la
    LEFT JOIN laudos l ON la.id = l.lote_id
WHERE
    la.laudo_enviado_em IS NOT NULL
ORDER BY la.laudo_enviado_em DESC
LIMIT 10;

SELECT 'Migration 004 concluída com sucesso!' as resultado;