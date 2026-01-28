-- Migration 059: Fix trigger notificar_valor_definido - remove campo inexistente
-- Data: 2026-01-20
-- Descrição: Remove referência a NEW.observacoes_admin que não existe na tabela

-- Recriar função sem o campo observacoes_admin
CREATE OR REPLACE FUNCTION notificar_valor_definido()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_id INT;
  v_contratante_nome TEXT;
  v_gestor_cpf TEXT;
BEGIN
  -- Buscar ID, nome do contratante e CPF do gestor responsável
  SELECT c.id, c.nome, c.responsavel_cpf
  INTO v_contratante_id, v_contratante_nome, v_gestor_cpf
  FROM contratantes c
  WHERE c.id = NEW.contratante_id;

  -- Notificar gestor do contratante (preenchendo tanto id quanto CPF)
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_id, destinatario_cpf, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  )
  VALUES (
    'valor_definido',
    'media',
    v_contratante_id,
    v_gestor_cpf,
    'gestor_entidade',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionário: R$ ' || 
      TO_CHAR(NEW.valor_por_funcionario, 'FM999G999G990D00') || 
      '. Total estimado: R$ ' || TO_CHAR(NEW.valor_total_estimado, 'FM999G999G990D00') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'valor_por_funcionario', NEW.valor_por_funcionario,
      'valor_total_estimado', NEW.valor_total_estimado,
      'numero_funcionarios', NEW.numero_funcionarios_estimado
    ),
    '/entidade/contratacao/' || NEW.id,
    'Ver Contrato',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicando a correção
COMMENT ON FUNCTION notificar_valor_definido() IS 
  'Trigger para notificar gestor quando valor do plano personalizado é definido pelo admin. Atualizado em 2026-01-20 para remover campo observacoes_admin inexistente.';
