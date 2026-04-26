-- Migration 1231: Corrigir seed da taxa_transacao para R$2,05
-- O seed da migration 1230 definiu taxa_transacao = 0.00
-- O valor operacional correto é R$2,05 por transação (taxa API Asaas)
-- Aplica somente se ainda estiver no valor padrão do seed (0.00),
-- preservando configurações já ajustadas pelo admin no painel.

UPDATE configuracoes_gateway
   SET valor = 2.05,
       atualizado_em = NOW()
 WHERE codigo = 'taxa_transacao'
   AND valor = 0;
