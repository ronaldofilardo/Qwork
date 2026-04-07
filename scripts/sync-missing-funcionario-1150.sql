-- ====================================================================
-- SYNC: Funcionario ID 1150 de neondb para neondb_v2
-- Data: 06/04/2026  
-- Funcionario: Gabrielly Elaine Corte Real (adicionada após migração)
-- ====================================================================

BEGIN;

-- Configura contexto de sessão para satisfazer triggers de auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- 1. Inserir funcionario (mapeando schema neondb -> neondb_v2)
-- neondb: data_admissao exists, usuario_tipo does NOT
-- neondb_v2: usuario_tipo exists, data_admissao does NOT
-- usuario_tipo = 'funcionario_clinica' (vinculada à clinica 120)
INSERT INTO funcionarios (
  id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo,
  criado_em, atualizado_em, matricula, turno, escala, nivel_cargo,
  ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status,
  ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, indice_avaliacao,
  incluido_em, inativado_em, inativado_por, ultimo_lote_codigo,
  usuario_tipo
) VALUES (
  1150,
  '52745219162',
  'Gabrielly Elaine Corte Real',
  'ADM', 'ADM',
  'djfhjksfjhgsdfh@gmail.com',
  '$2a$10$fDIwytqMYZ98inaMci7/I.6X9X3U/Y0j2w.2XEebec.6iknQvhPpm',
  'funcionario', true,
  '2026-04-06 13:20:00.942483',
  '2026-04-06 13:20:00.942483',
  NULL, NULL, NULL,
  'operacional',
  NULL, NULL, NULL, NULL, NULL,
  '1999-02-20',
  0,
  '2026-04-06 13:20:00.942483',
  NULL, NULL, NULL,
  'funcionario_clinica'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ajustar sequence para estar acima do max(id) 
SELECT setval('funcionarios_id_seq', GREATEST((SELECT max(id) FROM funcionarios), 1150));

-- 3. Inserir vínculo funcionarios_clinicas
INSERT INTO funcionarios_clinicas (
  id, funcionario_id, empresa_id, ativo, data_vinculo, data_desvinculo, clinica_id
) VALUES (
  73,
  1150,
  17,
  true,
  '2026-04-06 13:20:01.75919',
  NULL,
  120
)
ON CONFLICT (id) DO NOTHING;

-- 4. Ajustar sequence de funcionarios_clinicas
SELECT setval('funcionarios_clinicas_id_seq', GREATEST((SELECT max(id) FROM funcionarios_clinicas), 73));

-- 5. Verificação pós-insert
SELECT 'Funcionario 1150 em v2: ' || count(*) FROM funcionarios WHERE id = 1150;
SELECT 'Vinculo fc id 73 em v2: ' || count(*) FROM funcionarios_clinicas WHERE id = 73;
SELECT 'Total funcionarios v2: ' || count(*) FROM funcionarios;

COMMIT;
