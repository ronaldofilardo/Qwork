-- Garantir que a tabela usuarios tenha todas as colunas necessárias
-- Executado: 2026-02-05

-- Adicionar coluna email se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email TEXT;

-- Adicionar coluna senha_hash se não existir (já foi adicionado antes, mas garantindo)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Adicionar coluna atualizado_em se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
