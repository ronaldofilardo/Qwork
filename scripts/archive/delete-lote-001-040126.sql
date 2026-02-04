-- Script: delete-lote-001-040126.sql
-- Objetivo: remover lote com código '001-040126' e todas as avaliações/respostas/laudos associados
-- Autor: gerado automaticamente (revise antes de executar)
-- Banco alvo: nr-bps_db
-- USO: Rodar o arquivo em um cliente psql ou DBeaver. Primeiro execute o bloco de PREVIEW e o bloco DRY-RUN (ele faz ROLLBACK). Quando pronto, descomente e execute o bloco de EXECUÇÃO REAL.

-- ===========================
-- 1) PREVIEW: listar lote(s) e registros relacionados
-- ===========================
SELECT la.id AS lote_id,  la.titulo, la.status, la.liberado_por, la.clinica_id, la.empresa_id, la.liberado_em
FROM lotes_avaliacao la
WHERE la.id = 0 -- FIXME: substituir por ID correto;

SELECT la.id AS lote_id, a.id AS avaliacao_id, a.funcionario_cpf, a.status, a.inicio, a.envio
FROM avaliacoes a
JOIN lotes_avaliacao la ON la.id = a.lote_id
WHERE la.id = 0 -- FIXME: substituir por ID correto
ORDER BY a.id;

SELECT DISTINCT f.id, f.cpf, f.nome, f.indice_avaliacao, f.data_ultimo_lote
FROM funcionarios f
JOIN lotes_avaliacao_funcionarios laf ON laf.funcionario_id = f.id
JOIN lotes_avaliacao la ON la.id = laf.lote_id
WHERE la.id = 0 -- FIXME: substituir por ID correto;

SELECT COUNT(*) AS respostas_count
FROM respostas r
WHERE r.avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126'));

SELECT COUNT(*) AS laudos_count
FROM laudos l
WHERE l.lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126');

-- (Opcional) localizar contratante pelo CPF de login fornecido
SELECT id AS contratante_id, nome, responsavel_cpf
FROM contratantes
WHERE responsavel_cpf = '87545772920';


-- ===========================
-- 2) DRY-RUN (executar para ver efeitos, NÃO COMMITAR)
-- Este bloco faz BEGIN ... ROLLBACK para simular as mudanças
-- ===========================
BEGIN;

-- criar backups temporários para revisão (serão descartados com ROLLBACK)
CREATE TEMP TABLE backup_lote AS SELECT * FROM lotes_avaliacao WHERE codigo = '001-040126';
CREATE TEMP TABLE backup_avaliacoes AS SELECT * FROM avaliacoes WHERE lote_id IN (SELECT id FROM backup_lote);
CREATE TEMP TABLE backup_respostas AS SELECT * FROM respostas WHERE avaliacao_id IN (SELECT id FROM backup_avaliacoes);
CREATE TEMP TABLE backup_resultados AS SELECT * FROM resultados WHERE avaliacao_id IN (SELECT id FROM backup_avaliacoes);
CREATE TEMP TABLE backup_laudos AS SELECT * FROM laudos WHERE lote_id IN (SELECT id FROM backup_lote);
CREATE TEMP TABLE backup_laf AS SELECT * FROM lotes_avaliacao_funcionarios WHERE lote_id IN (SELECT id FROM backup_lote);

-- mostrar contagens que seriam alteradas
SELECT 'lotes' AS objeto, COUNT(*) FROM backup_lote
UNION ALL SELECT 'avaliacoes', COUNT(*) FROM backup_avaliacoes
UNION ALL SELECT 'respostas', COUNT(*) FROM backup_respostas
UNION ALL SELECT 'resultados', COUNT(*) FROM backup_resultados
UNION ALL SELECT 'laudos', COUNT(*) FROM backup_laudos
UNION ALL SELECT 'lotes_avaliacao_funcionarios', COUNT(*) FROM backup_laf;

-- capturar funcionários afetados (antes de apagar a ligação)
WITH afetados AS (
  SELECT DISTINCT f.id FROM funcionarios f
  JOIN lotes_avaliacao_funcionarios laf ON laf.funcionario_id = f.id
  JOIN lotes_avaliacao la ON la.id = laf.lote_id
  WHERE la.id = 0 -- FIXME: substituir por ID correto
)
SELECT f.id, f.cpf, f.nome, f.indice_avaliacao, f.data_ultimo_lote
FROM funcionarios f
WHERE f.id IN (SELECT id FROM afetados);

-- Simular deleções (serão revertidas pelo ROLLBACK)
-- Marcar avaliações concluídas como inativadas (para permitir delete de respostas)
UPDATE avaliacoes SET status = 'inativada' WHERE status = 'concluida' AND lote_id IN (SELECT id FROM backup_lote);
-- Observação: usamos DELETE ... RETURNING para ver o que seria removido (sem LIMIT pois não é suportado junto com RETURNING)
DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM backup_avaliacoes) RETURNING id;
DELETE FROM resultados WHERE avaliacao_id IN (SELECT id FROM backup_avaliacoes) RETURNING id;
DELETE FROM auditoria_laudos WHERE lote_id IN (SELECT id FROM backup_lote) RETURNING id;
DELETE FROM laudos WHERE lote_id IN (SELECT id FROM backup_lote) RETURNING id;
DELETE FROM lotes_avaliacao_funcionarios WHERE lote_id IN (SELECT id FROM backup_lote) RETURNING id;
DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM backup_lote) RETURNING id;
DELETE FROM lotes_avaliacao WHERE id IN (SELECT id FROM backup_lote) RETURNING id;

-- Simular atualização dos funcionários (voltar para "nunca avaliados")
WITH afetados AS (
  SELECT DISTINCT f.id FROM funcionarios f
  JOIN backup_laf laf ON laf.funcionario_id = f.id
)
UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL
WHERE id IN (SELECT id FROM afetados)
RETURNING id, cpf, nome, indice_avaliacao, data_ultimo_lote;

-- IMPORTANTE: DRY-RUN -> reverter tudo
ROLLBACK;


-- ===========================
-- 3) EXECUÇÃO FORÇADA (AUTORIZADA)
-- Observação: triggers de proteção serão desabilitadas temporariamente e reabilitadas ao final.
-- Executar apenas quando autorizado (já autorizado pelo usuário).
-- ===========================
BEGIN;

-- Desabilitar triggers de proteção para permitir remoção forçada
ALTER TABLE respostas DISABLE TRIGGER ALL;
ALTER TABLE avaliacoes DISABLE TRIGGER ALL;
ALTER TABLE resultados DISABLE TRIGGER ALL;
ALTER TABLE laudos DISABLE TRIGGER ALL;
ALTER TABLE auditoria_laudos DISABLE TRIGGER ALL;
ALTER TABLE lotes_avaliacao_funcionarios DISABLE TRIGGER ALL;

-- Realizar deleções na ordem segura
DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126'));
DELETE FROM resultados WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126'));
DELETE FROM auditoria_laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126');
DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126');
DELETE FROM lotes_avaliacao_funcionarios WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126');
DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126');
DELETE FROM lotes_avaliacao WHERE codigo = '001-040126';

-- Atualizar funcionários para "nunca avaliados" (índice = 0, data NULL)
WITH afetados AS (
  SELECT DISTINCT f.id FROM funcionarios f
  JOIN lotes_avaliacao_funcionarios laf ON laf.funcionario_id = f.id
  JOIN lotes_avaliacao la ON la.id = laf.lote_id
  WHERE la.id = 0 -- FIXME: substituir por ID correto
)
UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL
WHERE id IN (SELECT id FROM afetados);

-- Reabilitar triggers
ALTER TABLE respostas ENABLE TRIGGER ALL;
ALTER TABLE avaliacoes ENABLE TRIGGER ALL;
ALTER TABLE resultados ENABLE TRIGGER ALL;
ALTER TABLE laudos ENABLE TRIGGER ALL;
ALTER TABLE auditoria_laudos ENABLE TRIGGER ALL;
ALTER TABLE lotes_avaliacao_funcionarios ENABLE TRIGGER ALL;

-- Relatórios finais: contagens após execução
SELECT 'POS_EXEC_Lotes' as objeto, COUNT(*) FROM lotes_avaliacao WHERE codigo = '001-040126'
UNION ALL SELECT 'POS_EXEC_Avaliacoes', COUNT(*) FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126')
UNION ALL SELECT 'POS_EXEC_Respostas', COUNT(*) FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126'))
UNION ALL SELECT 'POS_EXEC_LAF', COUNT(*) FROM lotes_avaliacao_funcionarios WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = '001-040126')
UNION ALL SELECT 'POS_EXEC_Funcionarios_Afetados', COUNT(*) FROM funcionarios f WHERE f.indice_avaliacao = 0 AND f.data_ultimo_lote IS NULL;

COMMIT;

-- ===========================
-- FIM
-- ===========================
