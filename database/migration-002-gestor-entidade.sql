-- Migration 002: Adicionar perfil gestor_entidade e ajustar relacionamentos
-- Data: 2025-12-19
-- Descrição: Suporte para gestores de entidade com acesso direto aos seus funcionários

-- Migration 002: Adicionar perfil gestor_entidade e ajustar relacionamentos
-- Data: 2025-12-19
-- Descrição: Suporte para gestores de entidade com acesso direto aos seus funcionários

-- ============================================================================
-- ATUALIZAR CONSTRAINT DE PERFIL PARA INCLUIR GESTOR_ENTIDADE
-- ============================================================================

-- Remover constraint existente
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

-- Adicionar nova constraint com gestor_entidade
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_perfil_check
    CHECK (perfil::text = ANY (ARRAY[
        'funcionario'::character varying,
        'rh'::character varying,
        'admin'::character varying,
        'emissor'::character varying,
        'gestor_entidade'::character varying
    ]::text[]));

-- ============================================================================
-- AJUSTAR TABELA FUNCIONARIOS PARA SUPORTAR CONTRATANTE_ID
-- ============================================================================

-- A coluna contratante_id já existe (adicionada em migration anterior)
-- Apenas garantir que o índice existe
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id ON funcionarios(contratante_id);

-- Adicionar constraint para garantir que funcionário tem OU clinica/empresa OU contratante
-- Comentário: Não podemos adicionar check constraint complexo sem quebrar dados existentes
-- Solução: Validação em nível de aplicação

-- ============================================================================
-- CRIAR TABELA DE SENHA PARA GESTORES DE ENTIDADE
-- ============================================================================

-- Tabela para armazenar senhas hash dos gestores de entidade
-- (responsavel_cpf em contratantes pode fazer login)
CREATE TABLE IF NOT EXISTS contratantes_senhas (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL UNIQUE,
    cpf VARCHAR(11) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_contratantes_senhas_contratante 
        FOREIGN KEY (contratante_id) 
        REFERENCES contratantes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT contratantes_senhas_cpf_check 
        CHECK (LENGTH(cpf) = 11)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contratantes_senhas_cpf 
ON contratantes_senhas(cpf);

CREATE INDEX IF NOT EXISTS idx_contratantes_senhas_contratante 
ON contratantes_senhas(contratante_id);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_contratantes_senhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contratantes_senhas_updated_at
    BEFORE UPDATE ON contratantes_senhas
    FOR EACH ROW
    EXECUTE FUNCTION update_contratantes_senhas_updated_at();

-- Comentários
COMMENT ON TABLE contratantes_senhas IS 'Senhas hash para gestores de entidades fazerem login';
COMMENT ON COLUMN contratantes_senhas.cpf IS 'CPF do responsavel_cpf em contratantes - usado para login';
COMMENT ON COLUMN contratantes_senhas.primeira_senha_alterada IS 'Flag para forçar alteração de senha no primeiro acesso';

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA CRIAR SENHA INICIAL PARA GESTOR DE ENTIDADE
-- ============================================================================

-- Função para gerar senha inicial (usar após aprovação de entidade)
-- Senha inicial padrão: últimos 6 dígitos do CNPJ
CREATE OR REPLACE FUNCTION criar_senha_inicial_entidade(p_contratante_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_cpf VARCHAR(11);
    v_cnpj VARCHAR(18);
    v_senha_inicial VARCHAR(6);
    v_senha_hash VARCHAR(255);
BEGIN
    -- Buscar dados do contratante
    SELECT responsavel_cpf, cnpj INTO v_cpf, v_cnpj
    FROM contratantes
    WHERE id = p_contratante_id AND tipo = 'entidade';

    IF v_cpf IS NULL THEN
        RAISE EXCEPTION 'Contratante % não encontrado ou não é entidade', p_contratante_id;
    END IF;

    -- Gerar senha inicial: últimos 6 dígitos do CNPJ (sem formatação)
    v_senha_inicial := RIGHT(REPLACE(REPLACE(REPLACE(v_cnpj, '.', ''), '/', ''), '-', ''), 6);

    -- Hash da senha (será substituído por bcrypt no backend)
    -- Este é apenas um placeholder - em produção, usar bcrypt do backend
    v_senha_hash := 'PLACEHOLDER_' || v_senha_inicial;

    -- Inserir ou atualizar senha
    INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash, primeira_senha_alterada)
    VALUES (p_contratante_id, v_cpf, v_senha_hash, false)
    ON CONFLICT (contratante_id)
    DO UPDATE SET
        senha_hash = EXCLUDED.senha_hash,
        atualizado_em = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Senha inicial criada para contratante % (CPF: %)', p_contratante_id, v_cpf;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_senha_inicial_entidade IS 'Cria senha inicial para gestor de entidade após aprovação';

-- ============================================================================
-- AJUSTES EM VISTAS/QUERIES (SE NECESSÁRIO)
-- ============================================================================

-- Comentário: Vistas que filtram por perfil precisam ser atualizadas
-- para incluir 'gestor_entidade' onde apropriado

-- ============================================================================
-- ROLLBACK (APENAS PARA REFERÊNCIA - NÃO EXECUTAR EM PRODUÇÃO)
-- ============================================================================

-- Para reverter (cuidado - pode causar perda de dados):
-- DROP TABLE IF EXISTS contratantes_senhas CASCADE;
-- DROP FUNCTION IF EXISTS criar_senha_inicial_entidade;
-- DROP FUNCTION IF EXISTS update_contratantes_senhas_updated_at;
-- ALTER TABLE funcionarios DROP COLUMN IF EXISTS contratante_id;
-- -- Nota: Não é possível remover valor de enum facilmente no PostgreSQL

-- ============================================================================
-- SEED DATA PARA TESTES (OPCIONAL)
-- ============================================================================

-- Exemplo: Criar senha para entidades existentes aprovadas
-- (executar manualmente ou via script backend)

-- SELECT criar_senha_inicial_entidade(id)
-- FROM contratantes 
-- WHERE tipo = 'entidade' AND status = 'aprovado'
-- AND id NOT IN (SELECT contratante_id FROM contratantes_senhas);
