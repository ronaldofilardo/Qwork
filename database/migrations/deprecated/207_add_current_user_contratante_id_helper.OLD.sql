-- Migration 207: Adicionar helper function current_user_contratante_id() para RLS
-- Data: 2026-01-29
-- Contexto: Suporte para isolamento de dados por entidade (complementa migration 206)
--           Permite policies RLS usarem contratante_id para isolamento
--           Similar a current_user_clinica_id() mas para entidades

BEGIN;

-- ==========================================
-- CRIAR HELPER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON FUNCTION public.current_user_contratante_id() IS
'Retorna o contratante_id do usuário atual para isolamento de dados de entidades via RLS. 
Usado em policies para garantir que gestores de entidade acessem apenas dados de sua própria entidade.
Contexto setado via: SET LOCAL app.current_user_contratante_id = <id>
Similar a current_user_clinica_id() mas para entidades (tipo=entidade).';

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================

DO $$
BEGIN
  -- Testar funcao
  PERFORM current_user_contratante_id();
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OK - Migration 207 aplicada com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper function criada:';
  RAISE NOTICE '  - current_user_contratante_id()';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso em RLS policies:';
  RAISE NOTICE '  WHERE contratante_id = current_user_contratante_id()';
  RAISE NOTICE '';
  RAISE NOTICE 'Contexto setado em queries:';
  RAISE NOTICE '  SET LOCAL app.current_user_contratante_id = <id>';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ==========================================
-- EXEMPLO DE USO
-- ==========================================

/*
-- Em lib/db.ts, ao fazer query com sessão de gestor_entidade:

if (session.perfil === 'gestor_entidade' && session.contratante_id) {
  await query(
    'SET LOCAL app.current_user_contratante_id = $1',
    [session.contratante_id]
  );
}

-- Em RLS policy:

CREATE POLICY funcionarios_gestor_entidade_read
ON funcionarios
FOR SELECT
USING (
  current_user_perfil() = 'gestor_entidade'
  AND contratante_id = current_user_contratante_id()
);
*/

-- ==========================================
-- VALIDAÇÃO PÓS-MIGRATION
-- ==========================================

/*
-- Verificar função foi criada
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'current_user_contratante_id'
  AND routine_schema = 'public';

-- Testar função
SELECT current_user_contratante_id() as contratante_id;
-- Deve retornar NULL (sem contexto setado)

-- Testar com contexto
BEGIN;
SET LOCAL app.current_user_contratante_id = '123';
SELECT current_user_contratante_id() as contratante_id;
-- Deve retornar 123
ROLLBACK;

-- Listar todas as helper functions RLS
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'current_user%'
  AND routine_schema = 'public'
ORDER BY routine_name;
*/

-- ==========================================
-- ROLLBACK (Se necessário)
-- ==========================================

/*
DROP FUNCTION IF EXISTS public.current_user_contratante_id() CASCADE;
*/
