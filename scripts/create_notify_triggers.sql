-- Cria função que envia NOTIFY quando tabelas relevantes mudarem
-- Use com cuidado: instalar em ambiente de desenvolvimento/produção conforme aprovado

CREATE OR REPLACE FUNCTION notify_refresh_mv_admin()
RETURNS trigger AS $$
BEGIN
  -- Envia o nome da view e a tabela que causou o evento como payload
  PERFORM pg_notify('refresh_mv_admin', TG_TABLE_NAME || '|' || TG_OP);
  RETURN NULL; -- FOR EACH STATEMENT triggers devem retornar NULL
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Criar triggers FOR EACH STATEMENT para evitar excesso de notificações
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'entidades',
    'planos',
    'contratos',
    'pagamentos',
    'recibos',
    'documentos_entidades',
    'funcionarios',
    'empresas_clientes',
    'entidades_funcionarios'
  ];
  -- Nota: Tabelas renomeadas - 'contratantes' -> 'entidades', 'documentos_contratantes' -> 'documentos_entidades', 'contratantes_funcionarios' -> 'entidades_funcionarios'
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_notify_%I ON %I;', tbl, tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_notify_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION notify_refresh_mv_admin();',
        tbl,
        tbl
      );
    EXCEPTION WHEN undefined_table THEN
      -- tabela não existe neste schema - ignorar
      RAISE NOTICE 'Tabela % não encontrada, ignorando trigger', tbl;
    END;
  END LOOP;
END$$;

-- Nota: a função criada apenas emite um NOTIFY. É responsabilidade de um listener aplicar
-- o REFRESH MATERIALIZED VIEW CONCURRENTLY de forma controlada (para evitar bloqueios).

-- Como desfazer (opcional):
-- DROP TRIGGER IF EXISTS trg_notify_entidades ON entidades; -- (renomeado de contratantes)
-- DROP FUNCTION notify_refresh_mv_admin();

COMMENT ON FUNCTION notify_refresh_mv_admin() IS 'Emite NOTIFY refresh_mv_admin para indicar que a view materializada deve ser atualizada (payload: tabela|OPERACAO)';
