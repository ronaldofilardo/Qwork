-- Script para investigar lotes/laudos perdidos de gestores convertidos
-- CPFs: 87545772920, 16543102047

\echo '========================================='
\echo 'INVESTIGAÇÃO: Lotes/Laudos Perdidos'
\echo '========================================='

-- 1. Verificar localização atual dos CPFs
\echo ''
\echo '[1] Localização atual dos CPFs:'
SELECT 'funcionarios' as tabela, cpf, nome, perfil, ativo, contratante_id
FROM funcionarios 
WHERE cpf IN ('87545772920', '16543102047')
UNION ALL
SELECT 'contratantes_senhas' as tabela, cs.cpf, c.nome, cs.perfil::text, true, cs.contratante_id
FROM contratantes_senhas cs
JOIN contratantes c ON cs.contratante_id = c.id
WHERE cs.cpf IN ('87545772920', '16543102047');

-- 2. Verificar lotes criados por esses CPFs
\echo ''
\echo '[2] Lotes criados (liberado_por):'
SELECT 
    la.id,
    la.codigo,
    la.titulo,
    la.status,
    la.liberado_por,
    la.contratante_id,
    COALESCE(c.nome, 'SEM CONTRATANTE') as contratante_nome,
    la.clinica_id,
    la.empresa_id,
    COUNT(a.id) as total_avaliacoes
FROM lotes_avaliacao la
LEFT JOIN contratantes c ON la.contratante_id = c.id
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.liberado_por IN ('87545772920', '16543102047')
GROUP BY la.id, la.codigo, la.titulo, la.status, la.liberado_por, la.contratante_id, c.nome, la.clinica_id, la.empresa_id
ORDER BY la.id DESC;

-- 3. Verificar laudos emitidos por esses CPFs
\echo ''
\echo '[3] Laudos emitidos (emissor_cpf):'
SELECT 
    l.id,
    l.lote_id,
    la.codigo as lote_codigo,
    l.status,
    l.emissor_cpf,
    l.emitido_em,
    l.enviado_em,
    l.hash_pdf IS NOT NULL as tem_hash,
    la.contratante_id
FROM laudos l
JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE l.emissor_cpf IN ('87545772920', '16543102047')
ORDER BY l.id DESC;

-- 4. Verificar avaliacoes vinculadas a esses lotes
\echo ''
\echo '[4] Avaliações nos lotes desses gestores:'
SELECT 
    a.id,
    a.lote_id,
    la.codigo as lote_codigo,
    a.funcionario_cpf,
    a.status,
    COUNT(r.id) as total_respostas
FROM avaliacoes a
JOIN lotes_avaliacao la ON a.lote_id = la.id
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE la.liberado_por IN ('87545772920', '16543102047')
GROUP BY a.id, a.lote_id, la.codigo, a.funcionario_cpf, a.status
ORDER BY a.lote_id DESC, a.id
LIMIT 20;

-- 5. Verificar se há inconsistências (lotes sem contratante_id)
\echo ''
\echo '[5] Lotes sem contratante_id que deveriam ter:'
SELECT 
    la.id,
    la.codigo,
    la.liberado_por,
    la.contratante_id,
    cs.contratante_id as gestor_contratante_id
FROM lotes_avaliacao la
LEFT JOIN contratantes_senhas cs ON cs.cpf = la.liberado_por
WHERE la.liberado_por IN ('87545772920', '16543102047')
  AND la.contratante_id IS NULL
  AND cs.contratante_id IS NOT NULL;

\echo ''
\echo '========================================='
\echo 'Fim da Investigação'
\echo '========================================='
