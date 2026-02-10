-- ============================================================================
-- MIGRATION 1100: Correção do Fluxo de Pagamento e Emissão
-- Data: 10/02/2026
-- Autor: Sistema
-- Descrição: Remove criação prematura de laudos e ajusta fluxo de pagamento
-- ============================================================================

BEGIN;

\echo '=========================================='
\echo 'MIGRATION 1100: Início'
\echo '=========================================='

-- ============================================================================
-- PARTE 1: Remover Trigger de Criação Prematura de Laudo
-- ============================================================================

\echo ''
\echo '1. Removendo trigger de criação prematura de laudo...'

-- Remover trigger que cria laudo ao criar lote
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao CASCADE;

\echo '   ✓ Trigger removido'

-- Manter função mas desativada (para histórico)
COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS 
'DEPRECATED - Função desativada em 10/02/2026. 
Causava criação prematura de laudos antes do fluxo de pagamento.
Laudos agora são criados APENAS quando emissor clica "Gerar Laudo" após pagamento confirmado.';

\echo '   ✓ Função marcada como deprecated'

-- ============================================================================
-- PARTE 2: Atualizar Comentário da Tabela laudos
-- ============================================================================

\echo ''
\echo '2. Atualizando documentação da tabela laudos...'

COMMENT ON TABLE laudos IS 
'Laudos psicológicos emitidos por emissores.

FLUXO CORRETO DE CRIAÇÃO:
1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
2. Status do lote: status_pagamento = ''aguardando_cobranca''
3. Admin define valor (POST /api/admin/emissoes/[loteId]/definir-valor)
4. Admin gera link (POST /api/admin/emissoes/[loteId]/gerar-link)
5. Status do lote: status_pagamento = ''aguardando_pagamento''
6. Solicitante confirma pagamento
7. Status do lote: status_pagamento = ''pago''
8. Emissor vê o lote no dashboard
9. Emissor clica "Gerar Laudo" (POST /api/emissor/laudos/[loteId])
10. Sistema cria registro em laudos com status = ''rascunho''
11. Sistema gera PDF e calcula hash
12. Sistema atualiza para status = ''emitido'' com hash_pdf
13. Emissor revisa e envia
14. Sistema atualiza para status = ''enviado''

IMPORTANTE:
- Laudos NÃO devem ser criados antecipadamente
- Laudo só é criado APÓS pagamento confirmado E emissor iniciar geração
- Hash só existe após PDF ser gerado
- Trigger de criação automática foi REMOVIDA em 10/02/2026 (Migration 1100)';

\echo '   ✓ Documentação atualizada'

-- ============================================================================
-- PARTE 3: Limpar Laudos Rascunho Órfãos
-- ============================================================================

\echo ''
\echo '3. Limpando laudos rascunho órfãos (criados prematuramente)...'

-- Identificar laudos rascunho de lotes não pagos
WITH laudos_orfaos AS (
  SELECT l.id, l.lote_id, la.status_pagamento
  FROM laudos l
  INNER JOIN lotes_avaliacao la ON la.id = l.lote_id
  WHERE l.status = 'rascunho'
    AND l.emissor_cpf IS NULL
    AND l.hash_pdf IS NULL
    AND l.emitido_em IS NULL
    AND (
      la.status_pagamento IS NULL
      OR la.status_pagamento != 'pago'
    )
)
SELECT COUNT(*) AS total_laudos_orfaos FROM laudos_orfaos;

-- Deletar laudos rascunho de lotes não pagos
DELETE FROM laudos
WHERE id IN (
  SELECT l.id
  FROM laudos l
  INNER JOIN lotes_avaliacao la ON la.id = l.lote_id
  WHERE l.status = 'rascunho'
    AND l.emissor_cpf IS NULL
    AND l.hash_pdf IS NULL
    AND l.emitido_em IS NULL
    AND (
      la.status_pagamento IS NULL
      OR la.status_pagamento != 'pago'
    )
);

\echo '   ✓ Laudos órfãos removidos'

-- ============================================================================
-- PARTE 4: Ajustar View v_solicitacoes_emissao
-- ============================================================================

\echo ''
\echo '4. Ajustando view v_solicitacoes_emissao...'

CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
SELECT 
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  la.link_pagamento_token,
  la.link_pagamento_enviado_em,
  la.pagamento_metodo,
  la.pagamento_parcelas,
  la.pago_em,
  e.nome AS empresa_nome,
  COALESCE(c.nome, e.nome) AS nome_tomador,
  u.nome AS solicitante_nome,
  u.cpf AS solicitante_cpf,
  COUNT(a.id) AS num_avaliacoes_concluidas,
  la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
  la.criado_em AS lote_criado_em,
  la.liberado_em AS lote_liberado_em,
  la.status AS lote_status,
  -- ADICIONAR: Informações do laudo (se existir)
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS laudo_tem_hash,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  CASE 
    WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true
    ELSE false
  END AS laudo_ja_emitido,
  -- Tipo de solicitante (RH ou Entidade)
  CASE 
    WHEN c.id IS NOT NULL THEN 'rh'
    WHEN la.entidade_id IS NOT NULL THEN 'gestor'
    ELSE 'desconhecido'
  END AS tipo_solicitante,
  c.id AS clinica_id,
  c.nome AS clinica_nome,
  la.entidade_id,
  e.id AS empresa_id
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id  -- ADICIONAR: JOIN com laudos
WHERE la.status_pagamento IS NOT NULL
GROUP BY 
  la.id, e.nome, e.id, c.nome, c.id, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS 
'View para admin gerenciar solicitações de emissão de laudos.
Atualizada em 10/02/2026 para incluir informações sobre laudos existentes.
Permite ao admin verificar se laudo já foi emitido antes de processar solicitação.';

\echo '   ✓ View atualizada'

-- ============================================================================
-- PARTE 5: Adicionar Índices para Performance
-- ============================================================================

\echo ''
\echo '5. Criando índices...'

-- Índice para consultas da view
CREATE INDEX IF NOT EXISTS idx_laudos_lote_id_status 
  ON laudos(lote_id, status);

\echo '   ✓ Índices criados'

-- ============================================================================
-- PARTE 6: Verificações Finais
-- ============================================================================

\echo ''
\echo '6. Executando verificações finais...'

-- Verificar se trigger foi removido
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_reservar_id_laudo_on_lote_insert'
  ) INTO v_trigger_exists;
  
  IF v_trigger_exists THEN
    RAISE EXCEPTION 'FALHA: Trigger ainda existe!';
  ELSE
    RAISE NOTICE '   ✓ Trigger confirmado como removido';
  END IF;
END $$;

-- Verificar se view foi atualizada
DO $$
DECLARE
  v_view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('v_solicitacoes_emissao'::regclass) INTO v_view_def;
  
  IF v_view_def LIKE '%laudo_id%' AND v_view_def LIKE '%laudo_status%' THEN
    RAISE NOTICE '   ✓ View confirmada como atualizada';
  ELSE
    RAISE EXCEPTION 'FALHA: View não foi atualizada corretamente!';
  END IF;
END $$;

COMMIT;

\echo ''
\echo '=========================================='
\echo 'MIGRATION 1100: Concluída com Sucesso'
\echo '=========================================='
\echo ''
\echo 'IMPORTANTE:'
\echo '  - Trigger de criação automática de laudos REMOVIDO'
\echo '  - Laudos rascunho órfãos REMOVIDOS'
\echo '  - View v_solicitacoes_emissao ATUALIZADA'
\echo '  - Laudos agora são criados APENAS após pagamento'
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '  1. Testar fluxo completo em ambiente de testes'
\echo '  2. Verificar se admin consegue processar lote 1005'
\echo '  3. Confirmar que emissor vê apenas lotes pagos'
\echo '=========================================='

-- Rollback (se necessário):
-- BEGIN;
-- -- Recriar trigger
-- CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
--   AFTER INSERT ON lotes_avaliacao
--   FOR EACH ROW
--   EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();
-- COMMIT;
