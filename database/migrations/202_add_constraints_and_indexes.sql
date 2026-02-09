-- ==========================================
-- MIGRATION 202: Adicionar Constraints e Índices de Performance
-- Descrição: Adiciona FKs, constraints de integridade e índices otimizados
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. VALIDAÇÃO PRÉ-MIGRATION
-- ==========================================

-- Verificar dados órfãos antes de adicionar FKs
DO $$
DECLARE
  orfaos_count INTEGER;
BEGIN
  -- Verificar laudos sem lote válido
  SELECT COUNT(*) INTO orfaos_count
  FROM laudos l
  WHERE NOT EXISTS (
    SELECT 1 FROM lotes_avaliacao la
    WHERE la.id = l.lote_id
  );
  
  IF orfaos_count > 0 THEN
    RAISE WARNING 'Encontrados % laudos órfãos (sem lote válido). Eles serão reportados.', orfaos_count;
    
    -- Logar laudos órfãos
    INSERT INTO _migration_issues (
      migration_version,
      issue_type,
      description,
      data,
      created_at
    )
    SELECT 
      202,
      'orphan_laudo',
      'Laudo sem lote válido',
      json_build_object('laudo_id', l.id, 'lote_id', l.lote_id),
      NOW()
    FROM laudos l
    WHERE NOT EXISTS (
      SELECT 1 FROM lotes_avaliacao la WHERE la.id = l.lote_id
    );
  END IF;
END $$;

-- Criar tabela de issues se não existir
CREATE TABLE IF NOT EXISTS _migration_issues (
  id SERIAL PRIMARY KEY,
  migration_version INTEGER NOT NULL,
  issue_type VARCHAR(50) NOT NULL,
  description TEXT,
  data JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 2. ADICIONAR FOREIGN KEYS
-- ==========================================

-- FK: laudos.lote_id -> lotes_avaliacao.id
-- Nota: ON DELETE CASCADE significa que ao deletar lote, laudos são deletados também
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_laudos_lote_id'
  ) THEN
    -- Deletar laudos órfãos antes de criar FK
    DELETE FROM laudos
    WHERE NOT EXISTS (
      SELECT 1 FROM lotes_avaliacao WHERE id = laudos.lote_id
    );
    
    ALTER TABLE laudos
    ADD CONSTRAINT fk_laudos_lote_id
    FOREIGN KEY (lote_id)
    REFERENCES lotes_avaliacao(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'FK fk_laudos_lote_id criada com sucesso';
  END IF;
END $$;

-- FK: laudos.emissor_cpf -> funcionarios.cpf
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_laudos_emissor_cpf'
  ) THEN
    ALTER TABLE laudos
    ADD CONSTRAINT fk_laudos_emissor_cpf
    FOREIGN KEY (emissor_cpf)
    REFERENCES funcionarios(cpf)
    ON DELETE RESTRICT; -- Não permitir deletar emissor com laudos
    
    RAISE NOTICE 'FK fk_laudos_emissor_cpf criada com sucesso';
  END IF;
END $$;

-- FK: auditoria_laudos.lote_id -> lotes_avaliacao.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_auditoria_laudos_lote_id'
  ) THEN
    -- Limpar auditorias órfãs
    DELETE FROM auditoria_laudos
    WHERE NOT EXISTS (
      SELECT 1 FROM lotes_avaliacao WHERE id = auditoria_laudos.lote_id
    );
    
    ALTER TABLE auditoria_laudos
    ADD CONSTRAINT fk_auditoria_laudos_lote_id
    FOREIGN KEY (lote_id)
    REFERENCES lotes_avaliacao(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'FK fk_auditoria_laudos_lote_id criada com sucesso';
  END IF;
END $$;

-- ==========================================
-- 3. ADICIONAR CONSTRAINTS DE INTEGRIDADE
-- ==========================================

-- Constraint: hash_pdf deve ser válido SHA-256 (64 caracteres hex)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_laudos_hash_pdf_valid'
  ) THEN
    ALTER TABLE laudos
    ADD CONSTRAINT chk_laudos_hash_pdf_valid
    CHECK (
      hash_pdf IS NULL OR 
      (hash_pdf ~ '^[a-f0-9]{64}$')
    );
    
    RAISE NOTICE 'Constraint chk_laudos_hash_pdf_valid criada';
  END IF;
END $$;

-- Constraint: status do laudo deve ser válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_laudos_status_valid'
  ) THEN
    ALTER TABLE laudos
    ADD CONSTRAINT chk_laudos_status_valid
    CHECK (status IN ('emitido', 'enviado', 'rascunho'));
    
    RAISE NOTICE 'Constraint chk_laudos_status_valid criada';
  END IF;
END $$;

-- Constraint: emitido_em deve ser anterior a enviado_em
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_laudos_emitido_antes_enviado'
  ) THEN
    ALTER TABLE laudos
    ADD CONSTRAINT chk_laudos_emitido_antes_enviado
    CHECK (
      enviado_em IS NULL OR 
      emitido_em IS NULL OR 
      emitido_em <= enviado_em
    );
    
    RAISE NOTICE 'Constraint chk_laudos_emitido_antes_enviado criada';
  END IF;
END $$;

-- ==========================================
-- 4. ÍNDICES DE PERFORMANCE
-- ==========================================

-- Índice: Buscar lotes por status (query comum no dashboard)
CREATE INDEX IF NOT EXISTS idx_lotes_status_criado
ON lotes_avaliacao(status, criado_em DESC)
WHERE status IN ('ativo', 'concluido', 'emissao_solicitada');

-- Índice: Buscar lotes com emissão solicitada
CREATE INDEX IF NOT EXISTS idx_lotes_emissao_solicitada_liberado
ON lotes_avaliacao(liberado_em DESC)
WHERE status = 'emissao_solicitada';

-- Índice: Buscar laudos por emissor
CREATE INDEX IF NOT EXISTS idx_laudos_emissor_cpf_emitido
ON laudos(emissor_cpf, emitido_em DESC);

-- Índice: Buscar laudos por status
CREATE INDEX IF NOT EXISTS idx_laudos_status
ON laudos(status, emitido_em DESC);

-- Índice: Buscar laudos com hash (para verificação de integridade)
CREATE INDEX IF NOT EXISTS idx_laudos_hash_pdf
ON laudos(hash_pdf)
WHERE hash_pdf IS NOT NULL;

-- Índice: Buscar auditoria por lote e ação
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_lote_acao
ON auditoria_laudos(lote_id, acao, criado_em DESC);

-- Índice: Buscar auditoria de solicitações de emissão
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_solicitante_criado
ON auditoria_laudos(emissor_cpf, criado_em DESC)
WHERE acao = 'emissao_solicitada';

-- Índice: Dashboard do emissor - lotes prontos para emitir
CREATE INDEX IF NOT EXISTS idx_dashboard_emissor
ON lotes_avaliacao(status, liberado_em DESC)
WHERE status IN ('emissao_solicitada', 'emissao_em_andamento')
  AND cancelado_automaticamente = false;

-- Índice composto para queries de relatório
CREATE INDEX IF NOT EXISTS idx_lotes_empresa_status_liberado
ON lotes_avaliacao(empresa_id, status, liberado_em DESC);

-- Índice para contagem de avaliações por lote
CREATE INDEX IF NOT EXISTS idx_avaliacoes_lote_status
ON avaliacoes(lote_id, status)
WHERE status != 'inativada';

-- ==========================================
-- 5. ATUALIZAR ESTATÍSTICAS
-- ==========================================

-- Atualizar estatísticas das tabelas para o planner escolher melhores índices
ANALYZE lotes_avaliacao;
ANALYZE laudos;
ANALYZE auditoria_laudos;
ANALYZE avaliacoes;

-- ==========================================
-- 6. ADICIONAR COMENTÁRIOS
-- ==========================================

COMMENT ON CONSTRAINT fk_laudos_lote_id ON laudos IS
'Garante integridade referencial: todo laudo deve ter um lote válido';

COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON laudos IS
'Garante que emissor existe na tabela funcionarios. RESTRICT previne deleção de emissor com laudos.';

COMMENT ON CONSTRAINT chk_laudos_hash_pdf_valid ON laudos IS
'Valida que hash_pdf é um SHA-256 válido (64 caracteres hexadecimais)';

COMMENT ON CONSTRAINT chk_laudos_emitido_antes_enviado ON laudos IS
'Garante que data de emissão é anterior à data de envio';

COMMENT ON INDEX idx_dashboard_emissor IS
'Otimiza query do dashboard do emissor para listar lotes prontos para emissão';

COMMENT ON INDEX idx_lotes_empresa_status_liberado IS
'Otimiza queries de relatório por empresa e status';

-- ==========================================
-- 7. CRIAR VIEW OTIMIZADA PARA DASHBOARD EMISSOR
-- ==========================================

CREATE OR REPLACE VIEW v_dashboard_emissor AS
SELECT 
  la.id as lote_id,
  la.descricao,
  la.tipo,
  la.status,
  la.liberado_em,
  la.liberado_por,
  COALESCE(ec.nome, cont.nome) as empresa_nome,
  COUNT(a.id) FILTER (WHERE a.status != 'inativada') as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as avaliacoes_concluidas,
  l.id as laudo_id,
  l.status as laudo_status,
  l.hash_pdf,
  l.emitido_em,
  l.enviado_em,
  al.emissor_cpf as solicitado_por,
  al.criado_em as solicitado_em
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
LEFT JOIN tomadores cont ON la.contratante_id = cont.id
LEFT JOIN avaliacoes a ON la.id = a.lote_id
LEFT JOIN laudos l ON la.id = l.lote_id
LEFT JOIN LATERAL (
  SELECT emissor_cpf, criado_em
  FROM auditoria_laudos
  WHERE lote_id = la.id AND acao = 'emissao_solicitada'
  ORDER BY criado_em DESC
  LIMIT 1
) al ON true
WHERE la.status IN ('emissao_solicitada', 'emissao_em_andamento')
  AND la.cancelado_automaticamente = false
GROUP BY 
  la.id, la.descricao, la.tipo, la.status, la.liberado_em, la.liberado_por,
  ec.nome, cont.nome, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  al.emissor_cpf, al.criado_em
ORDER BY la.liberado_em DESC;

COMMENT ON VIEW v_dashboard_emissor IS
'View otimizada para dashboard do emissor - lista lotes prontos para emissão com informações consolidadas';

COMMIT;

-- ==========================================
-- VALIDAÇÃO PÓS-MIGRATION
-- ==========================================

-- Verificar se todos os índices foram criados
DO $$
DECLARE
  expected_indexes TEXT[] := ARRAY[
    'idx_lotes_status_criado',
    'idx_lotes_emissao_solicitada_liberado',
    'idx_laudos_emissor_cpf_emitido',
    'idx_laudos_status',
    'idx_laudos_hash_pdf',
    'idx_auditoria_laudos_lote_acao',
    'idx_dashboard_emissor',
    'idx_lotes_empresa_status_liberado'
  ];
  idx TEXT;
  missing_count INTEGER := 0;
BEGIN
  FOREACH idx IN ARRAY expected_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = idx
    ) THEN
      RAISE WARNING 'Índice % não foi criado', idx;
      missing_count := missing_count + 1;
    END IF;
  END LOOP;
  
  IF missing_count = 0 THEN
    RAISE NOTICE 'Todos os índices foram criados com sucesso';
  END IF;
END $$;

-- ==========================================
-- ROLLBACK (se necessário)
-- ==========================================

/*
BEGIN;

-- Remover FKs
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_lote_id;
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_emissor_cpf;
ALTER TABLE auditoria_laudos DROP CONSTRAINT IF EXISTS fk_auditoria_laudos_lote_id;

-- Remover constraints
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS chk_laudos_hash_pdf_valid;
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS chk_laudos_emitido_antes_enviado;

-- Remover índices
DROP INDEX IF EXISTS idx_lotes_status_criado;
DROP INDEX IF EXISTS idx_lotes_emissao_solicitada_liberado;
DROP INDEX IF EXISTS idx_laudos_emissor_cpf_emitido;
DROP INDEX IF EXISTS idx_laudos_status;
DROP INDEX IF EXISTS idx_laudos_hash_pdf;
DROP INDEX IF EXISTS idx_auditoria_laudos_lote_acao;
DROP INDEX IF EXISTS idx_auditoria_laudos_solicitante_criado;
DROP INDEX IF EXISTS idx_dashboard_emissor;
DROP INDEX IF EXISTS idx_lotes_empresa_status_liberado;
DROP INDEX IF EXISTS idx_avaliacoes_lote_status;

-- Remover view
DROP VIEW IF EXISTS v_dashboard_emissor;

-- Remover tabela de issues
DROP TABLE IF EXISTS _migration_issues;

-- Remover migração
DELETE FROM _migrations WHERE version = 202;

COMMIT;
*/
