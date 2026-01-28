-- Migration 076b (optional data population): popular 'questao' apenas para respostas pertencentes a avaliações NÃO 'concluida'
-- Este script é **opcional** e deve ser executado somente no banco de teste (nr-bps_db_test) quando for seguro fazê-lo.

BEGIN;

UPDATE respostas r
SET questao = (regexp_replace(r.item, '\D', '', 'g'))::integer
FROM avaliacoes a
WHERE r.questao IS NULL
  AND r.item IS NOT NULL
  AND a.id = r.avaliacao_id
  AND a.status <> 'concluida';

COMMIT;
