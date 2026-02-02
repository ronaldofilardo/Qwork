-- Teste: Verificar se RH pode solicitar emissão de lote
-- Data: 30/01/2026

-- 1. Verificar lotes disponíveis para RH solicitar emissão
SELECT 
    la.id as lote_id,
    la.codigo,
    la.titulo,
    la.status,
    ec.nome as empresa_nome,
    c.nome as clinica_nome,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    l.id as laudo_id,
    fe.id as fila_emissao_id,
    CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
    CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo
FROM lotes_avaliacao la
JOIN empresas_clientes ec ON ec.id = la.empresa_id
JOIN clinicas c ON c.id = ec.clinica_id
LEFT JOIN avaliacoes a ON a.lote_id = la.id
LEFT JOIN laudos l ON l.lote_id = la.id
LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
WHERE la.status = 'concluido'
  AND la.empresa_id IS NOT NULL  -- Lotes de clínica
GROUP BY la.id, la.codigo, la.titulo, la.status, ec.nome, c.nome, l.id, fe.id
HAVING COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
ORDER BY la.id DESC
LIMIT 5;

-- 2. Verificar estrutura da tabela fila_emissao
\d fila_emissao

-- 3. Simular consulta que o RH faria (getLoteInfo)
-- Exemplo: Lote 15
SELECT 
    la.id,
    la.codigo,
    la.titulo,
    la.descricao,
    la.tipo,
    la.status,
    la.liberado_em,
    la.liberado_por,
    f.nome as liberado_por_nome,
    la.empresa_id,
    ec.nome as empresa_nome,
    la.emitido_em,
    l.id as laudo_id,
    l.status as laudo_status,
    l.emitido_em as laudo_emitido_em,
    l.enviado_em as laudo_enviado_em,
    CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
    fe.solicitado_em as emissao_solicitado_em,
    CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo
FROM lotes_avaliacao la
LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
JOIN empresas_clientes ec ON la.empresa_id = ec.id
LEFT JOIN laudos l ON l.lote_id = la.id
LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
WHERE la.id = 15
  AND ec.clinica_id = 1;  -- Ajustar clinica_id conforme necessário
