-- Migration 1103: Mover campos de cargo para tabelas de vinculo M:N
-- Data: 2026-03-14
-- Objetivo: Suporte multi-CNPJ - um funcionario (CPF) pode trabalhar em mais de uma empresa
-- com setor, funcao, matricula, nivel de cargo, turno e escala diferentes por empresa.
--
-- RACIONAL:
-- Atualmente setor/funcao/matricula/nivel_cargo/turno/escala ficam em funcionarios (global).
-- Com multi-vinculo, cada empresa pode ter valores distintos por vinculo.
-- Os campos sao adicionados as tabelas funcionarios_clinicas e funcionarios_entidades.
-- Os dados existentes sao copiados de funcionarios para os vinculos atuais.
-- Tambem adicionamos indice_avaliacao e data_ultimo_lote por vinculo para elegibilidade per-empresa.

BEGIN;

-- =============================================================================
-- 1. ADICIONAR COLUNAS EM funcionarios_clinicas
-- =============================================================================

-- Garantir coluna atualizado_em (trigger existente depende dela)
ALTER TABLE funcionarios_clinicas
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE funcionarios_entidades
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
-- Garantir coluna criado_em
ALTER TABLE funcionarios_clinicas
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE funcionarios_entidades
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE funcionarios_clinicas
  ADD COLUMN IF NOT EXISTS setor VARCHAR(100),
  ADD COLUMN IF NOT EXISTS funcao VARCHAR(100),
  ADD COLUMN IF NOT EXISTS matricula VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nivel_cargo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS turno VARCHAR(50),
  ADD COLUMN IF NOT EXISTS escala VARCHAR(50),
  ADD COLUMN IF NOT EXISTS indice_avaliacao INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS data_ultimo_lote TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN funcionarios_clinicas.setor IS 'Setor do funcionario nesta empresa (pode diferir entre empresas)';
COMMENT ON COLUMN funcionarios_clinicas.funcao IS 'Funcao do funcionario nesta empresa';
COMMENT ON COLUMN funcionarios_clinicas.matricula IS 'Matricula do funcionario nesta empresa';
COMMENT ON COLUMN funcionarios_clinicas.nivel_cargo IS 'Nivel de cargo: operacional ou gestao (pode diferir entre empresas)';
COMMENT ON COLUMN funcionarios_clinicas.turno IS 'Turno de trabalho nesta empresa';
COMMENT ON COLUMN funcionarios_clinicas.escala IS 'Escala de trabalho nesta empresa';
COMMENT ON COLUMN funcionarios_clinicas.indice_avaliacao IS 'Indice sequencial da ultima avaliacao concluida nesta empresa (0 = nunca fez)';
COMMENT ON COLUMN funcionarios_clinicas.data_ultimo_lote IS 'Data/hora da ultima avaliacao valida concluida nesta empresa';

-- =============================================================================
-- 2. ADICIONAR COLUNAS EM funcionarios_entidades
-- =============================================================================

ALTER TABLE funcionarios_entidades
  ADD COLUMN IF NOT EXISTS setor VARCHAR(100),
  ADD COLUMN IF NOT EXISTS funcao VARCHAR(100),
  ADD COLUMN IF NOT EXISTS matricula VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nivel_cargo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS turno VARCHAR(50),
  ADD COLUMN IF NOT EXISTS escala VARCHAR(50),
  ADD COLUMN IF NOT EXISTS indice_avaliacao INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS data_ultimo_lote TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN funcionarios_entidades.setor IS 'Setor do funcionario nesta entidade (pode diferir entre entidades)';
COMMENT ON COLUMN funcionarios_entidades.funcao IS 'Funcao do funcionario nesta entidade';
COMMENT ON COLUMN funcionarios_entidades.matricula IS 'Matricula do funcionario nesta entidade';
COMMENT ON COLUMN funcionarios_entidades.nivel_cargo IS 'Nivel de cargo: operacional ou gestao (pode diferir entre entidades)';
COMMENT ON COLUMN funcionarios_entidades.turno IS 'Turno de trabalho nesta entidade';
COMMENT ON COLUMN funcionarios_entidades.escala IS 'Escala de trabalho nesta entidade';
COMMENT ON COLUMN funcionarios_entidades.indice_avaliacao IS 'Indice sequencial da ultima avaliacao concluida nesta entidade (0 = nunca fez)';
COMMENT ON COLUMN funcionarios_entidades.data_ultimo_lote IS 'Data/hora da ultima avaliacao valida concluida nesta entidade';

-- =============================================================================
-- 3. POPULAR DADOS EXISTENTES: COPIAR DE funcionarios PARA VINCULOS
-- =============================================================================

-- Para funcionarios_clinicas: copiar setor/funcao etc. de funcionarios
UPDATE funcionarios_clinicas fc
SET
  setor = f.setor,
  funcao = f.funcao,
  matricula = f.matricula,
  nivel_cargo = f.nivel_cargo,
  turno = f.turno,
  escala = f.escala,
  indice_avaliacao = COALESCE(f.indice_avaliacao, 0),
  data_ultimo_lote = f.data_ultimo_lote
FROM funcionarios f
WHERE fc.funcionario_id = f.id
  AND fc.setor IS NULL;

-- Para funcionarios_entidades: copiar setor/funcao etc. de funcionarios
UPDATE funcionarios_entidades fe
SET
  setor = f.setor,
  funcao = f.funcao,
  matricula = f.matricula,
  nivel_cargo = f.nivel_cargo,
  turno = f.turno,
  escala = f.escala,
  indice_avaliacao = COALESCE(f.indice_avaliacao, 0),
  data_ultimo_lote = f.data_ultimo_lote
FROM funcionarios f
WHERE fe.funcionario_id = f.id
  AND fe.setor IS NULL;

-- =============================================================================
-- 4. INDICES PARA PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_func_clinicas_nivel_cargo
  ON funcionarios_clinicas(nivel_cargo);

CREATE INDEX IF NOT EXISTS idx_func_entidades_nivel_cargo
  ON funcionarios_entidades(nivel_cargo);

COMMIT;
