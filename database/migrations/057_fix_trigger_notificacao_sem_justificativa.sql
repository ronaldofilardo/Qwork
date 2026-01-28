-- Migration 057: Corrigir trigger que referencia campo inexistente justificativa_contratante
-- Data: 20/01/2026
-- Descrição: Remove referência ao campo justificativa_contratante que não existe em contratacao_personalizada

-- Recriar função sem o campo justificativa_contratante
CREATE OR REPLACE FUNCTION notificar_pre_cadastro_criado()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
BEGIN
  -- Buscar nome do contratante
  SELECT nome INTO v_contratante_nome
  FROM contratantes
  WHERE id = NEW.contratante_id;

  -- Inserir notificação para todos os admins
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    usuario_id,
    papel_destinatario,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    texto_acao,
    recurso_id
  )
  SELECT 
    'pre_cadastro_criado',
    'alta',
    u.id,
    'admin',
    'Novo Pré-Cadastro: ' || v_contratante_nome,
    'Um novo pré-cadastro de plano personalizado foi criado e aguarda definição de valor. Funcionários estimados: ' || COALESCE(NEW.numero_funcionarios_estimado::TEXT, 'Não informado') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'contratante_nome', v_contratante_nome,
      'numero_funcionarios', NEW.numero_funcionarios_estimado
    ),
    '/admin/contratacao/pendentes',
    'Definir Valor',
    NEW.id
  FROM usuarios u
  WHERE u.role = 'admin' AND u.ativo = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notificar_pre_cadastro_criado() IS 'Notifica admins quando novo pré-cadastro personalizado é criado (sem campo justificativa)';

SELECT '✓ Migration 057 aplicada com sucesso - Trigger de notificação corrigido' AS status;
