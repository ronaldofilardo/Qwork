-- Tabela para armazenar tokens de retomada de pagamento
-- Permite que admins gerem links seguros para contratantes retomarem pagamentos

CREATE TABLE IF NOT EXISTS tokens_retomada_pagamento (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  contratante_id INTEGER NOT NULL,
  contrato_id INTEGER,
  plano_id INTEGER,
  tipo_plano VARCHAR(20) CHECK (tipo_plano IN ('fixo', 'personalizado')),
  numero_funcionarios INTEGER,
  valor_total DECIMAL(10,2),
  
  -- Controle de uso e expiração
  expiracao TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT false,
  usado_em TIMESTAMP,
  ip_uso VARCHAR(50),
  
  -- Auditoria
  gerado_por VARCHAR(14), -- CPF do admin que gerou
  gerado_em TIMESTAMP DEFAULT NOW(),
  
  -- Metadata adicional
  metadata JSONB,
  
  CONSTRAINT fk_token_contratante FOREIGN KEY (contratante_id) 
    REFERENCES contratantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_token_contrato FOREIGN KEY (contrato_id) 
    REFERENCES contratos(id) ON DELETE CASCADE,
  CONSTRAINT fk_token_plano FOREIGN KEY (plano_id) 
    REFERENCES planos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_token_gerado_por FOREIGN KEY (gerado_por) 
    REFERENCES funcionarios(cpf) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_tokens_token ON tokens_retomada_pagamento(token) WHERE usado = false;
CREATE INDEX idx_tokens_contratante ON tokens_retomada_pagamento(contratante_id);
CREATE INDEX idx_tokens_expiracao ON tokens_retomada_pagamento(expiracao) WHERE usado = false;
CREATE INDEX idx_tokens_usado ON tokens_retomada_pagamento(usado, expiracao);

-- Comentários de documentação
COMMENT ON TABLE tokens_retomada_pagamento IS 
'Armazena tokens seguros para permitir que contratantes retomem pagamentos pendentes sem refazer cadastro.';

COMMENT ON COLUMN tokens_retomada_pagamento.token IS 
'Token único gerado para autenticar link de pagamento. Tem TTL de 48h por padrão.';

COMMENT ON COLUMN tokens_retomada_pagamento.usado IS 
'Indica se token já foi utilizado. Tokens usados não podem ser reutilizados.';

COMMENT ON COLUMN tokens_retomada_pagamento.gerado_por IS 
'CPF do admin que gerou o link. Obrigatório para auditoria.';

-- Função para limpar tokens expirados (executar via cron)
CREATE OR REPLACE FUNCTION fn_limpar_tokens_expirados()
RETURNS TABLE (
  tokens_removidos INTEGER
) AS $$
DECLARE
  total_removidos INTEGER;
BEGIN
  DELETE FROM tokens_retomada_pagamento
  WHERE expiracao < NOW() - INTERVAL '7 days'; -- Mantém histórico de 7 dias
  
  GET DIAGNOSTICS total_removidos = ROW_COUNT;
  
  RETURN QUERY SELECT total_removidos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_limpar_tokens_expirados IS 
'Remove tokens expirados há mais de 7 dias. Deve ser executado via cron diariamente.';

-- Função para validar token
CREATE OR REPLACE FUNCTION fn_validar_token_pagamento(p_token VARCHAR)
RETURNS TABLE (
  valido BOOLEAN,
  contratante_id INTEGER,
  contrato_id INTEGER,
  plano_id INTEGER,
  tipo_plano VARCHAR,
  numero_funcionarios INTEGER,
  valor_total DECIMAL,
  erro VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN t.id IS NULL THEN false
      WHEN t.usado = true THEN false
      WHEN t.expiracao < NOW() THEN false
      ELSE true
    END AS valido,
    t.contratante_id,
    t.contrato_id,
    t.plano_id,
    t.tipo_plano,
    t.numero_funcionarios,
    t.valor_total,
    CASE 
      WHEN t.id IS NULL THEN 'Token não encontrado'
      WHEN t.usado = true THEN 'Token já foi utilizado'
      WHEN t.expiracao < NOW() THEN 'Token expirado'
      ELSE NULL
    END AS erro
  FROM tokens_retomada_pagamento t
  WHERE t.token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, 
                        NULL::VARCHAR, NULL::INTEGER, NULL::DECIMAL, 
                        'Token não encontrado'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_validar_token_pagamento IS 
'Valida token de retomada de pagamento. Retorna dados se válido ou erro específico se inválido.';

-- Função para marcar token como usado
CREATE OR REPLACE FUNCTION fn_marcar_token_usado(p_token VARCHAR, p_ip VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tokens_retomada_pagamento
  SET usado = true,
      usado_em = NOW(),
      ip_uso = p_ip
  WHERE token = p_token
    AND usado = false
    AND expiracao > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_marcar_token_usado IS 
'Marca token como usado após pagamento bem-sucedido. Previne reutilização.';

-- View para auditoria de tokens
CREATE OR REPLACE VIEW vw_tokens_auditoria AS
SELECT 
  t.id,
  t.token,
  c.nome AS contratante_nome,
  c.cnpj,
  p.nome AS plano_nome,
  t.tipo_plano,
  t.numero_funcionarios,
  t.valor_total,
  t.usado,
  t.usado_em,
  t.expiracao,
  CASE 
    WHEN t.usado = true THEN 'usado'
    WHEN t.expiracao < NOW() THEN 'expirado'
    ELSE 'valido'
  END AS status,
  g.nome AS gerado_por_nome,
  t.gerado_por AS gerado_por_cpf,
  t.gerado_em,
  t.ip_uso
FROM tokens_retomada_pagamento t
JOIN contratantes c ON t.contratante_id = c.id
LEFT JOIN planos p ON t.plano_id = p.id
LEFT JOIN funcionarios g ON t.gerado_por = g.cpf
ORDER BY t.gerado_em DESC;

COMMENT ON VIEW vw_tokens_auditoria IS 
'View para facilitar auditoria de tokens gerados. Mostra status atual e quem gerou.';

-- Inserir comentários nas constraints
COMMENT ON CONSTRAINT fk_token_contratante ON tokens_retomada_pagamento IS 
'Garante que token está sempre vinculado a um contratante válido.';

COMMENT ON CONSTRAINT fk_token_plano ON tokens_retomada_pagamento IS 
'Garante que token referencia plano válido. RESTRICT previne deleção de planos com tokens ativos.';
