-- Aceitar contrato 38
UPDATE contratos SET aceito = true WHERE id = 38;

-- Ativar contratante 27
UPDATE contratantes SET ativa = true, pagamento_confirmado = true, status = 'aprovado' WHERE id = 27;

-- Criar conta de login para responsável em USUARIOS (não em funcionarios)
INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
SELECT 
    c.responsavel_cpf, 
    c.responsavel_nome, 
    c.responsavel_email, 
    '$2a$10$VvZNvejsx8bdZiHok8biVua4I6DMy/wUGPIAYpx/NqbNdpWFREHo6', 
    'rh',
    (SELECT id FROM clinicas WHERE contratante_id = c.id LIMIT 1),
    true,
    NOW(),
    NOW()
FROM contratantes c
WHERE c.id = 27
ON CONFLICT (cpf) DO UPDATE SET
    tipo_usuario = 'rh',
    clinica_id = (SELECT id FROM clinicas WHERE contratante_id = 27 LIMIT 1),
    ativo = true, 
    senha_hash = EXCLUDED.senha_hash,
    atualizado_em = NOW();

-- Criar senha na tabela entidades_senhas
INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash)
SELECT c.id, c.responsavel_cpf, '$2a$10$VvZNvejsx8bdZiHok8biVua4I6DMy/wUGPIAYpx/NqbNdpWFREHo6'
FROM contratantes c
WHERE c.id = 27
ON CONFLICT (contratante_id) DO UPDATE
SET cpf = EXCLUDED.cpf, senha_hash = EXCLUDED.senha_hash;

-- Verificar resultado
SELECT 
  c.id, c.nome, c.ativa, c.status, c.pagamento_confirmado,
  cr.aceito as contrato_aceito,
  f.cpf as funcionario_cpf, f.nome as funcionario_nome
FROM contratantes c
LEFT JOIN contratos cr ON cr.contratante_id = c.id AND cr.id = 38
LEFT JOIN funcionarios f ON f.contratante_id = c.id AND f.perfil = 'rh'
WHERE c.id = 27;
