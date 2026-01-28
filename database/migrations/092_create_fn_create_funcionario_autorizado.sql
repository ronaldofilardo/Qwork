-- Migration 092: Criar helper seguro para inserção de funcionarios pelo sistema
-- Data: 2026-01-24

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_create_funcionario_autorizado IS 'Cria ou atualiza um funcionario em nome do sistema (Security Definer)';

COMMIT;
