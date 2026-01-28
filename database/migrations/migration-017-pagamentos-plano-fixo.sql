-- Migration: Adicionar colunas de controle para planos fixos na tabela pagamentos
-- Data: 2025-12-25
-- Descrição: Adiciona colunas para armazenar número de funcionários e valor por funcionário

-- Adicionar colunas à tabela pagamentos
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS numero_funcionarios INTEGER,
ADD COLUMN IF NOT EXISTS valor_por_funcionario NUMERIC(10,2);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN pagamentos.numero_funcionarios IS 'Número de funcionários no momento da contratação (para planos fixos)';
COMMENT ON COLUMN pagamentos.valor_por_funcionario IS 'Valor cobrado por funcionário (R$20,00 para plano fixo)';

-- Criar índice para facilitar consultas por número de funcionários
CREATE INDEX IF NOT EXISTS idx_pagamentos_num_funcionarios ON pagamentos(numero_funcionarios) WHERE numero_funcionarios IS NOT NULL;

COMMENT ON TABLE pagamentos IS 'Tabela de pagamentos com suporte a planos fixos e personalizados';
