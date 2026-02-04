-- Script de Correção: Aplicar Migrations Faltantes no Neon
-- Data: 04/02/2026
-- Objetivo: Garantir que banco Neon tem todas migrations críticas aplicadas

-- ==========================================
-- MIGRATION 099: Corrigir função prevent_mutation_during_emission
-- ==========================================
-- Esta migration remove referência ao campo processamento_em que foi removido

CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097/130
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante emissão
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informações do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo já foi emitido, prevenir mudanças críticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se está tentando mudar campos críticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_mutation_during_emission IS 
'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. Atualizada em migration 099 para remover referência ao campo processamento_em removido.';

-- ==========================================
-- ATUALIZAR VIEW vw_funcionarios_por_lote
-- ==========================================
-- Garantir que a view está atualizada com todos os campos necessários

DROP VIEW IF EXISTS vw_funcionarios_por_lote;

CREATE VIEW vw_funcionarios_por_lote AS
SELECT
    f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.turno,
    f.escala,
    f.empresa_id,
    f.clinica_id,
    a.id as avaliacao_id,
    a.status as status_avaliacao,
    a.envio as data_conclusao,
    a.inicio as data_inicio,
    a.inativada_em as data_inativacao,
    a.motivo_inativacao,
    a.lote_id
FROM funcionarios f
LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
WHERE
    f.perfil = 'funcionario'
    AND f.ativo = true;

COMMENT ON VIEW vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';

-- ==========================================
-- VERIFICAÇÃO: Confirmar que tudo está OK
-- ==========================================

-- Verificar se função foi atualizada
SELECT 'prevent_mutation_during_emission' as funcao, 
       CASE WHEN pg_get_functiondef('prevent_mutation_during_emission'::regproc) LIKE '%processamento_em%' 
            THEN '❌ AINDA TEM REFERÊNCIA A processamento_em'
            ELSE '✅ Função atualizada corretamente'
       END as status;

-- Verificar se view existe
SELECT 'vw_funcionarios_por_lote' as view_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_funcionarios_por_lote')
            THEN '✅ View existe'
            ELSE '❌ View não encontrada'
       END as status;

-- Verificar se coluna processamento_em foi removida
SELECT 'processamento_em' as coluna,
       CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lotes_avaliacao' AND column_name = 'processamento_em'
       )
       THEN '❌ Coluna ainda existe (migration 130 não aplicada)'
       ELSE '✅ Coluna removida corretamente'
       END as status;
