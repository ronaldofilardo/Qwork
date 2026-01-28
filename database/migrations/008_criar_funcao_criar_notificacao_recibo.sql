-- Migration 008: Criar função criar_notificacao_recibo
-- Função para criar notificação quando um recibo é gerado

CREATE OR REPLACE FUNCTION criar_notificacao_recibo(
  p_contratante_id INTEGER,
  p_recibo_numero VARCHAR(50),
  p_valor_total DECIMAL(12,2),
  p_destinatario_cpf VARCHAR(11)
) RETURNS INTEGER AS $$
DECLARE
  v_notificacao_id INTEGER;
  v_contratante_nome VARCHAR(200);
BEGIN
  -- Buscar nome do contratante
  SELECT nome INTO v_contratante_nome
  FROM contratantes
  WHERE id = p_contratante_id;

  -- Criar notificação
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_cpf,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto,
    criado_em
  ) VALUES (
    'pagamento_confirmado',
    'alta',
    p_destinatario_cpf,
    'contratante',
    'Recibo de Pagamento Gerado',
    format('Seu recibo %s no valor de R$ %s foi gerado com sucesso para %s.', 
           p_recibo_numero, 
           p_valor_total::TEXT, 
           v_contratante_nome),
    jsonb_build_object(
      'contratante_id', p_contratante_id,
      'recibo_numero', p_recibo_numero,
      'valor_total', p_valor_total
    ),
    '/recibos/' || p_recibo_numero,
    'Ver Recibo',
    NOW()
  ) RETURNING id INTO v_notificacao_id;

  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_notificacao_recibo IS 'Cria notificação quando um recibo é gerado após confirmação de pagamento';

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Migration 008 executada: função criar_notificacao_recibo criada';
END $$;
