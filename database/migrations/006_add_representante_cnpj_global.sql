-- ==========================================
-- MIGRATION 006: Adicionar Dados do Representante e CNPJ Único Global
-- Data: 28/12/2025
-- Objetivo: 
--   1. Adicionar campos de representante (nome, fone, email)
--   2. Mudar constraint de CNPJ de único por clínica para único global
-- ==========================================

\echo 'MIGRATION 006: Adicionando campos de representante e ajustando CNPJ...'

-- Adicionar novos campos para dados do representante
ALTER TABLE empresas_clientes
ADD COLUMN IF NOT EXISTS representante_nome TEXT,
ADD COLUMN IF NOT EXISTS representante_fone TEXT,
ADD COLUMN IF NOT EXISTS representante_email TEXT;

\echo 'Campos de representante adicionados!'

-- Remover constraint antigo (CNPJ único por clínica)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'empresas_clientes_cnpj_clinica_key'
  ) THEN
    ALTER TABLE empresas_clientes DROP CONSTRAINT empresas_clientes_cnpj_clinica_key;
    RAISE NOTICE 'Constraint empresas_clientes_cnpj_clinica_key removido';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'empresas_clientes_clinica_id_cnpj_key'
  ) THEN
    ALTER TABLE empresas_clientes DROP CONSTRAINT empresas_clientes_clinica_id_cnpj_key;
    RAISE NOTICE 'Constraint empresas_clientes_clinica_id_cnpj_key removido';
  END IF;
END $$;

-- Criar constraint global (CNPJ único em todo o sistema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'empresas_clientes_cnpj_key'
  ) THEN
    ALTER TABLE empresas_clientes ADD CONSTRAINT empresas_clientes_cnpj_key UNIQUE (cnpj);
    RAISE NOTICE 'Constraint empresas_clientes_cnpj_key (global) criado';
  END IF;
END $$;

\echo 'Constraint de CNPJ atualizado para único global!'

-- Verificar constraint ativo
\echo 'Constraints ativos em empresas_clientes:'
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'empresas_clientes'::regclass
ORDER BY conname;

\echo 'MIGRATION 006 concluída com sucesso!'
