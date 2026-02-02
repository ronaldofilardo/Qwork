-- Migração: Religar gestores desconectados
-- Data: 2026-01-30
-- Descrição: Insere gestores de entidade que estavam liberando lotes mas não constavam em contratantes_senhas

-- ============================================
-- ANÁLISE DO PROBLEMA:
-- ============================================
-- Encontrados 7 lotes "desconectados" onde liberado_por não estava em contratantes_senhas:
-- - Lotes 2,7,9,10: liberado_por=87545772920, contratante_id=1 (RLGR)
-- - Lotes 13,14: liberado_por=16543102047, contratante_id=5 (Amanda Ltda)
--
-- CONFIRMAÇÕES:
-- - CPF 87545772920 é gestor_entidade do contratante 1 (CNPJ 02.494.916/0001-70 - RLGR)
-- - CPF 16543102047 é gestor_entidade do contratante 5 (CNPJ 37.024.309/0001-21 - Amanda Ltda)
-- - CPF 04703084945 já estava correto (contratante 2)

-- ============================================
-- CORREÇÃO: Inserir gestores faltantes
-- ============================================
-- REGRA: Senha para RH e gestor_entidade = 6 últimos dígitos do CNPJ
-- - Contratante 1 (RLGR): CNPJ 02.494.916/0001-70 → senha: 000170
-- - Contratante 5 (Amanda Ltda): CNPJ 37.024.309/0001-21 → senha: 000121

-- 1. Inserir gestor da RLGR (contratante_id=1)
-- Senha: 000170 (últimos 6 dígitos do CNPJ 02494916000170)
INSERT INTO contratantes_senhas (cpf, contratante_id, senha_hash, primeira_senha_alterada)
VALUES (
  '87545772920', 
  1, 
  crypt('000170', gen_salt('bf', 10)),
  false
)
ON CONFLICT (cpf) DO NOTHING;

-- 2. Inserir gestor da Amanda Ltda (contratante_id=5)
-- Senha: 000121 (últimos 6 dígitos do CNPJ 37024309000121)
INSERT INTO contratantes_senhas (cpf, contratante_id, senha_hash, primeira_senha_alterada)
VALUES (
  '16543102047', 
  5, 
  crypt('000121', gen_salt('bf', 10)),
  false
)
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- VALIDAÇÃO: Verificar reconexão
-- ============================================
DO $$ 
DECLARE
  lotes_reconectados INTEGER;
BEGIN
  -- Contar lotes que agora estão conectados
  SELECT COUNT(*) INTO lotes_reconectados
  FROM lotes_avaliacao l
  INNER JOIN contratantes_senhas cs ON cs.cpf = l.liberado_por
  WHERE l.liberado_por IN ('87545772920', '16543102047')
    AND l.contratante_id = cs.contratante_id;
  
  RAISE NOTICE 'Lotes reconectados: % de 6 esperados', lotes_reconectados;
  
  IF lotes_reconectados = 6 THEN
    RAISE NOTICE 'SUCCESS: Todos os lotes foram reconectados corretamente!';
  ELSE
    RAISE WARNING 'ATENCAO: Esperados 6 lotes reconectados, encontrados %', lotes_reconectados;
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL: Status de todas as conexões
-- ============================================
SELECT 
  l.id as lote_id,
  l.codigo,
  l.contratante_id,
  c.nome as contratante_nome,
  l.liberado_por,
  cs.cpf as cpf_encontrado,
  CASE 
    WHEN cs.contratante_id = l.contratante_id THEN '✓ CONECTADO'
    WHEN cs.cpf IS NULL THEN '✗ CPF NAO ENCONTRADO'
    ELSE '✗ CONTRATANTE DIFERENTE'
  END as status_conexao
FROM lotes_avaliacao l
LEFT JOIN contratantes_senhas cs ON cs.cpf = l.liberado_por
LEFT JOIN contratantes c ON c.id = l.contratante_id
WHERE l.contratante_id IS NOT NULL
ORDER BY status_conexao DESC, l.id;
