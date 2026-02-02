-- Migration: Corrigir lote_id_allocator vazio
-- Data: 01/02/2026
-- Descrição: Inicializa a tabela lote_id_allocator que estava vazia causando erro em fn_next_lote_id()

-- Problema: A função fn_next_lote_id() faz UPDATE em lote_id_allocator, mas se a tabela estiver vazia,
-- o UPDATE não afeta linhas e retorna NULL, causando erro "o valor nulo na coluna id viola restrição"

-- Solução: Garantir que lote_id_allocator tenha sempre um registro inicial

DO $$
BEGIN
  -- Verificar se a tabela está vazia
  IF NOT EXISTS (SELECT 1 FROM lote_id_allocator LIMIT 1) THEN
    -- Inserir registro inicial
    INSERT INTO lote_id_allocator (last_id) VALUES (0);
    RAISE NOTICE 'lote_id_allocator inicializada com last_id = 0';
  ELSE
    RAISE NOTICE 'lote_id_allocator já contém dados, nenhuma ação necessária';
  END IF;
END $$;

-- Validar resultado
SELECT 
  'lote_id_allocator' as tabela,
  COUNT(*) as total_registros,
  COALESCE(MAX(last_id), 0) as ultimo_id
FROM lote_id_allocator;

-- Teste da função fn_next_lote_id()
SELECT fn_next_lote_id() as proximo_id_teste;

-- Reverter o teste (subtrair 1 do last_id)
UPDATE lote_id_allocator SET last_id = last_id - 1;

RAISE NOTICE 'Migration 302 concluída com sucesso';

-- ROLLBACK (para reverter):
-- Não há rollback necessário, pois apenas garante que existe um registro inicial.
-- Se precisar resetar: DELETE FROM lote_id_allocator WHERE last_id = 0;
