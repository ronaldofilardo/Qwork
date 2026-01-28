-- MIGRATION 080: Atualizar função verificar_inativacao_consecutiva
-- Objetivo: aplicar a nova regra de inativação (primeiro lote após importação permitido; sinalização a partir da 2ª inativação)
-- Testes afetados (execute antes/depois):
--   - __tests__/api/avaliacoes/inativar-validacao.test.ts
--   - __tests__/api/avaliacoes/inativar-contratante.test.ts
--
-- PASSO A PASSO DE DEPLOY (implantação manual em staging/prod):
-- 1) Fazer backup do banco de dados de destino (dump):
--      pg_dump -U postgres -h <host> -p <port> -d nr-bps_db -f backups/pre-migration-080-YYYYMMDD.sql
-- 2) Rever e testar localmente em environment de staging:
--      - Rodar tests: pnpm test -- __tests__/api/avaliacoes/inativar-validacao.test.ts __tests__/api/avaliacoes/inativar-contratante.test.ts -i
-- 3) Aplicar migration no banco de destino:
--      psql -U postgres -h <host> -p <port> -d nr-bps_db -f database/migrations/080_update_verificar_inativacao_consecutiva.sql
-- 4) (Opcional) Confirmar versão da função usando psql:
--      SELECT proname, prosrc FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE proname = 'verificar_inativacao_consecutiva';
-- 5) Após aplicar, rodar a suíte de testes de integração / smoke tests em staging; se tudo OK, promover para produção.
-- 6) Caso seja necessario revert, restaurar o dump feito no passo (1).

-- Observação: esta migration substitui (CREATE OR REPLACE) a função existente.

DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva (CHAR(11), INTEGER);

CREATE OR REPLACE FUNCTION verificar_inativacao_consecutiva(
  p_funcionario_cpf CHAR(11),
  p_lote_id INTEGER
)
RETURNS TABLE(
  permitido BOOLEAN,
  motivo TEXT,
  total_inativacoes_consecutivas INTEGER,
  ultima_inativacao_lote VARCHAR(20)
) AS $$
DECLARE
  v_lote_atual_ordem INTEGER;
  v_lote_anterior_ordem INTEGER;
  v_avaliacao_anterior_status VARCHAR(20);
  v_ultima_inativacao_codigo VARCHAR(20);
  v_total_consecutivas INTEGER := 0;
  v_tem_anomalia_critica BOOLEAN := false;
  v_empresa_id INTEGER;
BEGIN
  -- Buscar empresa_id do lote
  SELECT empresa_id INTO v_empresa_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas
  SELECT EXISTS(
    SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
    WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRÍTICA'
  ) INTO v_tem_anomalia_critica;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e contar avaliações anteriores
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativações anteriores (qualquer lote anterior)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.empresa_id = v_empresa_id
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada';

  -- Contar número de avaliações anteriores (independente de status)
  DECLARE v_total_avaliacoes_anteriores INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON a.lote_id = la.id
    WHERE a.funcionario_cpf = p_funcionario_cpf
      AND la.empresa_id = v_empresa_id
      AND la.numero_ordem < v_lote_atual_ordem;
  EXCEPTION WHEN OTHERS THEN
    v_total_avaliacoes_anteriores := 0;
  END;

  -- Se tem anomalia critica, permitir inativacao consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. ' ||
      'Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nao ha avaliacoes anteriores (funcionario recem-importado/inscrito), permitir sem sinalizar como forcada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores (possivel recem-importado/inscrito). Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2a inativacao (ou seja, ja existe pelo menos 1 inativacao anterior), sinalizar como restricao (pode ser forcada)
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. ' ||
      'A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT
      true AS permitido,
      'Inativação permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_inativacao_consecutiva (CHAR(11), INTEGER) IS 'Atualização: primeira avaliação pós importação permitida; sinalização a partir da 2ª inativação';