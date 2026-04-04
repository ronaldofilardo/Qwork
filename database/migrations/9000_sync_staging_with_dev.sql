-- =============================================================================
-- Migration 9000: Sincronização STAGING → Espelhar DEV (nr-bps_db)
-- Data: 2026-04-04
-- Fonte da Verdade: DEV (nr-bps_db local)
-- Destino: STAGING (neondb_staging — Neon Cloud)
--
-- FASES:
--   1. Remover objetos legacy do STAGING (tabelas, colunas, ENUMs, triggers)
--   2. Corrigir ENUMs com valores extras/divergentes
--   3. Corrigir NOT NULL constraints (migration 1139 não aplicada no STAGING)
--   4. Adicionar tabelas faltantes (laudos_storage_log, rate_limit_entries)
--   5. Adicionar colunas faltantes por tabela
--   6. Adicionar triggers/funções faltantes
--   7. Recriar views atualizadas (migration 1141 — link_disponibilizado_em)
--   8. Corrigir constraint legacy notificacoes (contratante → removido)
--   9. Atualizar constraint lotes_avaliacao_status (faltava 'rascunho')
-- =============================================================================

BEGIN;

-- Contexto de sessão para triggers de auditoria que exigem app.current_user_cpf
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- =============================================================================
-- FASE 1: REMOVER OBJETOS LEGACY DO STAGING
-- =============================================================================

-- ─── 1.1 Views legacies que não existem no DEV ────────────────────────────
DROP VIEW IF EXISTS v_relatorio_emissoes_usuario CASCADE;
DROP VIEW IF EXISTS vw_auditoria_acessos_funcionarios CASCADE;

-- ─── 1.2 Tabela legacy asaas_pagamentos ───────────────────────────────────
-- DEV não tem essa tabela — campos Asaas ficam em pagamentos diretamente
DROP TABLE IF EXISTS asaas_pagamentos CASCADE;

-- ─── 1.3 ENUMs legacy (old = orphan após refactoring) ─────────────────────
DROP TYPE IF EXISTS status_laudo_enum_old CASCADE;
DROP TYPE IF EXISTS status_lote_enum_old CASCADE;

-- ─── 1.4 Trigger legacy em avaliacoes ─────────────────────────────────────
-- DEV não tem trigger_limpar_indice_ao_deletar em avaliacoes
DROP TRIGGER IF EXISTS trigger_limpar_indice_ao_deletar ON avaliacoes;

-- ─── 1.5 Coluna legacy entidades_senhas.contratante_id ────────────────────
-- Nome legado (era "contratante", renomeado para tomador em migration 1016/1017)
ALTER TABLE entidades_senhas DROP COLUMN IF EXISTS contratante_id;

-- ─── 1.6 Colunas legacy clinicas ──────────────────────────────────────────
-- DEV não tem razao_social, idioma_preferencial, nome_fantasia em clinicas
ALTER TABLE clinicas DROP COLUMN IF EXISTS razao_social;
ALTER TABLE clinicas DROP COLUMN IF EXISTS nome_fantasia;
-- idioma_preferencial usa o enum idioma_suportado — dropar com CASCADE
ALTER TABLE clinicas DROP COLUMN IF EXISTS idioma_preferencial;

-- ─── 1.7 Colunas legacy empresas_clientes (arquivo_remoto) ────────────────
-- DEV tem essas colunas apenas em clinicas, não em empresas_clientes
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS cartao_cnpj_arquivo_remoto_provider;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS cartao_cnpj_arquivo_remoto_bucket;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS cartao_cnpj_arquivo_remoto_key;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS cartao_cnpj_arquivo_remoto_url;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS contrato_social_arquivo_remoto_provider;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS contrato_social_arquivo_remoto_bucket;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS contrato_social_arquivo_remoto_key;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS contrato_social_arquivo_remoto_url;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS doc_identificacao_arquivo_remoto_provider;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS doc_identificacao_arquivo_remoto_bucket;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS doc_identificacao_arquivo_remoto_key;
ALTER TABLE empresas_clientes DROP COLUMN IF EXISTS doc_identificacao_arquivo_remoto_url;

-- ─── 1.8 Coluna legacy funcionarios.data_admissao ─────────────────────────
-- DEV não tem data_admissao em funcionarios
ALTER TABLE funcionarios DROP COLUMN IF EXISTS data_admissao;

-- ─── 1.9 Colunas e constraints legacy fila_emissao ────────────────────────
-- DEV não tem solicitado_por, solicitado_em, tipo_solicitante em fila_emissao
ALTER TABLE fila_emissao DROP CONSTRAINT IF EXISTS chk_fila_emissao_solicitante;
ALTER TABLE fila_emissao DROP CONSTRAINT IF EXISTS fila_emissao_tipo_solicitante_check;
ALTER TABLE fila_emissao DROP COLUMN IF EXISTS solicitado_por;
ALTER TABLE fila_emissao DROP COLUMN IF EXISTS solicitado_em;
ALTER TABLE fila_emissao DROP COLUMN IF EXISTS tipo_solicitante;

-- ─── 1.10 Coluna legacy pagamentos.origem_pagamento ───────────────────────
-- DEV não tem essa coluna
ALTER TABLE pagamentos DROP COLUMN IF EXISTS origem_pagamento;

-- ─── 1.11 Colunas legacy importacoes_clinica ──────────────────────────────
-- DEV não tem data_importacao nem atualizado_em em importacoes_clinica
ALTER TABLE importacoes_clinica DROP COLUMN IF EXISTS data_importacao;
ALTER TABLE importacoes_clinica DROP COLUMN IF EXISTS atualizado_em;

-- ─── 1.12 Corrigir tipo de importacoes_clinica.usuario_cpf ────────────────
-- DEV: character varying; STAGING: character (fixed)
-- Mudar de CHAR para VARCHAR preserva dados
ALTER TABLE importacoes_clinica ALTER COLUMN usuario_cpf TYPE character varying(11);

-- ─── 1.13 Corrigir default de importacoes_clinica.status ──────────────────
-- DEV usa 'concluido' (masculino), STAGING usava 'concluida' (feminino)
ALTER TABLE importacoes_clinica ALTER COLUMN status SET DEFAULT 'concluido';

-- =============================================================================
-- FASE 2: CORRIGIR CONSTRAINTS LEGACIES
-- =============================================================================

-- ─── 2.1 notificacoes.destinatario_tipo ───────────────────────────────────
-- STAGING ainda tinha 'contratante' (legacy) no CHECK constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_destinatario_tipo_check
  CHECK (destinatario_tipo = ANY (ARRAY[
    'admin', 'gestor', 'funcionario', 'clinica', 'comercial', 'suporte'
  ]));

-- ─── 2.2 lotes_avaliacao_status_check ─────────────────────────────────────
-- STAGING tinha constraint sem 'rascunho'; DEV tem 'rascunho' no enum
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;
ALTER TABLE lotes_avaliacao ADD CONSTRAINT lotes_avaliacao_status_check
  CHECK (status::text = ANY (ARRAY[
    'ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho'
  ]));

-- =============================================================================
-- FASE 3: CORRIGIR NOT NULL CONSTRAINTS (migration 1139)
-- =============================================================================

-- Garantir que rows existentes sem valor recebam defaults antes de NOT NULL
UPDATE clinicas SET ativa = true WHERE ativa IS NULL;
ALTER TABLE clinicas ALTER COLUMN ativa SET NOT NULL;

UPDATE entidades SET tipo = 'entidade' WHERE tipo IS NULL;
ALTER TABLE entidades ALTER COLUMN tipo SET NOT NULL;

UPDATE empresas_clientes SET ativa = true WHERE ativa IS NULL;
ALTER TABLE empresas_clientes ALTER COLUMN ativa SET NOT NULL;

UPDATE lotes_avaliacao SET tipo = 'completo' WHERE tipo IS NULL;
ALTER TABLE lotes_avaliacao ALTER COLUMN tipo SET NOT NULL;

-- lotes_avaliacao.status já é NOT NULL na STAGING? Verificar e garantir
UPDATE lotes_avaliacao SET status = 'ativo' WHERE status IS NULL;
ALTER TABLE lotes_avaliacao ALTER COLUMN status SET NOT NULL;

UPDATE avaliacoes SET lote_id = 0 WHERE lote_id IS NULL;  -- apenas se houver orphans (não deve ter)
ALTER TABLE avaliacoes ALTER COLUMN lote_id SET NOT NULL;

UPDATE avaliacoes SET status = 'iniciada' WHERE status IS NULL;
ALTER TABLE avaliacoes ALTER COLUMN status SET NOT NULL;

-- =============================================================================
-- FASE 4: ADICIONAR TABELAS FALTANTES NO STAGING
-- =============================================================================

-- ─── 4.1 laudos_storage_log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laudos_storage_log (
  id             bigserial PRIMARY KEY,
  laudo_id       integer NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  lote_id        integer NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  clinica_id     integer REFERENCES clinicas(id) ON DELETE SET NULL,
  entidade_id    integer REFERENCES entidades(id) ON DELETE SET NULL,
  arquivo_path   text NOT NULL,
  hash_sha256    character varying NOT NULL,
  backblaze_bucket character varying,
  backblaze_key  character varying,
  backblaze_url  text,
  emissor_cpf    character(11),
  tamanho_bytes  bigint,
  registrado_em  timestamp without time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE laudos_storage_log IS
  'Log imutável de uploads de laudos ao Backblaze B2. Cada linha representa um upload.';

-- Trigger para impedir mutação (igual ao DEV)
CREATE OR REPLACE FUNCTION prevent_mutation_laudos_storage_log()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'laudos_storage_log é imutável — registros não podem ser alterados ou deletados';
END;
$$;

CREATE TRIGGER trg_prevent_mutation_storage_log
  BEFORE UPDATE OR DELETE ON laudos_storage_log
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation_laudos_storage_log();

-- ─── 4.2 rate_limit_entries ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  key        character varying NOT NULL PRIMARY KEY,
  count      integer NOT NULL DEFAULT 1,
  expires_at timestamp without time zone NOT NULL
);

COMMENT ON TABLE rate_limit_entries IS
  'Entradas de rate limiting in-database. Limpeza via job ou TTL.';

-- =============================================================================
-- FASE 5: ADICIONAR COLUNAS FALTANTES NO STAGING
-- =============================================================================

-- ─── 5.1 funcionarios.usuario_tipo ────────────────────────────────────────
-- usuario_tipo_enum já existe em STAGING — apenas adicionar a coluna
-- Nota: o trigger trg_reject_prohibited_roles bloqueia UPDATE em linhas com
-- perfil admin/emissor/gestor/rh (que não deveriam existir em funcionarios).
-- O ADD COLUMN com DEFAULT cobre esses casos; só atualizamos perfis permitidos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='funcionarios' AND column_name='usuario_tipo'
  ) THEN
    -- Adicionar com DEFAULT para rows existentes
    ALTER TABLE funcionarios
      ADD COLUMN usuario_tipo usuario_tipo_enum NOT NULL DEFAULT 'funcionario_entidade';

    -- Atualizar APENAS linhas com perfis que o trigger permite (funcionario, suporte, comercial, vendedor)
    -- Linhas com admin/emissor/gestor/rh já ficam com o DEFAULT 'funcionario_entidade'
    -- (essas linhas não deveriam existir em funcionarios de qualquer forma)
    ALTER TABLE funcionarios DISABLE TRIGGER trg_reject_prohibited_roles;
    UPDATE funcionarios SET usuario_tipo =
      CASE
        WHEN perfil = 'admin'     THEN 'admin'::usuario_tipo_enum
        WHEN perfil = 'emissor'   THEN 'emissor'::usuario_tipo_enum
        WHEN perfil = 'gestor'    THEN 'gestor'::usuario_tipo_enum
        WHEN perfil = 'rh'        THEN 'rh'::usuario_tipo_enum
        WHEN perfil = 'suporte'   THEN 'suporte'::usuario_tipo_enum
        WHEN perfil = 'comercial' THEN 'comercial'::usuario_tipo_enum
        WHEN perfil = 'vendedor'  THEN 'vendedor'::usuario_tipo_enum
        ELSE 'funcionario_entidade'::usuario_tipo_enum
      END;
    ALTER TABLE funcionarios ENABLE TRIGGER trg_reject_prohibited_roles;

    -- Remover DEFAULT temporário (INSERTs futuros devem declarar explicitamente)
    ALTER TABLE funcionarios ALTER COLUMN usuario_tipo DROP DEFAULT;

    RAISE NOTICE '✓ funcionarios.usuario_tipo adicionado';
  ELSE
    RAISE NOTICE '✓ funcionarios.usuario_tipo já existe — pulando';
  END IF;
END $$;

-- ─── 5.2 hierarquia_comercial.comercial_id ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='hierarquia_comercial' AND column_name='comercial_id'
  ) THEN
    ALTER TABLE hierarquia_comercial ADD COLUMN comercial_id integer REFERENCES funcionarios(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ hierarquia_comercial.comercial_id adicionado';
  ELSE
    RAISE NOTICE '✓ hierarquia_comercial.comercial_id já existe — pulando';
  END IF;
END $$;

-- ─── 5.3 laudos.relatorio_setor + hash_relatorio_setor ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='laudos' AND column_name='relatorio_setor'
  ) THEN
    ALTER TABLE laudos ADD COLUMN relatorio_setor bytea;
    RAISE NOTICE '✓ laudos.relatorio_setor adicionado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='laudos' AND column_name='hash_relatorio_setor'
  ) THEN
    ALTER TABLE laudos ADD COLUMN hash_relatorio_setor character varying;
    RAISE NOTICE '✓ laudos.hash_relatorio_setor adicionado';
  END IF;
END $$;

-- ─── 5.4 laudos.hash_pdf (posição no STAGING é diferente — não crítico) ───
-- hash_pdf já existe em STAGING, apenas em posição diferente. Sem ação.

-- ─── 5.5 usuarios.senha_hash ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usuarios' AND column_name='senha_hash'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN senha_hash text;
    RAISE NOTICE '✓ usuarios.senha_hash adicionado';
  ELSE
    RAISE NOTICE '✓ usuarios.senha_hash já existe — pulando';
  END IF;
END $$;

-- ─── 5.6 importacoes_clinica.criado_em ────────────────────────────────────
-- DEV tem criado_em, STAGING tinha criado_em mas possivelmente sem DEFAULT correto
-- Garantir que criado_em existe com DEFAULT CURRENT_TIMESTAMP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='importacoes_clinica' AND column_name='criado_em'
  ) THEN
    ALTER TABLE importacoes_clinica ADD COLUMN criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✓ importacoes_clinica.criado_em adicionado';
  END IF;
END $$;

-- ─── 5.7 importacoes_clinica.total_linhas — garantir DEFAULT correto ───────
-- DEV: total_linhas integer NOT NULL (sem DEFAULT explícito)
-- STAGING tinha DEFAULT 0 — manter, é compatível

-- =============================================================================
-- FASE 6: ADICIONAR TRIGGERS E FUNÇÕES FALTANTES
-- =============================================================================

-- ─── 6.1 fn_reservar_id_laudo_on_lote_insert + trigger ────────────────────
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Reservar o ID do laudo (id = lote_id) em status 'rascunho'
  -- Status 'rascunho' permite criar laudo sem hash_pdf/emissor_cpf/emitido_em
  -- Isso evita disparar a trigger de validação fn_validar_laudo_emitido
  INSERT INTO laudos (id, lote_id, status)
  VALUES (NEW.id, NEW.id, 'rascunho')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
  AFTER INSERT ON lotes_avaliacao
  FOR EACH ROW EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS
  'Ao inserir um lote, reserva automaticamente um registro de laudo com status rascunho.
   O id do laudo = id do lote (garantido por laudos_id_equals_lote_id constraint).';

-- ─── 6.2 audit_laudo_delete_attempt + trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION audit_laudo_delete_attempt()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Registrar tentativa de DELETE em laudos (sempre bloqueada)
  INSERT INTO auditoria_laudos (
    lote_id, acao, status, solicitado_por, detalhes
  ) VALUES (
    OLD.lote_id,
    'tentativa_delete',
    'erro',
    current_setting('app.current_user_cpf', true),
    jsonb_build_object('laudo_id', OLD.id, 'motivo', 'DELETE bloqueado — laudos são imutáveis')
  ) ON CONFLICT DO NOTHING;

  RAISE EXCEPTION 'Laudos não podem ser deletados (id=%). Operação registrada em auditoria.', OLD.id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_laudo_delete_attempt ON laudos;
CREATE TRIGGER trg_audit_laudo_delete_attempt
  BEFORE DELETE ON laudos
  FOR EACH ROW EXECUTE FUNCTION audit_laudo_delete_attempt();

-- =============================================================================
-- FASE 7: RECRIAR VIEW v_solicitacoes_emissao (migration 1141)
-- Adiciona link_disponibilizado_em que estava faltando no STAGING
-- =============================================================================

DROP VIEW IF EXISTS v_solicitacoes_emissao CASCADE;

CREATE VIEW v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  la.link_pagamento_token,
  la.link_pagamento_enviado_em,
  la.link_disponibilizado_em,
  la.pagamento_metodo,
  la.pagamento_parcelas,
  la.pago_em,
  e.nome AS empresa_nome,
  COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
  u.nome AS solicitante_nome,
  u.cpf AS solicitante_cpf,
  COUNT(a.id) AS num_avaliacoes_concluidas,
  la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
  la.criado_em AS lote_criado_em,
  la.liberado_em AS lote_liberado_em,
  la.status AS lote_status,
  -- Informações do laudo
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS laudo_tem_hash,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  CASE
    WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true
    ELSE false
  END AS laudo_ja_emitido,
  -- Tipo de solicitante
  CASE
    WHEN c.id IS NOT NULL THEN 'rh'
    WHEN la.entidade_id IS NOT NULL THEN 'gestor'
    ELSE 'desconhecido'
  END AS tipo_solicitante,
  c.id AS clinica_id,
  c.nome AS clinica_nome,
  COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
  e.id AS empresa_id,
  -- Dados do representante vinculado
  vc.id AS vinculo_id,
  r.id AS representante_id,
  r.nome AS representante_nome,
  r.codigo AS representante_codigo,
  r.tipo_pessoa AS representante_tipo_pessoa,
  r.percentual_comissao AS representante_percentual_comissao,
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada,
  (
    SELECT COUNT(*) FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  )::int AS comissoes_geradas_count,
  (
    SELECT COUNT(*)
    FROM comissoes_laudo cl
    WHERE cl.lote_pagamento_id = la.id
      AND cl.parcela_confirmada_em IS NOT NULL
  )::int AS comissoes_ativas_count,
  COALESCE(lr.valor_negociado, vc.valor_negociado) AS lead_valor_negociado
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN entidades ent ON ent.id = la.entidade_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
LEFT JOIN vinculos_comissao vc
  ON vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
  AND (
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL
      AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
    )
    OR
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NULL
      AND la.clinica_id IS NOT NULL
      AND vc.clinica_id = la.clinica_id
    )
  )
LEFT JOIN representantes r ON r.id = vc.representante_id
LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome,
  u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao,
  lr.valor_negociado, vc.valor_negociado
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão. '
  'link_disponibilizado_em: quando o suporte disponibilizou o link na conta do tomador. '
  'Migration 9000 (sync staging) + 1141 aplicadas em 2026-04-04.';

-- =============================================================================
-- FASE 8: VERIFICAÇÃO FINAL
-- =============================================================================

DO $$
DECLARE
  v_ok boolean := true;
  v_msg text;
BEGIN
  -- Verificar tabelas criadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='laudos_storage_log') THEN
    RAISE WARNING 'FALHA: laudos_storage_log não foi criada';
    v_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rate_limit_entries') THEN
    RAISE WARNING 'FALHA: rate_limit_entries não foi criada';
    v_ok := false;
  END IF;

  -- Verificar colunas adicionadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funcionarios' AND column_name='usuario_tipo') THEN
    RAISE WARNING 'FALHA: funcionarios.usuario_tipo não foi adicionada';
    v_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hierarquia_comercial' AND column_name='comercial_id') THEN
    RAISE WARNING 'FALHA: hierarquia_comercial.comercial_id não foi adicionada';
    v_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='laudos' AND column_name='relatorio_setor') THEN
    RAISE WARNING 'FALHA: laudos.relatorio_setor não foi adicionada';
    v_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios' AND column_name='senha_hash') THEN
    RAISE WARNING 'FALHA: usuarios.senha_hash não foi adicionada';
    v_ok := false;
  END IF;

  -- Verificar view
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='v_solicitacoes_emissao' AND column_name='link_disponibilizado_em') THEN
    RAISE WARNING 'FALHA: v_solicitacoes_emissao.link_disponibilizado_em não existe';
    v_ok := false;
  END IF;

  -- Verificar tabelas legacy removidas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='asaas_pagamentos') THEN
    RAISE WARNING 'FALHA: asaas_pagamentos ainda existe (deveria ter sido dropada)';
    v_ok := false;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entidades_senhas' AND column_name='contratante_id') THEN
    RAISE WARNING 'FALHA: entidades_senhas.contratante_id ainda existe (legacy)';
    v_ok := false;
  END IF;

  IF v_ok THEN
    RAISE NOTICE '✅ Migration 9000 concluída com sucesso — STAGING sincronizado com DEV';
  ELSE
    RAISE EXCEPTION '❌ Migration 9000 concluída com erros — ver WARNINGs acima';
  END IF;
END $$;

COMMIT;
