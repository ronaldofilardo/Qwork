-- Migration 025: Substituir tipo laudo_emitido por laudo_enviado
-- Data: 2026-01-04
-- Objetivo: Consolidar notificação de laudo em um único tipo 'laudo_enviado' após PDF + hash

-- ==========================================
-- ADICIONAR NOVO TIPO laudo_enviado
-- ==========================================

-- Verificar se já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'tipo_notificacao' AND e.enumlabel = 'laudo_enviado'
    ) THEN
        ALTER TYPE tipo_notificacao ADD VALUE 'laudo_enviado';
        RAISE NOTICE 'Tipo laudo_enviado adicionado ao enum tipo_notificacao';
    ELSE
        RAISE NOTICE 'Tipo laudo_enviado já existe no enum tipo_notificacao';
    END IF;
END $$;

-- ==========================================
-- MIGRAR NOTIFICAÇÕES EXISTENTES
-- ==========================================

-- Atualizar notificações antigas de laudo_emitido para laudo_enviado
UPDATE notificacoes
SET tipo = 'laudo_enviado'
WHERE tipo = 'laudo_emitido'
  AND resolvida = FALSE;

-- Registrar na auditoria (somente se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria_geral') THEN
    INSERT INTO auditoria_geral (tabela_afetada, acao, dados_novos, criado_em)
    VALUES (
      'notificacoes',
      'migration_025_tipo_laudo',
      jsonb_build_object(
        'descricao', 'Migração de laudo_emitido para laudo_enviado',
        'total_atualizadas', (SELECT COUNT(*) FROM notificacoes WHERE tipo = 'laudo_enviado'),
        'data_migracao', NOW()
      ),
      NOW()
    );
  ELSE
    RAISE NOTICE 'Tabela auditoria_geral não existe; pulando registro de auditoria para migração 025';
  END IF;
END $$;

-- ==========================================
-- COMENTÁRIOS EXPLICATIVOS
-- ==========================================

COMMENT ON TYPE tipo_notificacao IS 'Tipos de notificação suportados no sistema. laudo_enviado é disparado após PDF + hash + status=enviado';

-- Nota: Não é possível remover valores de um enum no PostgreSQL sem recriar o tipo.
-- O valor 'laudo_emitido' permanece no enum mas não deve mais ser usado no código.
-- Todas as referências foram substituídas por 'laudo_enviado'.
