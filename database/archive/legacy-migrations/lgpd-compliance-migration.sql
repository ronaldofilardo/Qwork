-- ===============================================
-- MIGRAÇÃO DE CONFORMIDADE LGPD
-- Data: 20/12/2025
-- ===============================================

-- ===============================================
-- 1. CRIAÇÃO DE TABELAS PARA PERFIS ADMINISTRATIVOS
-- ===============================================

-- Tabela para Administradores
CREATE TABLE IF NOT EXISTS administradores (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    clinica_id INTEGER REFERENCES clinicas(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    criado_por VARCHAR(11),
    
    -- Auditoria LGPD
    data_consentimento TIMESTAMP,
    ip_consentimento INET,
    base_legal VARCHAR(20) CHECK (base_legal IN ('contrato', 'obrigacao_legal', 'consentimento', 'interesse_legitimo')) DEFAULT 'contrato',
    
    CONSTRAINT cpf_valido_admin CHECK (LENGTH(cpf) = 11 AND cpf ~ '^[0-9]+$')
);

-- Tabela para Emissores
CREATE TABLE IF NOT EXISTS emissores (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    clinica_id INTEGER REFERENCES clinicas(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    criado_por VARCHAR(11),
    
    -- Auditoria LGPD
    data_consentimento TIMESTAMP,
    ip_consentimento INET,
    base_legal VARCHAR(20) CHECK (base_legal IN ('contrato', 'obrigacao_legal', 'consentimento', 'interesse_legitimo')) DEFAULT 'contrato',
    
    -- Registro profissional (para emissores técnicos)
    registro_profissional VARCHAR(50),
    conselho_classe VARCHAR(20),
    
    CONSTRAINT cpf_valido_emissor CHECK (LENGTH(cpf) = 11 AND cpf ~ '^[0-9]+$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_administradores_cpf ON administradores(cpf);
CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);
CREATE INDEX IF NOT EXISTS idx_administradores_clinica ON administradores(clinica_id);
CREATE INDEX IF NOT EXISTS idx_emissores_cpf ON emissores(cpf);
CREATE INDEX IF NOT EXISTS idx_emissores_email ON emissores(email);
CREATE INDEX IF NOT EXISTS idx_emissores_clinica ON emissores(clinica_id);

-- Triggers para atualização automática
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_administradores
    BEFORE UPDATE ON administradores
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_emissores
    BEFORE UPDATE ON emissores
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- ===============================================
-- 2. MIGRAÇÃO DE DADOS EXISTENTES
-- ===============================================

-- Migrar administradores da tabela funcionarios
INSERT INTO administradores (cpf, nome, email, senha_hash, clinica_id, ativo, criado_em, base_legal)
SELECT 
    cpf,
    nome,
    email,
    senha_hash,
    clinica_id,
    ativo,
    criado_em,
    'contrato' as base_legal
FROM funcionarios
WHERE perfil = 'admin'
ON CONFLICT (cpf) DO NOTHING;

-- Migrar emissores da tabela funcionarios
INSERT INTO emissores (cpf, nome, email, senha_hash, clinica_id, ativo, criado_em, base_legal)
SELECT 
    cpf,
    nome,
    email,
    senha_hash,
    clinica_id,
    ativo,
    criado_em,
    'contrato' as base_legal
FROM funcionarios
WHERE perfil = 'emissor'
ON CONFLICT (cpf) DO NOTHING;

-- ===============================================
-- 3. ADICIONAR BASE LEGAL ÀS AVALIAÇÕES
-- ===============================================

-- Adicionar colunas de conformidade LGPD
ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS base_legal VARCHAR(20) 
    CHECK (base_legal IN ('contrato', 'obrigacao_legal', 'consentimento', 'interesse_legitimo')) 
    DEFAULT 'obrigacao_legal';

ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS data_consentimento TIMESTAMP;

ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS ip_consentimento INET;

ALTER TABLE avaliacoes
ADD COLUMN IF NOT EXISTS consentimento_documento TEXT; -- Hash ou referência ao documento de consentimento

-- Atualizar avaliações existentes com base legal padrão
UPDATE avaliacoes 
SET base_legal = 'obrigacao_legal',
    data_consentimento = criado_em
WHERE base_legal IS NULL;

-- ===============================================
-- 4. POLÍTICA DE RETENÇÃO DE DADOS
-- ===============================================

-- Adicionar colunas de controle de retenção
ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS data_validade TIMESTAMP;

ALTER TABLE avaliacoes
ADD COLUMN IF NOT EXISTS anonimizada BOOLEAN DEFAULT false;

ALTER TABLE avaliacoes
ADD COLUMN IF NOT EXISTS data_anonimizacao TIMESTAMP;

-- Definir data de validade para avaliações existentes (36 meses)
UPDATE avaliacoes 
SET data_validade = criado_em + INTERVAL '36 months'
WHERE data_validade IS NULL;

-- Tabela para histórico de exclusões (auditoria)
CREATE TABLE IF NOT EXISTS historico_exclusoes (
    id SERIAL PRIMARY KEY,
    tipo_registro VARCHAR(50) NOT NULL,
    registro_id INTEGER NOT NULL,
    cpf_anonimizado VARCHAR(20), -- Apenas últimos 4 dígitos
    motivo VARCHAR(100) NOT NULL,
    data_exclusao TIMESTAMP DEFAULT NOW(),
    executado_por VARCHAR(11),
    dados_anonimizados JSONB -- Snapshot anonimizado para fins estatísticos
);

-- Função para anonimizar avaliação
CREATE OR REPLACE FUNCTION anonimizar_avaliacao(avaliacao_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_cpf CHAR(11);
    v_dados JSONB;
BEGIN
    -- Buscar dados antes da anonimização
    SELECT f.cpf INTO v_cpf
    FROM avaliacoes a
    JOIN funcionarios f ON a.funcionario_id = f.id
    WHERE a.id = avaliacao_id;
    
    -- Criar snapshot anonimizado para estatísticas
    SELECT jsonb_build_object(
        'data_avaliacao', a.criado_em,
        'grupo_avaliacao', a.grupo_avaliacao_id,
        'status', a.status,
        'pontuacao_total', r.pontuacao_total
    ) INTO v_dados
    FROM avaliacoes a
    LEFT JOIN resultados r ON a.id = r.avaliacao_id
    WHERE a.id = avaliacao_id;
    
    -- Registrar no histórico
    INSERT INTO historico_exclusoes (
        tipo_registro, 
        registro_id, 
        cpf_anonimizado, 
        motivo, 
        dados_anonimizados
    ) VALUES (
        'avaliacao',
        avaliacao_id,
        '***-***-' || RIGHT(v_cpf, 4),
        'Retenção expirada (36 meses)',
        v_dados
    );
    
    -- Marcar como anonimizada
    UPDATE avaliacoes 
    SET anonimizada = true,
        data_anonimizacao = NOW()
    WHERE id = avaliacao_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para excluir dados vencidos
CREATE OR REPLACE FUNCTION executar_politica_retencao()
RETURNS TABLE (
    total_anonimizadas INTEGER,
    total_excluidas INTEGER
) AS $$
DECLARE
    v_anonimizadas INTEGER := 0;
    v_excluidas INTEGER := 0;
    v_avaliacao_id INTEGER;
BEGIN
    -- 1. Anonimizar avaliações vencidas (não excluir imediatamente)
    FOR v_avaliacao_id IN 
        SELECT id 
        FROM avaliacoes 
        WHERE data_validade < NOW() 
        AND anonimizada = false
        AND status IN ('concluido', 'inativada')
    LOOP
        PERFORM anonimizar_avaliacao(v_avaliacao_id);
        v_anonimizadas := v_anonimizadas + 1;
    END LOOP;
    
    -- 2. Excluir respostas de avaliações anonimizadas há mais de 6 meses
    DELETE FROM respostas
    WHERE avaliacao_id IN (
        SELECT id 
        FROM avaliacoes 
        WHERE anonimizada = true 
        AND data_anonimizacao < NOW() - INTERVAL '6 months'
    );
    
    GET DIAGNOSTICS v_excluidas = ROW_COUNT;
    
    -- 3. Excluir resultados detalhados (manter apenas snapshot no histórico)
    DELETE FROM resultados
    WHERE avaliacao_id IN (
        SELECT id 
        FROM avaliacoes 
        WHERE anonimizada = true 
        AND data_anonimizacao < NOW() - INTERVAL '6 months'
    );
    
    RETURN QUERY SELECT v_anonimizadas, v_excluidas;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 5. AUDITORIA DE CPFs
-- ===============================================

-- Função para validar CPF (algoritmo completo)
CREATE OR REPLACE FUNCTION validar_cpf_completo(cpf_input VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    cpf CHAR(11);
    digito1 INTEGER;
    digito2 INTEGER;
    soma INTEGER;
    i INTEGER;
BEGIN
    -- Remover formatação
    cpf := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Verificar tamanho
    IF LENGTH(cpf) != 11 THEN
        RETURN false;
    END IF;
    
    -- CPFs inválidos conhecidos
    IF cpf IN ('00000000000', '11111111111', '22222222222', '33333333333', 
               '44444444444', '55555555555', '66666666666', '77777777777',
               '88888888888', '99999999999') THEN
        RETURN false;
    END IF;
    
    -- Calcular primeiro dígito verificador
    soma := 0;
    FOR i IN 1..9 LOOP
        soma := soma + (SUBSTRING(cpf, i, 1)::INTEGER * (11 - i));
    END LOOP;
    digito1 := 11 - (soma % 11);
    IF digito1 >= 10 THEN
        digito1 := 0;
    END IF;
    
    -- Verificar primeiro dígito
    IF digito1 != SUBSTRING(cpf, 10, 1)::INTEGER THEN
        RETURN false;
    END IF;
    
    -- Calcular segundo dígito verificador
    soma := 0;
    FOR i IN 1..10 LOOP
        soma := soma + (SUBSTRING(cpf, i, 1)::INTEGER * (12 - i));
    END LOOP;
    digito2 := 11 - (soma % 11);
    IF digito2 >= 10 THEN
        digito2 := 0;
    END IF;
    
    -- Verificar segundo dígito
    IF digito2 != SUBSTRING(cpf, 11, 1)::INTEGER THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View para auditoria de CPFs inválidos
CREATE OR REPLACE VIEW cpfs_invalidos AS
SELECT 
    'funcionarios' as tabela,
    id,
    cpf,
    nome,
    email,
    ativo
FROM funcionarios
WHERE NOT validar_cpf_completo(cpf)
UNION ALL
SELECT 
    'administradores' as tabela,
    id,
    cpf,
    nome,
    email,
    ativo
FROM administradores
WHERE NOT validar_cpf_completo(cpf)
UNION ALL
SELECT 
    'emissores' as tabela,
    id,
    cpf,
    nome,
    email,
    ativo
FROM emissores
WHERE NOT validar_cpf_completo(cpf);

-- ===============================================
-- 6. REMOVER PERFIS ADMINISTRATIVOS DE FUNCIONARIOS
-- ===============================================

-- Após confirmar migração bem-sucedida, descomentar:
-- DELETE FROM funcionarios WHERE perfil IN ('admin', 'emissor');

-- Remover coluna perfil (após migração completa de todas as funcionalidades)
-- ALTER TABLE funcionarios DROP COLUMN IF EXISTS perfil;

-- ===============================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================================

COMMENT ON TABLE administradores IS 'Perfis administrativos do sistema - não são funcionários de empresas';
COMMENT ON TABLE emissores IS 'Profissionais técnicos responsáveis por emissão de laudos - não são funcionários de empresas';
COMMENT ON COLUMN avaliacoes.base_legal IS 'Base legal LGPD: contrato, obrigacao_legal, consentimento, interesse_legitimo';
COMMENT ON COLUMN avaliacoes.data_validade IS 'Data após a qual os dados devem ser anonimizados (36 meses)';
COMMENT ON TABLE historico_exclusoes IS 'Registro de auditoria para exclusões e anonimizações realizadas';
COMMENT ON FUNCTION executar_politica_retencao() IS 'Executa política de retenção: anonimiza dados vencidos e exclui após 6 meses';

