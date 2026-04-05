-- ========================================================
-- CORRIGIR CHECK CONSTRAINT PARA ACEITAR 'concluida'
-- ========================================================

BEGIN;

-- Mostrar constraint atual
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'avaliacoes_status_check';

-- Remover check constraint antigo
ALTER TABLE avaliacoes
DROP CONSTRAINT avaliacoes_status_check;

-- Criar novo check constraint com AMBOS 'concluido' e 'concluida' para compatibilidade
ALTER TABLE avaliacoes
ADD CONSTRAINT avaliacoes_status_check CHECK (
  status::text = ANY (ARRAY[
    'rascunho'::character varying,
    'iniciada'::character varying,
    'em_andamento'::character varying,
    'concluido'::character varying,    -- antigo valor (sera migrado)
    'concluida'::character varying,    -- NOVO valor (correto para feminino)
    'inativada'::character varying
  ]::text[])
);

-- Verificar novo constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'avaliacoes_status_check';

COMMIT;
