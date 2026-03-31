-- =============================================================================
-- Migration 309: Restringir RLS do Emissor em laudos — UPDATE granular
-- Banco alvo : nr-bps_db
-- Data       : 2026-03-06
-- Referência : INCON-5
-- =============================================================================
-- PROBLEMA:
--   Migration 099 criou: CREATE POLICY rls_emissor_crud_laudos ON public.laudos
--     FOR ALL USING (...) WITH CHECK (...)
--   Isso permite que qualquer emissor crie, edite E delete qualquer laudo
--   — sem restrição de autoria.
--
-- REGRA DE NEGÓCIO:
--   - Emissor é GLOBAL (não vinculado a clínica/entidade)
--   - Emissor só deve INSERIR e ATUALIZAR campos técnicos dos SEUS laudos
--   - Emissor NÃO pode DELETAR laudos (emissão é permanente)
--   - UPDATE restrito ao laudo onde emissor_cpf = CPF do emissor autenticado
--
-- WORKFLOW PRESERVADO (sem quebra de API):
--   - upload/route.ts:        INSERT + UPDATE (arquivo, status='emitido')
--   - route.ts (enviado):     UPDATE (status='enviado', emissor_cpf, enviado_em)
--   - pdf/route.ts:           UPDATE (hash_pdf)
--   - upload-confirm/route.ts: INSERT com emissor_cpf
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1 — Remover policies permissivas existentes (todas as variantes)
-- =============================================================================

-- Policy FOR ALL da migration 099 (a problemática — permite DELETE de qualquer laudo)
DROP POLICY IF EXISTS rls_emissor_crud_laudos ON public.laudos;

-- Policies granulares anteriores (migrations 001/004) — limpeza preventiva
DROP POLICY IF EXISTS laudos_emissor_select ON public.laudos;
DROP POLICY IF EXISTS laudos_emissor_insert ON public.laudos;
DROP POLICY IF EXISTS laudos_emissor_update ON public.laudos;
DROP POLICY IF EXISTS laudos_emissor_delete ON public.laudos;
DROP POLICY IF EXISTS "laudos_emissor_select" ON public.laudos;
DROP POLICY IF EXISTS "laudos_emissor_insert" ON public.laudos;
DROP POLICY IF EXISTS "laudos_emissor_update" ON public.laudos;
DROP POLICY IF EXISTS "laudos_emissor_delete" ON public.laudos;
DROP POLICY IF EXISTS policy_laudos_emissor ON public.laudos;

DO $$ BEGIN RAISE NOTICE '[INCON-5] Policies permissivas do emissor removidas.'; END $$;

-- =============================================================================
-- PARTE 2 — Criar policies granulares corretas
-- =============================================================================

-- 2a) SELECT: Emissor pode ver todos os laudos (necessário para listar pendentes)
CREATE POLICY rls_emissor_select_laudos ON public.laudos
  FOR SELECT
  TO PUBLIC
  USING (current_user_perfil() = 'emissor');

-- 2b) INSERT: Emissor pode criar laudos (o emissor_cpf é definido na aplicação)
CREATE POLICY rls_emissor_insert_laudos ON public.laudos
  FOR INSERT
  TO PUBLIC
  WITH CHECK (current_user_perfil() = 'emissor');

-- 2c) UPDATE: Emissor pode atualizar APENAS laudos onde ele é o autor (emissor_cpf)
--     Preserva o workflow: upload final, hash_pdf, status → 'emitido'/'enviado'
--     Bloqueia: modificação de laudos de outros emissores
CREATE POLICY rls_emissor_update_laudos ON public.laudos
  FOR UPDATE
  TO PUBLIC
  USING (
    current_user_perfil() = 'emissor'
    AND (
      -- Permite atualizar se o CPF do emissor já consta no laudo
      emissor_cpf = current_user_cpf()
      -- Permite atualizar se emissor_cpf ainda é NULL (laudo recém-criado, sem dono)
      OR emissor_cpf IS NULL
    )
  )
  WITH CHECK (current_user_perfil() = 'emissor');

-- 2d) DELETE: NÃO criar policy de DELETE → bloqueio automático via RLS
--     Emissor não pode deletar laudos (emissão é permanente/auditável)
-- (Nenhuma policy = deny por padrão quando RLS está ativo)

DO $$
BEGIN
    RAISE NOTICE '[INCON-5] Policies granulares criadas:';
    RAISE NOTICE '  - rls_emissor_select_laudos  (FOR SELECT - todos os laudos)';
    RAISE NOTICE '  - rls_emissor_insert_laudos  (FOR INSERT - criar novos laudos)';
    RAISE NOTICE '  - rls_emissor_update_laudos  (FOR UPDATE - apenas laudos proprios)';
    RAISE NOTICE '  - DELETE bloqueado (sem policy = deny when RLS ativo)';
END $$;

-- =============================================================================
-- PARTE 3 — Criar trigger para proteger campos sensíveis de UPDATE pelo emissor
-- =============================================================================
-- O emissor só deve atualizar campos técnicos. Um trigger impede alterações
-- em campos de conteúdo que não fazem parte do workflow de emissão.

CREATE OR REPLACE FUNCTION public.fn_bloquear_campos_sensiveis_emissor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_user_perfil();

    -- Aplicar restrição apenas ao perfil emissor
    IF v_perfil = 'emissor' THEN
        -- Proteger campos de conteúdo gerado pelo sistema de avaliação
        IF (OLD.observacoes IS DISTINCT FROM NEW.observacoes) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar o campo observacoes de um laudo.'
                USING ERRCODE = '42501', HINT = 'O campo observacoes é gerenciado pelo sistema.';
        END IF;

        -- Proteger lote_id (não pode reatribuir laudo a outro lote)
        IF (OLD.lote_id IS DISTINCT FROM NEW.lote_id) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar o lote_id de um laudo.'
                USING ERRCODE = '42501', HINT = 'lote_id é imutável após criação.';
        END IF;

        -- Proteger emissor_cpf após definição (anti-fraude: não pode apropriar laudo alheio)
        IF (OLD.emissor_cpf IS NOT NULL AND OLD.emissor_cpf IS DISTINCT FROM NEW.emissor_cpf) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar emissor_cpf após definição.'
                USING ERRCODE = '42501', HINT = 'emissor_cpf é imutável após atribuição.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_bloquear_campos_emissor ON public.laudos;

-- Criar trigger BEFORE UPDATE
CREATE TRIGGER trg_bloquear_campos_emissor
    BEFORE UPDATE ON public.laudos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_bloquear_campos_sensiveis_emissor();

DO $$ BEGIN RAISE NOTICE '[INCON-5] Trigger trg_bloquear_campos_emissor criado.'; END $$;

-- =============================================================================
-- PARTE 4 — Validação
-- =============================================================================

DO $$
BEGIN
    -- Confirmar que a policy FOR ALL foi removida
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'laudos' AND policyname = 'rls_emissor_crud_laudos'
    ) THEN
        RAISE EXCEPTION 'FALHA: Policy rls_emissor_crud_laudos ainda existe!';
    END IF;

    -- Confirmar que não existe policy de DELETE para emissor
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'laudos'
          AND policyname LIKE '%emissor%delete%'
    ) THEN
        RAISE EXCEPTION 'FALHA: Policy de DELETE do emissor ainda existe!';
    END IF;

    -- Confirmar que as 3 policies corretas existem
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'laudos' AND policyname = 'rls_emissor_select_laudos') THEN
        RAISE EXCEPTION 'FALHA: Policy rls_emissor_select_laudos não foi criada!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'laudos' AND policyname = 'rls_emissor_insert_laudos') THEN
        RAISE EXCEPTION 'FALHA: Policy rls_emissor_insert_laudos não foi criada!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'laudos' AND policyname = 'rls_emissor_update_laudos') THEN
        RAISE EXCEPTION 'FALHA: Policy rls_emissor_update_laudos não foi criada!';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 309 concluída com sucesso.';
    RAISE NOTICE '  INCON-5: RLS Emissor refatorado';
    RAISE NOTICE '    DELETE: bloqueado (sem policy)';
    RAISE NOTICE '    UPDATE: restrito ao próprio emissor';
    RAISE NOTICE '    Campos sensíveis protegidos por trigger';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
