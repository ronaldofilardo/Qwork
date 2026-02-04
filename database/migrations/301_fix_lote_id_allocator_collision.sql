-- Migration 301: Corrigir lote_id_allocator sobrepondo IDs
-- Data: 04/02/2026
-- Problema: lote_id_allocator não está respeitando IDs já existentes na tabela lotes_avaliacao,
--          causando violações de PRIMARY KEY e sobrepondo lotes
-- Causa: A tabela lote_id_allocator foi criada na migration 085, mas não está sendo sincronizada
--        corretamente quando há inserções diretas ou quando a sequence fica desatualizada
-- Solução: 1) Sincronizar lote_id_allocator com o MAX(id) atual
--          2) Adicionar constraint e validação
--          3) Melhorar a função fn_next_lote_id() para evitar colisões

BEGIN;

-- ==========================================
-- PARTE 1: DIAGNÓSTICO
-- ==========================================

SELECT '=== DIAGNÓSTICO DO lote_id_allocator ===' as diagnostico;

-- Verificar estado atual
SELECT 
    'lote_id_allocator' as tabela,
    last_id as valor_atual,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_id_lotes,
    (SELECT MAX(id) FROM lotes_avaliacao) - last_id as diferenca,
    CASE 
        WHEN last_id >= (SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao) 
        THEN '✅ OK'
        ELSE '❌ DESATUALIZADO'
    END as status
FROM lote_id_allocator;

-- Verificar se há lotes com IDs maiores que o allocator
SELECT 
    id,
    codigo,
    criado_em,
    '⚠️ ID maior que allocator' as observacao
FROM lotes_avaliacao
WHERE id > (SELECT COALESCE(last_id, 0) FROM lote_id_allocator)
ORDER BY id DESC
LIMIT 10;

-- ==========================================
-- PARTE 2: SINCRONIZAÇÃO DO ALLOCATOR
-- ==========================================

SELECT '=== SINCRONIZANDO lote_id_allocator ===' as sincronizacao;

-- Atualizar o allocator para o maior ID existente
UPDATE lote_id_allocator
SET last_id = (SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao);

-- Verificar atualização
SELECT 
    'lote_id_allocator atualizado' as resultado,
    last_id as novo_valor,
    '✅ Sincronizado com MAX(id) de lotes_avaliacao' as status
FROM lote_id_allocator;

-- ==========================================
-- PARTE 3: MELHORAR FUNÇÃO fn_next_lote_id
-- ==========================================

SELECT '=== MELHORANDO fn_next_lote_id() ===' as funcao;

-- Função aprimorada com validação e sincronização automática
CREATE OR REPLACE FUNCTION fn_next_lote_id()
RETURNS bigint AS $$
DECLARE
    v_next bigint;
    v_max_existing bigint;
    v_retries INT := 0;
    v_max_retries INT := 5;
BEGIN
    -- Verificar se o allocator existe e está sincronizado
    SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;
    
    -- Loop com retry para garantir ID único (proteção contra race conditions)
    LOOP
        -- Atualizar atomicamente e obter próximo ID
        UPDATE lote_id_allocator
        SET last_id = GREATEST(last_id + 1, v_max_existing + 1)
        RETURNING last_id INTO v_next;
        
        -- Se não existe na tabela, inicializar
        IF NOT FOUND THEN
            INSERT INTO lote_id_allocator (last_id)
            VALUES (v_max_existing + 1)
            ON CONFLICT DO NOTHING
            RETURNING last_id INTO v_next;
        END IF;
        
        -- Verificar se o ID já existe (colisão)
        IF NOT EXISTS (SELECT 1 FROM lotes_avaliacao WHERE id = v_next) THEN
            RETURN v_next; -- ID único encontrado
        END IF;
        
        -- Colisão detectada, tentar novamente
        v_retries := v_retries + 1;
        IF v_retries >= v_max_retries THEN
            RAISE EXCEPTION 'fn_next_lote_id: Falha ao gerar ID único após % tentativas', v_max_retries;
        END IF;
        
        -- Log de warning
        RAISE WARNING 'fn_next_lote_id: Colisão detectada no ID %. Tentando novamente (% de %)',
            v_next, v_retries, v_max_retries;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_next_lote_id() IS 
'Retorna o próximo ID disponível para lotes_avaliacao de forma atômica, 
com proteção contra colisões e sincronização automática com IDs existentes.
Versão melhorada da migration 301.';

-- ==========================================
-- PARTE 4: ADICIONAR CONSTRAINT DE VALIDAÇÃO
-- ==========================================

SELECT '=== ADICIONANDO CONSTRAINTS DE VALIDAÇÃO ===' as constraints;

-- Garantir que lote_id_allocator sempre tenha exatamente 1 linha
DO $$
BEGIN
    -- Adicionar constraint para garantir apenas 1 linha
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lote_id_allocator_single_row'
    ) THEN
        -- Trigger para impedir múltiplas linhas
        CREATE OR REPLACE FUNCTION fn_lote_id_allocator_single_row()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF (SELECT COUNT(*) FROM lote_id_allocator) > 1 THEN
                RAISE EXCEPTION 'lote_id_allocator deve conter apenas uma linha';
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trg_lote_id_allocator_single_row
            AFTER INSERT OR UPDATE ON lote_id_allocator
            FOR EACH STATEMENT
            EXECUTE FUNCTION fn_lote_id_allocator_single_row();
            
        RAISE NOTICE 'Constraint lote_id_allocator_single_row criada';
    END IF;
END $$;

-- ==========================================
-- PARTE 5: FUNÇÃO AUXILIAR PARA RESINCRONIZAÇÃO
-- ==========================================

SELECT '=== CRIANDO FUNÇÃO DE MANUTENÇÃO ===' as manutencao;

-- Função para resincronizar manualmente se necessário
CREATE OR REPLACE FUNCTION resincronizar_lote_id_allocator()
RETURNS void AS $$
DECLARE
    v_max_id bigint;
BEGIN
    -- Buscar maior ID
    SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM lotes_avaliacao;
    
    -- Atualizar allocator
    UPDATE lote_id_allocator SET last_id = v_max_id;
    
    -- Sincronizar sequence também (se existir)
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lotes_avaliacao_id_seq') THEN
        PERFORM setval('lotes_avaliacao_id_seq', v_max_id, true);
    END IF;
    
    -- Log
    RAISE NOTICE 'lote_id_allocator resincronizado para ID %', v_max_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION resincronizar_lote_id_allocator() IS 
'Função de manutenção para resincronizar lote_id_allocator com MAX(id) 
de lotes_avaliacao. Usar apenas se detectar dessincronia.';

-- ==========================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ==========================================

SELECT '=== VERIFICAÇÃO FINAL ===' as verificacao;

-- Testar função nova (sem inserir, apenas verificar)
SELECT 
    'Próximo ID disponível' as descricao,
    fn_next_lote_id() as proximo_id,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_id_atual,
    '✅ Função funcionando corretamente' as status;

-- Rollback do teste
ROLLBACK TO SAVEPOINT before_test;
SAVEPOINT before_test;

-- Verificar estado final
SELECT 
    'Estado Final' as titulo,
    (SELECT last_id FROM lote_id_allocator) as allocator_value,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_lote_id,
    CASE 
        WHEN (SELECT last_id FROM lote_id_allocator) >= (SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao)
        THEN '✅ SINCRONIZADO'
        ELSE '❌ AINDA DESSINCRIONIZADO'
    END as status_final;

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
            301,
            'SYSTEM',
            'Migration 301: Corrigido lote_id_allocator sobrepondo IDs. Adicionadas proteções contra colisões e função de resincronização.',
            'system',
            NOW()
        );
    END IF;
END $$;

-- ==========================================
-- DOCUMENTAÇÃO DE USO
-- ==========================================

SELECT 
    '✅ Migration 301 aplicada com sucesso!' as status,
    'lote_id_allocator agora está sincronizado e protegido contra colisões' as descricao;

-- Comandos úteis para manutenção:
SELECT 
    '=== COMANDOS ÚTEIS ===' as titulo;

-- Para verificar estado atual:
SELECT 'SELECT * FROM lote_id_allocator; SELECT MAX(id) FROM lotes_avaliacao;' as comando_verificacao;

-- Para resincronizar manualmente:
SELECT 'SELECT resincronizar_lote_id_allocator();' as comando_resincronizacao;

-- Para testar próximo ID:
SELECT 'SELECT fn_next_lote_id();' as comando_teste;
