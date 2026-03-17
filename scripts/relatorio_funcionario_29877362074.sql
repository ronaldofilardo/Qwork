\echo '========== RELATÓRIO FUNCIONÁRIO - CPF: 29877362074 =========='

-- 1. DADOS BÁSICOS DO FUNCIONÁRIO
\echo ''
\echo '1. INFORMAÇÕES BÁSICAS'
\echo '─────────────────────────────────────────────'
SELECT 
  f.id, f.cpf, f.nome, f.email, f.data_nascimento, f.perfil, 
  f.ativo as status_global, 
  f.indice_avaliacao, f.data_ultimo_lote,
  f.criado_em, f.atualizado_em
FROM funcionarios f
WHERE f.cpf = '29877362074';

-- 2. VÍNCULOS (MULTI-CNPJ)
\echo ''
\echo '2. VÍNCULOS COM EMPRESAS/CLINICAS (funcionarios_clinicas)'
\echo '─────────────────────────────────────────────'
SELECT 
  fc.id as vinculo_id,
  ec.nome as empresa,
  c.nome as clinica,
  fc.ativo as status_vinculo,
  fc.setor, fc.funcao, fc.matricula, fc.nivel_cargo, fc.turno, fc.escala,
  fc.indice_avaliacao, fc.data_ultimo_lote,
  fc.criado_em, fc.atualizado_em
FROM funcionarios_clinicas fc
LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id
LEFT JOIN clinicas c ON c.id = fc.clinica_id
WHERE fc.funcionario_id = (SELECT id FROM funcionarios WHERE cpf = '29877362074')
ORDER BY fc.criado_em DESC;

-- 3. VÍNCULOS COM ENTIDADES
\echo ''
\echo '3. VÍNCULOS COM ENTIDADES (funcionarios_entidades)'
\echo '─────────────────────────────────────────────'
SELECT 
  fe.id as vinculo_id,
  e.nome as entidade,
  fe.ativo as status_vinculo,
  fe.setor, fe.funcao, fe.matricula, fe.nivel_cargo, fe.turno, fe.escala,
  fe.indice_avaliacao, fe.data_ultimo_lote,
  fe.criado_em, fe.atualizado_em
FROM funcionarios_entidades fe
LEFT JOIN entidades e ON e.id = fe.entidade_id
WHERE fe.funcionario_id = (SELECT id FROM funcionarios WHERE cpf = '29877362074')
ORDER BY fe.criado_em DESC;

-- 4. AVALIAÇÕES
\echo ''
\echo '4. HISTÓRICO DE AVALIAÇÕES'
\echo '─────────────────────────────────────────────'
SELECT 
  a.id as avaliacao_id,
  a.lote_id,
  la.numero_ordem,
  COALESCE(ec.nome, e.nome) as empresa_entidade,
  a.status,
  a.inicio, a.envio, a.inativada_em,
  (SELECT COUNT(*) FROM respostas r WHERE r.avaliacao_id = a.id) as total_respostas,
  a.motivo_inativacao,
  a.criado_em
FROM avaliacoes a
LEFT JOIN lotes_avaliacao la ON la.id = a.lote_id
LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
LEFT JOIN entidades e ON e.id = la.entidade_id
WHERE a.funcionario_cpf = '29877362074'
ORDER BY a.criado_em DESC;

-- 5. ESTATÍSTICAS
\echo ''
\echo '5. ESTATÍSTICAS'
\echo '─────────────────────────────────────────────'
SELECT 
  (SELECT COUNT(*) FROM funcionarios_clinicas WHERE funcionario_id = (SELECT id FROM funcionarios WHERE cpf = '29877362074')) as total_vinculos_empresas,
  (SELECT COUNT(*) FROM funcionarios_entidades WHERE funcionario_id = (SELECT id FROM funcionarios WHERE cpf = '29877362074')) as total_vinculos_entidades,
  (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = '29877362074') as total_avaliacoes,
  (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = '29877362074' AND status = 'concluida') as avaliacoes_concluidas,
  (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = '29877362074' AND status = 'iniciada') as avaliacoes_iniciadas,
  (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = '29877362074' AND status = 'inativada') as avaliacoes_inativadas;

-- 6. LOTES AFETADOS
\echo ''
\echo '6. LOTES COM AVALIAÇÕES DESTE FUNCIONÁRIO'
\echo '─────────────────────────────────────────────'
SELECT 
  DISTINCT la.id as lote_id,
  la.numero_ordem,
  COALESCE(ec.nome, e.nome) as empresa_entidade,
  la.status as status_lote,
  la.liberado_em,
  COUNT(a.id) as total_avaliacoes_neste_lote,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'iniciada') as iniciadas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
LEFT JOIN entidades e ON e.id = la.entidade_id
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.id IN (SELECT lote_id FROM avaliacoes WHERE funcionario_cpf = '29877362074')
GROUP BY la.id, la.numero_ordem, ec.nome, e.nome, la.status, la.liberado_em
ORDER BY la.numero_ordem DESC;

\echo ''
\echo '========== FIM DO RELATÓRIO =========='
