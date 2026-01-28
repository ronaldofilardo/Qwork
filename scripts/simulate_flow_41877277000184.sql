-- Simular fluxo completo para CNPJ 41.877.277/0001-84 (4x R$500)
BEGIN;

-- 1) Criar contratante
INSERT INTO contratantes (
  tipo, nome, cnpj, email, telefone, responsavel_cpf, responsavel_nome, responsavel_email, plano_id, numero_funcionarios_estimado, status
) VALUES (
  'entidade', 'RLGR Simulação', '41877277000184', 'omni@email.com', '(41) 99241-5220', '87545772920', 'RONALDO FILARDO', 'ronaldofilardo@gmail.com', 5, 100, 'pendente'
) RETURNING id INTO contract_id;

-- Se o banco não suporta INTO em INSERT direto, usar abaixo (compatibilidade):
-- detecta id do contratante recém criado

COMMIT;

-- Obter id do contratante
\gset
SELECT id FROM contratantes WHERE cnpj='41877277000184' LIMIT 1;

-- 2) Criar pagamento
INSERT INTO pagamentos (contratante_id, valor, valor_por_funcionario, numero_funcionarios, status, numero_parcelas, metodo, data_criacao)
VALUES ((SELECT id FROM contratantes WHERE cnpj='41877277000184'), 2000, 20, 100, 'pendente', 4, 'parcelado', NOW()) RETURNING id;

-- 3) Atualizar pagamento: data_pagamento, detalhes_parcelas e status parcial

-- Montar JSON de parcelas: 1ª paga, 3 futuras
DO $$
DECLARE
  cid INTEGER := (SELECT id FROM contratantes WHERE cnpj='41877277000184');
  pid INTEGER := (SELECT id FROM pagamentos WHERE contratante_id = cid ORDER BY id DESC LIMIT 1);
  parcelas JSONB;
  v1 DATE := CURRENT_DATE;
  v2 DATE := (CURRENT_DATE + INTERVAL '30 day')::date;
  v3 DATE := (CURRENT_DATE + INTERVAL '60 day')::date;
  v4 DATE := (CURRENT_DATE + INTERVAL '90 day')::date;
BEGIN
  parcelas := jsonb_build_array(
    jsonb_build_object('numero', 1, 'valor', 500, 'data_vencimento', v1::text, 'pago', true, 'status', 'pago'),
    jsonb_build_object('numero', 2, 'valor', 500, 'data_vencimento', v2::text, 'pago', false, 'status', 'pendente'),
    jsonb_build_object('numero', 3, 'valor', 500, 'data_vencimento', v3::text, 'pago', false, 'status', 'pendente'),
    jsonb_build_object('numero', 4, 'valor', 500, 'data_vencimento', v4::text, 'pago', false, 'status', 'pendente')
  );

  UPDATE pagamentos SET data_pagamento = NOW(), detalhes_parcelas = parcelas, status = 'parcial' WHERE id = pid;

  -- Criar notificações automáticas para parcelas 2..4
  PERFORM criar_notificacao_parcela(cid, pid, 2, 500, v2);
  PERFORM criar_notificacao_parcela(cid, pid, 3, 500, v3);
  PERFORM criar_notificacao_parcela(cid, pid, 4, 500, v4);
END;
$$;

-- 4) Ativar contratante (marca pagamento_confirmado e ativa)
UPDATE contratantes SET pagamento_confirmado = true, status = 'aprovado', data_liberacao_login = NOW(), ativa = true WHERE cnpj = '41877277000184';

-- 5) Criar senha inicial e registro de funcionario (responsavel)
SELECT criar_senha_inicial_entidade((SELECT id FROM contratantes WHERE cnpj='41877277000184'));

-- Inserir funcionario gestor_entidade
INSERT INTO funcionarios (cpf, nome, email, perfil, contratante_id, ativo, setor, funcao, nivel_cargo, senha_hash, criado_em, atualizado_em)
VALUES ('87545772920', 'RONALDO FILARDO', 'ronaldofilardo@gmail.com', 'gestor_entidade', (SELECT id FROM contratantes WHERE cnpj='41877277000184'), true, 'Gestão', 'Gestor da Entidade', 'gestao', (SELECT senha_hash FROM contratantes_senhas WHERE contratante_id = (SELECT id FROM contratantes WHERE cnpj='41877277000184') LIMIT 1), NOW(), NOW())
RETURNING id;

-- Vínculo
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
VALUES ((SELECT id FROM funcionarios WHERE cpf='87545772920' AND contratante_id = (SELECT id FROM contratantes WHERE cnpj='41877277000184') LIMIT 1), (SELECT id FROM contratantes WHERE cnpj='41877277000184'), 'entidade', true);

-- 6) Gerar recibo parcial para 1ª parcela
DO $$
DECLARE
  cid INTEGER := (SELECT id FROM contratantes WHERE cnpj='41877277000184');
  pid INTEGER := (SELECT id FROM pagamentos WHERE contratante_id = cid ORDER BY id DESC LIMIT 1);
  numero_recibo TEXT := gerar_numero_recibo();
  rid INTEGER;
BEGIN
  INSERT INTO recibos (contratante_id, pagamento_id, numero_recibo, valor, tipo_recibo, timestamp_emissao, status_recibo)
  VALUES (cid, pid, numero_recibo, 500, 'parcial', NOW(), 'emitido') RETURNING id INTO rid;
END;
$$;

-- Validações finais
SELECT id, nome, cnpj, ativa, pagamento_confirmado, status FROM contratantes WHERE cnpj = '41877277000184';
SELECT id, status, numero_parcelas, detalhes_parcelas FROM pagamentos WHERE contratante_id = (SELECT id FROM contratantes WHERE cnpj = '41877277000184') ORDER BY id DESC LIMIT 1;
SELECT id, numero_recibo, valor, tipo_recibo FROM recibos WHERE pagamento_id = (SELECT id FROM pagamentos WHERE contratante_id = (SELECT id FROM contratantes WHERE cnpj = '41877277000184')) ORDER BY id DESC LIMIT 1;
SELECT id, tipo, titulo, dados_contextuais FROM notificacoes WHERE contratante_id = (SELECT id FROM contratantes WHERE cnpj='41877277000184') ORDER BY id;

COMMIT;
