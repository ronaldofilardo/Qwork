-- Script seguro para deletar um contratante e suas referências (cnpj 41877277000184)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='recibos') THEN
    EXECUTE 'DELETE FROM recibos WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pagamentos') THEN
    EXECUTE 'DELETE FROM pagamentos WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contratos') THEN
    EXECUTE 'DELETE FROM contratos WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contratantes_funcionarios') THEN
    EXECUTE 'DELETE FROM contratantes_funcionarios WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contratantes_senhas') THEN
    EXECUTE 'DELETE FROM contratantes_senhas WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='funcionarios') THEN
    EXECUTE 'DELETE FROM funcionarios WHERE cpf = ''87545772920'' AND contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notificacoes') THEN
    EXECUTE 'DELETE FROM notificacoes WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='payment_links') THEN
    EXECUTE 'DELETE FROM payment_links WHERE contratante_id = 6';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contratantes') THEN
    EXECUTE 'DELETE FROM contratantes WHERE id = 6';
  END IF;
END;
$$;

-- Validations
SELECT 'contratante_exists' AS check, COUNT(*) FROM contratantes WHERE cnpj='41877277000184';
SELECT (SELECT COUNT(*) FROM pagamentos WHERE contratante_id=6) AS pagamentos;
SELECT (SELECT COUNT(*) FROM notificacoes WHERE contratante_id=6) AS notificacoes;
SELECT (SELECT COUNT(*) FROM funcionarios WHERE cpf='87545772920' AND contratante_id=6) AS funcionarios;
