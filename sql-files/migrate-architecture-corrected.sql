-- ================================================================
-- ETAPA 1.1: Migração CORRIGIDA - Arquitetura Independente
-- Data: 2026-02-06T18:31:40.751Z
-- ================================================================
-- ARQUITETURA:
-- - Entidades: independentes, têm funcionários direto (SEM empresas)
-- - Clínicas: independentes, têm empresas → empresas têm funcionários
-- - Ambas são "contratantes" com IDs sequenciais compartilhados
-- ================================================================

BEGIN;

-- ================================================================
-- 1. CORRIGIR ARQUITETURA: Remover vinculação clínica→entidade
-- ================================================================

-- Clínicas são INDEPENDENTES, não podem ter entidade_id
ALTER TABLE clinicas DROP COLUMN IF EXISTS entidade_id CASCADE;

COMMENT ON TABLE clinicas IS 'Clínicas independentes (contratantes). Têm empresas → empresas têm funcionários.';

-- ================================================================
-- 2. REMOVER TABELAS OBSOLETAS contratantes*
-- ================================================================

-- Backup da audit (tem 3 registros) - apenas se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contratantes_senhas_audit') THEN
    CREATE TABLE IF NOT EXISTS _backup_contratantes_senhas_audit AS 
    SELECT * FROM contratantes_senhas_audit;
  END IF;
END $$;

-- Drop tabelas obsoletas
DROP TABLE IF EXISTS contratantes_senhas CASCADE;
DROP TABLE IF EXISTS contratantes_senhas_audit CASCADE;
DROP TABLE IF EXISTS contratantes CASCADE;

-- ================================================================
-- 3. CRIAR clinicas_senhas (equivalente a entidades_senhas)
-- ================================================================

CREATE TABLE IF NOT EXISTS clinicas_senhas (
  id SERIAL PRIMARY KEY,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  primeira_senha_alterada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uk_clinicas_senhas_cpf UNIQUE (cpf)
);

CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica_id ON clinicas_senhas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_cpf ON clinicas_senhas(cpf);

COMMENT ON TABLE clinicas_senhas IS 'Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)';

-- ================================================================
-- 4. VALIDAÇÃO: Garantir entidades_senhas está correta
-- ================================================================

-- entidades_senhas já aponta corretamente para entidades(id)
-- Apenas adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_entidade_id ON entidades_senhas(entidade_id);
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_cpf ON entidades_senhas(cpf);

COMMENT ON TABLE entidades_senhas IS 'Senhas de gestores das entidades (equivalente a clinicas_senhas para gestores RH)';

COMMIT;

-- ================================================================
-- VALIDAÇÃO FINAL
-- ================================================================

-- Verificar que não existem mais FKs apontando para contratantes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'contratantes';

-- Deve retornar 0 linhas se migração for bem-sucedida
