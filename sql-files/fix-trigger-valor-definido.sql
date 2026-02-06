-- Corrigir função da trigger notificar_valor_definido para buscar de entidades (renomeado de contratantes)
CREATE OR REPLACE FUNCTION public.notificar_valor_definido()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_entidade_nome TEXT;
  v_gestor_cpf TEXT;
BEGIN
  -- Buscar dados da entidade (corrigido de clinicas para contratantes, agora renomeado para entidades)
  SELECT nome, responsavel_cpf INTO v_entidade_nome, v_gestor_cpf
  FROM entidades
  WHERE id = NEW.entidade_id;

  -- Notificar gestor do contratante
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_cpf, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  ) VALUES (
    'valor_definido',
    'media',
    v_gestor_cpf,
    'gestor',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionario: R$ ' ||
      TO_CHAR(NEW.valor_por_funcionario, 'FM999G999G990D00') ||
      '. Total estimado: R$ ' || TO_CHAR(NEW.valor_total_estimado, 'FM999G999G990D00') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'valor_por_funcionario', NEW.valor_por_funcionario,
      'valor_total_estimado', NEW.valor_total_estimado
    ),
    '/entidade/contratacao/' || NEW.id,
    'Ver Contrato',
    NEW.id
  );

  RETURN NEW;
END;
$function$;

SELECT '✓ Função notificar_valor_definido corrigida' AS status;
