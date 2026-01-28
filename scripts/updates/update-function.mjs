import pg from 'pg';

async function updateFunction() {
  const { Client } = pg;
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'nr-bps_db',
    user: 'postgres',
    password: '123456',
  });

  try {
    await client.connect();
    console.log('Conectado ao banco...');

    // Drop possible older signatures first
    await client.query(
      'DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva(character, integer) CASCADE;'
    );
    await client.query(
      'DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva(char(11), integer) CASCADE;'
    );
    console.log('Função(s) dropada(s) (se existiam)...');

    // Now create the new one
    const sql = `
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
  v_contratante_id INTEGER;
  v_total_avaliacoes_anteriores INTEGER := 0;
BEGIN
  -- Buscar empresa_id e contratante_id do lote (suporte a empresas e entidades)
  SELECT empresa_id, contratante_id INTO v_empresa_id, v_contratante_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionário tem anomalias críticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRITICA'
    ) INTO v_tem_anomalia_critica;
  ELSE
    -- Para contratantes ainda nao aplicamos detecção de anomalias; não bloquear por anomalia
    v_tem_anomalia_critica := false;
  END IF;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1)
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativacoes anteriores (qualquer lote anterior no contexto)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada'
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Contar numero de avaliacoes anteriores (independente de status) no contexto
  SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Se tem anomalia crítica, permitir inativação consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se não há avaliações anteriores (funcionário recém-importado/inscrito), permitir sem sinalizar como forçada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionário sem avaliações anteriores (possivelmente recém-importado/inscrito). Inativação do primeiro lote é permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2ª inativação (ou seja, já existe pelo menos 1 inativação anterior), sinalizar como restrição (pode ser forçada)
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT
      false AS permitido,
      'ATENCAO: Este funcionário já tem ' || v_total_consecutivas || ' inativação(ões) anteriores. A partir da segunda inativação, o sistema exige justificativa detalhada e registro de auditoria (inativação forçada).' AS motivo,
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

COMMENT ON FUNCTION verificar_inativacao_consecutiva (CHAR(11), INTEGER) IS 'Verifica se funcionário pode ter avaliação inativada (impede 2ª consecutiva, exceto para anomalias críticas)';
`;

    await client.query(sql);
    console.log('Função criada com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

updateFunction();
