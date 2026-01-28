-- Correção do conflito de enums tipo_plano
-- Padroniza os enums para usar apenas 'fixo' e 'personalizado'

-- 1. Remover valores não utilizados do enum tipo_plano
ALTER TYPE tipo_plano RENAME TO tipo_plano_old;

-- 2. Criar novo enum com valores corretos
CREATE TYPE tipo_plano AS ENUM ('fixo', 'personalizado');

-- 3. Atualizar a coluna plano_tipo na tabela contratantes
-- Como só há um registro com 'personalizado', podemos fazer update direto
UPDATE contratantes SET plano_tipo = 'personalizado'::tipo_plano WHERE plano_tipo = 'personalizado';

-- 4. Remover o enum antigo
DROP TYPE tipo_plano_old;

-- 5. Atualizar a tabela planos para usar o enum ao invés de VARCHAR
-- Primeiro, verificar se todos os valores são válidos
ALTER TABLE planos ALTER COLUMN tipo TYPE tipo_plano USING tipo::tipo_plano;

-- 6. Remover o enum não utilizado tipo_plano_enum
DROP TYPE IF EXISTS tipo_plano_enum;

-- 7. Verificar se o trigger ainda funciona (deve funcionar agora)
-- O trigger copia de planos.tipo para contratantes.plano_tipo
-- Ambos agora usam o mesmo enum tipo_plano