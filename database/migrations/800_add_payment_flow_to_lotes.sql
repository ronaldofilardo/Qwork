-- Migration 800: Adiciona fluxo de pagamento pré-emissão de laudos
-- Autor: Sistema
-- Data: 2026
-- Descrição: Implementa o fluxo onde admin define valor e gera link de pagamento antes da emissão

BEGIN;

-- 1. Criar ENUM para status de pagamento (link de uso único)
DO $$ BEGIN
    CREATE TYPE status_pagamento AS ENUM (
        'aguardando_cobranca',    -- RH/Gestor solicitou emissão, aguardando admin definir valor
        'aguardando_pagamento',   -- Link gerado (uso único), cliente ainda não pagou
        'pago'                    -- Pagamento confirmado, token marcado como usado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas de pagamento em lotes_avaliacao
-- Token de uso único: após usado (pago), um novo pode ser gerado se necessário
ALTER TABLE lotes_avaliacao
    ADD COLUMN IF NOT EXISTS status_pagamento status_pagamento,
    ADD COLUMN IF NOT EXISTS solicitacao_emissao_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS valor_por_funcionario DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS link_pagamento_token UUID,
    ADD COLUMN IF NOT EXISTS link_pagamento_enviado_em TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pagamento_metodo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS pagamento_parcelas INTEGER,
    ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_status_pagamento 
    ON lotes_avaliacao(status_pagamento);

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_token_pagamento 
    ON lotes_avaliacao(link_pagamento_token) 
    WHERE link_pagamento_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_solicitacao_emissao 
    ON lotes_avaliacao(solicitacao_emissao_em) 
    WHERE status_pagamento IS NOT NULL;

-- 4. Adicionar constraints de validação
DO $$
BEGIN
    ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT valor_funcionario_positivo_check 
            CHECK (valor_por_funcionario > 0 OR valor_por_funcionario IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT pagamento_parcelas_range_check 
            CHECK (pagamento_parcelas BETWEEN 1 AND 12 OR pagamento_parcelas IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT link_pagamento_token_unique 
            UNIQUE (link_pagamento_token);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT pagamento_completo_check 
            CHECK (
                (status_pagamento = 'pago' AND pagamento_metodo IS NOT NULL AND pagamento_parcelas IS NOT NULL AND pago_em IS NOT NULL)
                OR (status_pagamento != 'pago' OR status_pagamento IS NULL)
            );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

-- 5. Função para calcular valor total do lote
CREATE OR REPLACE FUNCTION calcular_valor_total_lote(p_lote_id INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_valor_por_funcionario DECIMAL(10,2);
    v_num_avaliacoes INTEGER;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Buscar valor por funcionário e contar avaliações concluídas
    SELECT 
        la.valor_por_funcionario,
        COUNT(a.id)
    INTO v_valor_por_funcionario, v_num_avaliacoes
    FROM lotes_avaliacao la
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    WHERE la.id = p_lote_id
    GROUP BY la.id, la.valor_por_funcionario;
    
    -- Se não encontrou o lote ou não há valor definido, retornar NULL
    IF v_valor_por_funcionario IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calcular valor total
    v_valor_total := v_valor_por_funcionario * v_num_avaliacoes;
    
    RETURN v_valor_total;
END;
$$;

-- 6. Função para validar token de pagamento (uso único)
-- Token é válido apenas se status = 'aguardando_pagamento'
-- Após uso (status = 'pago'), token torna-se inválido automaticamente
CREATE OR REPLACE FUNCTION validar_token_pagamento(p_token UUID)
RETURNS TABLE (
    lote_id INTEGER,
    valido BOOLEAN,
    ja_usado BOOLEAN,
    status_atual status_pagamento,
    valor_por_funcionario DECIMAL(10,2),
    num_avaliacoes INTEGER,
    valor_total DECIMAL(10,2),
    empresa_nome VARCHAR,
    nome_tomador VARCHAR
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id AS lote_id,
        (la.link_pagamento_token = p_token 
         AND la.status_pagamento = 'aguardando_pagamento') AS valido,
        (la.status_pagamento = 'pago') AS ja_usado,
        la.status_pagamento AS status_atual,
        la.valor_por_funcionario,
        COUNT(a.id)::INTEGER AS num_avaliacoes,
        (la.valor_por_funcionario * COUNT(a.id)) AS valor_total,
        e.nome AS empresa_nome,
        COALESCE(c.nome, e.nome) AS nome_tomador
    FROM lotes_avaliacao la
    JOIN empresas_clientes e ON e.id = la.empresa_id
    LEFT JOIN clinicas c ON c.id = la.clinica_id
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    WHERE la.link_pagamento_token = p_token
    GROUP BY la.id, e.nome, c.nome;
END;
$$;

-- 7. View para admin gerenciar solicitações de emissão
CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
SELECT 
    la.id AS lote_id,
    la.status_pagamento,
    la.solicitacao_emissao_em,
    la.valor_por_funcionario,
    la.link_pagamento_token,
    la.link_pagamento_enviado_em,
    la.pagamento_metodo,
    la.pagamento_parcelas,
    la.pago_em,
    e.nome AS empresa_nome,
    COALESCE(c.nome, e.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    COUNT(a.id) AS num_avaliacoes_concluidas,
    la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
WHERE la.status_pagamento IS NOT NULL
GROUP BY 
    la.id, e.nome, c.nome, u.nome, u.cpf
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

-- 8. Trigger para auditoria de mudanças em status_pagamento
CREATE OR REPLACE FUNCTION audit_status_pagamento_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento THEN
        INSERT INTO auditoria_logs (
            tabela,
            registro_id,
            acao,
            dados_antigos,
            dados_novos,
            usuario_cpf,
            sessao_id
        ) VALUES (
            'lotes_avaliacao',
            NEW.id,
            'UPDATE',
            jsonb_build_object('status_pagamento', OLD.status_pagamento),
            jsonb_build_object('status_pagamento', NEW.status_pagamento),
            current_setting('app.current_user_cpf', true),
            current_setting('app.session_id', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_status_pagamento ON lotes_avaliacao;
CREATE TRIGGER trg_audit_status_pagamento
    AFTER UPDATE ON lotes_avaliacao
    FOR EACH ROW
    WHEN (OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento)
    EXECUTE FUNCTION audit_status_pagamento_change();

-- 9. Comentários nas colunas
COMMENT ON COLUMN lotes_avaliacao.status_pagamento IS 'Status do pagamento: aguardando_cobranca, aguardando_pagamento, pago (link de uso único)';
COMMENT ON COLUMN lotes_avaliacao.solicitacao_emissao_em IS 'Timestamp quando RH/Gestor solicitou a emissão';
COMMENT ON COLUMN lotes_avaliacao.valor_por_funcionario IS 'Valor em R$ cobrado por funcionário (definido pelo admin)';
COMMENT ON COLUMN lotes_avaliacao.link_pagamento_token IS 'Token UUID único de uso único para acesso público. Após uso, novo token pode ser gerado';
COMMENT ON COLUMN lotes_avaliacao.link_pagamento_enviado_em IS 'Timestamp quando o link foi gerado e enviado';
COMMENT ON COLUMN lotes_avaliacao.pagamento_metodo IS 'Método de pagamento escolhido: pix, boleto, cartao';
COMMENT ON COLUMN lotes_avaliacao.pagamento_parcelas IS 'Número de parcelas (1-12) para cartão de crédito';
COMMENT ON COLUMN lotes_avaliacao.pago_em IS 'Timestamp de confirmação do pagamento';

COMMIT;
