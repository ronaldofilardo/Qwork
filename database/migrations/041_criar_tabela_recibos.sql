-- Migration: Criar tabela de recibos
-- Data: 2025-12-22
-- Descrição: Separa informações financeiras do contrato em recibo pós-pagamento
-- Objetivo: Ter contrato neutro (serviços) e recibo financeiro (valores, vigência)

-- ============================================================================
-- TABELA RECIBOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS recibos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL,
    pagamento_id INTEGER NOT NULL,
    contratante_id INTEGER NOT NULL,
    
    -- Número único do recibo
    numero_recibo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Vigência calculada (data_pagamento + período)
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE NOT NULL,
    
    -- Cobertura de funcionários
    numero_funcionarios_cobertos INTEGER NOT NULL,
    
    -- Valores
    valor_total_anual DECIMAL(10,2) NOT NULL,
    valor_por_funcionario DECIMAL(10,2),
    
    -- Forma de pagamento detalhada
    forma_pagamento VARCHAR(50) NOT NULL, -- 'avista', 'parcelado', 'pix', etc.
    numero_parcelas INTEGER DEFAULT 1,
    valor_parcela DECIMAL(10,2),
    detalhes_parcelas JSONB, -- Array com [{parcela: 1, valor: 100, vencimento: '2025-01-15'}]
    
    -- Descrição narrativa da forma de pagamento
    descricao_pagamento TEXT, -- ex: "Pagamento parcelado em 10x de R$ 150,00, vencimentos: 12/01, 12/02..."
    
    -- Conteúdo do recibo em PDF
    conteudo_pdf_path TEXT,
    conteudo_texto TEXT, -- Backup em texto
    
    -- Controle
    emitido_por_cpf VARCHAR(11),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_recibos_contrato FOREIGN KEY (contrato_id) 
        REFERENCES contratos (id) ON DELETE CASCADE,
    CONSTRAINT fk_recibos_pagamento FOREIGN KEY (pagamento_id) 
        REFERENCES pagamentos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_recibos_contratante FOREIGN KEY (contratante_id) 
        REFERENCES contratantes (id) ON DELETE CASCADE,
    
    -- Constraints de validação
    CONSTRAINT recibos_valor_total_check CHECK (valor_total_anual >= 0),
    CONSTRAINT recibos_valor_funcionario_check CHECK (valor_por_funcionario IS NULL OR valor_por_funcionario >= 0),
    CONSTRAINT recibos_numero_funcionarios_check CHECK (numero_funcionarios_cobertos > 0),
    CONSTRAINT recibos_numero_parcelas_check CHECK (numero_parcelas >= 1),
    CONSTRAINT recibos_vigencia_check CHECK (vigencia_fim > vigencia_inicio)
);

-- Índices para performance
CREATE INDEX idx_recibos_contrato ON recibos (contrato_id);
CREATE INDEX idx_recibos_pagamento ON recibos (pagamento_id);
CREATE INDEX idx_recibos_contratante ON recibos (contratante_id);
CREATE INDEX idx_recibos_numero ON recibos (numero_recibo);
CREATE INDEX idx_recibos_vigencia ON recibos (vigencia_inicio, vigencia_fim);
CREATE INDEX idx_recibos_ativo ON recibos (ativo);

-- Comentários
COMMENT ON TABLE recibos IS 'Recibos financeiros gerados após confirmação de pagamento, separados do contrato de serviço';
COMMENT ON COLUMN recibos.numero_recibo IS 'Número único do recibo no formato REC-AAAA-NNNNN';
COMMENT ON COLUMN recibos.vigencia_inicio IS 'Data de início da vigência = data do pagamento';
COMMENT ON COLUMN recibos.vigencia_fim IS 'Data de fim da vigência = data_pagamento + 364 dias';
COMMENT ON COLUMN recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionários cobertos pelo plano contratado';
COMMENT ON COLUMN recibos.valor_total_anual IS 'Valor total anual do plano';
COMMENT ON COLUMN recibos.valor_por_funcionario IS 'Valor cobrado por funcionário (se aplicável)';
COMMENT ON COLUMN recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';
COMMENT ON COLUMN recibos.descricao_pagamento IS 'Descrição textual da forma de pagamento para incluir no PDF';

-- ============================================================================
-- FUNÇÃO: GERAR NÚMERO DE RECIBO
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_numero_recibo()
RETURNS TEXT AS $$
DECLARE
    ano INTEGER;
    sequencia INTEGER;
    numero_recibo TEXT;
BEGIN
    ano := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Conta quantos recibos existem no ano atual
    SELECT COUNT(*) + 1 INTO sequencia
    FROM recibos
    WHERE EXTRACT(YEAR FROM criado_em) = ano;
    
    -- Formato: REC-AAAA-NNNNN (ex: REC-2025-00001)
    numero_recibo := 'REC-' || ano || '-' || LPAD(sequencia::TEXT, 5, '0');
    
    RETURN numero_recibo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_numero_recibo IS 'Gera número único de recibo no formato REC-AAAA-NNNNN';

-- ============================================================================
-- TRIGGER: AUTO-GERAR NÚMERO DE RECIBO
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_gerar_numero_recibo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_recibo IS NULL OR NEW.numero_recibo = '' THEN
        NEW.numero_recibo := gerar_numero_recibo();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gerar_numero_recibo
BEFORE INSERT ON recibos
FOR EACH ROW
EXECUTE FUNCTION trigger_gerar_numero_recibo();

-- ============================================================================
-- TRIGGER: ATUALIZAR DATA DE MODIFICAÇÃO
-- ============================================================================

CREATE TRIGGER trg_recibos_atualizar_data
BEFORE UPDATE ON recibos
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- ============================================================================
-- VIEW: RECIBOS COM INFORMAÇÕES COMPLETAS
-- ============================================================================

CREATE OR REPLACE VIEW vw_recibos_completos AS
SELECT 
    r.id,
    r.numero_recibo,
    r.vigencia_inicio,
    r.vigencia_fim,
    r.numero_funcionarios_cobertos,
    r.valor_total_anual,
    r.valor_por_funcionario,
    r.forma_pagamento,
    r.numero_parcelas,
    r.descricao_pagamento,
    r.criado_em,
    -- Dados do contrato
    c.id AS contrato_id,
    c.conteudo_gerado AS contrato_conteudo,
    c.data_aceite AS contrato_data_aceite,
    -- Dados do contratante
    ct.nome AS contratante_nome,
    ct.cnpj AS contratante_cnpj,
    ct.email AS contratante_email,
    ct.tipo AS contratante_tipo,
    -- Dados do plano
    p.nome AS plano_nome,
    p.tipo AS plano_tipo,
    -- Dados do pagamento
    pg.metodo AS pagamento_metodo,
    pg.data_pagamento,
    pg.status AS pagamento_status
FROM recibos r
INNER JOIN contratos c ON r.contrato_id = c.id
INNER JOIN contratantes ct ON r.contratante_id = ct.id
INNER JOIN pagamentos pg ON r.pagamento_id = pg.id
INNER JOIN planos p ON c.plano_id = p.id
WHERE r.ativo = true
ORDER BY r.criado_em DESC;

COMMENT ON VIEW vw_recibos_completos IS 'View com informações completas de recibos incluindo dados de contrato, contratante, plano e pagamento';

-- ============================================================================
-- FUNÇÃO: CALCULAR VIGÊNCIA (364 DIAS)
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_vigencia_fim(data_inicio DATE)
RETURNS DATE AS $$
BEGIN
    -- Vigência de 364 dias a partir da data de início
    RETURN data_inicio + INTERVAL '364 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_vigencia_fim IS 'Calcula data fim da vigência (data início + 364 dias)';

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

GRANT ALL PRIVILEGES ON recibos TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE recibos_id_seq TO postgres;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
