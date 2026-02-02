-- Migração: 151_remove_auto_laudo_creation_trigger
-- Data: 2026-02-01
-- Descrição: Remove trigger que cria automaticamente laudos "rascunho" ao criar lotes
-- 
-- PROBLEMA IDENTIFICADO:
-- O trigger trg_reservar_id_laudo_on_lote_insert chamava fn_reservar_id_laudo_on_lote_insert()
-- que AUTOMATICAMENTE criava um registro em laudos com status='rascunho' e emissor_cpf=NULL
-- toda vez que um novo lote era criado.
--
-- Isso viola a política de EMISSÃO 100% MANUAL:
-- - Laudos devem ser criados APENAS quando o emissor clica "Gerar Laudo"
-- - Não deve haver laudos "rascunho" criados antecipadamente
-- - O fluxo correto é: RH solicita → Emissor CRIA e EMITE o laudo manualmente
--
-- EVIDÊNCIA DO PROBLEMA (fornecida pelo usuário):
-- Laudos sendo criados com:
--   id | lote_id | status    | emissor_cpf | hash_pdf | emitido_em
--   1  | 1       | rascunho  | NULL        | NULL     | NULL
--   2  | 2       | rascunho  | NULL        | NULL     | NULL
--
-- AÇÃO CORRETIVA:
-- 1. Remover o trigger trg_reservar_id_laudo_on_lote_insert
-- 2. Remover a função fn_reservar_id_laudo_on_lote_insert()
-- 3. Limpar laudos rascunho órfãos existentes (sem emissor)

BEGIN;

-- 1. Remover o trigger
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;

-- 2. Remover a função
DROP FUNCTION IF EXISTS fn_reservar_id_laudo_on_lote_insert();

-- 3. Limpar laudos rascunho órfãos (criados pelo trigger, sem emissor)
-- Apenas laudos em status 'rascunho' sem emissor_cpf e sem PDF
DELETE FROM laudos 
WHERE status = 'rascunho' 
  AND emissor_cpf IS NULL 
  AND hash_pdf IS NULL
  AND emitido_em IS NULL;

-- 4. Documentar a mudança
COMMENT ON TABLE laudos IS 
'Laudos psicológicos emitidos por emissores. 
IMPORTANTE: Laudos são criados APENAS pelo emissor no momento da emissão.
NÃO devem ser criados antecipadamente em status rascunho.
Fluxo correto:
1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
2. Lote aparece no dashboard do emissor
3. Emissor clica "Gerar Laudo" (POST /api/emissor/laudos/[loteId])
4. Sistema cria registro em laudos E gera PDF+hash
5. Emissor revisa e envia';

COMMIT;

-- Rollback (NÃO EXECUTAR - apenas para referência):
-- Este trigger NÃO deve ser restaurado pois viola política de emissão manual
-- Se precisar reverter (para debugging), usar migrations antigas 083/086
