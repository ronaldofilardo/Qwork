-- Migration 094: Add NOTICE logs to fn_create_funcionario_autorizado for debugging
BEGIN;

CREATE OR REPLACE FUNCTION fn_create_funcionario_autorizado(
  p_cpf VARCHAR(11),
  p_nome TEXT,
  p_email TEXT,
  p_senha_hash TEXT,
  p_perfil VARCHAR(20),
  p_ativo BOOLEAN DEFAULT TRUE,
  p_contratante_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'fn_create_funcionario_autorizado called: cpf=% perfil=% contratante_id=%', p_cpf, p_perfil, p_contratante_id;
  INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id, criado_em, atualizado_em)
  VALUES (p_cpf, p_nome, p_email, p_senha_hash, p_perfil, p_ativo, p_contratante_id, NOW(), NOW())
  ON CONFLICT (cpf) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, funcionarios.nome),
    email = COALESCE(EXCLUDED.email, funcionarios.email),
    senha_hash = EXCLUDED.senha_hash,
    perfil = COALESCE(EXCLUDED.perfil, funcionarios.perfil),
    ativo = COALESCE(EXCLUDED.ativo, funcionarios.ativo),
    contratante_id = COALESCE(EXCLUDED.contratante_id, funcionarios.contratante_id),
    atualizado_em = NOW();
  RAISE NOTICE 'fn_create_funcionario_autorizado completed for cpf=%', p_cpf;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
