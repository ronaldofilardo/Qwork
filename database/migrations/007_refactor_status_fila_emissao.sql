-- ==========================================
-- MIGRATION 007: Refatoração de Status e Fila de Emissão
-- Descrição: Simplifica ENUMs, adiciona fila de emissão, triggers de imutabilidade, RLS
-- Data: 2025-01-03
-- Versão: 1.0.0
-- Autor: Sistema QWork
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007: Iniciando refatoração de status e fila de emissão ==='

-- ==========================================
-- 1. AJUSTES NO MODELO DE DADOS
-- ==========================================

\echo '1. Ajustando ENUMs de status...'

-- 1.1. Remover ENUMs antigos e criar novos simplificados
DO $$
BEGIN
    -- Dropar views que dependem das colunas status antes de alterar
    DROP VIEW IF EXISTS vw_auditoria_avaliacoes;
    DROP VIEW IF EXISTS vw_auditoria_lotes;
    DROP VIEW IF EXISTS vw_auditoria_laudos;
    DROP VIEW IF EXISTS vw_comparativo_empresas;
    DROP VIEW IF EXISTS vw_dashboard_por_empresa;
    DROP VIEW IF EXISTS vw_funcionarios_por_lote;
    DROP VIEW IF EXISTS vw_lotes_info; -- View mencionada no erro
    RAISE NOTICE 'Views dependentes removidas temporariamente';
    
    -- Dropar políticas RLS que dependem da coluna status
    DROP POLICY IF EXISTS lotes_emissor_select ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_funcionario_select ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_clinica ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_insert ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_update ON lotes_avaliacao;
    DROP POLICY IF EXISTS laudos_rh_clinica ON laudos;
    RAISE NOTICE 'Políticas RLS dependentes removidas temporariamente';
    
    -- Converter status_lote para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lotes_avaliacao' AND column_name = 'status') THEN
        ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de lotes_avaliacao convertida para TEXT';
    END IF;
    
    -- Converter status_laudo para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'laudos' AND column_name = 'status') THEN
        ALTER TABLE laudos ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de laudos convertida para TEXT';
    END IF;
    
    -- Converter status_avaliacao para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'avaliacoes' AND column_name = 'status') THEN
        ALTER TABLE avaliacoes ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de avaliacoes convertida para TEXT';
    END IF;

    -- Dropar ENUMs antigos
    DROP TYPE IF EXISTS status_lote CASCADE;
    DROP TYPE IF EXISTS status_lote_enum CASCADE;
    DROP TYPE IF EXISTS status_laudo CASCADE;
    DROP TYPE IF EXISTS status_laudo_enum CASCADE;
    DROP TYPE IF EXISTS status_avaliacao CASCADE;
    DROP TYPE IF EXISTS status_avaliacao_enum CASCADE;
    
    RAISE NOTICE 'ENUMs antigos removidos';
END $$;

-- Criar novos ENUMs simplificados
CREATE TYPE status_lote AS ENUM ('ativo', 'concluido', 'finalizado', 'cancelado');
COMMENT ON TYPE status_lote IS 'Status simplificado de lotes: ativo (em uso), concluido (avaliações finalizadas), finalizado (laudo enviado), cancelado';

-- Laudo só tem um estado persistido: 'enviado'
-- Não há mais rascunho ou emitido
CREATE TYPE status_laudo AS ENUM ('enviado');
COMMENT ON TYPE status_laudo IS 'Status de laudo: enviado (único estado persistido - laudo gerado e enviado)';

CREATE TYPE status_avaliacao AS ENUM ('iniciada', 'em_andamento', 'concluida', 'inativada');
COMMENT ON TYPE status_avaliacao IS 'Status de avaliação: iniciada (criada), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';

\echo '1.1. ENUMs atualizados com sucesso'

-- 1.2. Atualizar colunas para usar novos ENUMs
DO $$
BEGIN
    -- Atualizar status de lotes
    UPDATE lotes_avaliacao 
    SET status = 'ativo' 
    WHERE status NOT IN ('ativo', 'concluido', 'finalizado', 'cancelado');
    
    -- Atualizar avaliacoes
    UPDATE avaliacoes 
    SET status = 'iniciada' 
    WHERE status NOT IN ('iniciada', 'em_andamento', 'concluida', 'inativada');
    
    -- Atualizar laudos para 'enviado' (único estado válido)
    UPDATE laudos 
    SET status = 'enviado';
    
    RAISE NOTICE 'Dados migrados para novos status';
END $$;

-- Aplicar novos ENUMs às colunas
-- Dropar índices que usam status antes de alterar tipo
DROP INDEX IF EXISTS idx_lotes_auto_emitir;
DROP INDEX IF EXISTS idx_lotes_status;
DROP INDEX IF EXISTS idx_lotes_clinica_status;
DROP INDEX IF EXISTS idx_laudos_status;
DROP INDEX IF EXISTS idx_avaliacoes_status;

ALTER TABLE lotes_avaliacao ALTER COLUMN status DROP DEFAULT;
ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE status_lote USING status::status_lote;
ALTER TABLE lotes_avaliacao ALTER COLUMN status SET DEFAULT 'ativo'::status_lote;

ALTER TABLE laudos ALTER COLUMN status DROP DEFAULT;
ALTER TABLE laudos ALTER COLUMN status TYPE status_laudo USING status::status_laudo;
ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'enviado'::status_laudo;

ALTER TABLE avaliacoes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE avaliacoes ALTER COLUMN status TYPE status_avaliacao USING status::status_avaliacao;
ALTER TABLE avaliacoes ALTER COLUMN status SET DEFAULT 'iniciada'::status_avaliacao;

-- Recriar índices após alteração de tipo
CREATE INDEX idx_lotes_auto_emitir ON lotes_avaliacao (auto_emitir_em, status) WHERE auto_emitir_em IS NOT NULL AND status = 'concluido'::status_lote;
CREATE INDEX idx_lotes_status ON lotes_avaliacao (status);
CREATE INDEX idx_lotes_clinica_status ON lotes_avaliacao (clinica_id, status);
CREATE INDEX idx_laudos_status ON laudos (status);
CREATE INDEX idx_avaliacoes_status ON avaliacoes (status);

\echo '1.2. Colunas atualizadas para novos ENUMs'

-- 1.3. Adicionar novas colunas em lotes_avaliacao
ALTER TABLE lotes_avaliacao
  ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencia TEXT,
  ADD COLUMN IF NOT EXISTS processamento_em TIMESTAMP;

COMMENT ON COLUMN lotes_avaliacao.modo_emergencia IS 'Indica se laudo foi emitido via modo emergência';
COMMENT ON COLUMN lotes_avaliacao.motivo_emergencia IS 'Justificativa para uso do modo emergência';
COMMENT ON COLUMN lotes_avaliacao.processamento_em IS 'Timestamp efêmero indicando que emissão está em processamento';

\echo '1.3. Novas colunas adicionadas em lotes_avaliacao'

-- ==========================================
-- 2. TABELA DE FILA DE EMISSÃO
-- ==========================================

\echo '2. Criando tabela de fila de emissão...'

CREATE TABLE IF NOT EXISTS fila_emissao (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  tentativas INT DEFAULT 0,
  max_tentativas INT DEFAULT 3,
  proxima_tentativa TIMESTAMP DEFAULT NOW(),
  erro TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para buscar itens pendentes na fila
CREATE INDEX IF NOT EXISTS idx_fila_pendente 
ON fila_emissao(proxima_tentativa)
WHERE tentativas < max_tentativas;

-- Índice para buscar por lote
CREATE INDEX IF NOT EXISTS idx_fila_lote 
ON fila_emissao(lote_id);

COMMENT ON TABLE fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';
COMMENT ON COLUMN fila_emissao.tentativas IS 'Número de tentativas de processamento';
COMMENT ON COLUMN fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';
COMMENT ON COLUMN fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';
COMMENT ON COLUMN fila_emissao.erro IS 'Mensagem do último erro ocorrido';

\echo '2. Tabela fila_emissao criada com sucesso'

-- ==========================================
-- 3. TRIGGERS E CONSTRAINTS DE IMUTABILIDADE
-- ==========================================

\echo '3. Criando triggers de imutabilidade...'

-- 3.1. Trigger para impedir UPDATE em lotes finalizados/cancelados
CREATE OR REPLACE FUNCTION prevent_update_finalized_lote()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir modificação de lotes em estados terminais
  IF OLD.status IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Lote com status "%" não pode ser modificado', OLD.status;
  END IF;
  
  -- Impedir modificação se já existe laudo enviado
  IF EXISTS (
    SELECT 1 FROM laudos WHERE lote_id = OLD.id AND status = 'enviado'
  ) THEN
    RAISE EXCEPTION 'Lote possui laudo enviado. Modificações bloqueadas.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_lote ON lotes_avaliacao;
CREATE TRIGGER trg_immutable_lote
BEFORE UPDATE ON lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION prevent_update_finalized_lote();

\echo '3.1. Trigger de imutabilidade de lotes criado'

-- 3.2. Trigger para impedir UPDATE/DELETE em laudos enviados
CREATE OR REPLACE FUNCTION prevent_update_laudo_enviado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'enviado' THEN
    RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_laudo ON laudos;
CREATE TRIGGER trg_immutable_laudo
BEFORE UPDATE OR DELETE ON laudos
FOR EACH ROW EXECUTE FUNCTION prevent_update_laudo_enviado();

\echo '3.2. Trigger de imutabilidade de laudos criado'

-- ==========================================
-- 4. AUDITORIA AUTOMÁTICA
-- ==========================================

\echo '4. Configurando auditoria automática...'

-- 4.1. Criar tabela de auditoria se não existir
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id INTEGER,
  dados JSONB,
  user_id TEXT,
  user_role TEXT,
  ip TEXT,
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_criado_em ON audit_logs(criado_em DESC);

COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as ações críticas do sistema';

\echo '4.1. Tabela de auditoria criada/verificada'

-- 4.2. Trigger de auditoria para mudanças de status em lotes
CREATE OR REPLACE FUNCTION audit_lote_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (acao, entidade, entidade_id, dados)
    VALUES (
      'lote_status_change',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'status_antigo', OLD.status,
        'status_novo', NEW.status,
        'modo_emergencia', NEW.modo_emergencia,
        'motivo_emergencia', NEW.motivo_emergencia
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_lote_status ON lotes_avaliacao;
CREATE TRIGGER trg_audit_lote_status
AFTER UPDATE ON lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION audit_lote_status_change();

\echo '4.2. Trigger de auditoria de lotes criado'

-- 4.3. Trigger de auditoria para criação de laudos
CREATE OR REPLACE FUNCTION audit_laudo_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (acao, entidade, entidade_id, dados)
  VALUES (
    'laudo_criado',
    'laudos',
    NEW.id,
    jsonb_build_object(
      'lote_id', NEW.lote_id,
      'status', NEW.status,
      'tamanho_pdf', LENGTH(NEW.pdf)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_laudo_creation ON laudos;
CREATE TRIGGER trg_audit_laudo_creation
AFTER INSERT ON laudos
FOR EACH ROW EXECUTE FUNCTION audit_laudo_creation();

\echo '4.3. Trigger de auditoria de laudos criado'

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

\echo '5. Configurando Row Level Security...'

-- 5.1. Ativar RLS nas tabelas
ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

\echo '5.1. RLS ativado em lotes_avaliacao e laudos'

-- 5.2. Políticas antigas já foram removidas no início da migração
\echo '5.2. Políticas antigas removidas'

-- 5.3. Criar políticas para lotes_avaliacao

-- Emissor só vê lotes com status IN ('ativo', 'concluido', 'finalizado')
CREATE POLICY policy_lotes_emissor ON lotes_avaliacao
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) = 'emissor' AND
  status IN ('ativo', 'concluido', 'finalizado')
);

-- RH/Entidade só vê lotes do seu contratante
CREATE POLICY policy_lotes_entidade ON lotes_avaliacao
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) IN ('rh', 'entidade') AND
  contratante_id = NULLIF(current_setting('app.current_contratante_id', TRUE), '')::INTEGER
);

-- Admin vê tudo (mas só leitura)
CREATE POLICY policy_lotes_admin ON lotes_avaliacao
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'admin');

\echo '5.3. Políticas RLS para lotes_avaliacao criadas'

-- 5.4. Criar políticas para laudos

-- Emissor pode ver todos os laudos
CREATE POLICY policy_laudos_emissor ON laudos
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'emissor');

-- Admin vê tudo
CREATE POLICY policy_laudos_admin ON laudos
FOR SELECT
USING (current_setting('app.current_role', TRUE) = 'admin');

-- RH/Entidade pode ver laudos dos seus lotes
CREATE POLICY policy_laudos_entidade ON laudos
FOR SELECT
USING (
  current_setting('app.current_role', TRUE) IN ('rh', 'entidade') AND
  EXISTS (
    SELECT 1 FROM lotes_avaliacao 
    WHERE lotes_avaliacao.id = laudos.lote_id 
    AND lotes_avaliacao.contratante_id = NULLIF(current_setting('app.current_contratante_id', TRUE), '')::INTEGER
  )
);

\echo '5.4. Políticas RLS para laudos criadas'

-- ==========================================
-- 6. FUNÇÕES AUXILIARES
-- ==========================================

\echo '6. Criando funções auxiliares...'

-- 6.1. Função para calcular hash de PDF
CREATE OR REPLACE FUNCTION calcular_hash_pdf(pdf_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_hash_pdf IS 'Calcula hash SHA-256 de um PDF para validação de integridade';

\echo '6.1. Função calcular_hash_pdf criada'

-- 6.2. Função para verificar se lote pode ser processado
CREATE OR REPLACE FUNCTION lote_pode_ser_processado(p_lote_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_status status_lote;
  v_tem_laudo BOOLEAN;
BEGIN
  -- Buscar status do lote
  SELECT status INTO v_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se já tem laudo enviado
  SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = p_lote_id AND status = 'enviado')
  INTO v_tem_laudo;
  
  -- Pode processar se está concluído e não tem laudo
  RETURN v_status = 'concluido' AND NOT v_tem_laudo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION lote_pode_ser_processado IS 'Verifica se um lote está apto para emissão de laudo';

\echo '6.2. Função lote_pode_ser_processado criada'

-- ==========================================
-- 7. LIMPEZA E VALIDAÇÕES FINAIS
-- ==========================================

\echo '7. Executando validações finais...'

-- 7.1. Remover registros inconsistentes da fila de emissão
DELETE FROM fila_emissao
WHERE lote_id NOT IN (SELECT id FROM lotes_avaliacao);

\echo '7.1. Fila de emissão limpa'

-- 7.2. Validar integridade dos dados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar lotes com status inválido
  SELECT COUNT(*) INTO v_count
  FROM lotes_avaliacao
  WHERE status NOT IN ('ativo', 'concluido', 'finalizado', 'cancelado');
  
  IF v_count > 0 THEN
    RAISE WARNING '% lotes com status inválido encontrados', v_count;
  END IF;
  
  -- Verificar laudos sem lote
  SELECT COUNT(*) INTO v_count
  FROM laudos
  WHERE lote_id NOT IN (SELECT id FROM lotes_avaliacao);
  
  IF v_count > 0 THEN
    RAISE WARNING '% laudos órfãos encontrados', v_count;
  END IF;
  
  RAISE NOTICE 'Validações concluídas';
END $$;

\echo '7.2. Validações de integridade concluídas'

-- ==========================================
-- 8. COMMIT E FINALIZAÇÃO
-- ==========================================

\echo '=== MIGRATION 007: Concluída com sucesso ==='

COMMIT;

-- ==========================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- ==========================================

\echo ''
\echo 'Verificando resultados da migration...'

-- Verificar ENUMs
SELECT 
  'ENUMs criados' AS categoria,
  typname AS nome,
  pg_catalog.obj_description(pg_type.oid, 'pg_type') AS descricao
FROM pg_type
WHERE typname IN ('status_lote', 'status_laudo', 'status_avaliacao')
ORDER BY typname;

-- Verificar tabela fila_emissao
SELECT 
  'Tabela fila_emissao' AS categoria,
  COUNT(*) AS total_registros
FROM fila_emissao;

-- Verificar triggers
SELECT 
  'Triggers criados' AS categoria,
  trigger_name AS nome,
  event_manipulation AS evento,
  event_object_table AS tabela
FROM information_schema.triggers
WHERE trigger_name IN ('trg_immutable_lote', 'trg_immutable_laudo', 'trg_audit_lote_status', 'trg_audit_laudo_creation')
ORDER BY trigger_name;

-- Verificar políticas RLS
SELECT 
  'Políticas RLS' AS categoria,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('lotes_avaliacao', 'laudos')
ORDER BY tablename, policyname;

\echo ''
\echo 'Migration 007 aplicada com sucesso!'
\echo 'Próximos passos:'
\echo '  1. Atualizar lib/laudo-auto.ts com nova lógica transacional'
\echo '  2. Criar worker de fila (scripts/processar-fila-emissao.ts)'
\echo '  3. Atualizar rotas de API com validações RBAC'
\echo '  4. Atualizar componentes do frontend'

-- Recriar views removidas temporariamente
DROP VIEW IF EXISTS vw_auditoria_avaliacoes;
CREATE OR REPLACE VIEW vw_auditoria_avaliacoes AS
SELECT 
    a.id as avaliacao_id,
    a.funcionario_cpf as cpf,
    f.clinica_id,
    f.empresa_id,
    l.codigo as lote,
    l.status as lote_status,
    CASE WHEN l.status = 'ativo' THEN true ELSE false END as liberado,
    a.status as avaliacao_status,
    CASE WHEN a.status = 'concluida' THEN true ELSE false END as concluida,
    CASE WHEN a.status = 'inativada' THEN true ELSE false END as inativada,
    -- Contar interrupções via audit_logs
    (
        SELECT COUNT(*) 
        FROM audit_logs 
        WHERE resource = 'avaliacoes' 
        AND resource_id = a.id::TEXT 
        AND action = 'UPDATE'
        AND old_data->>'status' != new_data->>'status'
    ) as numero_interrupcoes,
    a.inicio as iniciada_em,
    a.envio as concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome
FROM avaliacoes a
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
LEFT JOIN clinicas c ON c.id = f.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = f.empresa_id
ORDER BY a.criado_em DESC;

COMMENT ON VIEW vw_auditoria_avaliacoes IS 'View agregada para auditoria de avaliações com todas as informações necessárias';

DROP VIEW IF EXISTS vw_auditoria_lotes;
CREATE OR REPLACE VIEW vw_auditoria_lotes AS
SELECT 
    l.id as lote_id,
    l.codigo as numero_lote,
    l.clinica_id,
    l.empresa_id,
    l.status,
    l.tipo,
    l.titulo,
    l.liberado_por as liberado_por_cpf,
    f.nome as liberado_por_nome,
    l.liberado_em,
    l.criado_em,
    l.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Contar avaliações do lote
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id) as total_avaliacoes,
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id AND status = 'concluida') as avaliacoes_concluidas,
    -- Contar mudanças de status via audit_logs
    (
        SELECT COUNT(*) 
        FROM audit_logs 
        WHERE resource = 'lotes_avaliacao' 
        AND resource_id = l.id::TEXT 
        AND action = 'UPDATE'
        AND old_data->>'status' != new_data->>'status'
    ) as mudancas_status
FROM lotes_avaliacao l
LEFT JOIN funcionarios f ON f.cpf = l.liberado_por
LEFT JOIN clinicas c ON c.id = l.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY l.criado_em DESC;

COMMENT ON VIEW vw_auditoria_lotes IS 'View agregada para auditoria de lotes com estatísticas e histórico';

DROP VIEW IF EXISTS vw_auditoria_laudos;
CREATE OR REPLACE VIEW vw_auditoria_laudos AS
SELECT
    ld.id as laudo_id,
    ld.emissor_cpf,
    f.nome as emissor_nome,
    l.clinica_id,
    l.empresa_id,
    l.id as lote_id,
    l.codigo as numero_lote,
    ld.status,
    ld.hash_pdf,
    ld.criado_em,
    ld.emitido_em,
    ld.enviado_em,
    ld.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Verificar se tem PDF
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN true
        ELSE false
    END as tem_arquivo_pdf,
    -- Tamanho do PDF em KB
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN pg_column_size (ld.arquivo_pdf) / 1024
        ELSE 0
    END as tamanho_pdf_kb
FROM
    laudos ld
    LEFT JOIN funcionarios f ON f.cpf = ld.emissor_cpf
    LEFT JOIN lotes_avaliacao l ON l.id = ld.lote_id
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY ld.criado_em DESC;

COMMENT ON VIEW vw_auditoria_laudos IS 'View agregada para auditoria de laudos com informações de emissão e hash';

DROP VIEW IF EXISTS vw_comparativo_empresas;
CREATE VIEW vw_comparativo_empresas AS
 SELECT ec.clinica_id,
    ec.id AS empresa_id,
    ec.nome AS empresa_nome,
    avg(
        CASE
            WHEN (r.grupo = 1) THEN r.valor
            ELSE NULL::integer
        END) AS demandas_trabalho,
    avg(
        CASE
            WHEN (r.grupo = 2) THEN r.valor
            ELSE NULL::integer
        END) AS organizacao_conteudo,
    avg(
        CASE
            WHEN (r.grupo = 3) THEN r.valor
            ELSE NULL::integer
        END) AS relacoes_sociais,
    avg(
        CASE
            WHEN (r.grupo = 4) THEN r.valor
            ELSE NULL::integer
        END) AS lideranca,
    avg(
        CASE
            WHEN (r.grupo = 5) THEN r.valor
            ELSE NULL::integer
        END) AS valores_organizacionais,
    avg(
        CASE
            WHEN (r.grupo = 6) THEN r.valor
            ELSE NULL::integer
        END) AS saude_bem_estar,
    avg(r.valor) AS score_geral,
    count(DISTINCT f.cpf) AS funcionarios_responderam,
    count(r.valor) AS total_respostas
   FROM (((public.empresas_clientes ec
     JOIN public.funcionarios f ON ((ec.id = f.empresa_id)))
     JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
     JOIN public.respostas r ON ((a.id = r.avaliacao_id)))
  WHERE (((a.status)::text = 'concluida'::text) AND (r.grupo <= 6))
  GROUP BY ec.clinica_id, ec.id, ec.nome
  ORDER BY ec.clinica_id, ec.nome;

DROP VIEW IF EXISTS vw_funcionarios_por_lote;
CREATE VIEW vw_funcionarios_por_lote AS
SELECT
    f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.turno,
    f.escala,
    f.empresa_id,
    f.clinica_id,
    a.id as avaliacao_id,
    a.status as status_avaliacao,
    a.envio as data_conclusao,
    a.inicio as data_inicio,
    a.inativada_em as data_inativacao,
    a.motivo_inativacao,
    a.lote_id
FROM funcionarios f
    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
WHERE
    f.perfil = 'funcionario'
    AND f.ativo = true;

COMMENT ON VIEW vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';

COMMIT;
