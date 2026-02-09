-- Simulação corrigida do fluxo completo para CNPJ 41877277000184 (4x R$500)
BEGIN;

-- 1) Inserir entidade (antiga tabela: tomadores)
INSERT INTO entidades (
  tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular, plano_id, numero_funcionarios_estimado, status
) VALUES (
  'entidade', 'RLGR Simulação Corrigida', '41877277000184', 'omni@email.com', '(41) 99241-5220', 'Rua Exemplo, 100', 'Curitiba', 'PR', '80000-000', '87545772920', 'RONALDO FILARDO', 'ronaldofilardo@gmail.com', '(41) 59886-6655', 5, 100, 'pendente'
);

-- 2) Criar contrato mínimo (ATENÇÃO: contratante_id mantido temporariamente em contratos)
INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, conteudo_gerado, status)
VALUES ((SELECT id FROM entidades WHERE cnpj='41877277000184'), 5, 100, 2000, 'Contrato gerado automaticamente após pagamento', 'pendente_pagamento');

-- 3) Criar pagamento (ATENÇÃO: contratante_id mantido temporariamente em pagamentos)
INSERT INTO pagamentos (contratante_id, valor, valor_por_funcionario, numero_funcionarios, status, numero_parcelas, metodo)
VALUES ((SELECT id FROM entidades WHERE cnpj='41877277000184'), 2000, 20, 100, 'pendente', 4, 'parcelado');

COMMIT;

-- 4) Atualizar pagamento com data_pagamento, calcular parcelas e persistir detalhes
DO $$
DECLARE
  cid INTEGER := (SELECT id FROM entidades WHERE cnpj='41877277000184');
  pid INTEGER := (SELECT id FROM pagamentos WHERE contratante_id = cid ORDER BY id DESC LIMIT 1);
  det JSONB;
  v1 DATE := CURRENT_DATE;
  v2 DATE := (CURRENT_DATE + INTERVAL '30 day')::date;
  v3 DATE := (CURRENT_DATE + INTERVAL '60 day')::date;
  v4 DATE := (CURRENT_DATE + INTERVAL '90 day')::date;
BEGIN
  det := jsonb_build_array(
    jsonb_build_object('numero', 1, 'valor', 500, 'data_vencimento', v1::text, 'pago', true, 'status', 'pago'),
    jsonb_build_object('numero', 2, 'valor', 500, 'data_vencimento', v2::text, 'pago', false, 'status', 'pendente'),
    jsonb_build_object('numero', 3, 'valor', 500, 'data_vencimento', v3::text, 'pago', false, 'status', 'pendente'),
    jsonb_build_object('numero', 4, 'valor', 500, 'data_vencimento', v4::text, 'pago', false, 'status', 'pendente')
  );

  UPDATE pagamentos SET data_pagamento = NOW(), detalhes_parcelas = det, status = 'parcial' WHERE id = pid;

  -- criar notificações de parcelas 2..4
  PERFORM criar_notificacao_parcela(cid, pid, 2, 500, v2);
  PERFORM criar_notificacao_parcela(cid, pid, 3, 500, v3);
  PERFORM criar_notificacao_parcela(cid, pid, 4, 500, v4);
END;
$$;

-- 5) Marcar pagamento confirmado e ativar entidade (antiga tabela: tomadores)
UPDATE entidades SET pagamento_confirmado = true, status = 'aprovado', data_liberacao_login = NOW(), ativa = true WHERE cnpj = '41877277000184';

-- 6) Criar senha inicial (se função existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'criar_senha_inicial_entidade') THEN
    PERFORM criar_senha_inicial_entidade((SELECT id FROM entidades WHERE cnpj='41877277000184'));
  END IF;
END;
$$;

-- 7) Inserir usuario gestor (NÃO em funcionarios - gestores vão para 'usuarios')
INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo, criado_em, atualizado_em)
VALUES (
    '87545772920', 
    'RONALDO FILARDO', 
    'ronaldofilardo@gmail.com', 
    (SELECT senha_hash FROM entidades_senhas WHERE entidade_id = (SELECT id FROM entidades WHERE cnpj='41877277000184') LIMIT 1), 
    'gestor', 
    (SELECT id FROM entidades WHERE cnpj='41877277000184'), 
    true, 
    NOW(), 
    NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
    tipo_usuario = 'gestor',
    entidade_id = EXCLUDED.entidade_id,
    ativo = true,
    atualizado_em = NOW();

-- 8) Vincular usuario à entidade (opcional - usuarios já tem entidade_id)

-- 9) Gerar recibo parcial para 1ª parcela (usar contrato previamente criado)
DO $$
DECLARE
  cid INTEGER := (SELECT id FROM entidades WHERE cnpj='41877277000184');
  pid INTEGER := (SELECT id FROM pagamentos WHERE contratante_id = cid ORDER BY id DESC LIMIT 1);
  contrato INTEGER := (SELECT id FROM contratos WHERE contratante_id = cid ORDER BY id DESC LIMIT 1);
  numero_recibo TEXT := gerar_numero_recibo();
BEGIN
  INSERT INTO recibos (contrato_id, pagamento_id, contratante_id, numero_recibo, vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, valor_parcela, forma_pagamento, numero_parcelas, detalhes_parcelas, descricao_pagamento, emitido_por_cpf, ativo)
  VALUES (contrato, pid, cid, numero_recibo, CURRENT_DATE, (CURRENT_DATE + INTERVAL '364 day')::date, 100, 500, 500, 'Boleto Bancário', 4, jsonb_build_array(jsonb_build_object('numero',1,'valor',500,'pago',true,'data_vencimento',CURRENT_DATE::text)), 'Recibo parcial 1ª parcela', '87545772920', true);
END;
$$;

-- 10) Validações finais
SELECT id, nome, cnpj, ativa, pagamento_confirmado, status FROM entidades WHERE cnpj = '41877277000184';
SELECT id, status, numero_parcelas, detalhes_parcelas FROM pagamentos WHERE contratante_id = (SELECT id FROM entidades WHERE cnpj = '41877277000184') ORDER BY id DESC LIMIT 1;
SELECT id, numero_recibo, valor_parcela, tipo_recibo FROM recibos WHERE pagamento_id = (SELECT id FROM pagamentos WHERE contratante_id = (SELECT id FROM entidades WHERE cnpj = '41877277000184')) ORDER BY id DESC LIMIT 1;
SELECT id, tipo, titulo, dados_contextuais FROM notificacoes WHERE entidade_id = (SELECT id FROM entidades WHERE cnpj='41877277000184') ORDER BY id;

COMMIT;
