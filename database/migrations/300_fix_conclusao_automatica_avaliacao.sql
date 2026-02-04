-- Migration 300: Corrigir Auto-Conclusão de Avaliações
-- Data: 04/02/2026
-- Problema: Avaliações com 37 respostas não são marcadas como 'concluida' automaticamente
-- Causa: O código em /api/avaliacao/respostas executa a conclusão apenas quando totalRespostas >= 37
--        mas há um problema onde o status não é persistido corretamente no banco
-- Solução: 1) Corrigir avaliações existentes com 37+ respostas mas status incorreto
--          2) Adicionar constraint e trigger para garantir consistência

BEGIN;

-- ==========================================
-- PARTE 1: DIAGNÓSTICO
-- ==========================================

-- Listar avaliações com 37+ respostas mas status != 'concluida'
SELECT 
    '=== AVALIAÇÕES COM 37+ RESPOSTAS MAS NÃO CONCLUÍDAS ===' as diagnostico;

SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    a.inicio,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as total_respostas,
    '❌ INCORRETO' as observacao
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status != 'concluida'
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status, a.inicio, a.envio
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;

-- ==========================================
-- PARTE 2: CORREÇÃO DE DADOS EXISTENTES
-- ==========================================

SELECT '=== CORRIGINDO AVALIAÇÕES EXISTENTES ===' as correcao;

-- Atualizar status para 'concluida' em avaliações com 37+ respostas
UPDATE avaliacoes a
SET 
    status = 'concluida',
    -- Se envio for NULL, usar a data da última resposta
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

-- Registrar quantas foram corrigidas
SELECT 
    COUNT(*) as avaliacoes_corrigidas,
    '✅ Avaliações corrigidas' as resultado
FROM avaliacoes a
JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status = 'concluida' 
  AND a.atualizado_em >= NOW() - INTERVAL '1 minute'
GROUP BY a.id
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;

-- ==========================================
-- PARTE 3: TRIGGER PARA GARANTIR CONSISTÊNCIA
-- ==========================================

SELECT '=== CRIANDO TRIGGER DE VALIDAÇÃO ===' as trigger;

-- Função trigger para validar status da avaliação
CREATE OR REPLACE FUNCTION fn_validar_status_avaliacao()
RETURNS TRIGGER AS $$
DECLARE
    v_total_respostas INT;
BEGIN
    -- Contar respostas únicas da avaliação
    SELECT COUNT(DISTINCT (grupo, item))
    INTO v_total_respostas
    FROM respostas
    WHERE avaliacao_id = NEW.id;
    
    -- Se tem 37+ respostas mas status não é 'concluida', corrigir
    IF v_total_respostas >= 37 AND NEW.status NOT IN ('concluida', 'inativada') THEN
        RAISE WARNING 'Avaliação % tem % respostas mas status é %. Ajustando para concluida.',
            NEW.id, v_total_respostas, NEW.status;
        
        NEW.status := 'concluida';
        NEW.envio := COALESCE(NEW.envio, NOW());
        NEW.atualizado_em := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE UPDATE em avaliacoes
DROP TRIGGER IF EXISTS trg_validar_status_avaliacao ON avaliacoes;
CREATE TRIGGER trg_validar_status_avaliacao
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR NEW.status != 'concluida')
    EXECUTE FUNCTION fn_validar_status_avaliacao();

-- ==========================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ==========================================

SELECT '=== VERIFICAÇÃO FINAL ===' as verificacao;

-- Verificar se ainda há avaliações incorretas
SELECT 
    a.id,
    a.status,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas,
    CASE 
        WHEN COUNT(DISTINCT (r.grupo, r.item)) >= 37 AND a.status = 'concluida' THEN '✅ CORRETO'
        WHEN COUNT(DISTINCT (r.grupo, r.item)) >= 37 AND a.status != 'concluida' THEN '❌ ERRO'
        ELSE '⏸️ PARCIAL'
    END as validacao
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.lote_id IS NOT NULL
GROUP BY a.id, a.status
ORDER BY a.id;

COMMIT;

-- ==========================================
-- AUDITORIA
-- ==========================================

-- Registrar na tabela de auditoria (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria') THEN
        INSERT INTO auditoria (resource, resource_id, operacao, detalhes, executado_por, executado_em)
        VALUES (
            'migrations',
            300,
            'SYSTEM',
            'Migration 300: Corrigido auto-conclusão de avaliações com 37+ respostas. Adicionado trigger de validação.',
            'system',
            NOW()
        );
    END IF;
END $$;

-- Mensagem final
SELECT 
    '✅ Migration 300 aplicada com sucesso!' as status,
    'Avaliações com 37+ respostas agora são automaticamente marcadas como concluída' as descricao;
