-- Migration 043: Adicionar UNIQUE constraint em recibos.pagamento_id e estender tipo_notificacao
-- Data: 2026-01-01
-- Descrição: Garantir idempotência na geração de recibos e suportar notificações retroativas
-- Objetivo: Evitar duplicação de recibos e permitir notificações de recibos retroativos

-- ============================================================================
-- PART 1: UNIQUE CONSTRAINT em pagamento_id
-- ============================================================================

-- Verificar e remover recibos duplicados antes de criar constraint
DO $$
DECLARE
  v_duplicados INTEGER;
BEGIN
  -- Contar duplicatas
  SELECT COUNT(*) INTO v_duplicados
  FROM (
    SELECT pagamento_id, COUNT(*) as cnt
    FROM recibos
    WHERE pagamento_id IS NOT NULL
    GROUP BY pagamento_id
    HAVING COUNT(*) > 1
  ) duplicatas;

  IF v_duplicados > 0 THEN
    RAISE NOTICE 'Encontradas % duplicatas em recibos.pagamento_id', v_duplicados;
    
    -- Manter apenas o recibo mais recente para cada pagamento
    DELETE FROM recibos r1
    WHERE EXISTS (
      SELECT 1 FROM recibos r2
      WHERE r2.pagamento_id = r1.pagamento_id
        AND r2.id > r1.id
    );
    
    RAISE NOTICE 'Duplicatas removidas, mantendo apenas os recibos mais recentes';
  END IF;
END $$;

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recibos_pagamento_id_unique'
  ) THEN
    ALTER TABLE recibos 
      ADD CONSTRAINT recibos_pagamento_id_unique 
      UNIQUE (pagamento_id);
    RAISE NOTICE 'Constraint UNIQUE adicionada em recibos.pagamento_id';
  ELSE
    RAISE NOTICE 'Constraint UNIQUE já existe em recibos.pagamento_id';
  END IF;
END $$;

-- ============================================================================
-- PART 2: EXTENSÃO DO ENUM tipo_notificacao
-- ============================================================================

-- Adicionar novos valores ao enum tipo_notificacao se não existirem
DO $$
BEGIN
  -- Verificar se o tipo existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacao') THEN
    
    -- Adicionar 'recibo_emitido' se não existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'tipo_notificacao'::regtype 
        AND enumlabel = 'recibo_emitido'
    ) THEN
      ALTER TYPE tipo_notificacao ADD VALUE 'recibo_emitido';
      RAISE NOTICE 'Valor recibo_emitido adicionado ao enum tipo_notificacao';
    END IF;

    -- Adicionar 'recibo_gerado_retroativo' se não existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'tipo_notificacao'::regtype 
        AND enumlabel = 'recibo_gerado_retroativo'
    ) THEN
      ALTER TYPE tipo_notificacao ADD VALUE 'recibo_gerado_retroativo';
      RAISE NOTICE 'Valor recibo_gerado_retroativo adicionado ao enum tipo_notificacao';
    END IF;

  ELSE
    RAISE NOTICE 'Enum tipo_notificacao não existe, será criado posteriormente';
  END IF;
END $$;

-- ============================================================================
-- PART 3: FUNÇÃO AUXILIAR PARA CRIAR NOTIFICAÇÃO DE RECIBO
-- ============================================================================

CREATE OR REPLACE FUNCTION criar_notificacao_recibo(
  p_recibo_id INTEGER,
  p_contratante_id INTEGER,
  p_tipo tipo_notificacao DEFAULT 'recibo_emitido'
)
RETURNS INTEGER AS $$
DECLARE
  v_notificacao_id INTEGER;
  v_responsavel_cpf VARCHAR(14);
  v_numero_recibo VARCHAR(50);
BEGIN
  -- Buscar CPF do responsável e número do recibo
  SELECT c.responsavel_cpf, r.numero_recibo
  INTO v_responsavel_cpf, v_numero_recibo
  FROM contratantes c
  CROSS JOIN recibos r
  WHERE c.id = p_contratante_id
    AND r.id = p_recibo_id;

  IF v_responsavel_cpf IS NULL THEN
    RAISE NOTICE 'Responsável não encontrado para contratante %', p_contratante_id;
    RETURN NULL;
  END IF;

  -- Criar notificação
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_id,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto
  ) VALUES (
    p_tipo,
    'media',
    p_contratante_id,
    'gestor',
    CASE 
      WHEN p_tipo = 'recibo_gerado_retroativo' 
      THEN 'Recibo Retroativo Disponível'
      ELSE 'Recibo de Pagamento Gerado'
    END,
    CASE 
      WHEN p_tipo = 'recibo_gerado_retroativo'
      THEN 'Recibo retroativo ' || v_numero_recibo || ' foi gerado para seu pagamento de 2025. Disponível para download.'
      ELSE 'Seu recibo de pagamento ' || v_numero_recibo || ' foi gerado com sucesso. Clique para visualizar ou baixar.'
    END,
    jsonb_build_object(
      'recibo_id', p_recibo_id,
      'numero_recibo', v_numero_recibo,
      'tipo_geracao', CASE WHEN p_tipo = 'recibo_gerado_retroativo' THEN 'retroativo' ELSE 'imediato' END
    ),
    '/recibo/' || p_recibo_id,
    'Ver Recibo'
  ) RETURNING id INTO v_notificacao_id;

  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_notificacao_recibo IS 'Cria notificação para contratante quando recibo é gerado';

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON CONSTRAINT recibos_pagamento_id_unique ON recibos 
  IS 'Garante que cada pagamento tem no máximo um recibo ativo (idempotência)';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
