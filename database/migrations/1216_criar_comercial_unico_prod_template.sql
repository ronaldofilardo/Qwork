-- Migration 1216 (PROD TEMPLATE)
-- Cria Comercial único (PROD: CPF específico) que gerencia todos os representantes
-- O comercial é também representante e faz suas próprias vendas com código 100
-- 
-- ⚠️ IMPORTANTE: Esta é uma TEMPLATE para PRODUÇÃO
-- Substitua {{COMERCIAL_CPF}} e {{COMERCIAL_EMAIL}} com valores reais antes de executar
-- 
-- Data: 17/04/2026
-- Contexto: O comercial é o "gestor" de toda a equipe de representantes e vendedores

BEGIN;

-- ====================================================================
-- FASE 1: Criar usuário comercial em usuarios (se não existir)
-- ====================================================================

DO $$
DECLARE
  v_comercial_cpf VARCHAR(11) := '{{COMERCIAL_CPF}}';  -- ← SUBSTITUIR CPF REAL
  v_comercial_email VARCHAR(100) := '{{COMERCIAL_EMAIL}}';  -- ← SUBSTITUIR EMAIL REAL
  v_user_id INTEGER;
BEGIN
  -- Validar que CPF foi substituído
  IF v_comercial_cpf = '{{COMERCIAL_CPF}}' OR v_comercial_cpf IS NULL THEN
    RAISE EXCEPTION '[MIGRATION 1216] ❌ ERRO: CPF não foi substituído! Use um CPF real.';
  END IF;

  -- Verificar se usuário comercial com este CPF já existe
  SELECT id INTO v_user_id
    FROM public.usuarios
   WHERE cpf = v_comercial_cpf AND tipo_usuario = 'comercial'
   LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Criar novo usuário comercial
    INSERT INTO public.usuarios (
      cpf, 
      nome, 
      email, 
      tipo_usuario, 
      ativo, 
      criado_em, 
      atualizado_em
    ) VALUES (
      v_comercial_cpf,
      'Comercial',
      v_comercial_email,
      'comercial',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE '[MIGRATION 1216] ✅ Usuário comercial criado: id=%, cpf=%', v_user_id, v_comercial_cpf;
  ELSE
    RAISE NOTICE '[MIGRATION 1216] ℹ️ Usuário comercial já existe: id=%, cpf=%', v_user_id, v_comercial_cpf;
  END IF;

  -- ====================================================================
  -- FASE 2: Criar perfil em vendedores_perfil com código 100
  -- ====================================================================

  IF NOT EXISTS (
    SELECT 1 FROM public.vendedores_perfil
    WHERE usuario_id = v_user_id
  ) THEN
    INSERT INTO public.vendedores_perfil (
      usuario_id,
      codigo,
      tipo_pessoa,
      criado_em,
      atualizado_em
    ) VALUES (
      v_user_id,
      '100',
      'pf',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '[MIGRATION 1216] ✅ Perfil comercial criado: usuario_id=%, codigo=100', v_user_id;
  ELSE
    RAISE NOTICE '[MIGRATION 1216] ℹ️ Perfil já existe para usuario_id=%', v_user_id;
  END IF;

END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║       COMERCIAL ÚNICO CONFIGURADO PARA PRODUÇÃO               ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
