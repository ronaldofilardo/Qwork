-- ============================================================================
-- Migration 1137: Proteção Permanente do Storage de Laudos
-- Data: 2026-04-03
-- Autor: Sistema
-- Descrição:
--   Implementa regras de negócio, RBAC e RLS para garantir que arquivos de
--   laudos em storage/laudos/ NUNCA sejam deletados da base de dados.
--
--   PRINCÍPIO FUNDAMENTAL:
--   Laudos são documentos legais imutáveis. Uma vez emitidos, não podem ser
--   removidos nem da base de dados nem do armazenamento físico local ou remoto.
--   Esta migration adiciona múltiplas camadas de proteção.
--
-- Camadas implementadas:
--   1. Tabela laudos_storage_log (write-once / append-only via RLS)
--   2. Trigger audit_laudos_delete_attempt (loga tentativas de delete)
--   3. Policy RLS explícita bloqueando DELETE em laudos para todos os perfis
--   4. Permission simbólica delete:laudos:filesystem (sem role receptora)
--   5. Comentários de documentação nas tabelas críticas
-- ============================================================================

BEGIN;

\echo '============================================'
\echo 'MIGRATION 1137: Proteção Storage de Laudos'
\echo '============================================'

-- ============================================================================
-- 1. TABELA laudos_storage_log (write-once / append-only)
-- ============================================================================

\echo ''
\echo '1. Criando tabela laudos_storage_log (append-only)...'

CREATE TABLE IF NOT EXISTS public.laudos_storage_log (
    id          BIGSERIAL PRIMARY KEY,
    laudo_id    INTEGER       NOT NULL,
    lote_id     INTEGER       NOT NULL,
    clinica_id  INTEGER,
    entidade_id INTEGER,
    -- Localização física
    arquivo_path        TEXT          NOT NULL,
    hash_sha256         VARCHAR(64)   NOT NULL,
    -- Localização remota (Backblaze)
    backblaze_bucket    VARCHAR(255),
    backblaze_key       VARCHAR(1024),
    backblaze_url       TEXT,
    -- Metadados de rastreabilidade
    emissor_cpf         CHAR(11),
    tamanho_bytes       BIGINT,
    registrado_em       TIMESTAMP     NOT NULL DEFAULT NOW(),
    -- Garantia de integridade: proibido UPDATE/DELETE via trigger
    CONSTRAINT fk_laudos_storage_log_laudo
        FOREIGN KEY (laudo_id) REFERENCES public.laudos(id)
        ON DELETE RESTRICT  -- impede DELETE em laudos que têm log
);

CREATE INDEX IF NOT EXISTS idx_laudos_storage_log_laudo_id
    ON public.laudos_storage_log (laudo_id);

CREATE INDEX IF NOT EXISTS idx_laudos_storage_log_registrado_em
    ON public.laudos_storage_log (registrado_em DESC);

COMMENT ON TABLE public.laudos_storage_log IS
'Registro imutável (append-only) de todos os arquivos físicos de laudos gerados.
Cada linha representa um arquivo de laudo que EXISTE no storage.
REGRA DE NEGÓCIO: Nenhuma linha pode ser alterada ou removida.
RLS garante: apenas INSERT é permitido a qualquer role.
Migration 1137 — 2026-04-03.';

COMMENT ON COLUMN public.laudos_storage_log.arquivo_path IS
'Caminho relativo ao diretório de trabalho (ex: storage/laudos/laudo-42.pdf)';

COMMENT ON COLUMN public.laudos_storage_log.hash_sha256 IS
'Hash SHA-256 do conteúdo do arquivo no momento de geração. Imutável.';

\echo '   ✓ Tabela laudos_storage_log criada'

-- ============================================================================
-- 2. RLS na tabela laudos_storage_log (INSERT-only)
-- ============================================================================

\echo ''
\echo '2. Ativando RLS append-only em laudos_storage_log...'

ALTER TABLE public.laudos_storage_log ENABLE ROW LEVEL SECURITY;

-- Apenas INSERT é permitido (qualquer role autenticada pode registrar)
DROP POLICY IF EXISTS laudos_storage_log_insert_only ON public.laudos_storage_log;
CREATE POLICY laudos_storage_log_insert_only
    ON public.laudos_storage_log
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

-- SELECT permitido para emissores, admin, suporte e sistema
DROP POLICY IF EXISTS laudos_storage_log_select_authorized ON public.laudos_storage_log;
CREATE POLICY laudos_storage_log_select_authorized
    ON public.laudos_storage_log
    FOR SELECT
    TO PUBLIC
    USING (
        public.current_user_perfil() IN ('emissor', 'admin', 'suporte')
    );

-- UPDATE: nenhuma policy = bloqueio total via RLS
-- DELETE: nenhuma policy = bloqueio total via RLS

\echo '   ✓ RLS append-only aplicado em laudos_storage_log'

-- ============================================================================
-- 3. TRIGGER: bloquear UPDATE/DELETE em laudos_storage_log via trigger
--    (defesa em profundidade além do RLS)
-- ============================================================================

\echo ''
\echo '3. Criando trigger de imutabilidade em laudos_storage_log...'

CREATE OR REPLACE FUNCTION public.prevent_mutation_laudos_storage_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'laudos_storage_log é append-only. UPDATE e DELETE são proibidos. '
        'Laudo ID: %. Esta restrição é parte da política de imutabilidade de laudos (Migration 1137).',
        COALESCE(OLD.laudo_id::TEXT, '?')
        USING ERRCODE = '23506',
              HINT = 'Consulte database/migrations/1137_laudos_storage_protection.sql';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_mutation_laudos_storage_log() IS
'Impede UPDATE e DELETE em laudos_storage_log (append-only). Migration 1137.';

DROP TRIGGER IF EXISTS trg_prevent_mutation_storage_log ON public.laudos_storage_log;
CREATE TRIGGER trg_prevent_mutation_storage_log
    BEFORE UPDATE OR DELETE ON public.laudos_storage_log
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_mutation_laudos_storage_log();

\echo '   ✓ Trigger de imutabilidade criado em laudos_storage_log'

-- ============================================================================
-- 4. RLS em laudos: policy explícita bloqueando DELETE para todas as roles
--    (complementa o trigger check_laudo_immutability já existente)
-- ============================================================================

\echo ''
\echo '4. Adicionando policy RLS de bloqueio de DELETE em laudos...'

-- Nenhuma role de aplicação pode executar DELETE em laudos via RLS.
-- O trigger check_laudo_immutability bloqueia DELETE de laudos emitidos.
-- Esta policy bloqueia DELETE de laudos rascunho também (exceto via sistema com bypass).

DROP POLICY IF EXISTS laudos_no_delete_app_roles ON public.laudos;
CREATE POLICY laudos_no_delete_app_roles
    ON public.laudos
    FOR DELETE
    TO PUBLIC
    USING (
        -- Apenas permite DELETE se for explicitamente autorizado pelo sistema
        -- (contexto app.allow_laudo_rascunho_delete = 'true' é usado APENAS
        -- pela migration de cleanup de rascunhos órfãos em setup/tests controlados)
        NULLIF(current_setting('app.allow_laudo_rascunho_delete', TRUE), '') = 'true'
        AND public.current_user_perfil() IS NULL  -- somente fora de contexto de usuário
    );

COMMENT ON POLICY laudos_no_delete_app_roles ON public.laudos IS
'Bloqueia DELETE em laudos para todas as roles de aplicação. '
'Exceção controlada: app.allow_laudo_rascunho_delete=true SEM perfil de usuário (apenas sistema). '
'Migration 1137 — 2026-04-03.';

\echo '   ✓ Policy RLS de bloqueio de DELETE em laudos criada'

-- ============================================================================
-- 5. TRIGGER: auditar tentativas de DELETE em laudos (mesmo bloqueadas)
-- ============================================================================

\echo ''
\echo '5. Criando trigger de auditoria de tentativas de DELETE em laudos...'

CREATE OR REPLACE FUNCTION public.audit_laudo_delete_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar a tentativa no audit_log independente de ser bloqueada ou não
    INSERT INTO public.audit_logs (
        user_cpf,
        user_perfil,
        action,
        resource,
        resource_id,
        old_data,
        details
    ) VALUES (
        COALESCE(public.current_user_cpf(), 'desconhecido'),
        COALESCE(public.current_user_perfil(), 'sistema'),
        'DELETE_ATTEMPT',
        'laudos',
        OLD.id::TEXT,
        row_to_json(OLD)::JSONB,
        'Tentativa de DELETE em laudo interceptada. Status: ' || OLD.status ||
        '. Migration 1137 policy ativa.'
    );

    -- O trigger NÃO cancela a operação — o RLS e check_laudo_immutability fazem isso.
    -- Este registro é de auditoria pura.
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_laudo_delete_attempt() IS
'Audita qualquer tentativa de DELETE em laudos. Migration 1137 — 2026-04-03.';

DROP TRIGGER IF EXISTS trg_audit_laudo_delete_attempt ON public.laudos;
CREATE TRIGGER trg_audit_laudo_delete_attempt
    BEFORE DELETE ON public.laudos
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_laudo_delete_attempt();

\echo '   ✓ Trigger de auditoria de DELETE em laudos criado'

-- ============================================================================
-- 6. RBAC: Permission simbólica delete:laudos:filesystem
--    Nenhuma role recebe esta permissão — existência é apenas documental
-- ============================================================================

\echo ''
\echo '6. Registrando permission simbólica delete:laudos:filesystem...'

INSERT INTO public.permissions (name, resource, action, description)
VALUES (
    'delete:laudos:filesystem',
    'laudos',
    'delete',
    'BLOQUEADA — Nenhuma role recebe esta permissão. '
    'Sua existência registra formalmente que a deleção de arquivos físicos de laudos '
    'é operação proibida pela política de imutabilidade da plataforma QWork. '
    'Consulte lib/storage/laudo-guard.ts e migration 1137.'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;

\echo '   ✓ Permission simbólica registrada (sem role receptora)'

-- ============================================================================
-- 7. Documentação: atualizar comentário da tabela laudos
-- ============================================================================

\echo ''
\echo '7. Atualizando documentação da tabela laudos...'

COMMENT ON TABLE public.laudos IS
'Laudos psicologicos emitidos por emissores.

REGRA DE NEGOCIO CRITICA - IMUTABILIDADE:
  Laudos emitidos (status=emitido ou enviado) sao documentos PERMANENTES.
  - Nenhum arquivo fisico em storage/laudos/ pode ser deletado
  - Nenhum registro nesta tabela pode ser alterado apos emissao
  - O hash_pdf comprova integridade do documento
  - Backups existem localmente (storage/laudos/) e remotamente (Backblaze)

PROTECOES ATIVAS (apos Migration 1137):
  - Trigger enforce_laudo_immutability: bloqueia UPDATE/DELETE de laudos emitidos
  - Trigger trg_validar_laudo_emitido: valida campos obrigatorios na emissao
  - Trigger trg_audit_laudo_delete_attempt: audita tentativas de DELETE
  - RLS laudos_no_delete_app_roles: bloqueia DELETE via roles de aplicacao
  - lib/storage/laudo-guard.ts: guard no filesystem local
  - assertNotLaudoBackblazeKey: guard no Backblaze

FLUXO CORRETO DE CRIACAO (veja tambem migration 1100):
  1. RH/Entidade solicita emissao
  2. Admin define valor e gera link de pagamento
  3. Pagamento confirmado
  4. Emissor gera laudo (POST /api/emissor/laudos/[loteId])
  5. PDF gerado localmente + hash SHA-256 calculado
  6. Status = emitido (IMUTAVEL a partir daqui)
  7. Upload assincrono para Backblaze
  8. Status = enviado';

\echo '   ✓ Documentação da tabela laudos atualizada'

-- ============================================================================
-- 8. Verificações finais
-- ============================================================================

\echo ''
\echo '8. Executando verificações finais...'

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_rls_enabled BOOLEAN;
    v_trigger_exists BOOLEAN;
    v_permission_exists BOOLEAN;
BEGIN
    -- Verificar tabela laudos_storage_log
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'laudos_storage_log'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'FALHA: Tabela laudos_storage_log nao foi criada!';
    END IF;
    RAISE NOTICE 'OK: Tabela laudos_storage_log criada';

    -- Verificar RLS ativo em laudos_storage_log
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class WHERE relname = 'laudos_storage_log';

    IF NOT v_rls_enabled THEN
        RAISE EXCEPTION 'FALHA: RLS nao esta ativo em laudos_storage_log!';
    END IF;
    RAISE NOTICE 'OK: RLS em laudos_storage_log ativo';

    -- Verificar trigger de imutabilidade
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_prevent_mutation_storage_log'
    ) INTO v_trigger_exists;

    IF NOT v_trigger_exists THEN
        RAISE EXCEPTION 'FALHA: Trigger trg_prevent_mutation_storage_log nao foi criado!';
    END IF;
    RAISE NOTICE 'OK: Trigger trg_prevent_mutation_storage_log criado';

    -- Verificar permission simbolica
    SELECT EXISTS(
        SELECT 1 FROM public.permissions
        WHERE name = 'delete:laudos:filesystem'
    ) INTO v_permission_exists;

    IF NOT v_permission_exists THEN
        RAISE EXCEPTION 'FALHA: Permission delete:laudos:filesystem nao foi registrada!';
    END IF;
    RAISE NOTICE 'OK: Permission delete:laudos:filesystem registrada';

    RAISE NOTICE 'Migration 1137 verificada com sucesso!';
END $$;

COMMIT;

\echo ''
\echo '============================================'
\echo 'MIGRATION 1137: Concluída com Sucesso'
\echo '============================================'
\echo ''
\echo 'PROTEÇÕES ATIVAS:'
\echo '  ✓ laudos_storage_log: append-only (RLS + trigger)'
\echo '  ✓ RLS laudos_no_delete_app_roles: DELETE bloqueado para todas as roles'
\echo '  ✓ Trigger trg_audit_laudo_delete_attempt: auditoria de tentativas'
\echo '  ✓ Permission simbólica delete:laudos:filesystem registrada'
\echo ''
\echo 'CÓDIGO ATUALIZADO:'
\echo '  ✓ lib/storage/laudo-guard.ts: deleteStorageFileSafe exportado'
\echo '  ✓ lib/storage/backblaze-client.ts: assertNotLaudoBackblazeKey integrado'
\echo '  ✓ app/api/emissor/lotes/route.ts: bloco CLEANUP_LAUDOS removido'
\echo '  ✓ __tests__/lib/laudo-storage.test.ts: sandbox isolado (sem rm -rf)'
\echo ''
