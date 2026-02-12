-- ============================================================================
-- DIAGNÓSTICO: Verificar Estado do Lote 1005 e Outros Lotes
-- Data: 10/02/2026
-- Ambiente: PRODUÇÃO
-- ============================================================================

\echo '=========================================='
\echo 'DIAGNÓSTICO: Lote 1005'
\echo '=========================================='

-- 1. Informações completas do lote 1005
SELECT 
  la.id AS lote_id,
  la.codigo AS lote_codigo,
  la.status AS lote_status,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  la.link_pagamento_token IS NOT NULL AS tem_link_gerado,
  la.link_pagamento_enviado_em,
  la.pagamento_metodo,
  la.pago_em,
  la.liberado_por AS solicitante_cpf,
  la.liberado_em,
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf,
  l.emissor_cpf,
  l.emitido_em AS laudo_emitido_em,
  l.criado_em AS laudo_criado_em
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id = 1005;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO: Todos Lotes Aguardando Cobrança'
\echo '=========================================='

-- 2. Todos os lotes aguardando cobrança
SELECT 
  la.id AS lote_id,
  la.codigo,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS tem_hash
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.status_pagamento = 'aguardando_cobranca'
ORDER BY la.solicitacao_emissao_em DESC;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO: Lotes com Laudo em Rascunho'
\echo '=========================================='

-- 3. Lotes com laudo em rascunho mas sem pagamento iniciado
SELECT 
  la.id AS lote_id,
  la.codigo,
  la.status AS lote_status,
  la.status_pagamento,
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.emissor_cpf,
  l.hash_pdf,
  l.criado_em AS laudo_criado_em
FROM lotes_avaliacao la
INNER JOIN laudos l ON l.lote_id = la.id
WHERE l.status = 'rascunho'
  AND (la.status_pagamento IS NULL OR la.status_pagamento != 'pago')
ORDER BY la.id DESC
LIMIT 20;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO: View v_solicitacoes_emissao'
\echo '=========================================='

-- 4. Ver o que a view mostra
SELECT 
  lote_id,
  status_pagamento,
  solicitacao_emissao_em,
  valor_por_funcionario,
  num_avaliacoes_concluidas,
  valor_total_calculado,
  nome_tomador,
  solicitante_nome
FROM v_solicitacoes_emissao
ORDER BY solicitacao_emissao_em DESC NULLS LAST
LIMIT 10;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO: Auditoria do Lote 1005'
\echo '=========================================='

-- 5. Auditoria de ações no lote 1005
SELECT 
  id,
  lote_id,
  acao,
  status,
  solicitado_por,
  tipo_solicitante,
  criado_em,
  tentativas
FROM auditoria_laudos
WHERE lote_id = 1005
ORDER BY criado_em DESC;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO: Notificações Admin'
\echo '=========================================='

-- 6. Notificações relacionadas ao fluxo de emissão
SELECT 
  id,
  tipo,
  titulo,
  mensagem,
  lote_id,
  criado_em,
  lida
FROM notificacoes_admin
WHERE lote_id = 1005
   OR tipo IN (
     'erro_critico_solicitacao_emissao',
     'solicitacao_emissao',
     'falha_emissao_imediata'
   )
ORDER BY criado_em DESC
LIMIT 20;

\echo ''
\echo '=========================================='
\echo 'DIAGNÓSTICO COMPLETO'
\echo '=========================================='
