-- Migration: Adicionar coluna valor_personalizado na tabela contratos
-- Data: 2025-12-22
-- Descrição: Adiciona coluna para armazenar valor personalizado por funcionário nos contratos

ALTER TABLE contratos
ADD COLUMN valor_personalizado DECIMAL(10,2);

-- Índice para consultas por valor personalizado
CREATE INDEX idx_contratos_valor_personalizado ON contratos (valor_personalizado);

-- Comentário
COMMENT ON COLUMN contratos.valor_personalizado IS 'Valor personalizado por funcionário (para planos personalizados)';

-- Atualizar dados existentes (se houver contratos sem valor_personalizado)
-- Para contratos existentes, definir valor_personalizado como NULL (não afeta cálculo)