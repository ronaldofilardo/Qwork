-- Migration 058: Corrigir nomes de colunas no trigger de notificação
-- Data: 20/01/2026
-- Descrição: Usar nomes corretos das colunas (destinatario_id, destinatario_tipo, botao_texto) e remover recurso_id inexistente

-- Recriar função com nomes corretos de colunas
CREATE OR REPLACE FUNCTION notificar_pre_cadastro_criado()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
BEGIN
  -- Buscar nome do contratante
  SELECT nome INTO v_contratante_nome
  FROM tomadores
  WHERE id = NEW.contratante_id;

  -- Inserir notificação para todos os admins
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_id,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto,
    contratacao_personalizada_id
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

COMMENT ON FUNCTION notificar_pre_cadastro_criado() IS 'Notifica admins quando novo pré-cadastro personalizado é criado (colunas corrigidas)';

SELECT '✓ Migration 058 aplicada com sucesso - Colunas de notificação corrigidas' AS status;
