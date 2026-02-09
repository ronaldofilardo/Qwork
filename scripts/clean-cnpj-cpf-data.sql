-- Script para limpar todos os CNPJs e CPFs do banco de dados QWork
-- ÚLTIMA ATUALIZAÇÃO: 2025-12-23
-- 
-- ⚠️  ATENÇÃO CRÍTICA: Este script remove TODOS os dados de CNPJ/CPF do sistema
-- ⚠️  SENHAS NÃO SÃO MAIS DELETADAS AUTOMATICAMENTE (Proteção implementada)
-- ⚠️  Execute apenas em ambiente de DESENVOLVIMENTO/TESTE
-- ⚠️  NUNCA execute este script em PRODUÇÃO!
-- 
-- Data original: 2025-12-20
-- Atualização de segurança: 2025-12-23

-- Desabilitar triggers e constraints temporariamente para limpeza
SET session_replication_role = 'replica';

-- ============================================================================
-- 1. LIMPAR TABELAS QUE FAZEM REFERÊNCIA A tomadores
-- ============================================================================

-- Limpar pagamentos relacionados a tomadores
DELETE FROM pagamentos WHERE contratante_id IN (SELECT id FROM tomadores);

-- Limpar contratos relacionados a tomadores
DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM tomadores);

-- Limpar planos relacionados a tomadores (através da tabela tomadores)
-- ATENÇÃO: Não deletar planos fixos compartilhados automaticamente (ex: planos seed/mercadoria).
-- Apenas remover planos do tipo 'personalizado' que estejam vinculados a tomadores.
DELETE FROM planos p
WHERE p.tipo = 'personalizado'
  AND p.id IN (SELECT plano_id FROM tomadores WHERE plano_id IS NOT NULL);

-- PROTEÇÃO CRÍTICA: Senhas NÃO são mais deletadas automaticamente!
-- Use fn_delete_senha_autorizado() se realmente precisar deletar senhas
-- DELETE FROM entidades_senhas foi REMOVIDO para evitar perda de dados
-- Ver migração 030_protecao_senhas_critica.sql para mais detalhes

-- Se você REALMENTE precisa deletar senhas (CUIDADO!):
-- SELECT fn_delete_senha_autorizado(contratante_id, 'motivo da deleção');

-- Limpar funcionários relacionados a tomadores
DELETE FROM tomadores_funcionarios WHERE contratante_id IN (SELECT id FROM tomadores);

-- ============================================================================
-- 2. LIMPAR TABELAS QUE FAZEM REFERÊNCIA A FUNCIONÁRIOS
-- ============================================================================

-- Limpar lotes_avaliacao_funcionarios
DELETE FROM lotes_avaliacao_funcionarios WHERE funcionario_id IN (SELECT id FROM funcionarios);

-- Limpar laudos
DELETE FROM laudos WHERE emissor_cpf IN (SELECT cpf FROM funcionarios);

-- Limpar respostas das avaliações
DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes);

-- Limpar análises estatísticas
DELETE FROM analise_estatistica WHERE avaliacao_id IN (SELECT id FROM avaliacoes);

-- Limpar avaliações
DELETE FROM avaliacoes WHERE funcionario_cpf IN (SELECT cpf FROM funcionarios);

-- Limpar MFA dos funcionários
DELETE FROM mfa_codes WHERE cpf IN (SELECT cpf FROM funcionarios);

-- Limpar logs de auditoria
DELETE FROM audit_logs WHERE user_cpf IN (SELECT cpf FROM funcionarios);

-- ============================================================================
-- 3. LIMPAR TABELAS QUE FAZEM REFERÊNCIA A EMPRESAS_CLIENTES
-- ============================================================================

-- Limpar lotes de avaliação
DELETE FROM lotes_avaliacao WHERE empresa_id IN (SELECT id FROM empresas_clientes);

-- Limpar relacionamento clinicas_empresas
DELETE FROM clinicas_empresas WHERE empresa_id IN (SELECT id FROM empresas_clientes);

-- ============================================================================
-- 4. LIMPAR TABELAS QUE FAZEM REFERÊNCIA A CLÍNICAS
-- ============================================================================

-- Limpar lotes de avaliação por clínica
DELETE FROM lotes_avaliacao WHERE clinica_id IN (SELECT id FROM clinicas);

-- Limpar empresas_clientes por clínica
DELETE FROM empresas_clientes WHERE clinica_id IN (SELECT id FROM clinicas);

-- Limpar funcionários por clínica
DELETE FROM funcionarios WHERE clinica_id IN (SELECT id FROM clinicas);

-- Limpar administradores por clínica
DELETE FROM administradores WHERE clinica_id IN (SELECT id FROM clinicas);

-- Limpar emissores por clínica
DELETE FROM emissores WHERE clinica_id IN (SELECT id FROM clinicas);

-- Limpar relacionamento clinicas_empresas por clínica
DELETE FROM clinicas_empresas WHERE clinica_id IN (SELECT id FROM clinicas);

-- ============================================================================
-- 5. LIMPAR TABELAS PRINCIPAIS (que contêm CNPJ/CPF)
-- ============================================================================

-- Limpar tomadores (contém CNPJ)
DELETE FROM tomadores;

-- Limpar funcionários (contém CPF)
DELETE FROM funcionarios;

-- Limpar empresas_clientes (contém CNPJ)
DELETE FROM empresas_clientes;

-- Limpar clinicas (contém CNPJ)
DELETE FROM clinicas;

-- ============================================================================
-- 6. RECRIAR SEQUENCES (reiniciar contadores)
-- ============================================================================

-- Resetar sequences para começar do 1 novamente
ALTER SEQUENCE tomadores_id_seq RESTART WITH 1;
ALTER SEQUENCE clinicas_id_seq RESTART WITH 1;
ALTER SEQUENCE empresas_clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE funcionarios_id_seq RESTART WITH 1;
ALTER SEQUENCE avaliacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE lotes_avaliacao_id_seq RESTART WITH 1;
ALTER SEQUENCE laudos_id_seq RESTART WITH 1;
ALTER SEQUENCE analise_estatistica_id_seq RESTART WITH 1;

-- ============================================================================
-- 7. REABILITAR TRIGGERS E CONSTRAINTS
-- ============================================================================

SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se ainda existem CNPJs nas tabelas principais
SELECT 'tomadores' as tabela, COUNT(*) as registros_com_cnpj FROM tomadores WHERE cnpj IS NOT NULL AND cnpj != ''
UNION ALL
SELECT 'clinicas' as tabela, COUNT(*) as registros_com_cnpj FROM clinicas WHERE cnpj IS NOT NULL AND cnpj != ''
UNION ALL
SELECT 'empresas_clientes' as tabela, COUNT(*) as registros_com_cnpj FROM empresas_clientes WHERE cnpj IS NOT NULL AND cnpj != ''
UNION ALL
SELECT 'funcionarios' as tabela, COUNT(*) as registros_com_cpf FROM funcionarios WHERE cpf IS NOT NULL AND cpf != '';

COMMIT;

-- Mensagem final
SELECT 'LIMPEZA CONCLUIDA: Todos os CNPJs e CPFs foram removidos do banco de dados.' as status;