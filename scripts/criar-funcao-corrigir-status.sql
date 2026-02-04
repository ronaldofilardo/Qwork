-- Função para Corrigir Status de Avaliações (Bypass RLS)
-- Data: 04/02/2026

CREATE OR REPLACE FUNCTION corrigir_status_avaliacoes()
RETURNS TABLE (
    avaliacao_id INT,
    status_anterior TEXT,
    status_novo TEXT,
    total_respostas BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_rec RECORD;
BEGIN
    -- Loop pelas avaliações com >= 37 respostas mas não concluídas
    FOR v_rec IN (
        SELECT 
            a.id,
            a.status as status_old,
            COUNT(DISTINCT (r.grupo, r.item)) as resp_count
        FROM avaliacoes a
        JOIN respostas r ON r.avaliacao_id = a.id
        WHERE a.status != 'concluida'
        GROUP BY a.id, a.status
        HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
    )
    LOOP
        UPDATE avaliacoes
        SET 
            status = 'concluida',
            envio = COALESCE(
                envio,
                (SELECT MAX(r2.criado_em) FROM respostas r2 WHERE r2.avaliacao_id = v_rec.id)
            ),
            atualizado_em = NOW()
        WHERE id = v_rec.id;
        
        RETURN QUERY SELECT v_rec.id, v_rec.status_old::TEXT, 'concluida'::TEXT, v_rec.resp_count;
    END LOOP;
    
    -- Loop pelas avaliações com 1-36 respostas mas status 'iniciada'
    FOR v_rec IN (
        SELECT 
            a.id,
            a.status as status_old,
            COUNT(DISTINCT (r.grupo, r.item)) as resp_count
        FROM avaliacoes a
        JOIN respostas r ON r.avaliacao_id = a.id
        WHERE a.status = 'iniciada'
        GROUP BY a.id, a.status
        HAVING COUNT(DISTINCT (r.grupo, r.item)) > 0 
           AND COUNT(DISTINCT (r.grupo, r.item)) < 37
    )
    LOOP
        UPDATE avaliacoes
        SET 
            status = 'em_andamento',
            atualizado_em = NOW()
        WHERE id = v_rec.id;
        
        RETURN QUERY SELECT v_rec.id, v_rec.status_old::TEXT, 'em_andamento'::TEXT, v_rec.resp_count;
    END LOOP;
END;
$$;

-- Executar a correção
SELECT * FROM corrigir_status_avaliacoes();

-- Verificar resultados
SELECT 
    a.id,
    a.status,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.id IN (17, 18)
GROUP BY a.id, a.status, a.envio
ORDER BY a.id;
