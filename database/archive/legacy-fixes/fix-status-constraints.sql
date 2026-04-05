-- FIX: Adicionar status 'inativada' para avaliacoes e 'concluido' para lotes_avaliacao

-- 1. Remover constraint antiga de avaliacoes e adicionar nova com 'inativada'
ALTER TABLE avaliacoes
DROP CONSTRAINT IF EXISTS avaliacoes_status_check;

ALTER TABLE avaliacoes
ADD CONSTRAINT avaliacoes_status_check CHECK (
    status IN (
        'iniciada',
        'em_andamento',
        'concluido',
        'inativada'
    )
);

-- 2. Remover constraint antiga de lotes_avaliacao e adicionar nova com 'concluido'
ALTER TABLE lotes_avaliacao
DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;

ALTER TABLE lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_status_check CHECK (
    status IN (
        'ativo',
        'cancelado',
        'finalizado',
        'concluido'
    )
);

-- Verificar constraints
SELECT conname, pg_get_constraintdef (oid)
FROM pg_constraint
WHERE
    conname IN (
        'avaliacoes_status_check',
        'lotes_avaliacao_status_check'
    );
