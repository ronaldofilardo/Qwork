-- =====================================================
-- 🚨 CORREÇÃO URGENTE - TRIGGER PROD
-- =====================================================
-- Data: 16/02/2026
-- Problema: Função trigger tentando acessar campo inexistente
-- Erro: record "new" has no field "funcionario_id"
-- =====================================================
-- EXECUTAR IMEDIATAMENTE EM PRODUÇÃO
-- =====================================================

BEGIN;

-- 1. Verificar estado atual
\echo '=== Verificando estado atual ==='
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario'
AND routine_type = 'FUNCTION';

\echo ''
\echo '=== Verificando triggers ==='
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';

-- 2. Remover trigger existente
\echo ''
\echo '=== Removendo trigger existente ==='
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON lotes_avaliacao CASCADE;

-- 3. Remover função existente
\echo ''
\echo '=== Removendo função existente ==='
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario() CASCADE;

-- 4. Recriar função CORRIGIDA (conforme migração 165)
\echo ''
\echo '=== Criando função corrigida ==='
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ Usa NEW.funcionario_cpf (campo correto da tabela avaliacoes)
  -- ✅ Usa WHERE cpf = NEW.funcionario_cpf (campo correto da tabela funcionarios)
  -- ✅ Atualiza apenas campos que existem
  
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_ultima_avaliacao_funcionario IS 'Atualiza campos denormalizados de última avaliação do funcionário (corrigido em 16/02/2026: usa funcionario_cpf, não funcionario_id)';

-- 5. Recriar trigger (tabela correta: avaliacoes)
\echo ''
\echo '=== Criando trigger corrigido ==='
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

-- 6. Validação
\echo ''
\echo '=== Validando correção ==='
SELECT 
  COUNT(*) as trigger_count,
  '✅ Trigger recriado com sucesso!' as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao'
AND event_object_table = 'avaliacoes';
-- Esperado: 1 row

SELECT 
  routine_name,
  '✅ Função corrigida!' as status
FROM information_schema.routines 
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario';
-- Esperado: 1 row

COMMIT;

\echo ''
\echo '=== ✅ CORREÇÃO CONCLUÍDA COM SUCESSO ==='
\echo ''
\echo 'Agora você pode tentar liberar o lote novamente.'
\echo ''
