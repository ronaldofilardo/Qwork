-- Corrigir função da trigger para buscar de entidades em vez de clinicas (renomeado de contratantes)
CREATE OR REPLACE FUNCTION public.notificar_pre_cadastro_criado()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_entidade_nome TEXT;
  v_admin_record RECORD;
BEGIN
  -- Buscar nome da entidade (corrigido de clinicas para contratantes, agora renomeado para entidades)
  SELECT nome INTO v_entidade_nome
  FROM entidades
  WHERE id = NEW.entidade_id;

  -- Notificar todos os admins
  FOR v_admin_record IN
    SELECT cpf FROM usuarios WHERE role = 'admin' AND ativo = TRUE
  LOOP
    INSERT INTO notificacoes (
      tipo, prioridade, destinatario_cpf, destinatario_tipo,
      titulo, mensagem, dados_contexto, link_acao, botao_texto,
      contratacao_personalizada_id
    ) VALUES (
      'pre_cadastro_criado',
      'alta',
      v_admin_record.cpf,
      'admin',
      'Novo Pre-Cadastro: ' || v_contratante_nome,
      'Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: ' || COALESCE(NEW.numero_funcionarios_estimado::TEXT, 'Nao informado') || '.',
      jsonb_build_object(
        'contratacao_id', NEW.id,
        'contratante_nome', v_contratante_nome,
        'numero_funcionarios', NEW.numero_funcionarios_estimado
      ),
      '/admin/contratacao/pendentes',
      'Definir Valor',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

SELECT '✓ Função notificar_pre_cadastro_criado corrigida' AS status;
