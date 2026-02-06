-- Script seguro para deletar uma entidade (antiga: contratante) e suas referências (cnpj 41877277000184)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='recibos') THEN
    EXECUTE 'DELETE FROM recibos WHERE entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pagamentos') THEN
    EXECUTE 'DELETE FROM pagamentos WHERE contratante_id = 6'; -- ATENÇÃO: contratante_id pode ser mantido temporariamente em pagamentos
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contratos') THEN
    EXECUTE 'DELETE FROM contratos WHERE contratante_id = 6'; -- ATENÇÃO: contratante_id pode ser mantido temporariamente em contratos
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='entidades_funcionarios') THEN
    EXECUTE 'DELETE FROM entidades_funcionarios WHERE entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='entidades_senhas') THEN
    EXECUTE 'DELETE FROM entidades_senhas WHERE entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='funcionarios') THEN
    EXECUTE 'DELETE FROM funcionarios WHERE cpf = ''87545772920'' AND entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notificacoes') THEN
    EXECUTE 'DELETE FROM notificacoes WHERE entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='payment_links') THEN
    EXECUTE 'DELETE FROM payment_links WHERE entidade_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='entidades') THEN
    EXECUTE 'DELETE FROM entidades WHERE id = 6';
  END IF;
END;
$$;

-- Validations
SELECT 'entidade_exists' AS check, COUNT(*) FROM entidades WHERE cnpj='41877277000184';
SELECT (SELECT COUNT(*) FROM pagamentos WHERE contratante_id=6) AS pagamentos;
SELECT (SELECT COUNT(*) FROM notificacoes WHERE entidade_id=6) AS notificacoes;
SELECT (SELECT COUNT(*) FROM funcionarios WHERE cpf='87545772920' AND entidade_id=6) AS funcionarios;
