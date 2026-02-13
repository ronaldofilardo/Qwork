-- Migration: 1015_populate_missing_funcionarios_entidades.sql
-- Descrição: Popula funcionarios_entidades que podem estar faltando em PROD
-- Data: 2026-02-12
-- Problema: Migração 601 pode ter falhado parcialmente, deixando a tabela vazia

-- Verificar estado atual
DO $$
DECLARE
    v_total_fe INTEGER;
    v_total_fun_com_entidade INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_fe FROM funcionarios_entidades;
    SELECT COUNT(*) INTO v_total_fun_com_entidade
    FROM funcionarios f
    WHERE f.perfil = 'funcionario'
      AND (f.contratante_id IS NOT NULL OR EXISTS (
        SELECT 1 FROM lotes_avaliacao la
        WHERE la.entidade_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM avaliacoes a
            WHERE a.lote_id = la.id
              AND a.funcionario_cpf = f.cpf
          )
      ));
    
    RAISE NOTICE '=== DIAGNÓSTICO ===';
    RAISE NOTICE 'Total em funcionarios_entidades: %', v_total_fe;
    RAISE NOTICE 'Total de funcionários com entidade: %', v_total_fun_com_entidade;
    
    IF v_total_fe = 0 AND v_total_fun_com_entidade > 0 THEN
        RAISE WARNING 'ALERTA: funcionarios_entidades está vazia mas há funcionários com entidade!';
    END IF;
END $$;

-- Repovoar funcionarios_entidades (ignorar conflitos)
INSERT INTO funcionarios_entidades (
    funcionario_id,
    entidade_id,
    ativo,
    data_vinculo,
    criado_em,
    atualizado_em
)
SELECT DISTINCT
    f.id AS funcionario_id,
    COALESCE(la.entidade_id, f.contratante_id) AS entidade_id,
    CASE WHEN f.ativo = false OR f.data_inativacao IS NOT NULL THEN false ELSE true END AS ativo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS data_vinculo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS criado_em,
    COALESCE(f.atualizado_em, CURRENT_TIMESTAMP) AS atualizado_em
FROM funcionarios f
LEFT JOIN lotes_avaliacao la ON EXISTS (
    SELECT 1 FROM avaliacoes a
    WHERE a.funcionario_cpf = f.cpf
      AND a.lote_id = la.id
)
WHERE f.perfil = 'funcionario'
  AND (f.contratante_id IS NOT NULL OR la.entidade_id IS NOT NULL)
  AND COALESCE(la.entidade_id, f.contratante_id) IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM tomadores t 
      WHERE t.id = COALESCE(la.entidade_id, f.contratante_id)
        AND t.tipo = 'entidade'
  )
ON CONFLICT (funcionario_id, entidade_id) DO NOTHING;

-- Log resultado
DO $$
DECLARE
    v_inserted INTEGER;
    v_total_fe INTEGER;
BEGIN
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    SELECT COUNT(*) INTO v_total_fe FROM funcionarios_entidades;
    
    RAISE NOTICE '=== RESULTADO ===';
    RAISE NOTICE 'Registros inseridos: %', v_inserted;
    RAISE NOTICE 'Total em funcionarios_entidades agora: %', v_total_fe;
END $$;

-- Validar índices
CREATE INDEX IF NOT EXISTS idx_func_entidades_funcionario 
    ON funcionarios_entidades(funcionario_id);

CREATE INDEX IF NOT EXISTS idx_func_entidades_entidade 
    ON funcionarios_entidades(entidade_id);

CREATE INDEX IF NOT EXISTS idx_func_entidades_ativo 
    ON funcionarios_entidades(ativo) 
    WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_func_entidades_entidade_ativo 
    ON funcionarios_entidades(entidade_id, ativo) 
    WHERE ativo = true;

RAISE NOTICE 'Índices validados/criados';
