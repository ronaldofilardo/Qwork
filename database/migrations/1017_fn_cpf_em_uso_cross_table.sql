-- ====================================================================
-- Migration 1017: Criar função fn_cpf_em_uso para validação cross-table
-- Data: 2026-03-09
-- Objetivo: Verificar se um CPF já está cadastrado em qualquer tabela
--           do sistema antes de permitir novo cadastro.
--
-- Tabelas verificadas:
--   1. funcionarios  (cpf) — funcionários de clínica ou entidade
--   2. usuarios      (cpf) — admin, emissor, rh, gestor
--   3. representantes (cpf) — representantes comerciais (PF)
--   4. entidades_senhas (cpf) — gestores de entidade (senhas)
--   5. clinicas_senhas  (cpf) — RH de clínica (senhas)
-- ====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION fn_cpf_em_uso(p_cpf TEXT)
RETURNS TABLE(origem TEXT, tipo_usuario TEXT) AS $$
BEGIN
  RETURN QUERY
  (SELECT 'funcionarios'::TEXT AS origem,
          COALESCE(f.perfil, 'funcionario')::TEXT AS tipo_usuario
     FROM funcionarios f
    WHERE f.cpf = p_cpf
    LIMIT 1)

  UNION ALL

  (SELECT 'usuarios'::TEXT,
          u.tipo_usuario::TEXT
     FROM usuarios u
    WHERE u.cpf = p_cpf
    LIMIT 1)

  UNION ALL

  (SELECT 'representantes'::TEXT,
          'representante'::TEXT
     FROM representantes r
    WHERE r.cpf = p_cpf
    LIMIT 1)

  UNION ALL

  (SELECT 'entidades_senhas'::TEXT,
          'gestor de entidade'::TEXT
     FROM entidades_senhas es
    WHERE es.cpf = p_cpf
    LIMIT 1)

  UNION ALL

  (SELECT 'clinicas_senhas'::TEXT,
          'rh'::TEXT
     FROM clinicas_senhas cs
    WHERE cs.cpf = p_cpf
    LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_cpf_em_uso(TEXT) IS
  'Retorna todas as ocorrências de um CPF nas tabelas do sistema. Usado para validação cross-table antes de cadastrar novo usuário/funcionário/representante.';

COMMIT;

\echo ''
\echo '✓ Função fn_cpf_em_uso() criada com sucesso'
\echo 'Uso: SELECT * FROM fn_cpf_em_uso(''12345678901'')'
